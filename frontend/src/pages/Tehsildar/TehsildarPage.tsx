import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserIdentity } from '../../hooks/useUserIdentity';
import DashboardShell from '../../components/Layout/DashboardShell';
import PendingQueue from './PendingQueue';
import ReviewRecord from './ReviewRecord';

const NAV_ITEMS = [
  {
    label: 'Pending Reviews',
    path: '/tehsildar',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
];

export default function TehsildarPage() {
  const { userId, role } = useUserIdentity();

  if (!userId || role !== 'tehsildar') {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <DashboardShell role="tehsildar" userName={userId} navItems={NAV_ITEMS} title="Pending Reviews">
            <PendingQueue />
          </DashboardShell>
        }
      />
      <Route
        path="/review/:id"
        element={
          <DashboardShell role="tehsildar" userName={userId} navItems={NAV_ITEMS} title="Review Record">
            <ReviewRecord tehsildarId={userId} />
          </DashboardShell>
        }
      />
    </Routes>
  );
}
