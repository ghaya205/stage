import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { loginUser } from './api';
import './app.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      const data = await loginUser(email, password);

      if (data.token) {
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        login(data.token, { name: payload.name, email: payload.email });
        navigate('/home');
      } else {
        setError(data.error || 'Login failed. Check your credentials.');
      }
    } catch (err) {
      setError('Fetch error: ' + err.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Sign in</h2>

        {error && <p className="msg-error">{error}</p>}

        <form onSubmit={handleSubmit}>
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

          <button type="submit" className="btn-primary">Login</button>
        </form>

        <p className="switch-link">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}