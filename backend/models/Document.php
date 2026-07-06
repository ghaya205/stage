<?php
namespace Models;

use Core\Database;
use PDO;

class Document {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function create(int $userId, string $category, string $originalName, string $path): int {
        $stmt = $this->db->prepare(
            "INSERT INTO documents (user_id, category, original_name, path) VALUES (?, ?, ?, ?)"
        );
        $stmt->execute([$userId, $category, $originalName, $path]);
        return (int) $this->db->lastInsertId();
    }

    public function mine(int $userId): array {
        $stmt = $this->db->prepare(
            "SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC"
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function find(int $id): array|false {
        $stmt = $this->db->prepare("SELECT * FROM documents WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM documents WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
