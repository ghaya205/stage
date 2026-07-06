<?php
namespace Controllers;

use Core\Controller;
use Models\SupportRequest;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class RequestController extends Controller {

    private const TYPES = ['work_certificate', 'salary_certificate', 'leave_entitlement'];

    public function create(): void {
        $decoded = $this->requireAuth();
        $data    = $this->input();

        $type    = $data['type']    ?? '';
        $subject = trim($data['subject'] ?? '');
        $content = trim($data['content'] ?? '');

        if (!in_array($type, self::TYPES, true)) {
            $this->json(['error' => 'A valid request type is required'], 400);
        }
        if (!$subject) {
            $this->json(['error' => 'Subject is required'], 400);
        }
        if (strlen($content) > 300) {
            $this->json(['error' => 'Content must be 300 characters or fewer'], 400);
        }

        $requestModel = new SupportRequest();
        $id = $requestModel->create((int) $decoded->sub, $type, $subject, $content ?: null);

        $this->json(['message' => 'Request submitted successfully', 'id' => $id], 201);
    }

    public function mine(): void {
        $decoded = $this->requireAuth();
        $requestModel = new SupportRequest();
        $this->json(['requests' => $requestModel->mine((int) $decoded->sub)]);
    }

    public function all(): void {
        $decoded = $this->requireAuth();
        if (!in_array((int) $decoded->role_id, [2, 3], true)) {
            $this->json(['error' => 'Forbidden'], 403);
        }
        $requestModel = new SupportRequest();
        $this->json(['requests' => $requestModel->all()]);
    }

    public function reply(): void {
        $decoded = $this->requireAuth();
        if (!in_array((int) $decoded->role_id, [2, 3], true)) {
            $this->json(['error' => 'Forbidden'], 403);
        }

        $data   = $this->input();
        $id     = (int) ($data['id'] ?? 0);
        $status = $data['status'] ?? '';
        $note   = trim($data['note'] ?? '');

        if (!$id || !in_array($status, ['approved', 'rejected'], true)) {
            $this->json(['error' => 'A request id and valid status are required'], 400);
        }

        $requestModel = new SupportRequest();
        if (!$requestModel->find($id)) {
            $this->json(['error' => 'Request not found'], 404);
        }

        $requestModel->reply($id, $status, $note ?: null, (int) $decoded->sub);
        $this->json(['message' => 'Request updated successfully']);
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
