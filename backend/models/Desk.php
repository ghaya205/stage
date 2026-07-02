<?php
namespace Models;

use Core\Database;
use PDO;

class Desk {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function all(): array {
        $stmt = $this->db->query("SELECT * FROM desks ORDER BY name ASC");
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row = $this->decode($row);
        }
        return $rows;
    }

    public function find(int $id): array|false {
        $stmt = $this->db->prepare("SELECT * FROM desks WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->decode($row) : false;
    }

    public function nameExists(string $name, ?int $excludeId = null): bool {
        if ($excludeId) {
            $stmt = $this->db->prepare("SELECT id FROM desks WHERE name = ? AND id != ?");
            $stmt->execute([$name, $excludeId]);
        } else {
            $stmt = $this->db->prepare("SELECT id FROM desks WHERE name = ?");
            $stmt->execute([$name]);
        }
        return (bool) $stmt->fetch();
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare(
            "INSERT INTO desks (name, acronym, languages, call_questions, case_questions, chat_questions)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['name'],
            $data['acronym'],
            json_encode($data['languages'] ?? []),
            json_encode($data['call_questions'] ?? []),
            json_encode($data['case_questions'] ?? []),
            json_encode($data['chat_questions'] ?? []),
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $stmt = $this->db->prepare(
            "UPDATE desks
             SET name = ?, acronym = ?, languages = ?, call_questions = ?, case_questions = ?, chat_questions = ?
             WHERE id = ?"
        );
        return $stmt->execute([
            $data['name'],
            $data['acronym'],
            json_encode($data['languages'] ?? []),
            json_encode($data['call_questions'] ?? []),
            json_encode($data['case_questions'] ?? []),
            json_encode($data['chat_questions'] ?? []),
            $id,
        ]);
    }

    private function decode(array $row): array {
        $row['languages']      = json_decode($row['languages'] ?? '[]', true) ?? [];
        $row['call_questions'] = json_decode($row['call_questions'] ?? '[]', true) ?? [];
        $row['case_questions'] = json_decode($row['case_questions'] ?? '[]', true) ?? [];
        $row['chat_questions'] = json_decode($row['chat_questions'] ?? '[]', true) ?? [];
        return $row;
    }
}
