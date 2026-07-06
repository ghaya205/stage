import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/api";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Clock,
  KeyRound,
} from "lucide-react";
import heroImg from "../../assets/hero.png";
import dxcLogo from "../../assets/dxclogo.png";
import "../../styles/login.css";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("");
  const [enterpriseCode, setEntCode] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [terms, setTerms] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!terms) {
      setError("Please accept the Terms & Conditions.");
      return;
    }
    if (role === "admin" && !enterpriseCode.trim()) {
      setError("An enterprise code is required to register as an Admin.");
      return;
    }
    setLoading(true);
    try {
      const { ok, data } = await registerUser(
        name,
        email,
        password,
        role,
        role === "admin" ? enterpriseCode : "",
      );
      if (ok) {
        if (data.status === "pending_approval") {
          setPending(true);
        } else {
          setMessage(data.message || "Account created! Redirecting to login…");
          setTimeout(() => navigate("/login"), 2000);
        }
      } else {
        setError(data.error || "Registration failed.");
      }
    } catch (err) {
      setError("Network error: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

  if (pending) {
    return (
      <div className="login-page-scope">
        <div className="auth-page">
          <div className="auth-card">
            <div className="auth-hero">
              <img src={heroImg} alt="" className="auth-hero-img" />
              <div className="auth-hero-logo">
                <span className="dxc-wordmark">DXC</span>
                <span className="logo-sub">
                  TECH
                  <br />
                  NOLOGY
                </span>
              </div>
              <div className="auth-hero-content">
                <h2>
                  Delivering
                  <br />
                  Excellence,
                  <br />
                  <em>Every Day.</em>
                </h2>
                <p>
                  Monitor SLA performance in real time and deliver exceptional
                  service.
                </p>
              </div>
            </div>

            <div className="auth-form-panel auth-form-panel--centered">
              <div className="auth-portal-badge">
                <img
                  src={dxcLogo}
                  alt="DXC Technology"
                  className="auth-portal-logo"
                />
                <div>
                  <div className="badge-text">Tunisia Web Portal</div>
                  <div className="badge-sub">Impossible. Delivered.</div>
                </div>
              </div>

              <div className="pending-icon-circle">
                <Clock size={34} className="pending-icon" />
              </div>

              <h2 className="no-margin">Account Pending Approval</h2>

              <p className="pending-desc">
                Your account has been created successfully. An administrator
                must approve your registration before you can log in. You will
                receive access once approved.
              </p>

              <div className="pending-notice-box">
                <p className="pending-notice-text">
                  Please contact your supervisor or IT department if you need
                  urgent access.
                </p>
              </div>

              <Link to="/login" className="auth-btn pending-back-link">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-scope">
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-hero">
            <img src={heroImg} alt="" className="auth-hero-img" />
            <div className="auth-hero-logo">
              <span className="dxc-wordmark">DXC</span>
              <span className="logo-sub">
                TECH
                <br />
                NOLOGY
              </span>
            </div>
            <div className="auth-hero-content">
              <h2>
                Delivering
                <br />
                Excellence,
                <br />
                <em>Every Day.</em>
              </h2>
              <p>
                Monitor SLA performance in real time and deliver exceptional
                service.
              </p>
            </div>
          </div>

          <div className="auth-form-panel">
            <div className="auth-portal-badge">
              <img
                src={dxcLogo}
                alt="DXC Technology"
                className="auth-portal-logo"
              />
              <div>
                <div className="badge-text">Tunisia Web Portal</div>
                <div className="badge-sub">Impossible. Delivered.</div>
              </div>
            </div>

            <h2>Create Account</h2>

            {message && (
              <p className="auth-msg-ok">
                <CheckCircle size={14} /> {message}
              </p>
            )}
            {error && (
              <p className="auth-msg-error">
                <AlertCircle size={14} /> {error}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="auth-field-row">
                <div className="auth-field-group">
                  <label>Full Name</label>
                  <div className="auth-field-wrap">
                    <span className="auth-field-icon">
                      <User size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="auth-field-group">
                  <label>Email Address</label>
                  <div className="auth-field-wrap">
                    <span className="auth-field-icon">
                      <Mail size={14} />
                    </span>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="auth-field-group">
                <label>Password</label>
                <div className="auth-field-wrap">
                  <span className="auth-field-icon">
                    <Lock size={14} />
                  </span>
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowPwd((v) => !v)}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="auth-field-group">
                <label>Confirm Password</label>
                <div className="auth-field-wrap">
                  <span className="auth-field-icon">
                    <Lock size={14} />
                  </span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="auth-field-group">
                <label>Role</label>
                <div className="auth-field-wrap select-wrap">
                  <span className="auth-field-icon">
                    <ChevronDown size={14} />
                  </span>
                  <select
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setEntCode("");
                    }}
                    required
                    className="select-with-icon"
                  >
                    <option value="" disabled>
                      Select your role
                    </option>
                    <option value="agent">Agent</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {role === "admin" && (
                <div
                  className="auth-field-group fade-in"
                >
                  <label className="label-row">
                    <KeyRound size={13} className="pending-icon" />
                    Enterprise Code
                    <span className="label-note">
                      (required for Admin)
                    </span>
                  </label>
                  <div
                    className="auth-field-wrap auth-field-wrap--active"
                  >
                    <span className="auth-field-icon">
                      <KeyRound size={14} />
                    </span>
                    <input
                      type={showCode ? "text" : "password"}
                      placeholder="Enter the enterprise secret code"
                      value={enterpriseCode}
                      onChange={(e) => setEntCode(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye-toggle"
                      onClick={() => setShowCode((v) => !v)}
                    >
                      {showCode ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="field-hint">
                    This code is provided by your IT department and authorises
                    admin account creation.
                  </p>
                </div>
              )}

              {(role === "agent" || role === "supervisor") && (
                <div className="approval-notice-box">
                  <p className="approval-notice-text">
                    <Clock size={13} /> Your account will require admin approval
                    before you can log in.
                  </p>
                </div>
              )}

              <div className="auth-check-row">
                <input
                  id="terms"
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                />
                <label htmlFor="terms">
                  I accept the <a href="#">Terms &amp; Conditions</a> and{" "}
                  <a href="#">Privacy Policy</a>
                </label>
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
