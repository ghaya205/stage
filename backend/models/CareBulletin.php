<?php
namespace Models;

use Core\Database;
use PDO;

class CareBulletin {
    private PDO $db;

    private const FEE_FIELDS = [
        'honoraires', 'pharmacie', 'analyse', 'radio_echo_scanner',
        'maternite_frais_clinique', 'chirurgie', 'injection',
        'dentaire', 'monture', 'verres',
    ];

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function create(int $userId, array $data, ?string $attachmentPath): int {
        $total = 0;
        foreach (self::FEE_FIELDS as $field) {
            $total += (float) ($data[$field] ?? 0);
        }

        $stmt = $this->db->prepare(
            "INSERT INTO care_bulletins
                (user_id, matricule, ref_bs, date_soins, adherent_name, patient_first_name,
                 honoraires, pharmacie, analyse, radio_echo_scanner, maternite_frais_clinique,
                 chirurgie, injection, dentaire, monture, verres, total_soins, comment, attachment_path)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $userId,
            $data['matricule'],
            $data['ref_bs'] ?? null,
            $data['date_soins'] ?: null,
            $data['adherent_name'],
            $data['patient_first_name'] ?? null,
            $data['honoraires'] ?? 0,
            $data['pharmacie'] ?? 0,
            $data['analyse'] ?? 0,
            $data['radio_echo_scanner'] ?? 0,
            $data['maternite_frais_clinique'] ?? 0,
            $data['chirurgie'] ?? 0,
            $data['injection'] ?? 0,
            $data['dentaire'] ?? 0,
            $data['monture'] ?? 0,
            $data['verres'] ?? 0,
            $total,
            $data['comment'] ?? null,
            $attachmentPath,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function mine(int $userId): array {
        $stmt = $this->db->prepare(
            "SELECT * FROM care_bulletins WHERE user_id = ? ORDER BY created_at DESC"
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function all(): array {
        $stmt = $this->db->query(
            "SELECT c.*, u.name AS user_name
             FROM care_bulletins c
             JOIN users u ON u.id = c.user_id
             ORDER BY (c.status = 'pending') DESC, c.created_at DESC"
        );
        return $stmt->fetchAll();
    }

    public function find(int $id): array|false {
        $stmt = $this->db->prepare("SELECT * FROM care_bulletins WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function updateStatus(int $id, string $status): bool {
        $stmt = $this->db->prepare("UPDATE care_bulletins SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }
}
