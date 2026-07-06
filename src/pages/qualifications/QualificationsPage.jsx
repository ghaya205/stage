import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  fetchFullProfile, updateFullProfile,
  fetchMyQualifications, createQualification, deleteQualification,
  assetUrl,
} from '../../services/api';
import {
  GraduationCap, Award, Plus, Trash2, Upload, AlertCircle, CheckCircle2,
} from 'lucide-react';

export default function QualificationsPage() {
  const { token } = useAuth();
  return (
    <DashboardLayout pageTitle="Qualifications">
      <div className="profile-page" style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        <CoreSkillsCard token={token} />
        <QualificationsCard token={token} />
      </div>
    </DashboardLayout>
  );
}

function CoreSkillsCard({ token }) {
  const [skills, setSkills] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFullProfile(token);
      const raw = data.profile?.skills ?? '';
      setSkills(raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  async function persist(next) {
    setSaving(true);
    try {
      await updateFullProfile(token, { skills: next.join(', ') });
      setSkills(next);
    } finally {
      setSaving(false);
    }
  }

  function addSkill() {
    const value = input.trim();
    if (!value || skills.includes(value)) return;
    persist([...skills, value]);
    setInput('');
  }

  function removeSkill(skill) {
    persist(skills.filter((s) => s !== skill));
  }

  return (
    <div className="profile-card">
      <div className="profile-card-title">Core Skills</div>
      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: -6, marginBottom: 14 }}>
        Add your technical and soft skills to improve your internal visibility.
      </p>

      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {skills.map((skill) => (
            <span
              key={skill}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                background: 'rgba(124,58,237,0.10)', color: '#7c3aed',
              }}
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#7c3aed', fontWeight: 800 }}
              >×</button>
            </span>
          ))}
          {skills.length === 0 && (
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>No skills added yet.</span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="profile-input"
          type="text"
          placeholder="Add a skill…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
        />
        <button
          type="button"
          className="profile-save-btn"
          onClick={addSkill}
          disabled={saving}
          style={{ whiteSpace: 'nowrap' }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status !== 'pending') return null;
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: 'rgba(245,158,11,0.12)', color: '#b45309',
    }}>
      Pending
    </span>
  );
}

function QualificationsCard({ token }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const documentsPath = { 1: '/agent/documents', 2: '/supervisor/documents', 3: '/admin/documents' }[user?.role_id] ?? '/agent/documents';
  const [qualifications, setQualifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'certification', name: '', institution: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyQualifications(token);
      setQualifications(data.qualifications ?? []);
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
    if (!form.name.trim()) { setErr('Please provide a name.'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('type', form.type);
      fd.append('name', form.name.trim());
      fd.append('institution', form.institution.trim());
      if (file) fd.append('proof', file);
      const data = await createQualification(token, fd);
      if (data.error) setErr(data.error);
      else {
        setMsg('Qualification added.');
        setForm({ type: 'certification', name: '', institution: '' });
        setFile(null);
        setShowForm(false);
        load();
      }
    } catch {
      setErr('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    await deleteQualification(token, id);
    load();
  }

  return (
    <div className="profile-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
        <div className="profile-card-title" style={{ marginBottom: 0 }}>Qualifications</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="profile-save-btn"
            onClick={() => navigate(documentsPath)}
            style={{ background: '#fff', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
          >
            CV &amp; Video
          </button>
          <button type="button" className="profile-save-btn" onClick={() => setShowForm((v) => !v)}>
            <Plus size={14} /> Add Qualification
          </button>
        </div>
      </div>

      {msg && <div className="profile-msg-ok"><CheckCircle2 size={14} /> {msg}</div>}
      {err && <div className="profile-msg-err"><AlertCircle size={14} /> {err}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ margin: '14px 0', padding: 16, border: '1px solid var(--border)', borderRadius: 10 }}>
          <div className="profile-field-row">
            <div className="profile-field">
              <label>Type</label>
              <select className="profile-input" value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="diploma">Diploma</option>
                <option value="certification">Certification</option>
              </select>
            </div>
            <div className="profile-field">
              <label>Name</label>
              <input className="profile-input" type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Scrum Master Certified" />
            </div>
          </div>
          <div className="profile-field-row">
            <div className="profile-field">
              <label>Institution / ID</label>
              <input className="profile-input" type="text" value={form.institution} onChange={(e) => set('institution', e.target.value)} placeholder="e.g. esprit or certificate ID" />
            </div>
            <div className="profile-field">
              <label>Proof (photo or PDF)</label>
              <input className="profile-input" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <button className="profile-save-btn" type="submit" disabled={submitting}>
            <Upload size={14} /> {submitting ? 'Uploading…' : 'Submit for Review'}
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Loading…</div>
      ) : qualifications.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>No qualifications added yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          {qualifications.map((q) => {
            const Icon = q.type === 'diploma' ? GraduationCap : Award;
            return (
              <div
                key={q.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  border: '1px solid var(--border)', borderRadius: 10,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                  background: q.type === 'diploma' ? 'rgba(37,99,235,0.10)' : 'rgba(217,119,6,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={q.type === 'diploma' ? '#2563eb' : '#b45309'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{q.name}</div>
                  {q.institution && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{q.institution}</div>
                  )}
                  {q.proof_path && (
                    <a href={assetUrl(q.proof_path)} target="_blank" rel="noreferrer" style={{ fontSize: 11.5 }}>
                      View proof
                    </a>
                  )}
                </div>
                <StatusBadge status={q.status} />
                <button
                  type="button"
                  onClick={() => handleDelete(q.id)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
