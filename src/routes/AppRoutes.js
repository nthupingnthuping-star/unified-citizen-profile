import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext'; 
import { DEPARTMENTS } from '../firebase/db'; 

// Public Pages
import HomePage from '../pages/HomePage';
import SearchPage from '../pages/SearchPage';
import AnnouncementsPage from '../pages/AnnouncementsPage';
import HelpCenterPage from '../pages/HelpCenterPage';
import CitizenLogin from '../components/auth/CitizenLogin';
import StaffLogin from '../components/auth/StaffLogin';
import Register from '../components/auth/Register';
import Logout from '../components/auth/Logout';
import VerifyPage from '../pages/VerifyPage';

// Citizen Pages
import Dashboard from '../components/citizen/Dashboard';
import AccessHistory from '../components/citizen/AccessHistory';
import BookAppointment from '../components/citizen/BookAppointment';
import MyAppointments from '../components/citizen/MyAppointments';
import NotificationsPage from '../components/citizen/NotificationsPage';
import CertificateView from '../components/citizen/CertificateView';

// Citizen Modules
import HomeAffairsModule from '../components/homeAffairs/HomeAffairsModule';
import FinanceModule from '../components/finance/FinanceModule';
import TrafficModule from '../components/traffic/TrafficModule';
import PoliceModule from '../components/police/PoliceModule';
import PassportModule from '../components/passport/PassportModule';
import PensionsModule from '../components/pensions/PensionsModule';
import PensionFundProfile from '../pages/pension/PensionFundProfile';
import PensionStatement from '../pages/pension/PensionStatement';
import PensionProjection from '../pages/pension/PensionProjection';
import PensionClaim from '../pages/pension/PensionClaim';
import PensionBeneficiaries from '../pages/pension/PensionBeneficiaries';
import PensionStatus from '../pages/pension/PensionStatus';
import PoliceCaseTracker from '../pages/police/PoliceCaseTracker';

// Staff Pages
import StaffDashboard from '../components/staff/StaffDashboard';
import StaffHomeAffairs from '../components/staff/StaffHomeAffairs';
import StaffFinance from '../components/staff/StaffFinance';
import StaffTraffic from '../components/staff/StaffTraffic';
import StaffPolice from '../components/staff/StaffPolice';
import StaffPassport from '../components/staff/StaffPassport';
import StaffPensions from '../components/staff/StaffPensions';
import StaffAppointments from '../components/staff/StaffAppointments';
import StaffLookup from '../pages/staff/StaffLookup';
import StaffProfile from '../pages/staff/StaffProfile';
import StaffHelp from '../pages/staff/StaffHelp';
import StaffSupport from '../pages/staff/StaffSupport'; // <-- ADDED IMPORT

// Staff Analytics
import StaffHomeAffairsAnalytics from '../components/staff/StaffHomeAffairsAnalytics';
import StaffTrafficAnalytics from '../components/staff/StaffTrafficAnalytics';
import StaffFinanceAnalytics from '../components/staff/StaffFinanceAnalytics';
import StaffPensionAnalytics from '../components/staff/StaffPensionAnalytics';
import StaffPoliceAnalytics from '../components/staff/StaffPoliceAnalytics';
import StaffPassportAnalytics from '../components/staff/StaffPassportAnalytics';

// Smart Queue Router for Staff
const StaffQueueRouter = () => {
  const { profile } = useAuth();
  
  if (!profile) return <Navigate to="/staff-dashboard" replace />;

  const deptId = profile.department_id;

  switch (deptId) {
    case DEPARTMENTS.HOME_AFFAIRS:
      return <StaffHomeAffairs />;
    case DEPARTMENTS.TRAFFIC:
      return <StaffTraffic />;
    case DEPARTMENTS.POLICE:
      return <StaffPolice />;
    case DEPARTMENTS.PASSPORT:
      return <StaffPassport />;
    case DEPARTMENTS.PENSIONS:
      return <StaffPensions />;
    case DEPARTMENTS.FINANCE:
    default:
      return <StaffFinance />;
  }
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* =========================================
          PUBLIC ROUTES
      ========================================= */}
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/announcements" element={<AnnouncementsPage />} />
      <Route path="/help" element={<HelpCenterPage />} />
      <Route path="/login" element={<CitizenLogin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/staff-login" element={<StaffLogin />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/verify/:reference" element={<VerifyPage />} />

      {/* =========================================
          CITIZEN PROTECTED ROUTES
      ========================================= */}
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
        <Route path="/police/case/:reference" element={<PoliceCaseTracker />} />
        <Route path="/passport" element={<PassportModule />} />
        <Route path="/pensions" element={<PensionsModule />} />

        <Route path="/pension/fund" element={<PensionFundProfile />} />
        <Route path="/pension/statement" element={<PensionStatement />} />
        <Route path="/pension/projection" element={<PensionProjection />} />
        <Route path="/pension/claims" element={<PensionClaim />} />
        <Route path="/pension/beneficiaries" element={<PensionBeneficiaries />} />
        <Route path="/pension/status" element={<PensionStatus />} />
      </Route>

      {/* =========================================
          STAFF PROTECTED ROUTES
      ========================================= */}
      <Route element={<ProtectedRoute />}>
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/staff/profile" element={<StaffProfile />} />
        <Route path="/staff/data" element={<AccessHistory />} />
        
        {/* Smart queue routing based on department */}
        <Route path="/staff/queue" element={<StaffQueueRouter />} /> 
        
        {/* Department specific routes */}
        <Route path="/staff/home-affairs" element={<StaffHomeAffairs />} />
        <Route path="/staff/finance" element={<StaffFinance />} />
        <Route path="/staff/traffic" element={<StaffTraffic />} />
        <Route path="/staff/police" element={<StaffPolice />} />
        <Route path="/staff/passport" element={<StaffPassport />} />
        <Route path="/staff/pensions" element={<StaffPensions />} />
        
        <Route path="/staff/lookup" element={<StaffLookup />} />
        <Route path="/staff/appointments" element={<StaffAppointments />} />
        
        {/* Help & Support Routes */}
        <Route path="/staff/help" element={<StaffHelp />} />
        <Route path="/staff/support" element={<StaffSupport />} /> {/* <-- ADDED ROUTE */}

        {/* Analytics */}
        <Route path="/staff/analytics" element={<StaffFinanceAnalytics />} />
        <Route path="/staff/home-affairs/analytics" element={<StaffHomeAffairsAnalytics />} />
        <Route path="/staff/traffic/analytics" element={<StaffTrafficAnalytics />} />
        <Route path="/staff/finance/analytics" element={<StaffFinanceAnalytics />} />
        <Route path="/staff/pensions/analytics" element={<StaffPensionAnalytics />} />
        <Route path="/staff/police/analytics" element={<StaffPoliceAnalytics />} />
        <Route path="/staff/passport/analytics" element={<StaffPassportAnalytics />} />
      </Route>

      {/* Catch-all: Redirect unknown routes to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;