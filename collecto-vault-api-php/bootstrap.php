<?php
declare(strict_types=1);

/**
 * Framework-free runtime helpers for the Collecto Vault API.
 * Requires PHP 8.1+, PDO MySQL, and cURL.
 */

final class ApiException extends RuntimeException
{
    public function __construct(public readonly int $status, string $message, public readonly array $details = [])
    {
        parent::__construct($message);
    }
}

function vault_load_env(string $file): void
{
    if (!is_file($file)) return;

    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) return;
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if ($key === '') continue;
        if (strlen($value) >= 2 && (($value[0] === '"' && $value[-1] === '"') || ($value[0] === "'" && $value[-1] === "'"))) {
            $value = substr($value, 1, -1);
        }
        if (getenv($key) === false) {
            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
        }
    }
}

vault_load_env(__DIR__ . '/.env');

function vault_env(string $name, ?string $default = null): ?string
{
    $value = getenv($name);
    if ($value === false || $value === '') return $default;
    return $value;
}

function vault_required_env(string $name): string
{
    $value = vault_env($name);
    if ($value === null) throw new ApiException(503, "Server configuration is missing {$name}.");
    return $value;
}

function vault_headers(): array
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    foreach ($_SERVER as $key => $value) {
        if (!str_starts_with($key, 'HTTP_')) continue;
        $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
        $headers[$name] = $value;
    }
    return $headers;
}

function vault_header(string $name): ?string
{
    foreach (vault_headers() as $key => $value) {
        if (strcasecmp($key, $name) === 0) return is_array($value) ? null : trim((string) $value);
    }
    if (strcasecmp($name, 'Authorization') === 0) {
        $value = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;
        return is_string($value) && $value !== '' ? $value : null;
    }
    return null;
}

function vault_apply_cors(): void
{
    $origin = vault_header('Origin');
    if ($origin === null) return;

    $allowed = trim((string) vault_env('CORS_ALLOWED_ORIGINS', '*'));
    $origins = array_filter(array_map('trim', explode(',', $allowed)));
    if (in_array('*', $origins, true)) {
        header('Access-Control-Allow-Origin: *');
    } elseif (in_array($origin, $origins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    } else {
        throw new ApiException(403, 'This origin is not allowed to use the API.');
    }
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Max-Age: 86400');
}

function vault_json_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') return [];
    try {
        $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        throw new ApiException(400, 'Request body must be valid JSON.');
    }
    if (!is_array($data) || array_is_list($data)) throw new ApiException(400, 'Request body must be a JSON object.');
    return $data;
}

function vault_respond(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function vault_error(ApiException $error): never
{
    $body = ['message' => $error->getMessage()];
    if ($error->details !== []) $body['error'] = $error->details;
    vault_respond($body, $error->status);
}

function vault_log(string $message, array $context = []): void
{
    $safe = $context === [] ? '' : ' ' . json_encode($context, JSON_UNESCAPED_SLASHES);
    error_log('[Collecto Vault API] ' . $message . $safe);
}

function vault_base_path(): string
{
    $script = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? '/index.php'));
    $base = rtrim(str_replace('/index.php', '', $script), '/');
    return $base === '/' ? '' : $base;
}

