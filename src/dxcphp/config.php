<?php
define('PROJECT_ROOT', realpath(__DIR__ . '/../..'));

$envFile = PROJECT_ROOT . '/.env';
if (!file_exists($envFile)) {
    http_response_code(500);
    echo json_encode(['error' => '.env not found at: ' . $envFile]);
    exit;
}

foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    $line = trim($line);
    if ($line === '' || str_starts_with($line, '#')) continue;
    if (!str_contains($line, '=')) continue;
    [$key, $val] = explode('=', $line, 2);
    $_ENV[trim($key)] = trim($val);
}

define('JWT_SECRET', $_ENV['jwtsecret'] ?? '');
if (!JWT_SECRET) {
    http_response_code(500);
    echo json_encode(['error' => 'jwtsecret missing in .env. PROJECT_ROOT=' . PROJECT_ROOT]);
    exit;
}