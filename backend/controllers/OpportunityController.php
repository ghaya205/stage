<?php
namespace Controllers;

use Core\Controller;
use Models\Opportunity;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class OpportunityController extends Controller {

    public function list(): void {
        $this->requireAuth();
        $search   = trim($_GET['search']   ?? '');
        $category = trim($_GET['category'] ?? '');

        $model = new Opportunity();
        $this->json(['opportunities' => $model->all($search, $category)]);
    }

    public function create(): void {
        $decoded = $this->requireAuth();
        if ((int) $decoded->role_id !== 3) {
            $this->json(['error' => 'Forbidden'], 403);
        }

        $data = $this->input();
        $title    = trim($data['title']    ?? '');
        $category = trim($data['category'] ?? '');

        if (!$title || !$category) {
            $this->json(['error' => 'Title and category are required'], 400);
        }

        $model = new Opportunity();
        $id = $model->create($data, (int) $decoded->sub);

        $this->json(['message' => 'Opportunity posted successfully', 'id' => $id], 201);
    }

    public function delete(): void {
        $decoded = $this->requireAuth();
        if ((int) $decoded->role_id !== 3) {
            $this->json(['error' => 'Forbidden'], 403);
        }

        $data = $this->input();
        $id   = (int) ($data['id'] ?? 0);
        if (!$id) {
            $this->json(['error' => 'Opportunity id is required'], 400);
        }

        $model = new Opportunity();
        if (!$model->find($id)) {
            $this->json(['error' => 'Opportunity not found'], 404);
        }
        $model->delete($id);
        $this->json(['message' => 'Opportunity removed']);
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
