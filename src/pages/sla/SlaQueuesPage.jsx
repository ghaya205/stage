import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import SlaTargetsManager from './SlaTargetsManager';
import ImportPanel from './ImportPanel';

export default function SlaQueuesPage() {
  const { token } = useAuth();
  return (
    <DashboardLayout pageTitle="SLA Queues">
      <div className="profile-page">
        <SlaTargetsManager token={token} />
        <div className="sla-toolbar sla-toolbar--import">
          <ImportPanel token={token} />
        </div>
      </div>
    </DashboardLayout>
  );
}
