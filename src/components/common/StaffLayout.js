import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import NotificationBell from './NotificationBell';
import LanguageToggle from './LanguageToggle';

const StaffLayout = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { t } = useLanguage();

  const handleLogout = () => {
    navigate('/logout');
  };

  // Determine department name for the sidebar
  const getDepartmentName = (id) => {
    switch (id) {
      case 1: return 'Home Affairs';
      case 2: return 'Traffic';
      case 3: return 'Finance';
      case 4: return 'Pensions';
      case 5: return 'Police';
      case 6: return 'Passport';
      default: return 'Department';
    }
  };

  const deptName = getDepartmentName(profile?.department_id);

  const menuGroups = [
    {
      label: null,
      items: [
        { path: '/staff-dashboard', label: 'Dashboard', icon: '🏠' },
        { path: '/staff/profile', label: 'My Profile', icon: '👤' },
        { path: '/staff/data', label: 'My Data', icon: '🗂️' },
      ]
    },
    {
      label: 'SERVICES',
      items: [
        // Dynamically label the queue based on the staff member's department
        { path: '/staff/queue', label: `${deptName} Queue`, icon: '📄' },
        { path: '/staff/lookup', label: 'Citizen Search', icon: '🔍' },
        { path: '/staff/appointments', label: 'Appointments', icon: '📅' },
        { path: '/staff/analytics', label: 'Analytics', icon: '📊' },
      ]
    },
    {
      label: 'HELP & SUPPORT',
      items: [
        { path: '/help', label: 'User Guide', icon: '📖' },
        { path: '/help', label: 'Contact Support', icon: '🎧' },
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={{
        width: 280, background: '#0b2545', color: 'white',
        display: 'flex', flexDirection: 'column', position: 'fixed',
        top: 0, bottom: 0, left: 0, zIndex: 10,
      }}>
        {/* Header */}
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={`${process.env.PUBLIC_URL}/assets/logos/lesotho-coat-of-arms.png`}
            alt="Lesotho"
            style={{ width: 40, height: 40, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white', lineHeight: 1.2 }}>
              Unified Citizen<br/>Profile System
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              Government of Lesotho
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          {menuGroups.map((group, idx) => (
            <div key={idx} style={{ marginBottom: 20 }}>
              {group.label && (
                <div style={{ padding: '8px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', fontWeight: 700 }}>
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.label} to={item.path} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 24px',
                    color: isActive ? 'white' : '#cbd5e1',
                    textDecoration: 'none',
                    background: isActive ? '#1e3a8a' : 'transparent',
                    borderLeft: isActive ? '4px solid #3b82f6' : '4px solid transparent',
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: 10, fontSize: 10, fontWeight: 'bold' }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Promo Banner */}
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ background: '#1e3a8a', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ color: '#93c5fd', fontSize: 30, marginBottom: 8 }}>🏔️</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.4 }}>
              A Connected Lesotho
            </div>
            <div style={{ fontSize: 11, color: '#93c5fd', marginTop: 4 }}>
              Better Services. Brighter Future.
            </div>
          </div>
        </div>

        {/* Logout */}
        <div style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '12px', background: '#1e3a8a',
            color: 'white', border: 'none', borderRadius: 8,
            cursor: 'pointer', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ marginLeft: 280, flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Header */}
        <header style={{
          background: 'white', padding: '16px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 5
        }}>
          <div style={{ flex: 1, maxWidth: 400, display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 999, padding: '0 16px', height: 40 }}>
            <span style={{ color: '#94a3b8', marginRight: 8 }}>🔍</span>
            <input type="text" placeholder="Search for services, permits, tax portals..." style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: 13, color: '#334155' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <LanguageToggle />
            <button style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>🧍</span> Accessibility
            </button>
            <NotificationBell />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '1px solid #e2e8f0', paddingLeft: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0b2545', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold' }}>
                {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{profile?.full_name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Staff</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: 32, flex: 1 }}>
          {title && <h1 style={{ color: '#0f172a', marginTop: 0, marginBottom: 24, fontSize: 26, fontWeight: 800 }}>{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;