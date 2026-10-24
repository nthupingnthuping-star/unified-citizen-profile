import StaffLayout from '../../components/common/StaffLayout';

const StaffData = () => {
  return (
    <StaffLayout title="My Data">
      <div style={{ background: 'white', borderRadius: 16, padding: 32, border: '1px solid #e2e8f0' }}>
        <h2 style={{ marginTop: 0 }}>My Data</h2>
        <p>View and manage your data access logs and system preferences.</p>
      </div>
    </StaffLayout>
  );
};
export default StaffData;