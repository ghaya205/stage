import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import SlaDashboardView from '../sla/SlaDashboardView';

export default function AdminDashboard() {
  const { token } = useAuth();
  return (
    <DashboardLayout pageTitle="SLA Dashboard">
      <div className="profile-page">
        <SlaDashboardView mode="admin" token={token} />
      </div>
    </DashboardLayout>
  );
}
