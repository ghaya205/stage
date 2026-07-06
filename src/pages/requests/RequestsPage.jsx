import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  createRequest, fetchMyRequests, fetchAllRequests, replyRequest,
} from '../../services/api';
import {
  FileText, Send, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Inbox,
} from 'lucide-react';

const TYPE_LABELS = {
  work_certificate: 'Work Certificate',
  salary_certificate: 'Salary Certificate',
  leave_entitlement: 'Leave Entitlement',
};

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt.replace(' ', 'T')).toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
  }) + ' ' + new Date(dt.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatusPill({ status }) {
  const map = {
    pending: { bg: 'rgba(107,114,128,0.12)', color: '#4b5563', label: 'Pending', icon: Clock },
    approved: { bg: 'rgba(16,185,129,0.12)', color: '#059669', label: 'Approved', icon: CheckCircle2 },
    rejected: { bg: 'rgba(239,68,68,0.12)', color: '#dc2626', label: 'Rejected', icon: XCircle },
  };
  const s = map[status] ?? map.pending;
  const Icon = s.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
      borderRadius: 999, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color,
    }}>
      <Icon size={11} /> {s.label}
    </span>
  );
}

export default function RequestsPage() {
  const { token, user } = useAuth();
  const canModerate = user?.role_id === 2 || user?.role_id === 3;

  return (
    <DashboardLayout pageTitle="Requests">
      <div className="profile-page">
        <SubmitRequestCard token={token} />
        {canModerate && <ModerationCard token={token} />}
      </div>
    </DashboardLayout>
  );
}

function SubmitRequestCard({ token }) {
  const [form, setForm] = useState({ type: '', subject: '', content: '' });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyRequests(token);
      setRequests(data.requests ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(''); setErr('');
    if (!form.type) { setErr('Please choose a request type.'); return; }
    if (!form.subject.trim()) { setErr('Subject is required.'); return; }
    setSubmitting(true);
    try {
      const data = await createRequest(token, form);
      if (data.error) setErr(data.error);
      else {
        setMsg('Your request has been sent.');
        setForm({ type: '', subject: '', content: '' });
        load();
      }
    } catch {
      setErr('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="profile-card">
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: 'rgba(37,99,235,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
        }}>
          <FileText size={20} color="#2563eb" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Submit a New Request</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Fill out the form below and our team will process your request shortly.
        </div>
      </div>

      {msg && <div className="profile-msg-ok"><CheckCircle2 size={14} /> {msg}</div>}
      {err && <div className="profile-msg-err"><AlertCircle size={14} /> {err}</div>}

      <form onSubmit={handleSubmit}>
        <div className="profile-field-row">
          <div className="profile-field">
            <label>Type</label>
            <select className="profile-input" value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="">Choose an option…</option>
              <option value="work_certificate">Work Certificate</option>
              <option value="salary_certificate">Salary Certificate</option>
              <option value="leave_entitlement">Leave Entitlement</option>
            </select>
          </div>
          <div className="profile-field">
            <label>Subject</label>
            <input
              className="profile-input" type="text" value={form.subject}
              onChange={(e) => set('subject', e.target.value)} placeholder="Enter subject"
            />
          </div>
        </div>

        <div className="profile-field">
          <label>Content</label>
          <textarea
            className="profile-input" rows={4} maxLength={300} value={form.content}
            onChange={(e) => set('content', e.target.value)}
          />
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {form.content.length}/300 characters
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="profile-save-btn" type="submit" disabled={submitting}>
            <Send size={14} /> {submitting ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: 28 }}>
        <div className="profile-card-title">
          <Clock size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
          My Last 10 Requests
        </div>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Loading…</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
            <Inbox size={26} style={{ opacity: 0.3, marginBottom: 8 }} /><br />
            No requests submitted yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border)' }}>
                  {['Request ID', 'Sent Date', 'Reply Date', 'Type', 'Subject', 'Status'].map((h) => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700 }}>#{r.id}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{fmtDate(r.created_at)}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{fmtDate(r.replied_at)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: '#f3f4f8', color: '#4b5563',
                      }}>{TYPE_LABELS[r.type] ?? r.type}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>{r.subject}</td>
                    <td style={{ padding: '12px 14px' }}><StatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ModerationCard({ token }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllRequests(token);
      setRequests(data.requests ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  async function handleReply(id, status) {
    setBusyId(id);
    try {
      await replyRequest(token, { id, status });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="profile-card" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="profile-card-title" style={{ marginBottom: 0 }}>Requests To Process</div>
        <button
          onClick={load}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
            border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Loading…</div>
      ) : requests.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>No requests found.</div>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border)' }}>
                {['Agent', 'Type', 'Subject', 'Content', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px' }}>{r.agent_name} <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.agent_email}</div></td>
                  <td style={{ padding: '12px 14px' }}>{TYPE_LABELS[r.type] ?? r.type}</td>
                  <td style={{ padding: '12px 14px' }}>{r.subject}</td>
                  <td style={{ padding: '12px 14px', maxWidth: 220, color: 'var(--text-secondary)' }}>{r.content}</td>
                  <td style={{ padding: '12px 14px' }}><StatusPill status={r.status} /></td>
                  <td style={{ padding: '12px 14px' }}>
                    {r.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          disabled={busyId === r.id}
                          onClick={() => handleReply(r.id, 'approved')}
                          style={{
                            padding: '5px 10px', borderRadius: 6, border: 'none', background: '#059669',
                            color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          }}
                        >Approve</button>
                        <button
                          disabled={busyId === r.id}
                          onClick={() => handleReply(r.id, 'rejected')}
                          style={{
                            padding: '5px 10px', borderRadius: 6, border: 'none', background: '#dc2626',
                            color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          }}
                        >Reject</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
