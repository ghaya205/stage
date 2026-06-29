import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { loginUser } from './api';
import { Mail, Lock, Eye, EyeOff, Calendar, AlertCircle } from 'lucide-react';
import heroImg from './assets/hero.png';
import dxcLogo from './assets/dxclogo.png';
import './login.css';

export default function Login() {
  const { login }               = useAuth();
  const navigate                = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [now, setNow]           = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (d) => {
    const p = n => String(n).padStart(2,'0');
    return `${p(d.getDate())}-${p(d.getMonth()+1)}-${d.getFullYear()}  ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await loginUser(email, password);
      if (data.token) {
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        login(data.token, { name: payload.name, email: payload.email, role_id: payload.role_id });
        const roleRoutes = { 1: '/agent/dashboard', 2: '/supervisor/dashboard', 3: '/admin/dashboard' };
        navigate(roleRoutes[payload.role_id] ?? '/agent/dashboard');
      } else {
        setError(data.error || 'Login failed. Check your credentials.');
      }
    } catch (err) {
      setError('Network error: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page-scope">
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-hero">
          <img src={heroImg} alt="" className="auth-hero-img" />
          <div className="auth-hero-logo">
            <span className="dxc-wordmark">DXC</span>
            <span className="logo-sub">TECH<br/>NOLOGY</span>
          </div>
          <div className="auth-hero-content">
            <h2>Delivering<br/>Excellence,<br/><em>Every Day.</em></h2>
            <p>Monitor SLA performance in real time and deliver exceptional service.</p>

          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-date">
            <Calendar size={13}/>
            {fmt(now)}
          </div>

          <div className="auth-portal-badge">
            <img src={dxcLogo} alt="DXC Technology" className="auth-portal-logo" />
            <div>
              <div className="badge-text">SLA Dashboard</div>
              <div className="badge-sub">tunisia</div>
            </div>
          </div>

          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to access your SLA Dashboard</p>

          {error && (
            <p className="auth-msg-error">
              <AlertCircle size={14}/> {error}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-field-group">
              <label>Email Address</label>
              <div className="auth-field-wrap">
                <span className="auth-field-icon"><Mail size={14}/></span>
                <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="auth-field-group">
              <label>Password</label>
              <div className="auth-field-wrap">
                <span className="auth-field-icon"><Lock size={14}/></span>
                <input type={showPwd ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="auth-eye-toggle" onClick={() => setShowPwd(v => !v)}>
                  {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            <div className="auth-login-opts">
              <div className="auth-check-row" style={{marginBottom:0}}>
                <input id="remember" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                <label htmlFor="remember">Remember me</label>
              </div>
              <a href="#" className="auth-forgot">Forgot password?</a>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'LOGIN'}
            </button>
          </form>

          <p className="auth-switch">Don't have an account? <Link to="/register">Register</Link></p>
        </div>

      </div>
    </div>
    </div>
  );
}