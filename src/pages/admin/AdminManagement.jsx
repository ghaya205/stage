import DashboardLayout from '../../layouts/DashboardLayout';
import UserManagement from './UserManagement';

export default function AdminManagement() {
  return (
    <DashboardLayout pageTitle="User Management">
      <UserManagement />
    </DashboardLayout>
  );
}
