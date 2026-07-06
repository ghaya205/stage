import DashboardLayout from '../../layouts/DashboardLayout';
import TeamPresence from './TeamPresence';

export default function SupervisorDashboard() {
  return (
    <DashboardLayout pageTitle="Team SLA Dashboard">
      <div className="profile-page">
        <TeamPresence />
      </div>
    </DashboardLayout>
  );
}
