<?php
namespace Models;

use Core\Database;
use PDO;

class Opportunity {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function all(string $search = '', string $category = ''): array {
        $sql    = "SELECT * FROM opportunities WHERE 1 = 1";
        $params = [];

        if ($search !== '') {
            $sql .= " AND (title LIKE ? OR description LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        if ($category !== '' && strtolower($category) !== 'all categories') {
            $sql .= " AND category = ?";
            $params[] = $category;
        }
        $sql .= " ORDER BY created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function find(int $id): array|false {
        $stmt = $this->db->prepare("SELECT * FROM opportunities WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function create(array $data, int $createdBy): int {
        $stmt = $this->db->prepare(
            "INSERT INTO opportunities (title, category, location, description, created_by)
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['title'],
            $data['category'],
            $data['location'] ?? null,
            $data['description'] ?? null,
            $createdBy,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM opportunities WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
