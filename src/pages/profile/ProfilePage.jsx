import { useState } from 'react';
import { useAuth } from '../../AuthContext';
import { updateProfile, updatePassword } from '../../api';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Eye, EyeOff, CheckCircle, AlertCircle, Shield } from 'lucide-react';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getRoleLabel(roleId) {
  const map = { 1: 'Agent', 2: 'Supervisor', 3: 'Administrator' };
  return map[roleId] ?? 'Unknown';
}

export default function ProfilePage() {
  const { user, token, login } = useAuth();

  const [name, setName]     = useState(user?.name ?? '');
  const [infoMsg, setInfoMsg] = useState('');
  const [infoErr, setInfoErr] = useState('');
  const [infoLoading, setInfoLoading] = useState(false);

  const [currentPwd, setCurrentPwd]   = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  async function handleInfoSave(e) {
    e.preventDefault();
    setInfoMsg(''); setInfoErr('');
    if (!name.trim()) { setInfoErr('Name cannot be empty.'); return; }
    setInfoLoading(true);
    try {
      const data = await updateProfile(token, { name: name.trim() });
      if (data.error) {
        setInfoErr(data.error);
      } else {
        login(token, { ...user, name: name.trim() });
        setInfoMsg('Profile updated successfully.');
      }
    } catch {
      setInfoErr('Network error. Please try again.');
    } finally {
      setInfoLoading(false);
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPwdMsg(''); setPwdErr('');
    if (!currentPwd) { setPwdErr('Current password is required.'); return; }
    if (newPwd.length < 8) { setPwdErr('New password must be at least 8 characters.'); return; }
    if (newPwd !== confirmPwd) { setPwdErr('Passwords do not match.'); return; }
    setPwdLoading(true);
    try {
      const data = await updatePassword(token, { current_password: currentPwd, new_password: newPwd });
      if (data.error) {
        setPwdErr(data.error);
      } else {
        setPwdMsg('Password changed successfully.');
        setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      }
    } catch {
      setPwdErr('Network error. Please try again.');
    } finally {
      setPwdLoading(false);
    }
  }

  const roleLabel = getRoleLabel(user?.role_id);

  return (
    <DashboardLayout pageTitle="Profile">
      <div className="profile-page">

        <div className="profile-header">
          <div className="profile-avatar-lg">{getInitials(user?.name)}</div>
          <div className="profile-header-info">
            <div className="profile-header-name">{user?.name}</div>
            <div className="profile-header-email">{user?.email}</div>
            <div className="profile-role-badge">
              <Shield size={11} />
              {roleLabel}
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-card-title">Account Information</div>

          <div className="profile-field">
            <label>Email Address</label>
            <input className="profile-input" type="email" value={user?.email ?? ''} disabled readOnly />
          </div>

          <div className="profile-field">
            <label>Role</label>
            <input className="profile-input" type="text" value={roleLabel} disabled readOnly />
            <span className="profile-readonly-note">Role cannot be changed from this page.</span>
          </div>

          {user?.username && (
            <div className="profile-field">
              <label>Username</label>
              <input className="profile-input" type="text" value={user.username} disabled readOnly />
            </div>
          )}
        </div>

        <div className="profile-card">
          <div className="profile-card-title">Edit Profile</div>

          {infoMsg && (
            <div className="profile-msg-ok">
              <CheckCircle size={14} /> {infoMsg}
            </div>
          )}
          {infoErr && (
            <div className="profile-msg-err">
              <AlertCircle size={14} /> {infoErr}
            </div>
          )}

          <form onSubmit={handleInfoSave}>
            <div className="profile-field">
              <label>Full Name</label>
              <input
                className="profile-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <button className="profile-save-btn" type="submit" disabled={infoLoading}>
              {infoLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="profile-card">
          <div className="profile-card-title">Change Password</div>

          {pwdMsg && (
            <div className="profile-msg-ok">
              <CheckCircle size={14} /> {pwdMsg}
            </div>
          )}
          {pwdErr && (
            <div className="profile-msg-err">
              <AlertCircle size={14} /> {pwdErr}
            </div>
          )}

          <form onSubmit={handlePasswordSave}>
            <div className="profile-field">
              <label>Current Password</label>
              <div className="profile-input-wrap">
                <input
                  className="profile-input"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="profile-input-eye"
                  onClick={() => setShowCurrent((v) => !v)}
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="profile-field-row">
              <div className="profile-field">
                <label>New Password</label>
                <div className="profile-input-wrap">
                  <input
                    className="profile-input"
                    type={showNew ? 'text' : 'password'}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    className="profile-input-eye"
                    onClick={() => setShowNew((v) => !v)}
                  >
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="profile-field">
                <label>Confirm New Password</label>
                <div className="profile-input-wrap">
                  <input
                    className="profile-input"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    className="profile-input-eye"
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <button className="profile-save-btn" type="submit" disabled={pwdLoading}>
              {pwdLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </DashboardLayout>
  );
}
