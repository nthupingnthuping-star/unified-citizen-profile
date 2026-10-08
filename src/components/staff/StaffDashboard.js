import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import StaffLayout from '../common/StaffLayout';
import Card from '../common/Card';

const StaffDashboard = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const departmentActions = {
    1: [{ to: '/staff/home-affairs', labelKey: 'verification_queue' }],
    2: [{ to: '/staff/traffic', labelKey: 'application_queue' }],
    3: [{ to: '/staff/finance', labelKey: 'application_queue' }],
    4: [{ to: '/staff/pensions', labelKey: 'application_queue' }],
    5: [{ to: '/staff/police', labelKey: 'application_queue' }],
    6: [{ to: '/staff/passport', labelKey: 'application_queue' }],
  };

  const actions = departmentActions[profile?.department_id] || [];

  return (
    <StaffLayout title={`${t('staff_dashboard_welcome')}, ${profile?.full_name}`}>
      <p style={{ color: '#666', marginTop: 0 }}>
        {t('signed_in_as')} <strong>{profile?.role}</strong>
      </p>

      <Card title={t('your_services')} style={{ marginTop: 20 }}>
        {actions.length === 0 ? (
          <p style={{ color: '#666' }}>{t('no_applications_yet')}</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginTop: 20 }}>
            {actions.map((a) => (
              <Link key={a.to} to={a.to} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8,
                padding: 20, background: '#f9f9f9',
                border: '1px solid #ddd', borderRadius: 8,
                textDecoration: 'none', color: '#1a1a5e',
                fontWeight: 'bold', textAlign: 'center',
              }}>
                <div style={{ fontSize: 32 }}>📄</div>
                <div>{t(a.labelKey)}</div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <div style={{
        background: '#e6f0fa', padding: 20, borderRadius: 8,
        marginTop: 25, border: '1px solid #b3d4f0',
      }}>
        <strong style={{ color: '#1a1a5e' }}>ℹ️ {t('role_permissions')}</strong>
        <p style={{ margin: '8px 0 0 0', color: '#333', fontSize: 14, lineHeight: 1.6 }}>
          {t('role_help')}
        </p>
        <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: 13 }}>
          {t('role_restriction')}
        </p>
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;