import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchOpportunities, createOpportunity, deleteOpportunity } from '../../services/api';
import {
  Briefcase, Search, Filter, Inbox, MapPin, Plus, Trash2, AlertCircle, CheckCircle2,
} from 'lucide-react';

const CATEGORIES = ['All Categories', 'IT', 'IT Manager', 'Developer', 'Data Science', 'Applications & Cloud'];

export default function OpportunitiesPage() {
  const { token, user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedCategory, setAppliedCategory] = useState('');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'IT', location: '', description: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOpportunities(token, { search: appliedSearch, category: appliedCategory });
      setOpportunities(data.opportunities ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, appliedSearch, appliedCategory]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  function handleFilter() {
    setAppliedSearch(search);
    setAppliedCategory(category === 'All Categories' ? '' : category);
  }

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setMsg(''); setErr('');
    if (!form.title.trim()) { setErr('Title is required.'); return; }
    const data = await createOpportunity(token, form);
    if (data.error) setErr(data.error);
    else {
      setMsg('Opportunity posted.');
      setForm({ title: '', category: 'IT', location: '', description: '' });
      setShowForm(false);
      load();
    }
  }

  async function handleDelete(id) {
    await deleteOpportunity(token, id);
    load();
  }

  return (
    <DashboardLayout pageTitle="Internal Opportunities">
      <div className="profile-page">
        <div className="profile-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase size={19} color="#7c3aed" /> Internal Opportunities
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                Explore and apply for open positions within DXC Technology.
              </div>
            </div>
            {user?.role_id === 3 && (
              <button className="profile-save-btn" onClick={() => setShowForm((v) => !v)}>
                <Plus size={14} /> Post Opportunity
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-secondary)' }} />
              <input
                className="profile-input"
                style={{ paddingLeft: 34 }}
                type="text"
                placeholder="Search by title or keyword…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleFilter(); }}
              />
            </div>
            <select className="profile-input" style={{ maxWidth: 220 }} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="profile-save-btn" onClick={handleFilter}>
              <Filter size={14} /> Filter
            </button>
          </div>

          {msg && <div className="profile-msg-ok"><CheckCircle2 size={14} /> {msg}</div>}
          {err && <div className="profile-msg-err"><AlertCircle size={14} /> {err}</div>}

          {showForm && (
            <form onSubmit={handleCreate} style={{ margin: '18px 0', padding: 16, border: '1px solid var(--border)', borderRadius: 10 }}>
              <div className="profile-field-row">
                <div className="profile-field">
                  <label>Title</label>
                  <input className="profile-input" type="text" value={form.title} onChange={(e) => set('title', e.target.value)} />
                </div>
                <div className="profile-field">
                  <label>Category</label>
                  <select className="profile-input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                    {CATEGORIES.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="profile-field-row">
                <div className="profile-field">
                  <label>Location</label>
                  <input className="profile-input" type="text" value={form.location} onChange={(e) => set('location', e.target.value)} />
                </div>
                <div className="profile-field">
                  <label>Description</label>
                  <input className="profile-input" type="text" value={form.description} onChange={(e) => set('description', e.target.value)} />
                </div>
              </div>
              <button className="profile-save-btn" type="submit">Post</button>
            </form>
          )}

          <div style={{ marginTop: 24 }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Loading…</div>
            ) : opportunities.length === 0 ? (
              <div style={{ padding: 50, textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Inbox size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>No open positions found</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your search filters or check back later.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {opportunities.map((o) => (
                  <div key={o.id} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{o.title}</div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        <span style={{ padding: '2px 9px', borderRadius: 999, background: '#f3f4f8' }}>{o.category}</span>
                        {o.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {o.location}</span>}
                      </div>
                      {o.description && <div style={{ fontSize: 13, marginTop: 8, color: 'var(--text-secondary)' }}>{o.description}</div>}
                    </div>
                    {user?.role_id === 3 && (
                      <button
                        onClick={() => handleDelete(o.id)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', height: 'fit-content' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
