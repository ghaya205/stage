<?php
namespace Core;

class Controller {
    protected function json(mixed $data, int $status = 200): void {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }

    protected function input(): array {
        return (array) json_decode(file_get_contents('php://input'), true);
    }
}
