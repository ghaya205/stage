<?php
namespace Controllers;

use Core\Controller;
use Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthController extends Controller {

    
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
            'iss'   => 'dxc-app',
            'iat'   => time(),
            'exp'   => time() + 3600,
            'sub'   => $user['id'],
            'name'  => $user['name'],
            'email' => $user['email'],
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
        $token = $this->bearerToken();
        if (!$token) {
            $this->json(['error' => 'No token provided'], 401);
        }

        try {
            $decoded = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
            $this->json(['message' => 'Access granted!', 'user' => (array) $decoded]);
        } catch (\Exception $e) {
            $this->json(['error' => 'Invalid or expired token'], 401);
        }
    }

    private function bearerToken(): string {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        return str_replace('Bearer ', '', $header);
    }
}
