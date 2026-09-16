import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { assetPath } from '../../utils/assetPath';
import Layout from '../common/Layout';
import Card from '../common/Card';
import Badge from '../common/Badge';

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useLanguage();

  const services = [
    { nameKey: 'ministry_finance', descKey: 'ministry_finance_desc', route: '/finance', logo: assetPath('/assets/logos/finance.png') },
    { nameKey: 'ministry_home_affairs', descKey: 'ministry_home_affairs_desc', route: '/home-affairs', logo: assetPath('/assets/logos/home-affairs.png') },
    { nameKey: 'ministry_traffic', descKey: 'ministry_traffic_desc', route: '/traffic', logo: assetPath('/assets/logos/traffic.png') },
    { nameKey: 'ministry_police', descKey: 'ministry_police_desc', route: '/police', logo: assetPath('/assets/logos/police.png') },
    { nameKey: 'ministry_passport', descKey: 'ministry_passport_desc', route: '/passport', logo: assetPath('/assets/logos/passport.png') },
    { nameKey: 'ministry_pensions', descKey: 'ministry_pensions_desc', route: '/pensions', logo: assetPath('/assets/logos/pensions.png') },
    { nameKey: 'ministry_access_history', descKey: 'ministry_access_history_desc', route: '/access-history', icon: '🔒' },
  ];

  // Get translated gender
  const genderKey = profile?.gender?.toLowerCase() || 'male';
  const genderLabel = t(genderKey);

  // Get translated citizenship
  const citizenshipKey = profile?.citizenship_status?.toLowerCase().includes('citizen')
    ? 'citizen'
    : 'unknown';
  const citizenshipLabel = t(citizenshipKey);

  return (
    <Layout title={t('dashboard')}>
      <p style={{ color: '#666', marginTop: 0 }}>
        {t('welcome_back')}, {profile?.full_name?.split(' ')[0] || t('citizen')}.
      </p>

      <Card style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img
            src={assetPath('/assets/images/citizen-card.png')}
            alt="Citizen"
            style={{ width: 80, height: 80, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div style={{ flex: 1 }}>
            <Badge color={profile?.verified_by_home_affairs ? 'green' : 'yellow'}>
              {profile?.verified_by_home_affairs
                ? t('verified_by_home_affairs')
                : t('not_verified_by_home_affairs')}
            </Badge>
            <h2 style={{ marginTop: 10, color: '#003366', marginBottom: 5 }}>
              {profile?.full_name}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 10 }}>
              <div><strong>{t('national_id')}:</strong> {profile?.national_id}</div>
              <div><strong>{t('date_of_birth')}:</strong> {profile?.date_of_birth}</div>
              <div><strong>{t('gender')}:</strong> {genderLabel}</div>
              <div><strong>{t('phone_number')}:</strong> {profile?.phone_number || '—'}</div>
              <div><strong>{t('email')}:</strong> {profile?.email || '—'}</div>
              <div><strong>{t('citizenship')}:</strong> {citizenshipLabel}</div>
            </div>
          </div>
        </div>
      </Card>

      <h3 style={{ color: '#003366', marginTop: 30 }}>{t('available_services')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginTop: 15 }}>
        {services.map((service) => (
          <button
            key={service.route}
            onClick={() => navigate(service.route)}
            style={{
              padding: 20,
              border: '1px solid #ddd',
              borderRadius: 8,
              background: 'white',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#003366';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,51,102,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#ddd';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ width: 70, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              {service.logo ? (
                <img
                  src={service.logo}
                  alt={t(service.nameKey)}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = '🏛️'; }}
                />
              ) : (
                <span style={{ fontSize: 44 }}>{service.icon}</span>
              )}
            </div>
            <div style={{ color: '#003366', fontWeight: 'bold', fontSize: 14 }}>
              {t(service.nameKey)}
            </div>
            <div style={{ marginTop: 5, fontSize: 12, color: '#888' }}>
              {t(service.descKey)}
            </div>
          </button>
        ))}
      </div>
    </Layout>
  );
};

export default Dashboard;