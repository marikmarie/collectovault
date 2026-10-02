<?php
declare(strict_types=1);

namespace Vault;

final class Response
{
    public static function cors(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $configured = array_filter(array_map('trim', explode(',', Config::get('CORS_ALLOWED_ORIGINS', '*'))));
        if (in_array('*', $configured, true)) {
            header('Access-Control-Allow-Origin: *');
        } elseif ($origin !== '' && in_array($origin, $configured, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Vary: Origin');
        }
        header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Max-Age: 86400');
    }

    /** @return array<string, mixed> */
    public static function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') return $_POST ?: [];
        try {
            $body = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new HttpException(400, 'Request body must be valid JSON.');
        }
        if (!is_array($body) || array_is_list($body)) throw new HttpException(400, 'Request body must be a JSON object.');
        return $body;
    }

    public static function header(string $name): ?string
    {
        $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        $value = $_SERVER[$serverKey] ?? ($_SERVER['REDIRECT_' . $serverKey] ?? null);
        return is_string($value) && $value !== '' ? $value : null;
    }

    /** @param array<string, mixed>|list<mixed> $payload */
    public static function json(array $payload, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        exit;
    }
}
