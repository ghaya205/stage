import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './context/AuthContext';

import Home                from './pages/home/Home';
import Login               from './pages/auth/Login';
import Register            from './pages/auth/Register';
import AgentDashboard      from './pages/agent/AgentDashboard';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import AdminDashboard      from './pages/admin/AdminDashboard';
import UserApprovals       from './pages/admin/UserApprovals';
import AdminManagement     from './pages/admin/AdminManagement';
import ProfilePage         from './pages/profile/ProfilePage';
import SettingsPage        from './pages/settings/SettingsPage';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { token, user } = useAuth();
  if (!token) return children;
  const roleRoutes = { 1: '/agent/dashboard', 2: '/supervisor/dashboard', 3: '/admin/dashboard' };
  return <Navigate to={roleRoutes[user?.role_id] ?? '/agent/dashboard'} replace />;
}

function RoleRoute({ children, allowedRoleId }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoleId && user?.role_id !== allowedRoleId) {
    const roleRoutes = { 1: '/agent/dashboard', 2: '/supervisor/dashboard', 3: '/admin/dashboard' };
    return <Navigate to={roleRoutes[user?.role_id] ?? '/agent/dashboard'} replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"         element={<Navigate to="/login" replace />} />
      <Route path="/home"     element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      <Route path="/agent/dashboard" element={<RoleRoute allowedRoleId={1}><AgentDashboard /></RoleRoute>} />
      <Route path="/agent/profile"   element={<RoleRoute allowedRoleId={1}><ProfilePage /></RoleRoute>} />
      <Route path="/agent/settings"  element={<RoleRoute allowedRoleId={1}><SettingsPage /></RoleRoute>} />

      <Route path="/supervisor/dashboard" element={<RoleRoute allowedRoleId={2}><SupervisorDashboard /></RoleRoute>} />
      <Route path="/supervisor/profile"   element={<RoleRoute allowedRoleId={2}><ProfilePage /></RoleRoute>} />
      <Route path="/supervisor/settings"  element={<RoleRoute allowedRoleId={2}><SettingsPage /></RoleRoute>} />

      <Route path="/admin/dashboard"      element={<RoleRoute allowedRoleId={3}><AdminDashboard /></RoleRoute>} />
      <Route path="/admin/user-approvals" element={<RoleRoute allowedRoleId={3}><UserApprovals /></RoleRoute>} />
      <Route path="/admin/management"     element={<RoleRoute allowedRoleId={3}><AdminManagement /></RoleRoute>} />
      <Route path="/admin/profile"        element={<RoleRoute allowedRoleId={3}><ProfilePage /></RoleRoute>} />
      <Route path="/admin/settings"       element={<RoleRoute allowedRoleId={3}><SettingsPage /></RoleRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
