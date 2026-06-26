<?php
require_once __DIR__ . '/config.php';
require_once PROJECT_ROOT . '/vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token      = str_replace('Bearer ', '', $authHeader);

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'No token provided']);
    exit;
}

try {
    $decoded = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
    echo json_encode(['message' => 'Access granted!', 'user' => (array) $decoded]);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
}