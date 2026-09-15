import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StaffLayout from '../common/StaffLayout';
import Card from '../common/Card';

const StaffDashboard = () => {
  const { profile } = useAuth();

  const departmentActions = {
    1: [{ to: '/staff/home-affairs', label: 'Verification Queue', icon: '✅' }],
    2: [{ to: '/staff/traffic', label: 'Application Queue', icon: '📄' }],
    3: [{ to: '/staff/finance', label: 'Application Queue', icon: '📄' }],
    4: [{ to: '/staff/pensions', label: 'Application Queue', icon: '📄' }],
    5: [{ to: '/staff/police', label: 'Application Queue', icon: '📄' }],
    6: [{ to: '/staff/passport', label: 'Application Queue', icon: '📌' }],
  };

  const actions = departmentActions[profile?.department_id] || [];

  return (
    <StaffLayout title={`Welcome, ${profile?.full_name}`}>
      <p style={{ color: '#666', marginTop: 0 }}>
        You are logged in as <strong>{profile?.role}</strong> at <strong>{profile?.citizenship_status === 'Staff' ? 'your department' : ''}</strong>.
      </p>

      <Card title="Your Services" style={{ marginTop: 20 }}>
        {actions.length === 0 ? (
          <p style={{ color: '#666' }}>No actions available for your department.</p>
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
                <div style={{ fontSize: 32 }}>{a.icon}</div>
                <div>{a.label}</div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <div style={{
        background: '#e6f0fa', padding: 20, borderRadius: 8,
        marginTop: 25, border: '1px solid #b3d4f0',
      }}>
        <strong style={{ color: '#1a1a5e' }}>ℹ️ Role & Permissions</strong>
        <p style={{ margin: '8px 0 0 0', color: '#333', fontSize: 14, lineHeight: 1.6 }}>
          You can <strong>view, approve, reject, or request more info</strong> on applications submitted to your department.
        </p>
        <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: 13 }}>
          You <strong>cannot</strong> create applications, edit citizen data, or access other ministries' records.
        </p>
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;