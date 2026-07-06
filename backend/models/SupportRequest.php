<?php
namespace Models;

use Core\Database;
use PDO;

class SupportRequest {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function create(int $userId, string $type, string $subject, ?string $content): int {
        $stmt = $this->db->prepare(
            "INSERT INTO requests (user_id, type, subject, content) VALUES (?, ?, ?, ?)"
        );
        $stmt->execute([$userId, $type, $subject, $content]);
        return (int) $this->db->lastInsertId();
    }

    public function mine(int $userId, int $limit = 10): array {
        $stmt = $this->db->prepare(
            "SELECT r.*, u.email AS agent_email
             FROM requests r
             JOIN users u ON u.id = r.user_id
             WHERE r.user_id = ?
             ORDER BY r.created_at DESC
             LIMIT ?"
        );
        $stmt->bindValue(1, $userId, PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function all(): array {
        $stmt = $this->db->query(
            "SELECT r.*, u.name AS agent_name, u.email AS agent_email
             FROM requests r
             JOIN users u ON u.id = r.user_id
             ORDER BY (r.status = 'pending') DESC, r.created_at DESC"
        );
        return $stmt->fetchAll();
    }

    public function find(int $id): array|false {
        $stmt = $this->db->prepare("SELECT * FROM requests WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function reply(int $id, string $status, ?string $note, int $adminId): bool {
        $stmt = $this->db->prepare(
            "UPDATE requests SET status = ?, admin_note = ?, replied_at = NOW(), replied_by = ? WHERE id = ?"
        );
        return $stmt->execute([$status, $note, $adminId, $id]);
    }
}
