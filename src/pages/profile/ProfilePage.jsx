import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  fetchFullProfile,
  fetchMyPresence,
  markPresence,
  fetchMyQualifications,
  assetUrl,
} from "../../services/api";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  Shield,
  Pencil,
  AlertCircle,
  User,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Moon,
  Sun,
} from "lucide-react";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleLabel(roleId) {
  const map = { 1: "Agent", 2: "Supervisor", 3: "Administrator" };
  return map[roleId] ?? "Unknown";
}

function getRolePath(roleId) {
  const map = { 1: "/agent", 2: "/supervisor", 3: "/admin" };
  return map[roleId] ?? "/agent";
}

function getShiftLabel(shift) {
  if (shift === "matin") return "Matin (09:00 – 17:00)";
  if (shift === "nuit") return "Nuit (21:00 – 06:00)";
  return null;
}

function fmtTime(dt) {
  if (!dt) return "";
  return new Date(dt.replace(" ", "T")).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, value }) {
  const isEmpty = !value;
  return (
    <div className="profile-field">
      <label>{label}</label>
      <div className={`profile-view-value${isEmpty ? " is-empty" : ""}`}>
        {isEmpty ? "Not provided" : value}
      </div>
    </div>
  );
}

function PresenceCard({ token }) {
  const [presence, setPresence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchMyPresence(token);
        if (!cancelled) setPresence(data.presence ?? null);
      } catch {
        if (!cancelled) setError("Could not load today's presence status.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleMark() {
    setMarking(true);
    setError("");
    try {
      const data = await markPresence(token);
      if (data.error) setError(data.error);
      else setPresence(data.presence ?? null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setMarking(false);
    }
  }

  const isPresent = !!presence;
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });

  return (
    <div className="profile-card presence-card">
      <div className="profile-card-title">
        <CalendarCheck size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
        Today's Presence
      </div>

      {error && (
        <div className="profile-msg-err">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="presence-row">
        <div>
          <div className="presence-date">{today}</div>
          {loading ? (
            <div className="presence-status is-loading">Checking status…</div>
          ) : isPresent ? (
            <div className="presence-status is-present">
              <CheckCircle2 size={15} /> Present since {fmtTime(presence.marked_at)}
            </div>
          ) : (
            <div className="presence-status is-absent">
              <Clock size={15} /> Not marked present yet
            </div>
          )}
        </div>
        <button
          className="profile-save-btn presence-mark-btn"
          onClick={handleMark}
          disabled={marking || isPresent}
        >
          {isPresent ? "You're present" : marking ? "Marking…" : "I'm present today"}
        </button>
      </div>
    </div>
  );
}

function QualificationNames({ token }) {
  const [qualifications, setQualifications] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchMyQualifications(token).then((data) => {
      if (!cancelled) setQualifications(data.qualifications ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (qualifications.length === 0) {
    return <div className="profile-view-value is-empty">Not provided</div>;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {qualifications.map((q) => (
        <span
          key={q.id}
          style={{
            padding: "3px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            background: q.type === "diploma" ? "rgba(59,130,246,0.10)" : "rgba(217,119,6,0.10)",
            color: q.type === "diploma" ? "#2563eb" : "#b45309",
          }}
        >
          {q.name}
        </span>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchFullProfile(token);
        if (!cancelled) {
          if (data.error) setError(data.error);
          else setProfile(data.profile);
        }
      } catch {
        if (!cancelled) setError("Failed to load profile. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const roleLabel = getRoleLabel(user?.role_id);
  const roleBase = getRolePath(user?.role_id);
  const shiftLabel = getShiftLabel(profile?.shift);

  return (
    <DashboardLayout pageTitle="Profile">
      <div className="profile-page">
        <div className="profile-header">
          {profile?.profile_picture ? (
            <img
              className="profile-avatar-lg profile-avatar-img"
              src={assetUrl(profile.profile_picture)}
              alt={user?.name}
            />
          ) : (
            <div className="profile-avatar-lg">{getInitials(user?.name)}</div>
          )}
          <div className="profile-header-info">
            <div className="profile-header-name">{user?.name}</div>
            <div className="profile-header-email">{user?.email}</div>
            <div className="profile-role-badge">
              <Shield size={11} />
              {roleLabel}
            </div>
            {shiftLabel && (
              <div className="profile-shift-badge">
                {profile?.shift === "nuit" ? <Moon size={11} /> : <Sun size={11} />}
                {shiftLabel}
              </div>
            )}
          </div>
          <button
            className="profile-save-btn profile-edit-btn"
            onClick={() => navigate(`${roleBase}/settings`)}
          >
            <Pencil size={14} /> Update Profile
          </button>
        </div>

        {error && (
          <div className="profile-msg-err">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <PresenceCard token={token} />

        {loading ? (
          <div className="profile-card profile-loading">Loading profile…</div>
        ) : (
          <div className="profile-grid-2col">
            <div className="profile-card">
              <div className="profile-card-title">
                <User size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                Personal Information
              </div>
              <div className="profile-field-row">
                <InfoRow label="National ID" value={profile?.national_id} />
                <InfoRow label="Phone" value={profile?.phone} />
              </div>
              <div className="profile-field-row">
                <InfoRow label="Address" value={profile?.address} />
                <InfoRow label="Governorate" value={profile?.governorate} />
              </div>
              <div className="profile-field-row">
                <InfoRow
                  label="Marital Status"
                  value={profile?.marital_status}
                />
                <InfoRow
                  label="Number of Children"
                  value={profile?.child_number}
                />
              </div>
              <div className="profile-field-row">
                <InfoRow label="Role" value={roleLabel} />
                <InfoRow label="Language" value={profile?.language} />
              </div>
            </div>

            <div className="profile-card">
              <div className="profile-card-title">
                <Briefcase
                  size={13}
                  style={{ marginRight: 6, verticalAlign: -2 }}
                />
                Professional Information
              </div>
              <div className="profile-field-row">
                <InfoRow label="Title" value={profile?.title} />
                <InfoRow label="Assigned Project" value={profile?.desk_name} />
              </div>
              <div className="profile-field-row">
                <InfoRow label="Shift" value={shiftLabel} />
                <div />
              </div>
              <div className="profile-field">
                <label>Diplomas &amp; Certifications</label>
                <QualificationNames token={token} />
              </div>
              <InfoRow label="Skills" value={profile?.skills} />
              <div className="profile-field-row">
                <InfoRow label="Manager" value={profile?.manager_name} />
                <InfoRow label="HR Manager" value={profile?.hr_manager_name} />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
