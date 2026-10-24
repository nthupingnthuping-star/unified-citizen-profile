import StaffLayout from '../../components/common/StaffLayout';
import { useAuth } from '../../contexts/AuthContext';

const StaffProfile = () => {
  const { profile } = useAuth();
  
  return (
    <StaffLayout title="My Profile">
      <div style={{ background: 'white', borderRadius: 16, padding: 32, border: '1px solid #e2e8f0', maxWidth: 800 }}>
        <h2 style={{ marginTop: 0, color: '#0f172a' }}>Profile Information</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Manage your personal and contact details here.</p>
        
        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Full Name</div>
            <div style={{ fontSize: 16, color: '#0f172a', fontWeight: 600, marginTop: 4 }}>{profile?.full_name}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Email Address</div>
            <div style={{ fontSize: 16, color: '#0f172a', fontWeight: 600, marginTop: 4 }}>{profile?.email}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Phone Number</div>
            <div style={{ fontSize: 16, color: '#0f172a', fontWeight: 600, marginTop: 4 }}>{profile?.phone_number || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Role</div>
            <div style={{ fontSize: 16, color: '#0f172a', fontWeight: 600, marginTop: 4 }}>Staff Member</div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffProfile;