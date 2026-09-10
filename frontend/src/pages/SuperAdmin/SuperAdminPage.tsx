import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserIdentity } from '../../hooks/useUserIdentity';
import DashboardShell from '../../components/Layout/DashboardShell';
import SearchRecords from './SearchRecords';
import RecordDetail from './RecordDetail';
import TehsildarLogs from './TehsildarLogs';

const NAV_ITEMS = [
  {
    label: 'Search Records',
    path: '/super-admin',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    label: 'Tehsildar Logs',
    path: '/super-admin/logs',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function SuperAdminPage() {
  const { userId, role } = useUserIdentity();

  if (!userId || role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <DashboardShell role="super_admin" userName={userId} navItems={NAV_ITEMS} title="Search Records">
            <SearchRecords />
          </DashboardShell>
        }
      />
      <Route
        path="/logs"
        element={
          <DashboardShell role="super_admin" userName={userId} navItems={NAV_ITEMS} title="Tehsildar Logs">
            <TehsildarLogs />
          </DashboardShell>
        }
      />
      <Route
        path="/record/:id"
        element={
          <DashboardShell role="super_admin" userName={userId} navItems={NAV_ITEMS} title="Record Details">
            <RecordDetail />
          </DashboardShell>
        }
      />
    </Routes>
  );
}
