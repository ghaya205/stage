import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  createCareBulletin, fetchMyCareBulletins, fetchAllCareBulletins, updateCareBulletinStatus,
} from '../../services/api';
import {
  FileText, ExternalLink, History, AlertCircle, CheckCircle2, Clock, XCircle,
} from 'lucide-react';

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={19} color="#7c3aed" /> New Care Bulletin
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href="https://ars.dh-ss.com/login"
                target="_blank"
                rel="noreferrer"
                className="profile-save-btn"
                style={{ textDecoration: 'none', background: '#fff', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
              >
                <ExternalLink size={14} /> Provider Portal
              </a>
              <button
                type="button"
                className="profile-save-btn"
                style={{ background: '#fff', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
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

              <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
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

                <div className="profile-card-title" style={{ marginTop: 20 }}>Détails des frais</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0 20px' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input className="profile-input" type="text" value={total.toFixed(3)} readOnly />
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>TND</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="profile-save-btn" style={{ background: '#fff', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }} onClick={handleClear}>
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
    <div style={{ marginTop: 16 }}>
      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Loading…</div>
      ) : bulletins.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>No care bulletins submitted yet.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border)' }}>
                {[canModerate ? 'Agent' : null, 'Matricule', 'Adherent', 'Date', 'Total', 'Status', canModerate ? 'Actions' : null]
                  .filter(Boolean)
                  .map((h) => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)',
                    }}>{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {bulletins.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  {canModerate && <td style={{ padding: '12px 14px' }}>{b.user_name}</td>}
                  <td style={{ padding: '12px 14px' }}>{b.matricule}</td>
                  <td style={{ padding: '12px 14px' }}>{b.adherent_name}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{b.date_soins ?? '—'}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700 }}>{Number(b.total_soins).toFixed(3)} TND</td>
                  <td style={{ padding: '12px 14px' }}><StatusPill status={b.status} /></td>
                  {canModerate && (
                    <td style={{ padding: '12px 14px' }}>
                      {b.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            disabled={busyId === b.id}
                            onClick={() => handleStatus(b.id, 'approved')}
                            style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#059669', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >Approve</button>
                          <button
                            disabled={busyId === b.id}
                            onClick={() => handleStatus(b.id, 'rejected')}
                            style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >Reject</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>—</span>
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
