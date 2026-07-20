import { Fragment, useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchMyCaseAudits } from '../../services/api';
import {
  AlertTriangle, CheckCircle2, ClipboardList, ChevronDown, ChevronUp, MessageSquare,
} from 'lucide-react';

const COACHING_THRESHOLD = 70;

export default function AgentDashboard() {
  const { token } = useAuth();
  const [audits, setAudits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMyCaseAudits(token);
        if (!cancelled) {
          setAudits(data.audits ?? []);
          setStats(data.stats ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const latest = audits[0];
  const needsCoaching = latest && Number(latest.score) < COACHING_THRESHOLD;

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <DashboardLayout pageTitle="My Quality Assessments">
      <div className="profile-card">
        <div className="profile-card-title">Score Overview</div>
        <div className="qa-agent-summary">
          <div><span className="qa-agent-label">Average Score</span><span className="qa-agent-value">{stats?.avg_score != null ? `${stats.avg_score}%` : '—'}</span></div>
          <div><span className="qa-agent-label">Last Score</span><span className="qa-agent-value">{stats?.last_score != null ? `${stats.last_score}%` : '—'}</span></div>
          <div><span className="qa-agent-label">Total Assessments</span><span className="qa-agent-value">{audits.length}</span></div>
        </div>

        {needsCoaching && (
          <div className="qa-result-box qa-result-box--low" style={{ marginTop: 18 }}>
            <div className="qa-result-score">{latest.score}%</div>
            <div className="qa-result-msg">
              <AlertTriangle size={16} />
              {latest.feedback?.coaching_note || 'This score is below target. A coaching session will be automatically scheduled to discuss areas for improvement.'}
            </div>
          </div>
        )}
      </div>

      <div className="profile-card">
        <div className="profile-card-title">
          <ClipboardList size={16} style={{ verticalAlign: -3, marginRight: 6 }} />
          Assessment History
        </div>
        {loading ? (
          <div className="mgmt-state-msg">Loading…</div>
        ) : audits.length === 0 ? (
          <div className="mgmt-state-msg">No assessments recorded yet.</div>
        ) : (
          <div className="mgmt-table-wrap">
            <table className="mgmt-table">
              <thead>
                <tr>
                  {['', 'Date', 'Type', 'Ticket', 'Desk', 'Auditor', 'Score', 'Status'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audits.map((row) => {
                  const low = Number(row.score) < COACHING_THRESHOLD;
                  const isOpen = expandedId === row.id;
                  return (
                    <Fragment key={row.id}>
                      <tr className="qa-history-row" onClick={() => toggleExpand(row.id)}>
                        <td>{isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                        <td>{row.assessed_at}</td>
                        <td className="mgmt-cell-strong">{row.assessment_type}</td>
                        <td className="mgmt-cell-muted">{row.ticket_ref || '—'}</td>
                        <td>{row.desk_name}</td>
                        <td>{row.auditor_name || '—'}</td>
                        <td>
                          <span className={`mgmt-status-pill ${low ? 'mgmt-status-pill--pending' : 'mgmt-status-pill--approved'}`}>
                            {row.score}%
                          </span>
                        </td>
                        <td>
                          {low ? (
                            <span className="qa-result-msg" style={{ fontSize: 12 }}>
                              <AlertTriangle size={13} /> Coaching scheduled
                            </span>
                          ) : (
                            <span className="qa-result-msg qa-result-msg--good" style={{ fontSize: 12 }}>
                              <CheckCircle2 size={13} /> On target
                            </span>
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={8} className="qa-breakdown-cell">
                            {row.breakdown?.length ? (
                              <div className="qa-breakdown-list">
                                {row.breakdown.map((b) => (
                                  <div key={b.key} className={`qa-breakdown-item${b.answer === 'no' ? ' qa-breakdown-item--no' : ''}`}>
                                    <div className="qa-breakdown-question">
                                      {b.answer === 'no' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                                      {b.question}
                                    </div>
                                    <span className={`qa-breakdown-answer${b.answer === 'no' ? ' qa-breakdown-answer--no' : ''}`}>
                                      {b.answer === 'no' ? 'No' : 'Yes'}
                                    </span>
                                    {b.comment && (
                                      <div className="qa-breakdown-comment">
                                        <MessageSquare size={12} /> {b.comment}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="mgmt-state-msg">No per-question detail available for this assessment.</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
