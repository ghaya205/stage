import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { fetchProtected } from './api';
import './app.css';

export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchProtected(token).then(setData).catch(() => {});
  }, [token]);

  return (
    <div className="page">
      <nav className="navbar">
        <span className="brand">DXC Internship</span>
        <div className="nav-links">
          <Link to="/home">Home</Link>
          <button onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="content">
        <div className="dash-card">
          <h3>Hello, {user?.name} 👋</h3>
          <p style={{ color: '#6b7280', fontSize: '.9rem' }}>{user?.email}</p>
        </div>

        {data && (
          <div className="dash-card">
            <h3>Server response</h3>
            <pre style={{ fontSize: '.85rem', overflowX: 'auto' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}