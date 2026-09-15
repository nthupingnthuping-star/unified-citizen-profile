import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from './NotificationBell';

const Layout = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const serviceGroups = [
    {
      group: 'My Identity',
      items: [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/home-affairs', label: 'Verify My Identity' },
        { path: '/notifications', label: 'Notifications' },
        { path: '/access-history', label: 'Who Viewed My Data' },
      ],
    },
    {
      group: 'Appointments',
      items: [
        { path: '/appointments', label: 'My Appointments' },
        { path: '/appointments/book', label: 'Book a Visit' },
      ],
    },
    {
      group: 'Money & Taxes',
      items: [
        { path: '/finance', label: 'Tax Clearance & Refunds' },
        { path: '/pensions', label: 'Pension Services' },
      ],
    },
    {
      group: 'Transport',
      items: [
        { path: '/traffic', label: "Driver's License & Vehicles" },
      ],
    },
    {
      group: 'Travel & Safety',
      items: [
        { path: '/passport', label: 'Passport Services' },
        { path: '/police', label: 'Police Clearance & Reports' },
      ],
    },
  ];

  const handleLogout = () => {
    navigate('/logout');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      <aside style={{
        width: 270, background: '#003366', color: 'white',
        display: 'flex', flexDirection: 'column', position: 'fixed',
        top: 0, bottom: 0, left: 0, zIndex: 10,
      }}>
        <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/assets/logos/lesotho-coat-of-arms.png" alt="Lesotho"
              style={{ width: 40, height: 40, objectFit: 'contain',
                background: 'white', borderRadius: 6, padding: 3 }}
              onError={(e) => { e.target.style.display = 'none'; }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: 13, color: 'white' }}>Unified Citizen</div>
              <div style={{ fontSize: 11, color: '#b3d4ff' }}>Profile System</div>
            </div>
            <NotificationBell />
          </div>
        </div>

        {profile && (
          <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 11, color: '#b3d4ff', fontWeight: 'bold' }}>Signed in as</div>
            <div style={{ fontWeight: 'bold', fontSize: 13, marginTop: 3, color: 'white' }}>
              {profile.full_name}
            </div>
            <div style={{
              fontSize: 11, marginTop: 3,
              color: profile.verified_by_home_affairs ? '#7fff7f' : '#ffcc00',
              fontWeight: 'bold',
            }}>
              {profile.verified_by_home_affairs ? 'Verified' : 'Not Verified'}
            </div>
          </div>
        )}

        <nav style={{ flex: 1, padding: '15px 0', overflowY: 'auto' }}>
          {serviceGroups.map((group) => (
            <div key={group.group} style={{ marginBottom: 15 }}>
              <div style={{
                padding: '8px 20px',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: '#ffcc00',
                fontWeight: 'bold',
              }}>
                {group.group}
              </div>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} style={{
                    display: 'block',
                    padding: '10px 20px',
                    color: 'white',
                    textDecoration: 'none',
                    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                    borderLeft: isActive ? '4px solid #ffcc00' : '4px solid transparent',
                    fontSize: 13,
                    fontWeight: isActive ? 'bold' : 'normal',
                  }}>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding: 15, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} style={{
            width: '100%', padding: 10, background: 'rgba(255,255,255,0.15)',
            color: 'white', border: 'none', borderRadius: 4,
            cursor: 'pointer', fontSize: 13, fontWeight: 'bold',
          }}>
            Logout
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: 270, flex: 1, padding: 30, minHeight: '100vh' }}>
        {title && (
          <h1 style={{ color: '#003366', marginTop: 0, marginBottom: 5 }}>{title}</h1>
        )}
        {children}
      </main>
    </div>
  );
};

export default Layout;