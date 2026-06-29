import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getRolePath(roleId) {
  const map = { 1: '/agent', 2: '/supervisor', 3: '/admin' };
  return map[roleId] ?? '/agent';
}

export default function Navbar({ onToggleSidebar, pageTitle }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const roleBase = getRolePath(user?.role_id);

  function goToProfile() {
    navigate(`${roleBase}/profile`);
  }

  return (
    <header className="dash-navbar">
      <button className="dash-navbar-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
      
      </button>

      <div className="dash-navbar-breadcrumb">
        <span>{pageTitle ?? 'Dashboard'}</span>
      </div>

      <div className="dash-navbar-actions">
       

        <div
          className="dash-navbar-avatar"
          role="button"
          tabIndex={0}
          aria-label="Profile"
          onClick={goToProfile}
          onKeyDown={(e) => e.key === 'Enter' && goToProfile()}
        >
          {getInitials(user?.name)}
        </div>
      </div>
    </header>
  );
}
