<?php
namespace Models;

use Core\Database;
use PDO;

class Presence {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function markPresent(int $userId): array|false {
        $stmt = $this->db->prepare(
            "INSERT INTO presence (user_id, presence_date, marked_at)
             VALUES (?, CURDATE(), NOW())
             ON DUPLICATE KEY UPDATE marked_at = marked_at"
        );
        $stmt->execute([$userId]);
        return $this->today($userId);
    }

    public function today(int $userId): array|false {
        $stmt = $this->db->prepare(
            "SELECT * FROM presence WHERE user_id = ? AND presence_date = CURDATE()"
        );
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }

    public function allForToday(): array {
        $stmt = $this->db->query(
            "SELECT user_id, marked_at FROM presence WHERE presence_date = CURDATE()"
        );
        return $stmt->fetchAll();
    }
}
