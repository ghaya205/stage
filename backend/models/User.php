<?php
namespace Models;

use Core\Database;
use PDO;

class User {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function findByEmail(string $email): array|false {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch();
    }

    public function findById(int $id): array|false {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function emailExists(string $email): bool {
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        return (bool) $stmt->fetch();
    }

    public function getRoleId(string $roleName): int|false {
        $stmt = $this->db->prepare("SELECT id FROM roles WHERE LOWER(name) = ?");
        $stmt->execute([strtolower($roleName)]);
        $row = $stmt->fetch();
        return $row ? (int) $row['id'] : false;
    }

    public function create(string $name, string $email, string $passwordHash, int $roleId): bool {
        $stmt = $this->db->prepare(
            "INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)"
        );
        return $stmt->execute([$name, $email, $passwordHash, $roleId]);
    }

    public function updateName(int $id, string $name): bool {
        $stmt = $this->db->prepare("UPDATE users SET name = ? WHERE id = ?");
        return $stmt->execute([$name, $id]);
    }

    public function updatePassword(int $id, string $passwordHash): bool {
        $stmt = $this->db->prepare("UPDATE users SET password = ? WHERE id = ?");
        return $stmt->execute([$passwordHash, $id]);
    }
}
