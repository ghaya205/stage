import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LayoutDashboard, Settings, LogOut, Shield, Users } from 'lucide-react';
import dxcLogo from '../assets/dxclogo.png';

const roleMenus = {
  1: [
    {
      section: 'Workspace',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/agent/dashboard' },
      ],
    },
    {
      section: 'Account',
      items: [
        { icon: Settings, label: 'Settings', path: '/agent/settings' },
      ],
    },
  ],
  2: [
    {
      section: 'Workspace',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/supervisor/dashboard' },
      ],
    },
    {
      section: 'Account',
      items: [
        { icon: Settings, label: 'Settings', path: '/supervisor/settings' },
      ],
    },
  ],
  3: [
    {
      section: 'Workspace',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
      ],
    },
    {
      section: 'Administration',
      items: [
        { icon: Users,  label: 'User Approvals', path: '/admin/user-approvals' },
        { icon: Shield, label: 'Management',     path: '/admin/management' },
        { icon: Settings, label: 'Settings',     path: '/admin/settings' },
      ],
    },
  ],
};

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roleId   = user?.role_id ?? 1;
  const sections = roleMenus[roleId] ?? roleMenus[1];

  function handleNav(path) {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className={`dash-sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      <div className="dash-sidebar-logo">
        <img src={dxcLogo} alt="DXC" />
        <span className="dash-sidebar-logo-text">DXC Technology</span>
      </div>
      <div className="dash-sidebar-accent" />

      <nav className="dash-sidebar-nav">
        {sections.map((sec) => (
          <div key={sec.section} className="dash-sidebar-section">
            <div className="dash-sidebar-section-label">{sec.section}</div>
            {sec.items.map(({ icon: Icon, label, path }) => (
              <button
                key={path + label}
                className={`dash-sidebar-item${location.pathname === path ? ' active' : ''}`}
                onClick={() => handleNav(path)}
              >
                <span className="dash-sidebar-item-icon"><Icon size={17} /></span>
                <span className="dash-sidebar-item-label">{label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="dash-sidebar-footer">
        <button className="dash-sidebar-item" onClick={handleLogout}>
          <span className="dash-sidebar-item-icon"><LogOut size={17} /></span>
          <span className="dash-sidebar-item-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