function vault_request_path(): string
{
    $path = (string) (parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/');
    $base = vault_base_path();
    if ($base !== '' && ($path === $base || str_starts_with($path, $base . '/'))) {
        $path = substr($path, strlen($base)) ?: '/';
    }
    return '/' . ltrim(rawurldecode($path), '/');
}

function vault_query_int(string $key, int $default, int $min, int $max): int
{
    $value = filter_input(INPUT_GET, $key, FILTER_VALIDATE_INT);
    if ($value === false || $value === null) return $default;
    return max($min, min($max, $value));
}

function vault_required(array $data, string $key): mixed
{
    $value = $data[$key] ?? null;
    if ($value === null || $value === '') throw new ApiException(400, "{$key} is required.");
    return $value;
}

function vault_positive_int(string $value, string $label = 'ID'): int
{
    if (!ctype_digit($value) || (int) $value < 1) throw new ApiException(400, "Invalid {$label}.");
    return (int) $value;
}

function vault_authorization(): ?string
{
    return vault_header('Authorization');
}

function vault_require_session(): void
{
    $authorization = vault_authorization();
    if ($authorization === null || preg_match('/^Bearer\s+\S+$/i', $authorization) !== 1) {
        throw new ApiException(401, 'A valid Vault session is required.');
    }
}

function vault_collecto_url(string $path): string
{
    $base = rtrim(vault_required_env('COLLECTO_BASE_URL'), '/');
    if (!filter_var($base, FILTER_VALIDATE_URL)) throw new ApiException(503, 'COLLECTO_BASE_URL is not a valid URL.');
    return $base . '/' . ltrim($path, '/');
}

function vault_collecto_headers(): array
{
    $headers = ['X-API-Key: ' . vault_required_env('COLLECTO_API_KEY')];
    $authorization = vault_authorization();
    if ($authorization !== null) $headers[] = 'Authorization: ' . $authorization;
    return $headers;
}

/** @return array{status:int,data:mixed,raw:string} */
function vault_http_json(string $method, string $url, ?array $payload, array $headers, int $timeout = 30): array
{
    if (!function_exists('curl_init')) throw new ApiException(503, 'PHP cURL is required for this API.');
    $curl = curl_init($url);
    if ($curl === false) throw new ApiException(503, 'Unable to start the upstream request.');

    $requestHeaders = array_merge(['Accept: application/json'], $headers);
    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_CONNECTTIMEOUT => min(10, $timeout),
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_HTTPHEADER => $requestHeaders,
        CURLOPT_CUSTOMREQUEST => $method,
    ];
    if ($payload !== null) {
        $encoded = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $options[CURLOPT_POSTFIELDS] = $encoded;
        $requestHeaders[] = 'Content-Type: application/json';
        $options[CURLOPT_HTTPHEADER] = $requestHeaders;
    }
    curl_setopt_array($curl, $options);
    $raw = curl_exec($curl);
    $error = curl_error($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);

    if ($raw === false) throw new ApiException(503, 'Upstream service is unreachable: ' . $error);
    $data = null;
    if ($raw !== '') {
        try {
            $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            $data = ['message' => $raw];
        }
    }
    return ['status' => $status ?: 502, 'data' => $data, 'raw' => $raw];
}

/** @return array{status:int,data:mixed,raw:string} */
function vault_collecto_request(string $method, string $path, ?array $payload = null): array
{
    return vault_http_json($method, vault_collecto_url($path), $payload, vault_collecto_headers());
}

/** @return array{status:int,data:mixed,raw:string} */
function vault_card_request(string $method, string $path, ?array $payload = null): array
{
    $base = rtrim(vault_required_env('PEGASUS_CARD_API_BASE_URL'), '/');
    if (!filter_var($base, FILTER_VALIDATE_URL)) throw new ApiException(503, 'PEGASUS_CARD_API_BASE_URL is not a valid URL.');
    return vault_http_json($method, $base . '/' . ltrim($path, '/'), $payload, ['X-API-Key: ' . vault_required_env('PEGASUS_CARD_API_KEY')]);
}

function vault_upstream_message(mixed $data, string $fallback): string
{
    if (is_array($data)) {
        foreach (['message', 'error', 'status_message'] as $key) {
            if (isset($data[$key]) && is_string($data[$key]) && $data[$key] !== '') return $data[$key];
        }
    }
    return $fallback;
}

function vault_forward_collecto(string $method, string $path, ?array $payload = null): never
{
    $response = vault_collecto_request($method, $path, $payload);
    vault_respond($response['data'] ?? ['message' => 'Empty response from Collecto.'], $response['status']);
}

