import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  createRequest, fetchMyRequests, fetchAllRequests, replyRequest,
} from '../../services/api';
import {
  FileText, Send, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Inbox,
} from 'lucide-react';
import './RequestsPage.css';

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
    pending: { className: 'status-pill--pending', label: 'Pending', icon: Clock },
    approved: { className: 'status-pill--approved', label: 'Approved', icon: CheckCircle2 },
    rejected: { className: 'status-pill--rejected', label: 'Rejected', icon: XCircle },
  };
  const s = map[status] ?? map.pending;
  const Icon = s.icon;
  return (
    <span className={`status-pill ${s.className}`}>
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
      <div className="req-form-intro">
        <div className="req-form-icon">
          <FileText size={20} color="#2563eb" />
        </div>
        <div className="req-form-title">Submit a New Request</div>
        <div className="req-form-subtitle">
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
          <div className="req-char-count">
            {form.content.length}/300 characters
          </div>
        </div>

        <div className="req-form-actions">
          <button className="profile-save-btn" type="submit" disabled={submitting}>
            <Send size={14} /> {submitting ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </form>

      <div className="req-history">
        <div className="profile-card-title">
          <Clock size={13} className="req-history-title-icon" />
          My Last 10 Requests
        </div>
        {loading ? (
          <div className="req-state-msg">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="req-state-msg">
            <Inbox size={26} className="req-empty-icon" /><br />
            No requests submitted yet.
          </div>
        ) : (
          <div className="req-table-wrap">
            <table className="req-table">
              <thead>
                <tr>
                  {['Request ID', 'Sent Date', 'Reply Date', 'Type', 'Subject', 'Status'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="req-cell-id">#{r.id}</td>
                    <td className="req-cell-muted">{fmtDate(r.created_at)}</td>
                    <td className="req-cell-muted">{fmtDate(r.replied_at)}</td>
                    <td>
                      <span className="req-type-pill">{TYPE_LABELS[r.type] ?? r.type}</span>
                    </td>
                    <td>{r.subject}</td>
                    <td><StatusPill status={r.status} /></td>
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
    <div className="profile-card card-spaced">
      <div className="req-moderation-header">
        <div className="profile-card-title req-moderation-title">Requests To Process</div>
        <button onClick={load} className="req-refresh-btn">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="req-state-msg">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="req-state-msg">No requests found.</div>
      ) : (
        <div className="req-table-wrap req-table-wrap--spaced">
          <table className="req-table">
            <thead>
              <tr>
                {['Agent', 'Type', 'Subject', 'Content', 'Status', 'Actions'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.agent_name} <div className="req-sub-email">{r.agent_email}</div></td>
                  <td>{TYPE_LABELS[r.type] ?? r.type}</td>
                  <td>{r.subject}</td>
                  <td className="req-cell-content">{r.content}</td>
                  <td><StatusPill status={r.status} /></td>
                  <td>
                    {r.status === 'pending' ? (
                      <div className="req-action-group">
                        <button
                          disabled={busyId === r.id}
                          onClick={() => handleReply(r.id, 'approved')}
                          className="req-action-btn req-action-btn--approve"
                        >Approve</button>
                        <button
                          disabled={busyId === r.id}
                          onClick={() => handleReply(r.id, 'rejected')}
                          className="req-action-btn req-action-btn--reject"
                        >Reject</button>
                      </div>
                    ) : (
                      <span className="req-action-none">—</span>
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
