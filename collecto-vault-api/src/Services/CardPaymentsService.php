<?php
declare(strict_types=1);

namespace Vault\Services;

use Throwable;
use Vault\Repositories\VaultRepository;
use Vault\Support\Config;
use Vault\Support\HttpClient;
use Vault\Support\HttpException;

final class CardPaymentsService
{
    private HttpClient $http;
    private string $baseUrl;
    private string $apiKey;

    public function __construct(private VaultRepository $store)
    {
        $this->http = new HttpClient();
        $this->baseUrl = rtrim(Config::required('PEGASUS_CARD_API_BASE_URL'), '/');
        $this->apiKey = Config::required('PEGASUS_CARD_API_KEY');
    }

    public function requireSession(?string $authorization): void
    {
        if ($authorization === null || preg_match('/^Bearer\s+\S+$/i', $authorization) !== 1) {
            throw new HttpException(401, 'A valid Vault session is required');
        }
    }

    public function validId(string $id): string
    {
        if (preg_match('/^[A-Za-z0-9_-]{1,60}$/', $id) !== 1) {
            throw new HttpException(400, 'Invalid card collection reference');
        }

        return $id;
    }

    public function amount(mixed $value): string
    {
        $value = trim((string) $value);

        if (preg_match('/^([1-9]\d*)(?:\.(\d{1,2}))?$/', $value, $matches) !== 1) {
            throw new HttpException(400, 'Enter a valid card payment amount');
        }

        return ltrim($matches[1], '0') . '.' . str_pad($matches[2] ?? '', 2, '0');
    }

    /** @param array<string, mixed>|null $payload @return array{status: int, data: array<string, mixed>} */
    private function api(string $method, string $path, ?array $payload = null): array
    {
        return $this->http->request(
            $method,
            $this->baseUrl . '/' . ltrim($path, '/'),
            $payload,
            ['X-API-Key' => $this->apiKey],
        );
    }

    /** @param array{status: int, data: array<string, mixed>} $response @return array<string, mixed> */
    private function collection(array $response): array
    {
        if ($response['status'] < 200 || $response['status'] >= 300) {
            $status = $response['status'] < 500 ? $response['status'] : 503;
            throw new HttpException($status, HttpClient::message($response['data'], 'Unable to reach card checkout service.'));
        }

        $collection = $response['data']['data'] ?? null;

        if (!is_array($collection) || !isset($collection['id'], $collection['checkout_url'])) {
            throw new HttpException(502, 'Card checkout service returned an invalid response');
        }

        return $collection;
    }

    /** @param array<string, mixed> $input @return array<string, mixed> */
    public function create(array $input): array
    {
        $amount = $this->amount($input['amount'] ?? null);
        $clientId = trim((string) ($input['clientId'] ?? ''));
        $collectoId = trim((string) ($input['collectoId'] ?? ''));

        if ($clientId === '' || $collectoId === '') {
            throw new HttpException(400, 'Missing collectoId or clientId');
        }

        $payload = [
            'amount' => $amount,
            'currency' => 'UGX',
            'description' => $this->ascii(
                $input['description'] ?? 'Collecto Vault payment',
                200,
                'Collecto Vault payment',
            ),
        ];

        if (!empty($input['customerName'])) {
            $payload['customer_name'] = $this->ascii($input['customerName'], 120, 'Collecto Vault customer');
        }

        if (!empty($input['customerEmail'])) {
            $payload['customer_email'] = trim((string) $input['customerEmail']);
        }

        $collection = $this->collection(
            $this->api('POST', '/api/v1/pegasus/card-collections', $payload),
        );
        $id = $this->validId((string) $collection['id']);

        $this->store->saveCardCollection($collection, $clientId, $collectoId, $amount);

        return $collection;
    }

