import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './AuthContext';

import Home      from './Home';
import Login     from './Login';
import Register  from './Register';
import Dashboard from './Dashboard';
import Status    from './Status';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { token } = useAuth();
  return token ? <Navigate to="/home" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"          element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/status"    element={<Status />} />
      <Route path="/login"     element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register"  element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="*"          element={<Navigate to="/home" replace />} />
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