import { useAuth } from "./AuthContext";
import { Link } from "react-router-dom";
import "./app.css";

export default function Status() {
  const { token, user, logout } = useAuth();

  return (
    <div className="status-page">
      <div className="status-card">
        {token ? (
          <>
            <div className="status-badge logged-in">● Logged in</div>
            <div className="status-avatar">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <h2 className="status-name">{user?.name}</h2>
            <p className="status-email">{user?.email}</p>

            <div className="status-info">
              <div className="status-row">
                <span className="status-label">Status</span>
                <span className="status-value green">Active session</span>
              </div>
              <div className="status-row">
                <span className="status-label">Token</span>
                <span className="status-value mono">{token.slice(0, 20)}…</span>
              </div>
            </div>

            <div className="status-actions">
              <Link to="/dashboard" className="btn-filled">
                Dashboard
              </Link>
              <button className="btn-outline" onClick={logout}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="status-badge logged-out">○ Not logged in</div>
            <div className="status-avatar ghost">?</div>
            <h2 className="status-name">No session</h2>
            <p className="status-email">You are not currently signed in.</p>

            <div className="status-actions">
              <Link to="/login" className="btn-filled">
                Sign in
              </Link>
              <Link to="/register" className="btn-outline">
                Register
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
