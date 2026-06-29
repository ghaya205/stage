<?php

$projectRoot = dirname(dirname(dirname(__FILE__)));

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

ob_start();

set_error_handler(function (int $errno, string $errstr, string $errfile, int $errline): bool {
    ob_end_clean();
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'PHP Error: ' . $errstr, 'file' => basename($errfile), 'line' => $errline]);
    exit;
});

set_exception_handler(function (Throwable $e): void {
    ob_end_clean();
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => $e->getMessage(), 'type' => get_class($e), 'file' => basename($e->getFile()), 'line' => $e->getLine()]);
    exit;
});

register_shutdown_function(function (): void {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        ob_end_clean();
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Fatal: ' . $err['message'], 'file' => basename($err['file']), 'line' => $err['line']]);
    }
});

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit;
}

$autoload = $projectRoot . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';

if (!file_exists($autoload)) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode([
        'error'      => 'vendor/autoload.php not found',
        'looked_in'  => $autoload,
        'index_file' => __FILE__,
        'php_ver'    => PHP_VERSION,
    ]);
    exit;
}

define('PROJECT_ROOT', $projectRoot);

require_once $autoload;
require_once __DIR__ . '/../config/app.php';

ob_end_clean();

spl_autoload_register(function (string $class) use ($projectRoot): void {
    $base = $projectRoot . DIRECTORY_SEPARATOR . 'backend';
    $map  = [
        'Core\\'        => $base . DIRECTORY_SEPARATOR . 'core'        . DIRECTORY_SEPARATOR,
        'Controllers\\' => $base . DIRECTORY_SEPARATOR . 'controllers' . DIRECTORY_SEPARATOR,
        'Models\\'      => $base . DIRECTORY_SEPARATOR . 'models'      . DIRECTORY_SEPARATOR,
    ];
    foreach ($map as $prefix => $dir) {
        if (str_starts_with($class, $prefix)) {
            $file = $dir . str_replace('\\', DIRECTORY_SEPARATOR, substr($class, strlen($prefix))) . '.php';
            if (file_exists($file)) require $file;
            return;
        }
    }
});

$router = new \Core\Router();
require __DIR__ . '/../routes/api.php';
$router->dispatch();
