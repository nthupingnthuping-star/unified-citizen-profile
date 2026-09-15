import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../common/Layout';
import Card from '../common/Card';
import Badge from '../common/Badge';

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const services = [
    { name: 'Finance / RSL', route: '/finance', logo: '/assets/logos/finance.png', desc: 'Tax clearance & PAYE refunds' },
    { name: 'Home Affairs', route: '/home-affairs', logo: '/assets/logos/home-affairs.png', desc: 'Identity & citizenship' },
    { name: 'Traffic', route: '/traffic', logo: '/assets/logos/traffic.png', desc: 'Licenses & traffic fines' },
    { name: 'Police', route: '/police', logo: '/assets/logos/police.png', desc: 'Clearances & crime reports' },
    { name: 'Passport', route: '/passport', logo: '/assets/logos/passport.png', desc: 'New passports & renewals' },
    { name: 'Pensions', route: '/pensions', logo: '/assets/logos/pensions.png', desc: 'Pension registration' },
    { name: 'Access History', route: '/access-history', icon: '🔒', desc: 'Who accessed your data' },
  ];

  return (
    <Layout title="Dashboard">
      <p style={{ color: '#666', marginTop: 0 }}>
        Welcome back, {profile?.full_name?.split(' ')[0] || 'Citizen'}.
      </p>

      <Card style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img src="/assets/images/citizen-card.png" alt="Citizen"
            style={{ width: 80, height: 80, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }} />
          <div style={{ flex: 1 }}>
            <Badge color={profile?.verified_by_home_affairs ? 'green' : 'yellow'}>
              {profile?.verified_by_home_affairs ? '✓ Verified by Home Affairs' : '⚠ Not Verified'}
            </Badge>
            <h2 style={{ marginTop: 10, color: '#003366', marginBottom: 5 }}>{profile?.full_name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 10 }}>
              <div><strong>National ID:</strong> {profile?.national_id}</div>
              <div><strong>Date of Birth:</strong> {profile?.date_of_birth}</div>
              <div><strong>Citizenship:</strong> {profile?.citizenship_status}</div>
              <div><strong>Gender:</strong> {profile?.gender}</div>
              <div><strong>Phone:</strong> {profile?.phone_number || '—'}</div>
              <div><strong>Email:</strong> {profile?.email || '—'}</div>
            </div>
          </div>
        </div>
      </Card>

      <h3 style={{ color: '#003366', marginTop: 30 }}>Available Services</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginTop: 15 }}>
        {services.map((service) => (
          <button
            key={service.route}
            onClick={() => navigate(service.route)}
            style={{
              padding: 20, border: '1px solid #ddd', borderRadius: 8,
              background: 'white', textAlign: 'center', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
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
                <img src={service.logo} alt={service.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = '🏛️'; }} />
              ) : (
                <span style={{ fontSize: 44 }}>{service.icon}</span>
              )}
            </div>
            <div style={{ color: '#003366', fontWeight: 'bold', fontSize: 14 }}>{service.name}</div>
            <div style={{ marginTop: 5, fontSize: 12, color: '#888' }}>{service.desc}</div>
          </button>
        ))}
      </div>
    </Layout>
  );
};

export default Dashboard;
