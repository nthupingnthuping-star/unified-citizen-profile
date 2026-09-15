import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../firebase/auth';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      console.log('🚪 Logging out...');
      await logout();
      console.log('✅ Logged out');
      navigate('/login');
    };
    doLogout();
  }, [navigate]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', color: '#666',
    }}>
      Logging out...
    </div>
  );
};

export default Logout;