function vault_pdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    if (!extension_loaded('pdo_mysql')) throw new ApiException(503, 'PHP PDO MySQL is required for Vault support features.');

    $host = vault_env('VAULT_DB_HOST', vault_env('VAULT_DB', '127.0.0.1'));
    $port = vault_env('VAULT_DB_PORT', '3306');
    $name = vault_required_env('VAULT_DB_NAME');
    $user = vault_required_env('VAULT_DB_USER');
    $password = vault_required_env('VAULT_DB_PASS');
    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
    try {
        $pdo = new PDO($dsn, $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException) {
        throw new ApiException(503, 'The Vault database is unavailable.');
    }
    return $pdo;
}

function vault_decode_attachments(?string $value): ?array
{
    if ($value === null || $value === '') return null;
    try {
        $decoded = json_decode($value, true, 512, JSON_THROW_ON_ERROR);
        return is_array($decoded) ? $decoded : null;
    } catch (JsonException) {
        return null;
    }
}

function vault_encode_attachments(mixed $value): ?string
{
    if ($value === null) return null;
    if (!is_array($value)) throw new ApiException(400, 'attachments must be an array.');
    return json_encode(array_values($value), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
}

function vault_map_row(array $row): array
{
    if (array_key_exists('attachments', $row)) $row['attachments'] = vault_decode_attachments($row['attachments']);
    foreach (['isRead', 'isPreferred', 'isActive'] as $key) {
        if (array_key_exists($key, $row)) $row[$key] = (bool) $row[$key];
    }
    return $row;
}

function vault_card_id(string $id): string
{
    $id = trim($id);
    if (preg_match('/^[A-Za-z0-9_-]{1,60}$/', $id) !== 1) throw new ApiException(400, 'Invalid card collection reference.');
    return $id;
}

function vault_amount(mixed $value): ?float
{
    if (!is_numeric($value)) return null;
    $number = (float) $value;
    return is_finite($number) && $number > 0 ? $number : null;
}

function vault_card_description(mixed $value, string $fallback): string
{
    $input = is_string($value) ? trim($value) : '';
    $safe = preg_replace('/[^\x20-\x7E]/', ' ', $input !== '' ? $input : $fallback) ?? $fallback;
    $safe = trim((string) preg_replace('/\s+/', ' ', $safe));
    return substr($safe, 0, 200) ?: $fallback;
}

function vault_card_completion(string $id): ?array
{
    $statement = vault_pdo()->prepare('SELECT status, response FROM card_payment_completions WHERE cardCollectionId = ?');
    $statement->execute([$id]);
    $row = $statement->fetch();
    if ($row === false) return null;
    $response = null;
    if (!empty($row['response'])) {
        try { $response = json_decode((string) $row['response'], true, 512, JSON_THROW_ON_ERROR); } catch (JsonException) { $response = null; }
    }
    return ['status' => $row['status'], 'response' => $response];
}

/** @return 'new'|'processing'|'completed' */
function vault_reserve_card_completion(string $id): string
{
    $pdo = vault_pdo();
    $existing = vault_card_completion($id);
    if ($existing !== null) {
        if ($existing['status'] === 'completed') return 'completed';
        $stale = $pdo->prepare('DELETE FROM card_payment_completions WHERE cardCollectionId = ? AND status = ? AND createdAt < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE)');
        $stale->execute([$id, 'processing']);
        if ($stale->rowCount() === 0) return 'processing';
    }
    try {
        $statement = $pdo->prepare('INSERT INTO card_payment_completions (cardCollectionId, status) VALUES (?, ?)');
        $statement->execute([$id, 'processing']);
        return 'new';
    } catch (PDOException) {
        $existing = vault_card_completion($id);
        return $existing !== null && $existing['status'] === 'completed' ? 'completed' : 'processing';
    }
}

function vault_finish_card_completion(string $id, array $response): void
{
    $statement = vault_pdo()->prepare('UPDATE card_payment_completions SET status = ?, response = ?, completedAt = CURRENT_TIMESTAMP WHERE cardCollectionId = ?');
    $statement->execute(['completed', json_encode($response, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), $id]);
}

function vault_release_card_completion(string $id): void
{
    $statement = vault_pdo()->prepare('DELETE FROM card_payment_completions WHERE cardCollectionId = ? AND status = ?');
    $statement->execute([$id, 'processing']);
}
