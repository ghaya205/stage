<?php
namespace Controllers;

use Core\Controller;
use Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthController extends Controller {

    public function ping(): void {
        $dbOk  = false;
        $dbMsg = '';
        try {
            \Core\Database::getInstance();
            $dbOk  = true;
            $dbMsg = 'Connected';
        } catch (\Throwable $e) {
            $dbMsg = $e->getMessage();
        }

        $this->json([
            'status'       => 'ok',
            'php'          => PHP_VERSION,
            'project_root' => PROJECT_ROOT,
            'db'           => $dbOk ? 'ok' : 'error',
            'db_message'   => $dbMsg,
            'jwt_secret'   => defined('JWT_SECRET') ? (JWT_SECRET !== 'change_me_in_env' ? 'set' : 'default') : 'missing',
        ]);
    }

    public function login(): void {
        $data  = $this->input();
        $email = trim($data['email']    ?? '');
        $pass  =      $data['password'] ?? '';

        if (!$email || !$pass) {
            $this->json(['error' => 'Email and password are required'], 400);
        }

        $userModel = new User();
        $user      = $userModel->findByEmail($email);

        if (!$user || !password_verify($pass, $user['password'])) {
            $this->json(['error' => 'Invalid email or password'], 401);
        }

        $payload = [
            'iss'     => 'dxc-app',
            'iat'     => time(),
            'exp'     => time() + 3600,
            'sub'     => $user['id'],
            'name'    => $user['name'],
            'email'   => $user['email'],
            'role_id' => (int) $user['role_id'],
        ];

        $this->json(['token' => JWT::encode($payload, JWT_SECRET, 'HS256')]);
    }

    public function register(): void {
        $data     = $this->input();
        $name     = trim($data['name']     ?? '');
        $email    = trim($data['email']    ?? '');
        $password =      $data['password'] ?? '';
        $roleName = strtolower(trim($data['role'] ?? ''));

        if (!$name || !$email || !$password || !$roleName) {
            $this->json(['error' => 'Name, email, password and role are required'], 400);
        }

        $userModel = new User();

        $roleId = $userModel->getRoleId($roleName);
        if ($roleId === false) {
            $this->json(['error' => 'Invalid role selected'], 400);
        }

        if ($userModel->emailExists($email)) {
            $this->json(['error' => 'An account with this email already exists'], 409);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $userModel->create($name, $email, $hash, $roleId);

        $this->json(['message' => 'Account created successfully'], 201);
    }

    public function me(): void {
        $decoded = $this->requireAuth();
        $this->json(['message' => 'Access granted!', 'user' => (array) $decoded]);
    }

    public function updateProfile(): void {
        $decoded = $this->requireAuth();
        $data    = $this->input();
        $name    = trim($data['name'] ?? '');

        if (!$name) {
            $this->json(['error' => 'Name cannot be empty'], 400);
        }

        $userModel = new User();
        $userModel->updateName((int) $decoded->sub, $name);

        $this->json(['message' => 'Profile updated successfully']);
    }

    public function updatePassword(): void {
        $decoded    = $this->requireAuth();
        $data       = $this->input();
        $currentPwd = $data['current_password'] ?? '';
        $newPwd     = $data['new_password']     ?? '';

        if (!$currentPwd || !$newPwd) {
            $this->json(['error' => 'Current and new password are required'], 400);
        }

        if (strlen($newPwd) < 8) {
            $this->json(['error' => 'New password must be at least 8 characters'], 400);
        }

        $userModel = new User();
        $user      = $userModel->findById((int) $decoded->sub);

        if (!$user || !password_verify($currentPwd, $user['password'])) {
            $this->json(['error' => 'Current password is incorrect'], 401);
        }

        $userModel->updatePassword((int) $decoded->sub, password_hash($newPwd, PASSWORD_BCRYPT));

        $this->json(['message' => 'Password updated successfully']);
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
