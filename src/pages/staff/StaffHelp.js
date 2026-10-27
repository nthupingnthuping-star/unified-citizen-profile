import StaffLayout from '../../components/common/StaffLayout';
import Card from '../../components/common/Card';

const StaffHelp = () => {
  return (
    <StaffLayout title="Help & Support">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ color: '#003366', marginBottom: 8 }}>Staff IT & System Support</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Get help with the Unified Citizen Profile system.</p>

        <Card>
          <h2 style={{ color: '#003366', marginTop: 0 }}>Contact Internal IT Support</h2>
          <ul style={{ lineHeight: 1.8, color: '#333' }}>
            <li><strong>Phone:</strong> +266 2222 1111 (Ext: 4400)</li>
            <li><strong>Email:</strong> it.support@ucps.gov.ls</li>
            <li><strong>Hours:</strong> Mon-Fri, 8am - 5pm</li>
          </ul>
        </Card>
      </div>
    </StaffLayout>
  );
};

export default StaffHelp;