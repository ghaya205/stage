import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchOpportunities, createOpportunity, deleteOpportunity } from '../../services/api';
import {
  Briefcase, Search, Filter, Inbox, MapPin, Plus, Trash2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import './OpportunitiesPage.css';

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
          <div className="opp-header">
            <div>
              <div className="opp-header-title">
                <Briefcase size={19} color="#7c3aed" /> Internal Opportunities
              </div>
              <div className="opp-header-subtitle">
                Explore and apply for open positions within DXC Technology.
              </div>
            </div>
            {user?.role_id === 3 && (
              <button className="profile-save-btn" onClick={() => setShowForm((v) => !v)}>
                <Plus size={14} /> Post Opportunity
              </button>
            )}
          </div>

          <div className="opp-filters">
            <div className="opp-search-wrap">
              <Search size={15} className="opp-search-icon" />
              <input
                className="profile-input opp-search-input"
                type="text"
                placeholder="Search by title or keyword…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleFilter(); }}
              />
            </div>
            <select className="profile-input opp-category-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="profile-save-btn" onClick={handleFilter}>
              <Filter size={14} /> Filter
            </button>
          </div>

          {msg && <div className="profile-msg-ok"><CheckCircle2 size={14} /> {msg}</div>}
          {err && <div className="profile-msg-err"><AlertCircle size={14} /> {err}</div>}

          {showForm && (
            <form onSubmit={handleCreate} className="opp-create-form">
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

          <div className="opp-list-wrap">
            {loading ? (
              <div className="opp-state-msg">Loading…</div>
            ) : opportunities.length === 0 ? (
              <div className="opp-empty-state">
                <Inbox size={40} className="opp-empty-icon" />
                <div className="opp-empty-title">No open positions found</div>
                <div className="opp-empty-hint">Try adjusting your search filters or check back later.</div>
              </div>
            ) : (
              <div className="opp-list">
                {opportunities.map((o) => (
                  <div key={o.id} className="opp-card">
                    <div>
                      <div className="opp-card-title">{o.title}</div>
                      <div className="opp-card-meta">
                        <span className="opp-card-category">{o.category}</span>
                        {o.location && <span className="opp-card-location"><MapPin size={12} /> {o.location}</span>}
                      </div>
                      {o.description && <div className="opp-card-description">{o.description}</div>}
                    </div>
                    {user?.role_id === 3 && (
                      <button
                        onClick={() => handleDelete(o.id)}
                        className="opp-card-delete-btn"
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
