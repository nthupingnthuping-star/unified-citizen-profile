import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import NotificationBell from './NotificationBell';
import LanguageToggle from './LanguageToggle';

const Layout = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { t } = useLanguage();

  const serviceGroups = [
    {
      groupKey: 'group_my_identity',
      items: [
        { path: '/dashboard', labelKey: 'dashboard' },
        { path: '/home-affairs', labelKey: 'verify_my_identity' },
        { path: '/notifications', labelKey: 'notifications' },
        { path: '/access-history', labelKey: 'who_viewed_my_data' },
      ],
    },
    {
      groupKey: 'group_appointments',
      items: [
        { path: '/appointments', labelKey: 'my_appointments' },
        { path: '/appointments/book', labelKey: 'book_a_visit' },
      ],
    },
    {
      groupKey: 'group_money_taxes',
      items: [
        { path: '/finance', labelKey: 'tax_clearance_refunds' },
        { path: '/pensions', labelKey: 'pension_services' },
      ],
    },
    {
      groupKey: 'group_transport',
      items: [
        { path: '/traffic', labelKey: 'drivers_license_vehicles' },
      ],
    },
    {
      groupKey: 'group_travel_safety',
      items: [
        { path: '/passport', labelKey: 'passport_services' },
        { path: '/police', labelKey: 'police_clearance_reports' },
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
        {/* Header with logo + language toggle + bell */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={`${process.env.PUBLIC_URL}/assets/logos/lesotho-coat-of-arms.png`}
              alt="Lesotho"
              style={{ width: 40, height: 40, objectFit: 'contain', background: 'white', borderRadius: 6, padding: 3 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: 13, color: 'white' }}>{t('unified_citizen')}</div>
              <div style={{ fontSize: 11, color: '#b3d4ff' }}>{t('profile_system')}</div>
            </div>
            <LanguageToggle />
            <NotificationBell />
          </div>
        </div>

        {/* Signed-in user */}
        {profile && (
          <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 11, color: '#b3d4ff', fontWeight: 'bold' }}>{t('signed_in_as')}</div>
            <div style={{ fontWeight: 'bold', fontSize: 13, marginTop: 3, color: 'white' }}>
              {profile.full_name}
            </div>
            <div style={{
              fontSize: 11, marginTop: 3,
              color: profile.verified_by_home_affairs ? '#7fff7f' : '#ffcc00',
              fontWeight: 'bold',
            }}>
              {profile.verified_by_home_affairs ? t('verified') : t('not_verified')}
            </div>
          </div>
        )}

        {/* Menu */}
        <nav style={{ flex: 1, padding: '15px 0', overflowY: 'auto' }}>
          {serviceGroups.map((group) => (
            <div key={group.groupKey} style={{ marginBottom: 15 }}>
              <div style={{
                padding: '8px 20px',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: '#ffcc00',
                fontWeight: 'bold',
              }}>
                {t(group.groupKey)}
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
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: 15, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} style={{
            width: '100%', padding: 10, background: 'rgba(255,255,255,0.15)',
            color: 'white', border: 'none', borderRadius: 4,
            cursor: 'pointer', fontSize: 13, fontWeight: 'bold',
          }}>
            {t('logout')}
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