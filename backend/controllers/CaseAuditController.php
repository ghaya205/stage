<?php
namespace Controllers;

use Core\Controller;
use Models\CaseAudit;
use Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class CaseAuditController extends Controller {

    /** POST /case-audits — "CONFIRM CASE" button. Only supervisors/admins can audit. */
    public function create(): void {
        $decoded = $this->requireAuth();
        if (!in_array((int) $decoded->role_id, [2, 3], true)) {
            $this->json(['error' => 'Forbidden'], 403);
        }

        $data = $this->input();

        $agentId        = (int) ($data['agent_id'] ?? 0);
        $deskId         = (int) ($data['desk_id'] ?? 0);
        $assessmentType = $data['assessment_type'] ?? '';
        $answers        = $data['answers'] ?? [];

        if (!$agentId || !$deskId || !in_array($assessmentType, ['call', 'case', 'chat'], true) || !$answers) {
            $this->json(['error' => 'agent_id, desk_id, assessment_type and answers are required'], 400);
        }

        $userModel  = new User();
        $agent      = $userModel->findById($agentId);
        if (!$agent) {
            $this->json(['error' => 'Agent not found'], 404);
        }

        $score = $this->computeScore($answers, $data['weights'] ?? []);

        $auditModel = new CaseAudit();
        $id = $auditModel->create([
            'agent_id'        => $agentId,
            'desk_id'         => $deskId,
            'auditor_id'      => (int) $decoded->sub,
            'ticket_ref'      => $data['ticket_ref']      ?? null,
            'channel'         => $data['channel']         ?? null,
            'assessment_type' => $assessmentType,
            'answers'         => $answers,
            'feedback'        => $data['feedback']        ?? [],
            'score'           => $score,
            'wfe_result'      => $data['wfe_result']      ?? null,
        ]);

        $this->json(['message' => 'Case confirmed', 'id' => $id, 'score' => $score], 201);
    }

    /** GET /case-audits?agent_id=123 — feeds the "Case Audit Logs" history table. */
    public function forAgent(): void {
        $this->requireAuth();

        $agentId = (int) ($_GET['agent_id'] ?? 0);
        if (!$agentId) {
            $this->json(['error' => 'agent_id is required'], 400);
        }

        $auditModel = new CaseAudit();
        $this->json([
            'audits' => $auditModel->forAgent($agentId),
            'stats'  => $auditModel->statsForAgent($agentId),
        ]);
    }

    /** GET /case-audits/export?agent_id=123 — "Export Case CSV" button. */
    public function exportForAgent(): void {
        $this->requireAuth();

        $agentId = (int) ($_GET['agent_id'] ?? 0);
        if (!$agentId) {
            $this->json(['error' => 'agent_id is required'], 400);
        }

        $auditModel = new CaseAudit();
        $audits = $auditModel->forAgent($agentId);

        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="case_audits_agent_' . $agentId . '.csv"');

        $out = fopen('php://output', 'w');
        fputcsv($out, ['Audit Date', 'Agent Name', 'Ticket Ref', 'Channel', 'Auditor', 'Score', 'WFE', 'Answers', 'Feedback']);
        foreach ($audits as $row) {
            fputcsv($out, [
                $row['assessed_at'],
                $row['agent_name'],
                $row['ticket_ref'],
                $row['channel'],
                $row['auditor_name'],
                $row['score'],
                $row['wfe_result'],
                json_encode($row['answers']),
                json_encode($row['feedback']),
            ]);
        }
        fclose($out);
        exit;
    }

    /** Percentage score = sum of (answer value) weighted, over max possible. Adjust to match your COF/NOTE rules. */
    private function computeScore(array $answers, array $weights): float {
        $total = 0;
        $max   = 0;
        foreach ($answers as $qKey => $value) {
            $weight = (float) ($weights[$qKey] ?? 1);
            $total += ((float) $value) * $weight;
            $max   += 4 * $weight; // adjust 4 if your answer scale isn't 0-4
        }
        return $max > 0 ? round(($total / $max) * 100, 2) : 0.0;
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
