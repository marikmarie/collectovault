<?php
declare(strict_types=1);

namespace Vault\Infrastructure;

use PDO;
use PDOException;
use Vault\Support\Config;
use Vault\Support\HttpException;

final class Database
{
    private static ?PDO $connection = null;

    public static function connection(): PDO
    {
        if (self::$connection instanceof PDO) {
            return self::$connection;
        }

        if (!extension_loaded('pdo_mysql')) {
            throw new HttpException(503, 'The PHP PDO MySQL extension is required.');
        }

        $host = Config::required('VAULT_DB');
        $port = Config::get('VAULT_DB_PORT', '3306');
        $database = Config::required('VAULT_DB_NAME');

        try {
            self::$connection = new PDO(
                "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4",
                Config::required('VAULT_DB_USER'),
                Config::get('VAULT_DB_PASS'),
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ],
            );
        } catch (PDOException $error) {
            error_log('[Vault API] database connection failed: ' . $error->getMessage());
            throw new HttpException(503, 'The Vault database is unavailable.');
        }

        return self::$connection;
    }
}
