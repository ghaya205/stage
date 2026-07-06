<?php
namespace Controllers;

use Core\Controller;
use Models\CareBulletin;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class InsuranceController extends Controller {

    public function create(): void {
        $decoded = $this->requireAuth();

        $matricule    = trim($_POST['matricule']     ?? '');
        $adherentName = trim($_POST['adherent_name'] ?? '');

        if (!$matricule) {
            $this->json(['error' => 'Matricule is required'], 400);
        }
        if (!$adherentName) {
            $this->json(['error' => 'Adherent name is required'], 400);
        }

        $attachmentPath = null;
        if (!empty($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['attachment'];
            if ($file['size'] > 15 * 1024 * 1024) {
                $this->json(['error' => 'Attachment must be smaller than 15MB'], 400);
            }
            $dir = PROJECT_ROOT . '/backend/public/uploads/insurance';
            if (!is_dir($dir)) {
                mkdir($dir, 0775, true);
            }
            $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'bulletin_' . $decoded->sub . '_' . time() . ($ext ? '.' . $ext : '');
            move_uploaded_file($file['tmp_name'], $dir . '/' . $filename);
            $attachmentPath = 'uploads/insurance/' . $filename;
        }

        $model = new CareBulletin();
        $id = $model->create((int) $decoded->sub, $_POST, $attachmentPath);

        $this->json(['message' => 'Care bulletin submitted successfully', 'id' => $id], 201);
    }

    public function mine(): void {
        $decoded = $this->requireAuth();
        $model = new CareBulletin();
        $this->json(['bulletins' => $model->mine((int) $decoded->sub)]);
    }

    public function all(): void {
        $decoded = $this->requireAuth();
        if (!in_array((int) $decoded->role_id, [2, 3], true)) {
            $this->json(['error' => 'Forbidden'], 403);
        }
        $model = new CareBulletin();
        $this->json(['bulletins' => $model->all()]);
    }

    public function updateStatus(): void {
        $decoded = $this->requireAuth();
        if (!in_array((int) $decoded->role_id, [2, 3], true)) {
            $this->json(['error' => 'Forbidden'], 403);
        }

        $data   = $this->input();
        $id     = (int) ($data['id'] ?? 0);
        $status = $data['status'] ?? '';

        if (!$id || !in_array($status, ['approved', 'rejected'], true)) {
            $this->json(['error' => 'A bulletin id and valid status are required'], 400);
        }

        $model = new CareBulletin();
        if (!$model->find($id)) {
            $this->json(['error' => 'Bulletin not found'], 404);
        }
        $model->updateStatus($id, $status);
        $this->json(['message' => 'Bulletin updated successfully']);
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
