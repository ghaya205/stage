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

$pdo->exec("CREATE TABLE IF NOT EXISTS companies (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(150) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)");
echo "companies table ready.\n";

$deskCols = $pdo->query("SHOW COLUMNS FROM desks")->fetchAll(PDO::FETCH_COLUMN);
if (!in_array('company_id', $deskCols)) {
    $pdo->exec("ALTER TABLE desks ADD COLUMN company_id INT NULL AFTER acronym");
    echo "Column desks.company_id added.\n";
} else {
    echo "Column desks.company_id already exists.\n";
}

$fkExists = $pdo->query(
    "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'desks'
       AND CONSTRAINT_NAME = 'fk_desks_company'"
)->fetchColumn();
if ($fkExists == 0) {
    $pdo->exec("ALTER TABLE desks ADD CONSTRAINT fk_desks_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL");
    echo "Foreign key fk_desks_company added.\n";
} else {
    echo "Foreign key fk_desks_company already exists.\n";
}

$pdo->exec("CREATE TABLE IF NOT EXISTS sla_targets (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    queue_name        VARCHAR(150) NOT NULL UNIQUE,
    desk_name         VARCHAR(150) NULL,
    company_id        INT NULL,
    timeframe_bh      INT NULL,
    timeframe_ooh     INT NULL,
    sla_type          VARCHAR(50)  NULL,
    abd_type          VARCHAR(50)  NULL,
    other_type        VARCHAR(50)  NULL,
    target_ans_rate   DECIMAL(6,3) NULL,
    target_abd_rate   DECIMAL(6,3) NULL,
    target_other      DECIMAL(6,3) NULL,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sla_targets_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
)");
echo "sla_targets table ready.\n";

$pdo->exec("CREATE TABLE IF NOT EXISTS sla_data (
    id                          BIGINT AUTO_INCREMENT PRIMARY KEY,
    queue_name                  VARCHAR(150) NOT NULL,
    start_date                  DATE NULL,
    start_time                  TIME NULL,
    end_date                    DATE NULL,
    end_time                    TIME NULL,

    contacts_abandoned_in_20    INT NULL,
    contacts_abandoned_in_30    INT NULL,
    contacts_abandoned_in_40    INT NULL,
    contacts_abandoned_in_45    INT NULL,
    contacts_abandoned_in_60    INT NULL,
    contacts_abandoned_in_90    INT NULL,
    contacts_abandoned_in_180   INT NULL,

    contacts_answered_in_20     INT NULL,
    contacts_answered_in_30     INT NULL,
    contacts_answered_in_40     INT NULL,
    contacts_answered_in_45     INT NULL,
    contacts_answered_in_60     INT NULL,
    contacts_answered_in_90     INT NULL,
    contacts_answered_in_180    INT NULL,

    service_level_60            DECIMAL(6,3) NULL,
    service_level_120           DECIMAL(6,3) NULL,

    agent_interaction_time      INT NULL,
    api_contacts                 INT NULL,
    api_contacts_handled         INT NULL,

    avg_agent_interaction_time  INT NULL,
    avg_customer_hold_time      INT NULL,
    avg_handle_time             INT NULL,
    avg_queue_abandon_time      INT NULL,
    avg_queue_answer_time       INT NULL,

    callback_contacts            INT NULL,
    callback_contacts_handled    INT NULL,

    contacts_abandoned          INT NULL,
    contacts_handled_incoming   INT NULL,
    contacts_handled_outbound   INT NULL,
    contacts_put_on_hold        INT NULL,
    contacts_queued             INT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_sla_data_queue (queue_name),
    INDEX idx_sla_data_date (start_date)
)");
echo "sla_data table ready.\n";

echo "Setup complete.\n";
