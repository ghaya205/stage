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

$pdo->exec("CREATE TABLE IF NOT EXISTS case_audits (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    agent_id        INT NOT NULL,
    desk_id         INT NOT NULL,
    auditor_id      INT NOT NULL,
    ticket_ref      VARCHAR(100) NULL,
    channel         VARCHAR(50)  NULL,
    assessment_type ENUM('call','case','chat') NOT NULL,
    answers         JSON NOT NULL,
    feedback        JSON NULL,
    score           DECIMAL(5,2) NOT NULL,
    wfe_result      DECIMAL(5,2) NULL,
    assessed_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_case_audits_agent   FOREIGN KEY (agent_id)   REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_case_audits_desk    FOREIGN KEY (desk_id)    REFERENCES desks(id) ON DELETE CASCADE,
    CONSTRAINT fk_case_audits_auditor FOREIGN KEY (auditor_id) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_case_audits_agent (agent_id),
    INDEX idx_case_audits_desk (desk_id),
    INDEX idx_case_audits_date (assessed_at)
)");
echo "case_audits table ready.\n";

echo "Setup complete.\n";
