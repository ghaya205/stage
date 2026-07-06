import { useCallback, useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchMyDocuments, uploadDocument, deleteDocument, assetUrl } from '../../services/api';
import {
  Folder, Upload, Eye, Trash2, FileText, Image as ImageIcon, Film, AlertCircle, CheckCircle2,
} from 'lucide-react';

function DocIcon({ name }) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
    return <ImageIcon size={20} color="#7c3aed" />;
  }
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) {
    return <Film size={20} color="#7c3aed" />;
  }
  return <FileText size={20} color="#7c3aed" />;
}

export default function DocumentsPage() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('other');
  const fileInput = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyDocuments(token);
      setDocuments(data.documents ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  function triggerUpload(cat) {
    setCategory(cat);
    fileInput.current?.click();
  }

  async function handleFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMsg(''); setErr(''); setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', category);
      const data = await uploadDocument(token, fd);
      if (data.error) setErr(data.error);
      else {
        setMsg('File uploaded successfully.');
        load();
      }
    } catch {
      setErr('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    await deleteDocument(token, id);
    load();
  }

  const cv = documents.find((d) => d.category === 'cv');
  const others = documents.filter((d) => d.category !== 'cv');

  return (
    <DashboardLayout pageTitle="My Documents">
      <div className="profile-page">
        <input ref={fileInput} type="file" style={{ display: 'none' }} onChange={handleFileChosen} />

        <div className="profile-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Folder size={19} color="#2563eb" /> My Documents
            </div>
            <button className="profile-save-btn" onClick={() => triggerUpload('other')} disabled={uploading}>
              <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload File'}
            </button>
          </div>

          {msg && <div className="profile-msg-ok"><CheckCircle2 size={14} /> {msg}</div>}
          {err && <div className="profile-msg-err"><AlertCircle size={14} /> {err}</div>}

          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#b45309', marginBottom: 10 }}>Profile Assets</div>
            {loading ? (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading…</div>
            ) : cv ? (
              <DocCard doc={cv} label="CV" onDelete={handleDelete} />
            ) : (
              <DocUploadPlaceholder label="Upload CV" onClick={() => triggerUpload('cv')} />
            )}
          </div>

          <div style={{ marginTop: 26 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#b45309', marginBottom: 10 }}>Other Documents</div>
            {!loading && others.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No other documents uploaded yet.</div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {others.map((d) => (
                <DocCard key={d.id} doc={d} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function DocUploadPlaceholder({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 160, height: 110, border: '1.5px dashed var(--border)', borderRadius: 10,
        background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 600,
      }}
    >
      <Upload size={16} style={{ marginRight: 6 }} /> {label}
    </button>
  );
}

function DocCard({ doc, label, onDelete }) {
  return (
    <div style={{
      width: 160, padding: 14, border: '1px solid var(--border)', borderRadius: 10, textAlign: 'center',
    }}>
      <div style={{
        width: 44, height: 44, margin: '0 auto 10px', borderRadius: 8, background: 'rgba(124,58,237,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <DocIcon name={doc.original_name} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{label ?? doc.original_name}</div>
      <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', wordBreak: 'break-all', marginTop: 2 }}>
        {doc.original_name}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10 }}>
        <a
          href={assetUrl(doc.path)}
          target="_blank"
          rel="noreferrer"
          style={{
            width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)',
          }}
        >
          <Eye size={14} />
        </a>
        <button
          onClick={() => onDelete(doc.id)}
          style={{
            width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(220,38,38,0.3)',
            background: 'rgba(220,38,38,0.06)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#dc2626',
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
