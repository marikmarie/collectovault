<?php
declare(strict_types=1);

ini_set('display_errors', '0');

spl_autoload_register(static function (string $class): void {
    $prefix = 'Vault\\';

    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relativeClass = substr($class, strlen($prefix));
    $file = __DIR__ . '/src/' . str_replace('\\', '/', $relativeClass) . '.php';

    if (is_file($file)) {
        require $file;
    }
});
