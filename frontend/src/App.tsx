import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import Home from './pages/Home';
import FieldOfficerPage from './pages/FieldOfficer/FieldOfficerPage';
import TehsildarPage from './pages/Tehsildar/TehsildarPage';
import SuperAdminPage from './pages/SuperAdmin/SuperAdminPage';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/field-officer/*" element={<FieldOfficerPage />} />
        <Route path="/tehsildar/*" element={<TehsildarPage />} />
        <Route path="/super-admin/*" element={<SuperAdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
