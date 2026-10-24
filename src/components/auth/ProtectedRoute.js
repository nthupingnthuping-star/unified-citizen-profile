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

  const isStaffRoute = location.pathname.startsWith('/staff');

  // 1. Not logged in → go to the correct login page and SAVE the destination
  if (!isAuthenticated) {
    // If they tried to access a staff route, send them to staff-login
    // Otherwise, send them to the citizen login
    const loginPath = isStaffRoute ? '/staff-login' : '/login';
    
    return (
      <Navigate 
        to={loginPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // 2. Staff trying to access citizen routes → send to staff dashboard
  if (isStaff && !isStaffRoute) {
    console.warn('⛔ Staff blocked from citizen route:', location.pathname);
    return <Navigate to="/staff-dashboard" replace />;
  }

  // 3. Citizen trying to access staff routes → send to citizen dashboard
  if (!isStaff && isStaffRoute) {
    console.warn('⛔ Citizen blocked from staff route:', location.pathname);
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;