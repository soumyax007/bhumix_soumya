import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserIdentity } from '../../hooks/useUserIdentity';
import DashboardShell from '../../components/Layout/DashboardShell';
import DocumentUploadFlow from './DocumentUploadFlow';
import MySubmissions from './MySubmissions';

const NAV_ITEMS = [
  {
    label: 'Upload Document',
    path: '/field-officer',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    label: 'My Submissions',
    path: '/field-officer/submissions',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function FieldOfficerPage() {
  const { userId, role } = useUserIdentity();

  if (!userId || role !== 'field_officer') {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <DashboardShell role="field_officer" userName={userId} navItems={NAV_ITEMS} title="Upload Document">
            <DocumentUploadFlow userId={userId} />
          </DashboardShell>
        }
      />
      <Route
        path="/submissions"
        element={
          <DashboardShell role="field_officer" userName={userId} navItems={NAV_ITEMS} title="My Submissions">
            <MySubmissions userId={userId} />
          </DashboardShell>
        }
      />
    </Routes>
  );
}