    /** @param array<string, mixed> $query @return array<string, mixed> */
    public function status(string $id, array $query): array
    {
        $this->store->requireCardCollection($id);
        $refresh = filter_var($query['refresh'] ?? false, FILTER_VALIDATE_BOOLEAN) ? '?refresh=true' : '';
        $collection = $this->collection(
            $this->api('GET', '/api/v1/pegasus/card-collections/' . rawurlencode($id) . $refresh),
        );

        $this->store->updateCardStatus($id, strtoupper((string) ($collection['status'] ?? 'PENDING')));

        return $collection;
    }

    /** @param array<string, mixed> $input @return array<string, mixed> */
    public function complete(
        string $id,
        array $input,
        ?string $authorization,
        CollectoService $collecto,
    ): array {
        $local = $this->store->requireCardCollection($id);

        if (
            (string) ($input['clientId'] ?? '') !== (string) $local['client_id']
            || (string) ($input['collectoId'] ?? '') !== (string) $local['collecto_id']
        ) {
            throw new HttpException(403, 'This card collection does not belong to the current Vault account.');
        }

        if (trim((string) ($input['reference'] ?? '')) === '') {
            throw new HttpException(400, 'Missing payment reference, collectoId, or clientId');
        }

        $expected = $this->amount($input['cardAmount'] ?? $input['amount'] ?? null);

        if (!hash_equals((string) $local['expected_amount'], $expected)) {
            throw new HttpException(409, 'The confirmed card amount does not match this payment.');
        }

        $claim = $this->store->beginFinalization($id);

        if ($claim['state'] === 'completed') {
            return $claim['response'] ?? [];
        }

        if ($claim['state'] === 'processing') {
            throw new HttpException(202, 'Your confirmed card payment is being applied.', ['status' => 'processing']);
        }

        try {
            $collection = $this->status($id, ['refresh' => true]);
            $collectionStatus = strtoupper((string) ($collection['status'] ?? 'PENDING'));

            if ($collectionStatus !== 'SUCCESS') {
                throw new HttpException(
                    409,
                    (string) ($collection['reason'] ?? 'Card payment is not confirmed yet.'),
                    ['status' => strtolower($collectionStatus), 'data' => $collection],
                );
            }

            if (!hash_equals($expected, $this->amount($collection['amount'] ?? null))) {
                throw new HttpException(409, 'The confirmed card amount does not match this payment.');
            }

            unset($input['cardAmount'], $input['phone']);
            $input['paymentOption'] = 'card';
            $input['cardCollectionId'] = $id;
            $input['cardTransactionId'] = $collection['provider_transaction_id'] ?? null;

            $upstream = $collecto->post('/requestToPay', $input, $authorization);

            if ($upstream['status'] < 200 || $upstream['status'] >= 300) {
                $status = $upstream['status'] < 500 ? $upstream['status'] : 503;
                throw new HttpException(
                    $status,
                    HttpClient::message($upstream['data'], 'Unable to apply the confirmed card payment.'),
                );
            }

            $inner = is_array($upstream['data']['data'] ?? null) ? $upstream['data']['data'] : [];
            $response = [
                'status' => 'confirmed',
                'status_message' => $upstream['data']['status_message'] ?? 'Card payment confirmed',
                'data' => [
                    'requestToPay' => false,
                    'transactionId' => $inner['transactionId'] ?? $inner['transaction_id'] ?? $inner['id'] ?? $id,
                    'cardCollectionId' => $id,
                    'message' => $inner['message'] ?? 'Your card payment has been confirmed.',
                ],
            ];

            $this->store->completeFinalization($id, $response);

            return $response;
        } catch (Throwable $error) {
            $this->store->failFinalization($id);
            throw $error;
        }
    }

    private function ascii(mixed $value, int $limit, string $fallback): string
    {
        $text = trim(preg_replace('/[^\x20-\x7E]/', ' ', (string) $value) ?? '');
        $text = preg_replace('/\s+/', ' ', $text) ?? '';

        return substr($text !== '' ? $text : $fallback, 0, $limit);
    }
}
