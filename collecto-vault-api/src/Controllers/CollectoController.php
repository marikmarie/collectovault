<?php
declare(strict_types=1);

namespace Vault\Controllers;

use Throwable;
use Vault\Repositories\VaultRepository;
use Vault\Services\CollectoService;
use Vault\Support\HttpClient;
use Vault\Support\HttpException;
use Vault\Support\Response;

final class CollectoController
{
    public function __construct(
        private CollectoService $collecto,
        private VaultRepository $store,
    ) {
    }

    /** @param array<string, mixed> $body */
    public function auth(array $body): never
    {
        if ($body === []) {
            throw new HttpException(400, 'Request body is required');
        }

        $this->forward('/auth', $body);
    }

    /** @param array<string, mixed> $body */
    public function authVerify(array $body): never
    {
        $this->forward('/authVerify', $body);
    }

    /** @param array<string, mixed> $body */
    public function getByUsername(array $body): never
    {
        $username = trim((string) ($body['username'] ?? ''));

        if ($username === '') {
            throw new HttpException(400, 'username is required');
        }

        $this->forward('/getByUsername', ['username' => $username]);
    }

    /** @param array<string, mixed> $body */
    public function setUsername(array $body, ?string $authorization): never
    {
        $clientId = trim((string) ($body['clientId'] ?? ''));
        $username = trim((string) ($body['username'] ?? ''));
        $action = $body['action'] ?? null;

        if ($clientId === '' || $username === '') {
            throw new HttpException(400, 'Both clientId and username are required');
        }

        if ($action !== null && !in_array($action, ['create', 'update'], true)) {
            throw new HttpException(400, 'Action must be either create or update');
        }

        if (
            strlen($username) < 3
            || strlen($username) > 100
            || preg_match('/^[a-zA-Z0-9_-]+$/', $username) !== 1
        ) {
            throw new HttpException(400, 'Username must be 3–100 letters, numbers, underscores, or hyphens');
        }

        $response = $this->collecto->post('/clientUsername', $body, $authorization);

        if ($response['status'] < 200 || $response['status'] >= 300) {
            $status = $response['status'] === 409 ? 409 : ($response['status'] ?: 400);
            Response::json([
                'success' => false,
                'message' => HttpClient::message($response['data'], 'Could not set username at this time'),
            ], $status);
        }

        $data = is_array($response['data']['data'] ?? null) ? $response['data']['data'] : [];

        Response::json([
            'success' => true,
            'message' => $data['message'] ?? 'Username set successfully',
            'data' => [
                'clientId' => $clientId,
                'username' => $data['clientUsername'] ?? $username,
                'status' => $response['data']['status_message'] ?? null,
            ],
        ]);
    }

    /** @param array<string, mixed> $body */
    public function requestToPay(array $body, ?string $authorization): never
    {
        if (trim((string) ($body['paymentOption'] ?? '')) === '') {
            throw new HttpException(400, 'Missing payment method');
        }

        if (
            trim((string) ($body['collectoId'] ?? '')) === ''
            || trim((string) ($body['clientId'] ?? '')) === ''
        ) {
            throw new HttpException(400, 'Missing collectoId or clientId');
        }

        if (!empty($body['phone'])) {
            $body['phone'] = preg_replace('/^0/', '256', (string) $body['phone']);
        }

        $response = $this->collecto->post('/requestToPay', $body, $authorization);

        if ($response['status'] < 200 || $response['status'] >= 300) {
            Response::json([
                'message' => 'Request to pay failed',
                'error' => HttpClient::message($response['data'], 'Request to pay failed'),
            ], $response['status'] ?: 503);
        }

        $inner = is_array($response['data']['data'] ?? null) ? $response['data']['data'] : [];
        $transactionId = $inner['transactionId'] ?? $inner['transaction_id'] ?? $inner['id'] ?? null;

        if ($transactionId !== null) {
            $this->store->cachePayment((string) $transactionId, 'pending', $inner);
        }

        Response::json([
            'status' => $response['data']['status'] ?? '200',
            'status_message' => $response['data']['status_message'] ?? 'success',
            'data' => [
                'requestToPay' => true,
                'message' => $inner['message'] ?? 'Confirm payment via the prompt on your phone.',
                'transactionId' => $transactionId,
            ],
        ]);
    }

    /** @param array<string, mixed> $body */
    public function requestToPayStatus(array $body, ?string $authorization): never
    {
        $transactionId = trim((string) ($body['transactionId'] ?? ''));

        if ($transactionId === '') {
            throw new HttpException(400, 'Missing transactionId in body');
        }

        try {
            $response = $this->collecto->post('/requestToPayStatus', $body, $authorization);

            if ($response['status'] < 200 || $response['status'] >= 300) {
                throw new HttpException($response['status'], 'Collecto request failed');
            }

            $payment = is_array($response['data']['data'] ?? null) ? $response['data']['data'] : [];
            $value = strtolower((string) (
                $payment['status']
                ?? $payment['paymentStatus']
                ?? $payment['invoiceStatus']
                ?? ($payment['invoice']['status'] ?? '')
            ));
            $status = (
                str_contains($value, 'success')
                || str_contains($value, 'paid')
                || str_contains($value, 'confirmed')
            ) ? 'confirmed' : 'pending';

            $this->store->cachePayment($transactionId, $status, $payment);
            Response::json([
                'transactionId' => $transactionId,
                'status' => $status,
                'payment' => $payment,
            ]);
        } catch (Throwable) {
            $cached = $this->store->cachedPayment($transactionId);

            if ($cached) {
                Response::json([
                    'transactionId' => $transactionId,
                    'status' => $cached['status'],
                    'payment' => $cached['payment'],
                    'message' => 'Local record used - Collecto unreachable',
                ]);
            }

            Response::json([
                'transactionId' => $transactionId,
                'status' => 'unknown',
                'message' => 'Collecto unreachable and no local record',
            ], 503);
        }
    }

