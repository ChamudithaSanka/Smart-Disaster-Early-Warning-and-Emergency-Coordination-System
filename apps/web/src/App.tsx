import { Navigate, Route, Routes } from 'react-router-dom';
import { ReactNode } from 'react';
import { homeFor, useAuth } from './lib/auth';
import DmcLayout from './components/DmcLayout';
import OpsLayout from './components/OpsLayout';
import { Soon } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateWarning from './pages/CreateWarning';
import DeliveryReports from './pages/DeliveryReports';
import WarningsList from './pages/WarningsList';
import Areas from './pages/Areas';
import ReviewQueue from './pages/ReviewQueue';
import ReportDetail from './pages/ReportDetail';
import Requests from './pages/Requests';
import Assignment from './pages/Assignment';
import DispatchPage from './pages/DispatchPage';
import { Approvals, Relief } from './pages/OrgPages';
import { Teams, OpsMap } from './pages/OpsMisc';

function Guard({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to={user ? homeFor(user.role) : '/login'} replace />} />
      <Route path="/dmc" element={<Guard roles={['DMC_OFFICER']}><DmcLayout /></Guard>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="warnings" element={<WarningsList />} />
        <Route path="create" element={<CreateWarning />} />
        <Route path="areas" element={<Areas />} />
        <Route path="delivery" element={<DeliveryReports />} />
        <Route path="notifications" element={<Soon title="Notifications" />} />
        <Route path="citizens" element={<Soon title="Citizens" />} />
        <Route path="settings" element={<Soon title="Settings" />} />
      </Route>
      <Route path="/ops" element={<Guard roles={['DMC_OFFICER']}><OpsLayout mode="review" /></Guard>}>
        <Route path="review" element={<ReviewQueue />} />
        <Route path="review/:id" element={<ReportDetail />} />
        <Route path="events" element={<Soon title="Hazard events" />} />
      </Route>
      <Route path="/ops" element={<Guard roles={['OPERATIONS_COORDINATOR', 'DMC_OFFICER']}><OpsLayout mode="rescue" /></Guard>}>
        <Route path="dashboard" element={<Requests />} />
        <Route path="requests" element={<Requests />} />
        <Route path="requests/:id" element={<Assignment />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="dispatch" element={<Navigate to="/ops/requests" replace />} />
        <Route path="dispatch/:id" element={<DispatchPage />} />
        <Route path="teams" element={<Teams />} />
        <Route path="map" element={<OpsMap />} />
        <Route path="relief" element={<Relief />} />
        <Route path="centres" element={<Soon title="Centre Management" />} />
        <Route path="settings" element={<Soon title="Settings" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
