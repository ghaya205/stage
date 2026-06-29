import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../AuthContext";
import { fetchAllUsers, approveUser, rejectUser } from "../../api";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  UserCheck,
  UserX,
  ShieldCheck,
  AlertCircle,
  Search,
} from "lucide-react";

const STATUS = { 0: "pending", 1: "approved", 2: "rejected" };

const ROLE_COLORS = {
  agent: {
    bg: "rgba(59,130,246,0.10)",
    color: "#2563eb",
    border: "rgba(59,130,246,0.22)",
  },
  supervisor: {
    bg: "rgba(139,92,246,0.10)",
    color: "#7c3aed",
    border: "rgba(139,92,246,0.22)",
  },
};

function RolePill({ name }) {
  const s = ROLE_COLORS[name] ?? {
    bg: "#f3f4f8",
    color: "#6b7280",
    border: "#e5e7eb",
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "capitalize",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {name}
    </span>
  );
}

function StatusPill({ status }) {
  const map = {
    pending: {
      bg: "rgba(245,158,11,0.10)",
      color: "#d97706",
      border: "rgba(245,158,11,0.25)",
      icon: <Clock size={11} />,
      label: "Pending",
    },
    approved: {
      bg: "rgba(16,185,129,0.10)",
      color: "#059669",
      border: "rgba(16,185,129,0.25)",
      icon: <CheckCircle2 size={11} />,
      label: "Approved",
    },
    rejected: {
      bg: "rgba(239,68,68,0.10)",
      color: "#dc2626",
      border: "rgba(239,68,68,0.25)",
      icon: <XCircle size={11} />,
      label: "Rejected",
    },
  };
  const s = map[status] ?? map.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {s.icon} {s.label}
    </span>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "var(--radius)",
        padding: "20px 22px",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "10px",
          background: color + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

export default function UserApprovals() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAllUsers(token);
      setUsers(data.users ?? []);
    } catch {
      setError("Failed to load users. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [token]);


  useEffect(() => {
    let cancelled = false;
    async function fetchUsers() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchAllUsers(token);
        if (!cancelled) setUsers(data.users ?? []);
      } catch {
        if (!cancelled)
          setError("Failed to load users. Check your connection.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleApprove(userId, userName) {
    setActionId(userId);
    try {
      await approveUser(token, userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_approved: 1 } : u)),
      );
      showToast(`✓ ${userName} approved — they can now log in.`);
    } catch {
      showToast("Action failed. Please try again.");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(userId, userName) {
    if (!window.confirm(`Reject account for ${userName}?`)) return;
    setActionId(userId);
    try {
      await rejectUser(token, userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_approved: 2 } : u)),
      );
      showToast(`✗ ${userName}'s account rejected.`);
    } catch {
      showToast("Action failed. Please try again.");
    } finally {
      setActionId(null);
    }
  }

  const pendingCount = users.filter(
    (u) => String(u.is_approved) === "0",
  ).length;
  const approvedCount = users.filter(
    (u) => String(u.is_approved) === "1",
  ).length;
  const rejectedCount = users.filter(
    (u) => String(u.is_approved) === "2",
  ).length;

  const filtered = users.filter((u) => {
    const statusStr = String(u.is_approved);
    const matchFilter =
      filter === "all"
        ? true
        : filter === "pending"
          ? statusStr === "0"
          : filter === "approved"
            ? statusStr === "1"
            : filter === "rejected"
              ? statusStr === "2"
              : true;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role_name.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const fmtDate = (dt) =>
    dt
      ? new Date(dt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <DashboardLayout pageTitle="User Approvals">
      
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            zIndex: 9999,
            background: "#1c1e2e",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: 500,
            boxShadow: "0 8px 30px rgba(0,0,0,0.22)",
            animation: "fadeInUp .2s ease",
          }}
        >
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        /* FIX 3: Added missing @keyframes spin for the refresh icon */
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .ua-row:hover td { background: #f9fafb !important; }
        .filter-tab { border:none; background:none; cursor:pointer; font-family:Inter,sans-serif; font-size:13px; font-weight:600; padding:7px 16px; border-radius:8px; color:var(--text-secondary); transition:all .18s; }
        .filter-tab.active { background:#fff; color:var(--text-primary); box-shadow:0 1px 4px rgba(0,0,0,.10); }
        .filter-tab:hover:not(.active) { color:var(--text-primary); }
        .act-btn { border:none; border-radius:7px; padding:6px 13px; font-size:12px; font-weight:700; font-family:Inter,sans-serif; cursor:pointer; display:inline-flex; align-items:center; gap:5px; transition:opacity .15s,transform .15s; }
        .act-btn:hover:not(:disabled) { opacity:.82; transform:translateY(-1px); }
        .act-btn:disabled { opacity:.4; cursor:not-allowed; }
        .act-btn.approve { background:rgba(16,185,129,0.12); color:#059669; }
        .act-btn.reject  { background:rgba(239,68,68,0.10);  color:#dc2626; }
      `}</style>

     
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            <ShieldCheck size={22} style={{ color: "var(--dxc-coral)" }} />
            User Approvals
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            Review and approve agent &amp; supervisor registrations
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1.5px solid var(--border)",
            background: "#fff",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-secondary)",
            fontFamily: "Inter,sans-serif",
            transition: "all .18s",
          }}
        >
          <RefreshCw
            size={14}
            style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
          />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div
        style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}
      >
        <StatCard
          icon={<Users size={20} />}
          label="Total Users"
          value={users.length}
          color="#6366f1"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Pending Approval"
          value={pendingCount}
          color="#f59e0b"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Approved"
          value={approvedCount}
          color="#10b981"
        />
        <StatCard
          icon={<XCircle size={20} />}
          label="Rejected"
          value={rejectedCount}
          color="#ef4444"
        />
      </div>

      
      <div
        style={{
          background: "#fff",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 4,
              background: "var(--bg-page)",
              padding: "4px",
              borderRadius: "10px",
            }}
          >
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button
                key={f}
                className={`filter-tab${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "pending" && pendingCount > 0 && (
                  <span
                    style={{
                      marginLeft: 5,
                      background: "#f59e0b",
                      color: "#fff",
                      borderRadius: "999px",
                      padding: "1px 6px",
                      fontSize: "10px",
                      fontWeight: 800,
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                color: "var(--text-secondary)",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, role…"
              style={{
                paddingLeft: 32,
                paddingRight: 12,
                paddingTop: 7,
                paddingBottom: 7,
                border: "1.5px solid var(--border)",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "Inter,sans-serif",
                outline: "none",
                width: 220,
              }}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "14px 20px",
              background: "#fef2f2",
              color: "#dc2626",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              padding: "56px 20px",
              textAlign: "center",
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            Loading users…
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: "56px 20px",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            <Users size={38} style={{ opacity: 0.18, marginBottom: 10 }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
              No users found
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>
              {filter === "pending"
                ? "No pending registrations at the moment."
                : "Try adjusting your filter or search."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f9fafb",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  
                  {[
                    "Name",
                    "Email",
                    "Role",
                    "Registered",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const status = STATUS[String(u.is_approved)] ?? "pending";
                  const isBusy = actionId === u.id;
                  const isLast = i === filtered.length - 1;
                  return (
                    <tr
                      key={u.id}
                      className="ua-row"
                      style={{
                        borderBottom: isLast
                          ? "none"
                          : "1px solid var(--border)",
                      }}
                    >
                      <td style={{ padding: "13px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg,#E8643A,#7B8FD4)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {u.name
                              .split(" ")
                              .map((p) => p[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <span
                            style={{
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {u.name}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {u.email}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <RolePill name={u.role_name} />
                      </td>
                      
                      <td
                        style={{
                          padding: "13px 16px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {fmtDate(u.created_at)}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <StatusPill status={status} />
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", gap: 7 }}>
                          {status !== "approved" && (
                            <button
                              className="act-btn approve"
                              disabled={isBusy}
                              onClick={() => handleApprove(u.id, u.name)}
                            >
                              <UserCheck size={13} /> Approve
                            </button>
                          )}
                         
                          {status !== "rejected" && (
                            <button
                              className="act-btn reject"
                              disabled={isBusy}
                              onClick={() => handleReject(u.id, u.name)}
                            >
                              <UserX size={13} /> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div
            style={{
              padding: "10px 20px",
              borderTop: "1px solid var(--border)",
              fontSize: 12,
              color: "var(--text-secondary)",
            }}
          >
            Showing {filtered.length} of {users.length} user
            {users.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
