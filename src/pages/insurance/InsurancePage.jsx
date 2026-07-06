import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  createCareBulletin, fetchMyCareBulletins, fetchAllCareBulletins, updateCareBulletinStatus,
} from '../../services/api';
import {
  FileText, ExternalLink, History, AlertCircle, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import './InsurancePage.css';

const FEE_FIELDS = [
  ['honoraires', 'Honoraires'],
  ['pharmacie', 'Pharmacie'],
  ['analyse', 'Analyse'],
  ['radio_echo_scanner', 'Radio/Echo/Scanner'],
  ['maternite_frais_clinique', 'Maternité/Frais clinique'],
  ['chirurgie', 'Chirurgie'],
  ['injection', 'Inject.'],
  ['dentaire', 'Dentaire'],
  ['monture', 'Monture'],
  ['verres', 'Verres'],
];

function emptyForm() {
  const base = { matricule: '', ref_bs: '', date_soins: '', adherent_name: '', patient_first_name: '', comment: '' };
  FEE_FIELDS.forEach(([key]) => { base[key] = '0.000'; });
  return base;
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

export default function InsurancePage() {
  const { token, user } = useAuth();
  const [view, setView] = useState('form');
  const [form, setForm] = useState(emptyForm());
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const total = useMemo(
    () => FEE_FIELDS.reduce((sum, [key]) => sum + (parseFloat(form[key]) || 0), 0),
    [form]
  );

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(''); setErr('');
    if (!form.matricule.trim() || !form.adherent_name.trim()) {
      setErr('Matricule and adherent name are required.');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('attachment', file);
      const data = await createCareBulletin(token, fd);
      if (data.error) setErr(data.error);
      else {
        setMsg('Care bulletin submitted successfully.');
        setForm(emptyForm());
        setFile(null);
      }
    } catch {
      setErr('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClear() {
    setForm(emptyForm());
    setFile(null);
    setMsg(''); setErr('');
  }

  const canModerate = user?.role_id === 2 || user?.role_id === 3;

  return (
    <DashboardLayout pageTitle="Insurance">
      <div className="profile-page">
        <div className="profile-card">
          <div className="ins-header">
            <div className="ins-header-title">
              <FileText size={19} color="#7c3aed" /> New Care Bulletin
            </div>
            <div className="ins-header-actions">
              <a
                href="https://ars.dh-ss.com/login"
                target="_blank"
                rel="noreferrer"
                className="profile-save-btn ins-btn-outline"
              >
                <ExternalLink size={14} /> Provider Portal
              </a>
              <button
                type="button"
                className="profile-save-btn ins-btn-outline"
                onClick={() => setView((v) => (v === 'form' ? 'history' : 'form'))}
              >
                <History size={14} /> {view === 'form' ? 'View History' : 'New Bulletin'}
              </button>
            </div>
          </div>

          {view === 'form' ? (
            <>
              {msg && <div className="profile-msg-ok"><CheckCircle2 size={14} /> {msg}</div>}
              {err && <div className="profile-msg-err"><AlertCircle size={14} /> {err}</div>}

              <form onSubmit={handleSubmit} className="ins-form">
                <div className="profile-field-row-3">
                  <div className="profile-field">
                    <label>Matricule</label>
                    <input className="profile-input" type="text" value={form.matricule} onChange={(e) => set('matricule', e.target.value)} />
                  </div>
                  <div className="profile-field">
                    <label>Réf BS</label>
                    <input className="profile-input" type="text" value={form.ref_bs} onChange={(e) => set('ref_bs', e.target.value)} placeholder="Référence Bulletin" />
                  </div>
                  <div className="profile-field">
                    <label>Date des Soins</label>
                    <input className="profile-input" type="date" value={form.date_soins} onChange={(e) => set('date_soins', e.target.value)} />
                  </div>
                </div>

                <div className="profile-field-row">
                  <div className="profile-field">
                    <label>Nom/Prénom de l'Adhérent</label>
                    <input className="profile-input" type="text" value={form.adherent_name} onChange={(e) => set('adherent_name', e.target.value)} />
                  </div>
                  <div className="profile-field">
                    <label>Prénom du Malade</label>
                    <input className="profile-input" type="text" value={form.patient_first_name} onChange={(e) => set('patient_first_name', e.target.value)} placeholder="Patient's first name" />
                  </div>
                </div>

                <div className="profile-card-title ins-section-title">Détails des frais</div>
                <div className="ins-fee-grid">
                  {FEE_FIELDS.map(([key, label]) => (
                    <div className="profile-field" key={key}>
                      <label>{label}</label>
                      <input
                        className="profile-input" type="number" step="0.001" min="0"
                        value={form[key]} onChange={(e) => set(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="profile-field">
                  <label>Attachments (Scanned Documents)</label>
                  <input className="profile-input" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </div>

                <div className="profile-field-row">
                  <div className="profile-field">
                    <label>Commentaire</label>
                    <textarea className="profile-input" rows={3} value={form.comment} onChange={(e) => set('comment', e.target.value)} placeholder="Notes additionnelles…" />
                  </div>
                  <div className="profile-field">
                    <label>Total des Soins</label>
                    <div className="ins-total-row">
                      <input className="profile-input" type="text" value={total.toFixed(3)} readOnly />
                      <span className="ins-total-currency">TND</span>
                    </div>
                  </div>
                </div>

                <div className="ins-form-actions">
                  <button type="button" className="profile-save-btn ins-btn-outline" onClick={handleClear}>
                    Clear Form
                  </button>
                  <button className="profile-save-btn" type="submit" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <HistorySection token={token} canModerate={canModerate} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function HistorySection({ token, canModerate }) {
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = canModerate ? await fetchAllCareBulletins(token) : await fetchMyCareBulletins(token);
      setBulletins(data.bulletins ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, canModerate]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  async function handleStatus(id, status) {
    setBusyId(id);
    try {
      await updateCareBulletinStatus(token, { id, status });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="ins-history">
      {loading ? (
        <div className="ins-state-msg">Loading…</div>
      ) : bulletins.length === 0 ? (
        <div className="ins-state-msg">No care bulletins submitted yet.</div>
      ) : (
        <div className="ins-table-wrap">
          <table className="ins-table">
            <thead>
              <tr>
                {[canModerate ? 'Agent' : null, 'Matricule', 'Adherent', 'Date', 'Total', 'Status', canModerate ? 'Actions' : null]
                  .filter(Boolean)
                  .map((h) => (
                    <th key={h}>{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {bulletins.map((b) => (
                <tr key={b.id}>
                  {canModerate && <td>{b.user_name}</td>}
                  <td>{b.matricule}</td>
                  <td>{b.adherent_name}</td>
                  <td className="ins-cell-muted">{b.date_soins ?? '—'}</td>
                  <td className="ins-cell-total">{Number(b.total_soins).toFixed(3)} TND</td>
                  <td><StatusPill status={b.status} /></td>
                  {canModerate && (
                    <td>
                      {b.status === 'pending' ? (
                        <div className="ins-action-group">
                          <button
                            disabled={busyId === b.id}
                            onClick={() => handleStatus(b.id, 'approved')}
                            className="ins-action-btn ins-action-btn--approve"
                          >Approve</button>
                          <button
                            disabled={busyId === b.id}
                            onClick={() => handleStatus(b.id, 'rejected')}
                            className="ins-action-btn ins-action-btn--reject"
                          >Reject</button>
                        </div>
                      ) : (
                        <span className="ins-action-none">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
