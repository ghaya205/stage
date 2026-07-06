<?php
namespace Models;

use Core\Database;
use PDO;

class Qualification {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function create(int $userId, string $type, string $name, ?string $institution, ?string $proofPath): int {
        $status = $type === 'diploma' ? 'approved' : 'pending';
        $stmt = $this->db->prepare(
            "INSERT INTO qualifications (user_id, type, name, institution, proof_path, status)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([$userId, $type, $name, $institution, $proofPath, $status]);
        return (int) $this->db->lastInsertId();
    }

    public function mine(int $userId): array {
        $stmt = $this->db->prepare(
            "SELECT * FROM qualifications WHERE user_id = ? ORDER BY created_at DESC"
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function find(int $id): array|false {
        $stmt = $this->db->prepare("SELECT * FROM qualifications WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function all(): array {
        $stmt = $this->db->query(
            "SELECT q.*, u.name AS user_name, u.email AS user_email
             FROM qualifications q
             JOIN users u ON u.id = q.user_id
             ORDER BY (q.status = 'pending') DESC, q.created_at DESC"
        );
        return $stmt->fetchAll();
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM qualifications WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function approve(int $id): bool {
        $stmt = $this->db->prepare("UPDATE qualifications SET status = 'approved' WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
