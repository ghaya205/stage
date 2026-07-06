import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchPresenceToday, fetchFullProfile } from '../../services/api';
import {
  Users, CalendarCheck, CheckCircle2, Clock, RefreshCw, AlertCircle, Moon, Sun,
} from 'lucide-react';

function ShiftPill({ shift }) {
  if (!shift) return <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>—</span>;
  const isNight = shift === 'nuit';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 999,
      fontSize: 11, fontWeight: 700, background: isNight ? 'rgba(99,102,241,0.10)' : 'rgba(245,158,11,0.10)',
      color: isNight ? '#6366f1' : '#d97706',
    }}>
      {isNight ? <Moon size={11} /> : <Sun size={11} />} {isNight ? 'Nuit' : 'Matin'}
    </span>
  );
}

function PresenceStatusPill({ isPresent }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 700, background: isPresent ? 'rgba(16,185,129,0.10)' : 'rgba(107,114,128,0.10)',
      color: isPresent ? '#059669' : '#6b7280',
    }}>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarCheck size={18} color="#7c3aed" /> Today's Team Presence
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            {deskName ? `${deskName} desk — ` : ''}{presentCount} of {users.length} agents checked in today
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
            border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
          }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {error && <div className="profile-msg-err"><AlertCircle size={14} /> {error}</div>}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Loading…</div>
      ) : users.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Users size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>No agents assigned to your desk yet.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Shift', 'Status', 'Since'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#E8643A,#7B8FD4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700,
                      }}>
                        {u.name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}><ShiftPill shift={u.shift} /></td>
                  <td style={{ padding: '13px 16px' }}><PresenceStatusPill isPresent={u.is_present} /></td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-secondary)' }}>{fmtTime(u.marked_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
