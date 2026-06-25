import { Navigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './app.css';

export default function Home() {
  const { token, user, logout } = useAuth();

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="page">
      <nav className="navbar">
        <span className="brand">DXC Internship</span>
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <button onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="hero">
        <h1>Welcome, {user?.name}!</h1>
        <p>DXC Internship</p>
        <div className="cta-group">
          <Link to="/dashboard" className="btn-filled">Go to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}