    /** @param array<string, mixed> $body */
    public function verifyPhoneNumber(array $body, ?string $authorization): never
    {
        $phone = trim((string) ($body['phoneNumber'] ?? ''));

        if ($phone === '') {
            throw new HttpException(400, 'Missing phoneNumber');
        }

        $payload = [
            'vaultOTPToken' => $body['vaultOTPToken'] ?? null,
            'collectoId' => $body['collectoId'] ?? null,
            'clientId' => $body['clientId'] ?? null,
            'phone' => $phone,
        ];
        $response = $this->collecto->post('/verifyPhoneNumber', $payload, $authorization);

        if ($response['status'] >= 200 && $response['status'] < 300) {
            Response::json($response['data']);
        }

        Response::json([
            'success' => true,
            'phoneNumber' => $phone,
            'verified' => true,
            'trxnId' => 'VER-' . (string) round(microtime(true) * 1000),
            'message' => 'Local verification (Collecto unreachable)',
        ]);
    }

    /** @param array<string, mixed> $body */
    public function services(array $body, ?string $authorization): never
    {
        $otp = $body['vaultOTPToken'] ?? null;
        $collectoId = $body['collectoId'] ?? null;

        if (!$collectoId && !$otp) {
            throw new HttpException(400, 'collectoId is required in the request body');
        }

        $this->forward('/servicesAndProducts', [
            'vaultOTPToken' => $otp,
            'collectoId' => $collectoId,
            'page' => max(1, (int) ($body['page'] ?? 1)),
        ], $authorization);
    }

    /** @param array<string, mixed> $body */
    public function invoiceDetails(array $body, ?string $authorization): never
    {
        $this->forward('/invoiceDetails', $body, $authorization);
    }

    /** @param array<string, mixed> $body */
    public function invoice(array $body, ?string $authorization): never
    {
        $items = $body['items'] ?? null;

        if (!is_array($items) || $items === []) {
            throw new HttpException(400, 'Invalid or missing items');
        }

        $first = is_array($items[0] ?? null) ? $items[0] : [];
        $collectoId = $first['collectoId'] ?? $body['collectoId'] ?? null;
        $clientId = $first['clientId'] ?? $body['clientId'] ?? null;

        if (!$collectoId || !$clientId) {
            throw new HttpException(400, 'collectoId and clientId are required');
        }

        $forwardItems = [];

        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $quantity = (float) ($item['quantity'] ?? $item['Quantity'] ?? $item['qty'] ?? 0);
            $total = (float) ($item['totalAmount'] ?? $item['total'] ?? $item['amount'] ?? 0);
            $unit = isset($item['amount']) && !isset($item['totalAmount'])
                ? (float) $item['amount']
                : ($quantity > 0 ? $total / $quantity : $total);

            $forwardItems[] = [
                'serviceId' => $item['serviceId'] ?? null,
                'serviceName' => $item['serviceName'] ?? null,
                'amount' => $unit,
                'quantity' => $quantity,
            ];
        }

        $computedAmount = array_reduce(
            $forwardItems,
            fn (float $sum, array $item): float => $sum + ($item['amount'] * $item['quantity']),
            0.0,
        );
        $payload = [
            'items' => $forwardItems,
            'amount' => isset($body['totalAmount']) ? (float) $body['totalAmount'] : $computedAmount,
            'collectoId' => (string) $collectoId,
            'clientId' => (string) $clientId,
        ];

        if (!empty($body['vaultOTPToken'])) {
            $payload['vaultOTPToken'] = $body['vaultOTPToken'];
        }

        if (!empty($body['staffId'])) {
            $payload['staffId'] = $body['staffId'];
        }

        $this->forward('/createInvoice', $payload, $authorization);
    }

    /** @param array<string, mixed> $body */
    public function loyaltySettings(array $body, ?string $authorization): never
    {
        if (empty($body['collectoId']) || empty($body['clientId'])) {
            throw new HttpException(400, 'collectoId and clientId are required');
        }

        $response = $this->collecto->post('/loyaltySettings', [
            'collectoId' => $body['collectoId'],
            'clientId' => $body['clientId'],
        ], $authorization);

        if ($response['status'] >= 200 && $response['status'] < 300) {
            Response::json($response['data']);
        }

        Response::json([
            'success' => true,
            'collectoId' => $body['collectoId'],
            'clientId' => $body['clientId'],
            'pointsToCurrencyRate' => 100,
            'message' => 'Local loyalty settings (Collecto unreachable)',
        ]);
    }

    /** @param array<string, mixed> $payload */
    private function forward(string $path, array $payload, ?string $authorization = null): never
    {
        $response = $this->collecto->post($path, $payload, $authorization);
        Response::json($response['data'], $response['status']);
    }
}
