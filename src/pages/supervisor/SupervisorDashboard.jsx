import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import SlaDashboardView from '../sla/SlaDashboardView';
import TeamPresence from './TeamPresence';

export default function SupervisorDashboard() {
  const { token } = useAuth();
  return (
    <DashboardLayout pageTitle="Team SLA Dashboard">
      <div className="profile-page">
        <SlaDashboardView mode="supervisor" token={token} />
        <TeamPresence />
      </div>
    </DashboardLayout>
  );
}
