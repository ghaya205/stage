<?php
namespace Controllers;

use Core\Controller;
use Models\User;
use Models\Presence;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class PresenceController extends Controller {

    public function markToday(): void {
        $decoded = $this->requireAuth();

        $presenceModel = new Presence();
        $status = $presenceModel->markPresent((int) $decoded->sub);

        $this->json(['message' => 'You are marked present for today', 'presence' => $status]);
    }

    public function myToday(): void {
        $decoded = $this->requireAuth();

        $presenceModel = new Presence();
        $status = $presenceModel->today((int) $decoded->sub);

        $this->json(['present' => (bool) $status, 'presence' => $status ?: null]);
    }

    public function listToday(): void {
        $decoded = $this->requireAuth();
        if (!in_array((int) $decoded->role_id, [2, 3])) {
            $this->json(['error' => 'Forbidden'], 403);
        }

        $userModel     = new User();
        $presenceModel = new Presence();

        if ((int) $decoded->role_id === 2) {
            $supervisor = $userModel->findById((int) $decoded->sub);
            $deskId     = $supervisor['desk_id'] ?? null;
            $users      = $deskId ? $userModel->getDeskAgentsForPresence((int) $deskId) : [];
        } else {
            $users = $userModel->getAllForPresence();
        }

        $presentToday = $presenceModel->allForToday();

        $presentMap = [];
        foreach ($presentToday as $row) {
            $presentMap[(int) $row['user_id']] = $row['marked_at'];
        }

        foreach ($users as &$u) {
            $u['is_present'] = isset($presentMap[(int) $u['id']]);
            $u['marked_at']  = $presentMap[(int) $u['id']] ?? null;
        }

        $this->json(['users' => $users]);
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
