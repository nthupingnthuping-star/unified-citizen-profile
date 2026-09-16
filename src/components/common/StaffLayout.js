import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageToggle from './LanguageToggle';
import { assetPath } from '../../utils/assetPath';

const StaffLayout = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { t } = useLanguage();

  const departmentMenus = {
    1: {
      name: 'Ministry of Home Affairs',
      logo: assetPath('/assets/logos/home-affairs.png'),
      items: [
        { path: '/staff-dashboard', labelKey: 'overview' },
        { path: '/staff/home-affairs', labelKey: 'verification_queue' },
        { path: '/staff/appointments', labelKey: 'appointments' },
        { path: '/staff/analytics', labelKey: 'analytics' },
      ],
    },
    2: {
      name: 'Department of Traffic and Transport',
      logo: assetPath('/assets/logos/traffic.png'),
      items: [
        { path: '/staff-dashboard', labelKey: 'overview' },
        { path: '/staff/traffic', labelKey: 'application_queue' },
        { path: '/staff/appointments', labelKey: 'appointments' },
        { path: '/staff/analytics', labelKey: 'analytics' },
      ],
    },
    3: {
      name: 'Ministry of Finance / RSL',
      logo: assetPath('/assets/logos/finance.png'),
      items: [
        { path: '/staff-dashboard', labelKey: 'overview' },
        { path: '/staff/finance', labelKey: 'application_queue' },
        { path: '/staff/appointments', labelKey: 'appointments' },
        { path: '/staff/analytics', labelKey: 'analytics' },
      ],
    },
    4: {
      name: 'Pensions Department',
      logo: assetPath('/assets/logos/pensions.png'),
      items: [
        { path: '/staff-dashboard', labelKey: 'overview' },
        { path: '/staff/pensions', labelKey: 'application_queue' },
        { path: '/staff/appointments', labelKey: 'appointments' },
        { path: '/staff/analytics', labelKey: 'analytics' },
      ],
    },
    5: {
      name: 'Lesotho Mounted Police Service',
      logo: assetPath('/assets/logos/police.png'),
      items: [
        { path: '/staff-dashboard', labelKey: 'overview' },
        { path: '/staff/police', labelKey: 'application_queue' },
        { path: '/staff/appointments', labelKey: 'appointments' },
        { path: '/staff/analytics', labelKey: 'analytics' },
      ],
    },
    6: {
      name: 'Passport and Citizenship Office',
      logo: assetPath('/assets/logos/passport.png'),
      items: [
        { path: '/staff-dashboard', labelKey: 'overview' },
        { path: '/staff/passport', labelKey: 'application_queue' },
        { path: '/staff/appointments', labelKey: 'appointments' },
        { path: '/staff/analytics', labelKey: 'analytics' },
      ],
    },
  };

  const currentDept = departmentMenus[profile?.department_id] || {
    name: profile?.citizenship_status === 'Staff' ? 'Government Staff' : 'Staff',
    logo: assetPath('/assets/logos/lesotho-coat-of-arms.png'),
    items: [{ path: '/staff-dashboard', labelKey: 'overview' }],
  };

  const handleLogout = () => {
    navigate('/logout');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      <aside style={{
        width: 270, background: '#1a1a5e', color: 'white',
        display: 'flex', flexDirection: 'column', position: 'fixed',
        top: 0, bottom: 0, left: 0, zIndex: 10,
      }}>
        {/* Header */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={assetPath('/assets/logos/lesotho-coat-of-arms.png')}
              alt="Lesotho"
              style={{ width: 40, height: 40, objectFit: 'contain', background: 'white', borderRadius: 6, padding: 3 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: 13, color: 'white' }}>{t('staff_portal')}</div>
              <div style={{ fontSize: 11, color: '#b3d4ff' }}>{t('government_of_lesotho')}</div>
            </div>
            <LanguageToggle />
          </div>
        </div>

        {/* Department */}
        <div style={{
          padding: 15, borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <img
            src={currentDept.logo}
            alt=""
            style={{ width: 36, height: 36, objectFit: 'contain', background: 'white', borderRadius: 6, padding: 3 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', lineHeight: 1.3, color: 'white' }}>
              {currentDept.name}
            </div>
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
              fontSize: 11, marginTop: 3, textTransform: 'capitalize',
              color: '#ffcc00', fontWeight: 'bold',
            }}>
              {profile.role}
            </div>
          </div>
        )}

        {/* Menu */}
        <nav style={{ flex: 1, padding: '15px 0', overflowY: 'auto' }}>
          {currentDept.items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'block',
                padding: '12px 20px',
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

export default StaffLayout;