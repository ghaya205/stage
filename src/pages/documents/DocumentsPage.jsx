import { useCallback, useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchMyDocuments, uploadDocument, deleteDocument, assetUrl } from '../../services/api';
import {
  Folder, Upload, Eye, Trash2, FileText, Image as ImageIcon, Film, AlertCircle, CheckCircle2,
} from 'lucide-react';
import './DocumentsPage.css';

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
        <input ref={fileInput} type="file" className="docs-file-input" onChange={handleFileChosen} />

        <div className="profile-card">
          <div className="docs-header">
            <div className="docs-header-title">
              <Folder size={19} color="#2563eb" /> My Documents
            </div>
            <button className="profile-save-btn" onClick={() => triggerUpload('other')} disabled={uploading}>
              <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload File'}
            </button>
          </div>

          {msg && <div className="profile-msg-ok"><CheckCircle2 size={14} /> {msg}</div>}
          {err && <div className="profile-msg-err"><AlertCircle size={14} /> {err}</div>}

          <div className="docs-section">
            <div className="docs-section-label">Profile Assets</div>
            {loading ? (
              <div className="docs-loading-text">Loading…</div>
            ) : cv ? (
              <DocCard doc={cv} label="CV" onDelete={handleDelete} />
            ) : (
              <DocUploadPlaceholder label="Upload CV" onClick={() => triggerUpload('cv')} />
            )}
          </div>

          <div className="docs-section docs-section--other">
            <div className="docs-section-label">Other Documents</div>
            {!loading && others.length === 0 && (
              <div className="docs-empty-text">No other documents uploaded yet.</div>
            )}
            <div className="docs-grid">
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
    <button onClick={onClick} className="docs-upload-placeholder">
      <Upload size={16} className="docs-upload-placeholder__icon" /> {label}
    </button>
  );
}

function DocCard({ doc, label, onDelete }) {
  return (
    <div className="doc-card">
      <div className="doc-card__icon">
        <DocIcon name={doc.original_name} />
      </div>
      <div className="doc-card__label">{label ?? doc.original_name}</div>
      <div className="doc-card__filename">
        {doc.original_name}
      </div>
      <div className="doc-card__actions">
        <a
          href={assetUrl(doc.path)}
          target="_blank"
          rel="noreferrer"
          className="doc-card__action-btn"
        >
          <Eye size={14} />
        </a>
        <button
          onClick={() => onDelete(doc.id)}
          className="doc-card__action-btn doc-card__action-btn--delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
