<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$data     = json_decode(file_get_contents('php://input'), true);
$name     = trim($data['name']     ?? '');
$email    = trim($data['email']    ?? '');
$password =      $data['password'] ?? '';
$role     = trim($data['role']     ?? 'agent');

if (!$name || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Name, email and password are required']);
    exit;
}

$check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$check->execute([$email]);
if ($check->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'An account with this email already exists']);
    exit;
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
$stmt->execute([$name, $email, $hash, $role]);

http_response_code(201);
echo json_encode(['message' => 'Account created successfully']);