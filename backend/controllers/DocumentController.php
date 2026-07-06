<?php
namespace Controllers;

use Core\Controller;
use Models\Document;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class DocumentController extends Controller {

    public function mine(): void {
        $decoded = $this->requireAuth();
        $model = new Document();
        $this->json(['documents' => $model->mine((int) $decoded->sub)]);
    }

    public function upload(): void {
        $decoded = $this->requireAuth();
        $category = $_POST['category'] ?? 'other';
        if (!in_array($category, ['cv', 'video', 'other'], true)) {
            $category = 'other';
        }

        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $this->json(['error' => 'No valid file uploaded'], 400);
        }

        $file = $_FILES['file'];
        if ($file['size'] > 15 * 1024 * 1024) {
            $this->json(['error' => 'File must be smaller than 15MB'], 400);
        }

        $dir = PROJECT_ROOT . '/backend/public/uploads/documents';
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'doc_' . $decoded->sub . '_' . time() . ($ext ? '.' . $ext : '');
        move_uploaded_file($file['tmp_name'], $dir . '/' . $filename);
        $path = 'uploads/documents/' . $filename;

        $model = new Document();
        $id = $model->create((int) $decoded->sub, $category, $file['name'], $path);

        $this->json(['message' => 'File uploaded successfully', 'id' => $id], 201);
    }

    public function delete(): void {
        $decoded = $this->requireAuth();
        $data    = $this->input();
        $id      = (int) ($data['id'] ?? 0);

        if (!$id) {
            $this->json(['error' => 'Document id is required'], 400);
        }

        $model    = new Document();
        $document = $model->find($id);
        if (!$document) {
            $this->json(['error' => 'Document not found'], 404);
        }
        if ((int) $document['user_id'] !== (int) $decoded->sub && (int) $decoded->role_id !== 3) {
            $this->json(['error' => 'Forbidden'], 403);
        }

        $model->delete($id);
        $this->json(['message' => 'Document removed']);
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
