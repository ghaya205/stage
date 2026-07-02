<?php

$projectRoot = dirname(__DIR__, 2);
$envFile = $projectRoot . '/.env';

if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $_ENV[trim($k)] = trim($v);
    }
}

$cfg = require __DIR__ . '/../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host={$cfg['host']};dbname={$cfg['dbname']};charset=utf8",
        $cfg['user'], $cfg['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Exception $e) {
    die("DB connection failed: " . $e->getMessage() . "\n");
}

$cols = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
if (!in_array('is_approved', $cols)) {
    $pdo->exec("ALTER TABLE users ADD COLUMN is_approved TINYINT(1) NOT NULL DEFAULT 0 AFTER role_id");
    echo "✓ Column is_approved added.\n";
} else {
    echo "· Column is_approved already exists.\n";
}
if (!in_array('approved_at', $cols)) {
    $pdo->exec("ALTER TABLE users ADD COLUMN approved_at DATETIME NULL AFTER is_approved");
    echo "✓ Column approved_at added.\n";
}
if (!in_array('approved_by', $cols)) {
    $pdo->exec("ALTER TABLE users ADD COLUMN approved_by INT NULL AFTER approved_at");
    echo "✓ Column approved_by added.\n";
}

$pdo->exec("UPDATE users SET is_approved = 1 WHERE role_id = 3 AND is_approved = 0");
echo "✓ Existing admin accounts approved. Agents/supervisors remain pending.\n";

$pdo->exec("CREATE TABLE IF NOT EXISTS enterprise_codes (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    code       VARCHAR(255) NOT NULL,
    label      VARCHAR(100) NOT NULL DEFAULT 'Enterprise Code',
    is_active  TINYINT(1)   NOT NULL DEFAULT 1,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
)");
echo "✓ enterprise_codes table ready.\n";

$existing = $pdo->query("SELECT COUNT(*) FROM enterprise_codes")->fetchColumn();
if ($existing == 0) {
    $opts = getopt('', ['code:']);
    $plainCode = $opts['code'] ?? 'DXC-ADMIN-2025';
    $hash = password_hash($plainCode, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO enterprise_codes (code, label, is_active) VALUES (?, ?, 1)");
    $stmt->execute([$hash, 'Default Enterprise Code']);
    
    echo "  Enterprise Code : {$plainCode}\n";
    echo "  Share only with authorized admins.\n";
    
} else {
    echo "· Enterprise code already set.\n";
}
