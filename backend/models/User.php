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

    public function create(string $name, string $email, string $passwordHash, int $roleId, bool $preApproved = false): bool {
        $approved = $preApproved ? 1 : 0;
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO users (name, email, password, role_id, is_approved) VALUES (?, ?, ?, ?, ?)"
            );
            return $stmt->execute([$name, $email, $passwordHash, $roleId, $approved]);
        } catch (\Exception $e) {
            $stmt = $this->db->prepare(
                "INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)"
            );
            return $stmt->execute([$name, $email, $passwordHash, $roleId]);
        }
    }

    public function updateName(int $id, string $name): bool {
        $stmt = $this->db->prepare("UPDATE users SET name = ? WHERE id = ?");
        return $stmt->execute([$name, $id]);
    }

    public function updatePassword(int $id, string $passwordHash): bool {
        $stmt = $this->db->prepare("UPDATE users SET password = ? WHERE id = ?");
        return $stmt->execute([$passwordHash, $id]);
    }

 
    public function getAllUsers(): array {
        $stmt = $this->db->prepare(
            "SELECT u.id,
                    u.name,
                    u.email,
                    u.role_id,
                    u.is_approved,

                    r.name AS role_name
             FROM users u
             JOIN roles r ON r.id = u.role_id
             WHERE u.role_id != 3
             ORDER BY u.is_approved ASC, u.id DESC"
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function approveUser(int $userId, int $adminId): bool {
        $stmt = $this->db->prepare(
            "UPDATE users SET is_approved = 1, approved_at = NOW(), approved_by = ? WHERE id = ?"
        );
        return $stmt->execute([$adminId, $userId]);
    }

    public function rejectUser(int $userId): bool {
        $stmt = $this->db->prepare("UPDATE users SET is_approved = 2 WHERE id = ?");
        return $stmt->execute([$userId]);
    }

    public function verifyEnterpriseCode(string $code): bool {
        $stmt = $this->db->prepare("SELECT code FROM enterprise_codes WHERE is_active = 1");
        $stmt->execute();
        $rows = $stmt->fetchAll();
        foreach ($rows as $row) {
            if (password_verify($code, $row['code'])) {
                return true;
            }
        }
        return false;
    }
}
