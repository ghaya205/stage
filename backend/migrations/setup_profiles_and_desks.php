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

$pdo->exec("CREATE TABLE IF NOT EXISTS desks (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(150) NOT NULL,
    acronym        VARCHAR(20)  NOT NULL,
    languages      JSON NULL,
    call_questions JSON NULL,
    case_questions JSON NULL,
    chat_questions JSON NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");
echo "desks table ready.\n";

$cols = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);

$newColumns = [
    'national_id'      => "VARCHAR(50)  NULL",
    'phone'            => "VARCHAR(30)  NULL",
    'address'          => "VARCHAR(255) NULL",
    'governorate'      => "VARCHAR(100) NULL",
    'marital_status'   => "VARCHAR(30)  NULL",
    'child_number'     => "INT          NULL",
    'title'            => "VARCHAR(150) NULL",
    'desk_id'          => "INT          NULL",
    'technical_skills' => "TEXT         NULL",
    'diplomas'         => "TEXT         NULL",
    'certifications'   => "TEXT         NULL",
    'skills'           => "TEXT         NULL",
    'manager_name'     => "VARCHAR(150) NULL",
    'hr_manager_name'  => "VARCHAR(150) NULL",
    'language'         => "VARCHAR(100) NULL",
    'profile_picture'  => "VARCHAR(255) NULL",
];

$previous = 'approved_by';
foreach ($newColumns as $name => $definition) {
    if (!in_array($name, $cols)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN $name $definition AFTER $previous");
        echo "Column $name added.\n";
    } else {
        echo "Column $name already exists.\n";
    }
    $previous = $name;
}

$fkExists = $pdo->query(
    "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND CONSTRAINT_NAME = 'fk_users_desk'"
)->fetchColumn();

if ($fkExists == 0) {
    $pdo->exec("ALTER TABLE users ADD CONSTRAINT fk_users_desk FOREIGN KEY (desk_id) REFERENCES desks(id) ON DELETE SET NULL");
    echo "Foreign key fk_users_desk added.\n";
} else {
    echo "Foreign key fk_users_desk already exists.\n";
}

echo "Setup complete.\n";
