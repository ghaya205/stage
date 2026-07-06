import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import {
  fetchAllUsers,
  approveUser,
  rejectUser,
  fetchPresenceToday,
} from "../../services/api";
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
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Moon,
  Sun,
} from "lucide-react";
import "./UserApprovals.css";

const STATUS = { 0: "pending", 1: "approved", 2: "rejected" };

function RolePill({ name }) {
  const className =
    name === "agent"
      ? "role-pill--agent"
      : name === "supervisor"
        ? "role-pill--supervisor"
        : "role-pill--default";
  return <span className={`role-pill ${className}`}>{name}</span>;
}

function StatusPill({ status }) {
  const map = {
    pending: { className: "ua-status-pill--pending", icon: <Clock size={11} />, label: "Pending" },
    approved: { className: "ua-status-pill--approved", icon: <CheckCircle2 size={11} />, label: "Approved" },
    rejected: { className: "ua-status-pill--rejected", icon: <XCircle size={11} />, label: "Rejected" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`ua-status-pill ${s.className}`}>
      {s.icon} {s.label}
    </span>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon-wrap" style={{ '--icon-bg': color + "18" }}>
        <span className="stat-card-icon" style={{ '--icon-color': color }}>{icon}</span>
      </div>
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}

function ShiftPill({ shift }) {
  if (!shift) {
    return <span className="ua-shift-empty">—</span>;
  }
  const isNight = shift === "nuit";
  return (
    <span className={`ua-shift-pill ${isNight ? "ua-shift-pill--night" : "ua-shift-pill--day"}`}>
      {isNight ? <Moon size={11} /> : <Sun size={11} />}
      {isNight ? "Nuit" : "Matin"}
    </span>
  );
}

function PresenceStatusPill({ isPresent }) {
  return (
    <span className={`ua-presence-pill ${isPresent ? "ua-presence-pill--present" : "ua-presence-pill--absent"}`}>
      {isPresent ? <CheckCircle2 size={11} /> : <Clock size={11} />}
      {isPresent ? "Present" : "Not marked"}
    </span>
  );
}

function PresenceSection({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 4;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchPresenceToday(token);
      setUsers(data.users ?? []);
    } catch {
      setError("Failed to load presence. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchPresenceToday(token);
        if (!cancelled) setUsers(data.users ?? []);
      } catch {
        if (!cancelled) setError("Failed to load presence. Check your connection.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const presentCount = users.filter((u) => u.is_present).length;
  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = users.slice((safePage - 1) * pageSize, safePage * pageSize);

  const fmtTime = (dt) =>
    dt
      ? new Date(dt.replace(" ", "T")).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div className="ua-panel ua-panel--spaced">
      <div className="ua-panel-header">
        <div>
          <h2 className="ua-panel-title">
            <CalendarCheck size={17} className="ua-page-title-icon" />
            Today's Presence
          </h2>
          <p className="ua-panel-subtitle">
            {presentCount} of {users.length} checked in today
          </p>
        </div>
        <button onClick={load} disabled={loading} className="ua-panel-refresh-btn">
          <RefreshCw size={13} className={loading ? "ua-spin-icon" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="ua-error-banner">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="ua-loading-row" style={{ height: 56 * pageSize }}>
          Loading presence…
        </div>
      ) : (
        <div className="ua-table-wrap">
          <table className="ua-table">
            <thead>
              <tr>
                {["Name", "Role", "Shift", "Status", "Since"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((u, i) => {
                const isLast = i === paginated.length - 1;
                return (
                  <tr
                    key={u.id}
                    className={`ua-row ua-row-h56${isLast && users.length >= pageSize ? "" : " ua-row-bordered"}`}
                  >
                    <td>
                      <div className="ua-name-cell">
                        <div className="ua-avatar">
                          {u.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <span className="ua-agent-name">{u.name}</span>
                      </div>
                    </td>
                    <td>
                      <RolePill name={u.role_name} />
                    </td>
                    <td>
                      <ShiftPill shift={u.shift} />
                    </td>
                    <td>
                      <PresenceStatusPill isPresent={u.is_present} />
                    </td>
                    <td className="ua-cell-muted">
                      {fmtTime(u.marked_at)}
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr style={{ height: 56 * pageSize }}>
                  <td colSpan={5} className="ua-empty-cell">
                    <Users size={32} className="ua-empty-icon" />
                    <p className="ua-empty-title">
                      No users found
                    </p>
                  </td>
                </tr>
              )}
              {paginated.length > 0 &&
                paginated.length < pageSize &&
                Array.from({ length: pageSize - paginated.length }).map((_, idx) => (
                  <tr key={`presence-filler-${idx}`} className="ua-row-h56">
                    <td colSpan={5} />
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="ua-pagination-bar">
          <div className="ua-pagination-info">
            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, users.length)} of{" "}
            {users.length} user{users.length !== 1 ? "s" : ""}
          </div>
          <div className="ua-pagination-controls">
            <button
              className="page-btn"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="ua-pagination-page">
              Page {safePage} of {totalPages}
            </span>
            <button
              className="page-btn"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
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
  const [page, setPage] = useState(1);
  const pageSize = 4;

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
      showToast(`${userName} approved, they can now log in.`);
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
      showToast(`${userName}'s account rejected.`);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

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
        <div className="ua-toast">
          {toast}
        </div>
      )}

      <div className="ua-page-header">
        <div>
          <h1 className="ua-page-title">
            <ShieldCheck size={22} className="ua-page-title-icon" />
            User Approvals
          </h1>
          <p className="ua-page-subtitle">
            Review and approve agent &amp; supervisor registrations
          </p>
        </div>
        <button onClick={load} disabled={loading} className="ua-refresh-btn">
          <RefreshCw size={14} className={loading ? "ua-spin-icon" : ""} />
          Refresh
        </button>
      </div>

      <div className="stat-cards-row">
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

      <PresenceSection token={token} />

      <div className="ua-panel">

        <div className="ua-panel-header">
          <div className="ua-filters-row">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button
                key={f}
                className={`filter-tab${filter === f ? " active" : ""}`}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "pending" && pendingCount > 0 && (
                  <span className="ua-pending-badge">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="ua-search-wrap">
            <Search size={14} className="ua-search-icon" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, role…"
              className="ua-search-input"
            />
          </div>
        </div>

        {error && (
          <div className="ua-error-banner">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {loading ? (
          <div className="ua-loading-row" style={{ height: 56 * pageSize }}>
            Loading users…
          </div>
        ) : (
          <div className="ua-table-wrap">
            <table className="ua-table">
              <thead>
                <tr>

                  {[
                    "Name",
                    "Email",
                    "Role",
                    "Registered",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((u, i) => {
                  const status = STATUS[String(u.is_approved)] ?? "pending";
                  const isBusy = actionId === u.id;
                  const isLast = i === paginated.length - 1;
                  return (
                    <tr
                      key={u.id}
                      className={`ua-row ua-row-h56${isLast && filtered.length >= pageSize ? "" : " ua-row-bordered"}`}
                    >
                      <td>
                        <div className="ua-name-cell">
                          <div className="ua-avatar">
                            {u.name
                              .split(" ")
                              .map((p) => p[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <span className="ua-agent-name">
                            {u.name}
                          </span>
                        </div>
                      </td>
                      <td className="ua-cell-muted">
                        {u.email}
                      </td>
                      <td>
                        <RolePill name={u.role_name} />
                      </td>

                      <td className="ua-cell-muted">
                        {fmtDate(u.created_at)}
                      </td>
                      <td>
                        <StatusPill status={status} />
                      </td>
                      <td>
                        <div className="ua-actions-cell">
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
                {paginated.length === 0 && (
                  <tr style={{ height: 56 * pageSize }}>
                    <td colSpan={6} className="ua-empty-cell">
                      <Users
                        size={32}
                        className="ua-empty-icon"
                      />
                      <p className="ua-empty-title">
                        No users found
                      </p>
                      <p className="ua-empty-hint">
                        {filter === "pending"
                          ? "No pending registrations at the moment."
                          : "Try adjusting your filter or search."}
                      </p>
                    </td>
                  </tr>
                )}
                {paginated.length > 0 &&
                  paginated.length < pageSize &&
                  Array.from({ length: pageSize - paginated.length }).map(
                    (_, idx) => (
                      <tr key={`filler-${idx}`} className="ua-row-h56">
                        <td colSpan={6} />
                      </tr>
                    ),
                  )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="ua-pagination-bar">
            <div className="ua-pagination-info">
              Showing {(safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, filtered.length)} of{" "}
              {filtered.length} user{filtered.length !== 1 ? "s" : ""}
            </div>
            <div className="ua-pagination-controls">
              <button
                className="page-btn"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="ua-pagination-page">
                Page {safePage} of {totalPages}
              </span>
              <button
                className="page-btn"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
