import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';

import HomePage from '../pages/HomePage';
import SeedPage from '../pages/SeedPage';
import VerifyPage from '../pages/VerifyPage';

import CitizenLogin from '../components/auth/CitizenLogin';
import StaffLogin from '../components/auth/StaffLogin';
import Register from '../components/auth/Register';
import Logout from '../components/auth/Logout';

import Dashboard from '../components/citizen/Dashboard';
import AccessHistory from '../components/citizen/AccessHistory';
import BookAppointment from '../components/citizen/BookAppointment';
import MyAppointments from '../components/citizen/MyAppointments';
import NotificationsPage from '../components/citizen/NotificationsPage';
import CertificateView from '../components/citizen/CertificateView';

import HomeAffairsModule from '../components/homeAffairs/HomeAffairsModule';
import FinanceModule from '../components/finance/FinanceModule';
import TrafficModule from '../components/traffic/TrafficModule';
import PoliceModule from '../components/police/PoliceModule';
import PassportModule from '../components/passport/PassportModule';
import PensionsModule from '../components/pensions/PensionsModule';

import StaffDashboard from '../components/staff/StaffDashboard';
import StaffHomeAffairs from '../components/staff/StaffHomeAffairs';
import StaffFinance from '../components/staff/StaffFinance';
import StaffTraffic from '../components/staff/StaffTraffic';
import StaffPolice from '../components/staff/StaffPolice';
import StaffPassport from '../components/staff/StaffPassport';
import StaffPensions from '../components/staff/StaffPensions';
import StaffAppointments from '../components/staff/StaffAppointments';
import StaffAnalytics from '../components/staff/StaffAnalytics';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<CitizenLogin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/staff-login" element={<StaffLogin />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/seed" element={<SeedPage />} />
      <Route path="/verify/:reference" element={<VerifyPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/access-history" element={<AccessHistory />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/appointments" element={<MyAppointments />} />
        <Route path="/appointments/book" element={<BookAppointment />} />
        <Route path="/certificate/:reference" element={<CertificateView />} />

        <Route path="/home-affairs" element={<HomeAffairsModule />} />
        <Route path="/finance" element={<FinanceModule />} />
        <Route path="/traffic" element={<TrafficModule />} />
        <Route path="/police" element={<PoliceModule />} />
        <Route path="/passport" element={<PassportModule />} />
        <Route path="/pensions" element={<PensionsModule />} />

        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/staff/home-affairs" element={<StaffHomeAffairs />} />
        <Route path="/staff/finance" element={<StaffFinance />} />
        <Route path="/staff/traffic" element={<StaffTraffic />} />
        <Route path="/staff/police" element={<StaffPolice />} />
        <Route path="/staff/passport" element={<StaffPassport />} />
        <Route path="/staff/pensions" element={<StaffPensions />} />
        <Route path="/staff/appointments" element={<StaffAppointments />} />
        <Route path="/staff/analytics" element={<StaffAnalytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;