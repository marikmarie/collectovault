<?php
declare(strict_types=1);

namespace Vault\Support;

final class Config
{
    /** @var array<string, string> */
    private static array $values = [];

    public static function load(string $path): void
    {
        if (!is_file($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }

            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            if ($key === '') {
                continue;
            }

            if ((str_starts_with($value, '"') && str_ends_with($value, '"'))
                || (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                $value = substr($value, 1, -1);
            }

            self::$values[$key] = $value;
        }
    }

    public static function get(string $key, string $default = ''): string
    {
        $environment = getenv($key);
        if ($environment !== false && $environment !== '') {
            return (string) $environment;
        }

        return self::$values[$key] ?? $default;
    }

    public static function required(string $key): string
    {
        $value = self::get($key);
        if ($value === '') {
            throw new HttpException(500, "Missing required server configuration: {$key}");
        }

        return $value;
    }
}
