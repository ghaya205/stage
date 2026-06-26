<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$data     = json_decode(file_get_contents('php://input'), true);
$name     = trim($data['name']     ?? '');
$email    = trim($data['email']    ?? '');
$password =      $data['password'] ?? '';
$roleName = strtolower(trim($data['role'] ?? ''));

if (!$name || !$email || !$password || !$roleName) {
    http_response_code(400);
    echo json_encode(['error' => 'Name, email, password and role are required']);
    exit;
}

// Look up role_id from roles table (case-insensitive)
$roleStmt = $pdo->prepare("SELECT id FROM roles WHERE LOWER(name) = ?");
$roleStmt->execute([$roleName]);
$roleRow = $roleStmt->fetch(PDO::FETCH_ASSOC);

if (!$roleRow) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid role selected']);
    exit;
}
$roleId = $roleRow['id'];

// Check duplicate email
$check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$check->execute([$email]);
if ($check->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'An account with this email already exists']);
    exit;
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $pdo->prepare("INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)");
$stmt->execute([$name, $email, $hash, $roleId]);

http_response_code(201);
echo json_encode(['message' => 'Account created successfully']);