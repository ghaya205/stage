import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { fetchFullProfile, assetUrl } from "../../api";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Shield, Pencil, AlertCircle, User, Briefcase } from "lucide-react";

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
                <InfoRow label="Diplomas" value={profile?.diplomas} />
                <InfoRow
                  label="Certifications"
                  value={profile?.certifications}
                />
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
