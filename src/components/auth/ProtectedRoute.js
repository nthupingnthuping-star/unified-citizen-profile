import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, isStaff, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', fontSize: 16, color: '#666',
      }}>
        Loading...
      </div>
    );
  }

  // Not logged in → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isStaffRoute = location.pathname.startsWith('/staff');

  // Staff trying to access citizen routes → send to staff dashboard
  if (isStaff && !isStaffRoute) {
    console.warn('⛔ Staff blocked from citizen route:', location.pathname);
    return <Navigate to="/staff-dashboard" replace />;
  }

  // Citizen trying to access staff routes → send to citizen dashboard
  if (!isStaff && isStaffRoute) {
    console.warn('⛔ Citizen blocked from staff route:', location.pathname);
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;