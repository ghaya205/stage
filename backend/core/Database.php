<?php
namespace Core;

use PDO;
use PDOException;

class Database {
    private static ?PDO $instance = null;

    public static function getInstance(): PDO {
        if (self::$instance === null) {
            $cfg = require __DIR__ . '/../config/database.php';
            try {
                self::$instance = new PDO(
                    "mysql:host={$cfg['host']};dbname={$cfg['dbname']};charset=utf8",
                    $cfg['user'],
                    $cfg['pass']
                );
                self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'DB connection failed: ' . $e->getMessage()]);
                exit;
            }
        }
        return self::$instance;
    }
}
