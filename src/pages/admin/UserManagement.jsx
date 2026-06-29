import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../AuthContext";
import {
  fetchPendingUsers,
  fetchAllUsers,
  approveUser,
  rejectUser,
} from "../../api";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  RefreshCw,
  Mail,
  Calendar,
  AlertTriangle,
} from "lucide-react";

export default function UserManagement() {
  const { token } = useAuth();
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState("");

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [p, a] = await Promise.all([
        fetchPendingUsers(token),
        fetchAllUsers(token),
      ]);
      if (p.error) {
        setError("API error: " + p.error);
      } else {
        setPending(Array.isArray(p.users) ? p.users : []);
      }
      if (a.users) setAll(Array.isArray(a.users) ? a.users : []);
    } catch (e) {
      setError("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const [p, a] = await Promise.all([
          fetchPendingUsers(token),
          fetchAllUsers(token),
        ]);
        if (cancelled) return;
        if (p.error) {
          setError("API error: " + p.error);
        } else {
          setPending(Array.isArray(p.users) ? p.users : []);
        }
        if (a.users) setAll(Array.isArray(a.users) ? a.users : []);
      } catch (e) {
        if (!cancelled) setError("Network error: " + e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleApprove(id, name) {
    const res = await approveUser(token, id);
    if (res.error) {
      showToast("Error: " + res.error, false);
      return;
    }
    showToast(`${name} approved.`);
    load();
  }

  async function handleReject(id, name) {
    const res = await rejectUser(token, id);
    if (res.error) {
      showToast("Error: " + res.error, false);
      return;
    }
    showToast(`${name} rejected.`);
    setConfirm(null);
    load();
  }

  const roleBadge = (role) => {
    const styles = {
      agent: { bg: "rgba(59,130,246,.15)", color: "#60a5fa" },
      supervisor: { bg: "rgba(168,85,247,.15)", color: "#c084fc" },
      admin: { bg: "rgba(236,72,153,.15)", color: "#f472b6" },
    };
    const s = styles[role?.toLowerCase()] ?? {
      bg: "rgba(148,163,184,.1)",
      color: "#94a3b8",
    };
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          padding: "2px 8px",
          borderRadius: 20,
          background: s.bg,
          color: s.color,
          textTransform: "capitalize",
        }}
      >
        {role}
      </span>
    );
  };

  const list = tab === "pending" ? pending : all;

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 1000,
            background: toast.ok ? "#16a34a" : "#dc2626",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: "0 4px 20px rgba(0,0,0,.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {toast.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}{" "}
          {toast.msg}
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#1e1b2e",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 14,
              padding: 28,
              maxWidth: 360,
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(239,68,68,.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserX size={18} color="#f87171" />
              </div>
              <div>
                <div
                  style={{ fontWeight: 600, fontSize: 15, color: "#f1f5f9" }}
                >
                  Reject Account
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  This action cannot be undone
                </div>
              </div>
            </div>
            <p
              style={{
                color: "#cbd5e1",
                fontSize: 13,
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              Reject{" "}
              <strong style={{ color: "#f1f5f9" }}>{confirm.name}</strong>?
              Their account will be permanently deleted.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirm(null)}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.1)",
                  color: "#94a3b8",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(confirm.id, confirm.name)}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: 8,
                  background: "rgba(239,68,68,.2)",
                  border: "1px solid rgba(239,68,68,.4)",
                  color: "#f87171",
                  fontSize: 13,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#f1f5f9",
              margin: 0,
            }}
          >
            User Management
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Review registrations and manage access
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            background: "rgba(124,58,237,.15)",
            border: "1px solid rgba(124,58,237,.3)",
            color: "#a78bfa",
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <RefreshCw
            size={14}
            style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
          />{" "}
          Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,.1)",
            border: "1px solid rgba(239,68,68,.3)",
            borderRadius: 10,
            padding: "12px 16px",
            color: "#f87171",
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          <AlertTriangle
            size={14}
            style={{ marginRight: 6, verticalAlign: "middle" }}
          />
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          {
            icon: <Clock size={18} color="#fbbf24" />,
            label: "Pending",
            value: pending.length,
            color: "#fbbf24",
            bg: "rgba(251,191,36,.08)",
          },
          {
            icon: <Users size={18} color="#60a5fa" />,
            label: "Total Users",
            value: all.length,
            color: "#60a5fa",
            bg: "rgba(59,130,246,.08)",
          },
          {
            icon: <UserCheck size={18} color="#34d399" />,
            label: "Approved",
            value: all.filter((u) => u.is_approved == 1).length,
            color: "#34d399",
            bg: "rgba(52,211,153,.08)",
          },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              background: c.bg,
              border: `1px solid ${c.color}28`,
              borderRadius: 12,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: `${c.color}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {c.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: c.color,
                  lineHeight: 1,
                }}
              >
                {loading ? "…" : c.value}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {c.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid rgba(255,255,255,.06)",
          marginBottom: 20,
        }}
      >
        {[
          { key: "pending", label: "Pending Requests", count: pending.length },
          { key: "all", label: "All Users" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              background: "transparent",
              color: tab === t.key ? "#a78bfa" : "#64748b",
              borderBottom:
                tab === t.key ? "2px solid #7c3aed" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span
                style={{
                  background: "#7c3aed",
                  color: "#fff",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "#475569",
            fontSize: 14,
          }}
        >
          Loading…
        </div>
      ) : list.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#475569",
            fontSize: 14,
            background: "rgba(255,255,255,.02)",
            borderRadius: 12,
            border: "1px dashed rgba(255,255,255,.08)",
          }}
        >
          {tab === "pending"
            ? "🎉 No pending registrations!"
            : "No users found."}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                {[
                  "User",
                  "Email",
                  "Role",
                  tab === "all" && "Status",
                  "Registered",
                  tab === "pending" && "Actions",
                ]
                  .filter(Boolean)
                  .map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 14px",
                        color: "#475569",
                        fontWeight: 600,
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: ".6px",
                      }}
                    >
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,.02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td style={{ padding: "12px 14px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500, color: "#e2e8f0" }}>
                        {u.name}
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: "12px 14px", color: "#94a3b8" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <Mail size={12} /> {u.email}
                    </div>
                  </td>

                  <td style={{ padding: "12px 14px" }}>{roleBadge(u.role)}</td>

                  {tab === "all" && (
                    <td style={{ padding: "12px 14px" }}>
                      {u.is_approved == 1 ? (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                            color: "#34d399",
                          }}
                        >
                          <CheckCircle2 size={13} /> Approved
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                            color: "#fbbf24",
                          }}
                        >
                          <Clock size={13} /> Pending
                        </span>
                      )}
                    </td>
                  )}

                  <td
                    style={{
                      padding: "12px 14px",
                      color: "#64748b",
                      fontSize: 12,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Calendar size={12} />{" "}
                      {(u.created_at || "").split("T")[0] || u.created_at}
                    </div>
                  </td>

                  {tab === "pending" && (
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleApprove(u.id, u.name)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 12px",
                            borderRadius: 7,
                            background: "rgba(52,211,153,.12)",
                            border: "1px solid rgba(52,211,153,.3)",
                            color: "#34d399",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <UserCheck size={13} /> Approve
                        </button>
                        <button
                          onClick={() => setConfirm({ id: u.id, name: u.name })}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 12px",
                            borderRadius: 7,
                            background: "rgba(239,68,68,.1)",
                            border: "1px solid rgba(239,68,68,.3)",
                            color: "#f87171",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <UserX size={13} /> Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
