<?php

define('PROJECT_ROOT', realpath(__DIR__ . '/../..'));

require_once PROJECT_ROOT . '/vendor/autoload.php';
require_once __DIR__ . '/../config/app.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

spl_autoload_register(function (string $class): void {
    $base = realpath(__DIR__ . '/..');   // /backend
    $map  = [
        'Core\\'        => $base . '/core/',
        'Controllers\\' => $base . '/controllers/',
        'Models\\'      => $base . '/models/',
    ];
    foreach ($map as $prefix => $dir) {
        if (str_starts_with($class, $prefix)) {
            $file = $dir . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
            if (file_exists($file)) require $file;
            return;
        }
    }
});


$router = new \Core\Router();
require __DIR__ . '/../routes/api.php';
$router->dispatch();
