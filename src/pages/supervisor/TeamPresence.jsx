import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchPresenceToday, fetchFullProfile } from '../../services/api';
import {
  Users, CalendarCheck, CheckCircle2, Clock, RefreshCw, AlertCircle, Moon, Sun,
} from 'lucide-react';
import './TeamPresence.css';

function ShiftPill({ shift }) {
  if (!shift) return <span className="tp-empty-shift">—</span>;
  const isNight = shift === 'nuit';
  return (
    <span className={`tp-shift-pill ${isNight ? 'tp-shift-pill--night' : 'tp-shift-pill--day'}`}>
      {isNight ? <Moon size={11} /> : <Sun size={11} />} {isNight ? 'Nuit' : 'Matin'}
    </span>
  );
}

function PresenceStatusPill({ isPresent }) {
  return (
    <span className={`tp-presence-pill ${isPresent ? 'tp-presence-pill--present' : 'tp-presence-pill--absent'}`}>
      {isPresent ? <CheckCircle2 size={11} /> : <Clock size={11} />} {isPresent ? 'Present' : 'Not marked'}
    </span>
  );
}

function fmtTime(dt) {
  if (!dt) return '—';
  return new Date(dt.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function TeamPresence() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [deskName, setDeskName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [presence, profile] = await Promise.all([
        fetchPresenceToday(token),
        fetchFullProfile(token),
      ]);
      setUsers(presence.users ?? []);
      setDeskName(profile.profile?.desk_name ?? '');
    } catch {
      setError('Failed to load team presence.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const presentCount = users.filter((u) => u.is_present).length;

  return (
    <div className="profile-card">
      <div className="tp-header">
        <div>
          <div className="tp-title">
            <CalendarCheck size={18} color="#7c3aed" /> Today's Team Presence
          </div>
          <p className="tp-subtitle">
            {deskName ? `${deskName} desk — ` : ''}{presentCount} of {users.length} agents checked in today
          </p>
        </div>
        <button onClick={load} disabled={loading} className="tp-refresh-btn">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {error && <div className="profile-msg-err"><AlertCircle size={14} /> {error}</div>}

      {loading ? (
        <div className="tp-state-msg">Loading…</div>
      ) : users.length === 0 ? (
        <div className="tp-state-msg">
          <Users size={32} className="tp-empty-icon" />
          <div className="tp-empty-title">No agents assigned to your desk yet.</div>
        </div>
      ) : (
        <div className="tp-table-wrap">
          <table className="tp-table">
            <thead>
              <tr>
                {['Name', 'Shift', 'Status', 'Since'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="tp-agent-cell">
                      <div className="tp-avatar">
                        {u.name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span className="tp-agent-name">{u.name}</span>
                    </div>
                  </td>
                  <td><ShiftPill shift={u.shift} /></td>
                  <td><PresenceStatusPill isPresent={u.is_present} /></td>
                  <td className="tp-cell-muted">{fmtTime(u.marked_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
