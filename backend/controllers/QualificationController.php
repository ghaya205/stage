<?php
namespace Controllers;

use Core\Controller;
use Models\Qualification;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class QualificationController extends Controller {

    public function mine(): void {
        $decoded = $this->requireAuth();
        $model = new Qualification();
        $this->json(['qualifications' => $model->mine((int) $decoded->sub)]);
    }

    public function create(): void {
        $decoded = $this->requireAuth();

        $type        = $_POST['type']        ?? '';
        $name        = trim($_POST['name']        ?? '');
        $institution = trim($_POST['institution'] ?? '');

        if (!in_array($type, ['diploma', 'certification'], true)) {
            $this->json(['error' => 'A valid qualification type is required'], 400);
        }
        if (!$name) {
            $this->json(['error' => 'Qualification name is required'], 400);
        }

        $proofPath = null;
        if (!empty($_FILES['proof']) && $_FILES['proof']['error'] === UPLOAD_ERR_OK) {
            $file    = $_FILES['proof'];
            $allowed = [
                'image/jpeg'      => 'jpg',
                'image/png'       => 'png',
                'image/webp'      => 'webp',
                'application/pdf' => 'pdf',
            ];
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime  = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            if (!isset($allowed[$mime])) {
                $this->json(['error' => 'Proof must be a JPG, PNG, WEBP or PDF file'], 400);
            }
            if ($file['size'] > 8 * 1024 * 1024) {
                $this->json(['error' => 'Proof file must be smaller than 8MB'], 400);
            }

            $dir = PROJECT_ROOT . '/backend/public/uploads/qualifications';
            if (!is_dir($dir)) {
                mkdir($dir, 0775, true);
            }

            $filename = 'qual_' . $decoded->sub . '_' . time() . '.' . $allowed[$mime];
            move_uploaded_file($file['tmp_name'], $dir . '/' . $filename);
            $proofPath = 'uploads/qualifications/' . $filename;
        }

        $model = new Qualification();
        $id = $model->create((int) $decoded->sub, $type, $name, $institution ?: null, $proofPath);

        $this->json(['message' => 'Qualification added successfully', 'id' => $id], 201);
    }

    public function delete(): void {
        $decoded = $this->requireAuth();
        $data    = $this->input();
        $id      = (int) ($data['id'] ?? 0);

        if (!$id) {
            $this->json(['error' => 'Qualification id is required'], 400);
        }

        $model = new Qualification();
        $qualification = $model->find($id);
        if (!$qualification) {
            $this->json(['error' => 'Qualification not found'], 404);
        }
        if ((int) $qualification['user_id'] !== (int) $decoded->sub && (int) $decoded->role_id !== 3) {
            $this->json(['error' => 'Forbidden'], 403);
        }

        $model->delete($id);
        $this->json(['message' => 'Qualification removed']);
    }

    public function all(): void {
        $decoded = $this->requireAuth();
        if ((int) $decoded->role_id !== 3) {
            $this->json(['error' => 'Forbidden'], 403);
        }
        $model = new Qualification();
        $this->json(['qualifications' => $model->all()]);
    }

    public function adminDelete(): void {
        $decoded = $this->requireAuth();
        if ((int) $decoded->role_id !== 3) {
            $this->json(['error' => 'Forbidden'], 403);
        }
        $data = $this->input();
        $id   = (int) ($data['id'] ?? 0);
        if (!$id) {
            $this->json(['error' => 'Qualification id is required'], 400);
        }
        $model = new Qualification();
        $model->delete($id);
        $this->json(['message' => 'Qualification removed']);
    }

    public function approve(): void {
        $decoded = $this->requireAuth();
        if ((int) $decoded->role_id !== 3) {
            $this->json(['error' => 'Forbidden'], 403);
        }
        $data = $this->input();
        $id   = (int) ($data['id'] ?? 0);
        if (!$id) {
            $this->json(['error' => 'Qualification id is required'], 400);
        }
        $model = new Qualification();
        $model->approve($id);
        $this->json(['message' => 'Qualification approved']);
    }

    private function requireAuth(): object {
        $token = $this->bearerToken();
        if (!$token) {
            $this->json(['error' => 'No token provided'], 401);
        }
        try {
            return JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
        } catch (\Exception $e) {
            $this->json(['error' => 'Invalid or expired token'], 401);
        }
    }

    private function bearerToken(): string {
        $header = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? '';

        if (!$header && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $header  = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }

        return str_replace('Bearer ', '', $header);
    }
}
