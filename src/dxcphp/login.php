<?php
require_once __DIR__ . '/config.php';
require_once PROJECT_ROOT . '/vendor/autoload.php';
require_once __DIR__ . '/db.php';

use Firebase\JWT\JWT;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$data  = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email']    ?? '');
$pass  =      $data['password'] ?? '';

if (!$email || !$pass) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($pass, $user['password'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid email or password']);
    exit;
}

$payload = [
    'iss'   => 'dxc-app',
    'iat'   => time(),
    'exp'   => time() + 3600,
    'sub'   => $user['id'],
    'name'  => $user['name'],
    'email' => $user['email'],
];

echo json_encode(['token' => JWT::encode($payload, JWT_SECRET, 'HS256')]);