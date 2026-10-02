<?php
declare(strict_types=1);

namespace Vault\Support;

final class HttpClient
{
    /**
     * @param array<string, mixed>|null $payload
     * @param array<string, string> $headers
     * @return array{status:int, data:array<string, mixed>}
     */
    public function request(
        string $method,
        string $url,
        ?array $payload = null,
        array $headers = [],
        int $timeout = 30,
    ): array {
        if (!function_exists('curl_init')) {
            throw new HttpException(503, 'PHP cURL is required for payment and Collecto requests.');
        }

        $curl = curl_init($url);
        if ($curl === false) {
            throw new HttpException(503, 'Unable to start an outbound request.');
        }

        $outboundHeaders = ['Accept: application/json'];
        foreach ($headers as $name => $value) {
            $outboundHeaders[] = "{$name}: {$value}";
        }
        if ($payload !== null) {
            $outboundHeaders[] = 'Content-Type: application/json';
        }

        curl_setopt_array($curl, [
            CURLOPT_CUSTOMREQUEST => strtoupper($method),
            CURLOPT_HTTPHEADER => $outboundHeaders,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => min(10, $timeout),
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_FOLLOWLOCATION => false,
        ]);

        if ($payload !== null) {
            curl_setopt(
                $curl,
                CURLOPT_POSTFIELDS,
                json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            );
        }

        $rawResponse = curl_exec($curl);
        $curlError = curl_error($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        curl_close($curl);

        if ($rawResponse === false || $status === 0) {
            $message = $curlError !== ''
                ? 'The upstream service could not be reached.'
                : 'The upstream service did not respond.';
            throw new HttpException(503, $message);
        }

        try {
            $data = json_decode((string) $rawResponse, true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($data) || array_is_list($data)) {
                $data = ['data' => $data];
            }
        } catch (\JsonException) {
            $message = trim((string) $rawResponse);
            $data = ['message' => $message !== '' ? $message : 'The upstream service returned an invalid response.'];
        }

        return ['status' => $status, 'data' => $data];
    }

    /** @param array<string, mixed> $data */
    public static function message(array $data, string $fallback): string
    {
        foreach (['message', 'error', 'status_message'] as $key) {
            if (isset($data[$key]) && is_scalar($data[$key]) && trim((string) $data[$key]) !== '') {
                return (string) $data[$key];
            }
        }

        return $fallback;
    }
}
