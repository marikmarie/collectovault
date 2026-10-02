<?php
declare(strict_types=1);

namespace Vault;

final class CollectoService
{
    private HttpClient $http;
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->http = new HttpClient();
        $this->baseUrl = rtrim(Config::required('COLLECTO_BASE_URL'), '/');
        $this->apiKey = Config::required('COLLECTO_API_KEY');
    }

    /** @param array<string,mixed> $payload @return array{status:int,data:array<string,mixed>} */
    public function post(string $path, array $payload, ?string $authorization = null): array
    {
        $headers = ['X-API-Key' => $this->apiKey];
        if ($authorization !== null && trim($authorization) !== '') $headers['Authorization'] = $authorization;
        return $this->http->request('POST', $this->baseUrl . '/' . ltrim($path, '/'), $payload, $headers);
    }
}
