import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from './api';
import './app.css';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('agent');
  const [message, setMessage]   = useState('');
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const { ok, data } = await registerUser(name, email, password, role);

      if (ok) {
        setMessage(data.message || 'Account created! Redirecting to login…');
        setTimeout(() => navigate('/login'), 1800);
        setName(''); setEmail(''); setPassword(''); setRole('agent');
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch {
      setError('Could not reach the server. Make sure the backend is running.');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create account</h2>

        {message && <p className="msg-ok">{message}</p>}
        {error   && <p className="msg-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <label htmlFor="role">Role</label>
          <select
            id="role"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="agent">Agent</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>

          <button type="submit" className="btn-primary">Register</button>
        </form>

        <p className="switch-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}