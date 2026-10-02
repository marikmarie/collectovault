<?php
declare(strict_types=1);

ini_set('display_errors', '0');

spl_autoload_register(static function (string $class): void {
    $prefix = 'Vault\\';
    if (!str_starts_with($class, $prefix)) return;
    $name = substr($class, strlen($prefix));
    $controllers = ['CollectoController', 'CardPaymentsController', 'LocalController'];
    $file = __DIR__ . '/src/' . (in_array($name, $controllers, true) ? 'Controllers' : $name) . '.php';
    if (is_file($file)) require $file;
});
