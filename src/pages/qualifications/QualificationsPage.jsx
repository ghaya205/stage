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
import './QualificationsPage.css';

export default function QualificationsPage() {
  const { token } = useAuth();
  return (
    <DashboardLayout pageTitle="Qualifications">
      <div className="profile-page qual-page-grid">
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
      <p className="qual-skills-hint">
        Add your technical and soft skills to improve your internal visibility.
      </p>

      {loading ? (
        <div className="qual-state-msg">Loading…</div>
      ) : (
        <div className="qual-skills-list">
          {skills.map((skill) => (
            <span key={skill} className="qual-skill-pill">
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="qual-skill-remove-btn"
              >×</button>
            </span>
          ))}
          {skills.length === 0 && (
            <span className="qual-skills-empty">No skills added yet.</span>
          )}
        </div>
      )}

      <div className="qual-skill-add-row">
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
          className="profile-save-btn qual-add-btn"
          onClick={addSkill}
          disabled={saving}
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
    <span className="qual-status-badge">
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
      <div className="qual-card-header">
        <div className="profile-card-title qual-card-title">Qualifications</div>
        <div className="qual-header-actions">
          <button
            type="button"
            className="profile-save-btn qual-btn-outline"
            onClick={() => navigate(documentsPath)}
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
        <form onSubmit={handleSubmit} className="qual-add-form">
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
        <div className="qual-empty-state">Loading…</div>
      ) : qualifications.length === 0 ? (
        <div className="qual-empty-state">No qualifications added yet.</div>
      ) : (
        <div className="qual-list">
          {qualifications.map((q) => {
            const Icon = q.type === 'diploma' ? GraduationCap : Award;
            return (
              <div key={q.id} className="qual-item">
                <div className={`qual-item-icon ${q.type === 'diploma' ? 'qual-item-icon--diploma' : 'qual-item-icon--cert'}`}>
                  <Icon size={18} color={q.type === 'diploma' ? '#2563eb' : '#b45309'} />
                </div>
                <div className="qual-item-body">
                  <div className="qual-item-name">{q.name}</div>
                  {q.institution && (
                    <div className="qual-item-institution">{q.institution}</div>
                  )}
                  {q.proof_path && (
                    <a href={assetUrl(q.proof_path)} target="_blank" rel="noreferrer" className="qual-item-proof-link">
                      View proof
                    </a>
                  )}
                </div>
                <StatusBadge status={q.status} />
                <button
                  type="button"
                  onClick={() => handleDelete(q.id)}
                  className="qual-item-delete-btn"
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
