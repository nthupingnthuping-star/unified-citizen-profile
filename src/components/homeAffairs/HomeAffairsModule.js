import { useAuth } from '../../contexts/AuthContext';
import { getMyAccessLogs } from '../../firebase/db';
import { useState, useEffect } from 'react';
import Layout from '../common/Layout';
import Card from '../common/Card';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';
import VerifiedGuard from '../citizen/VerifiedGuard';

const HomeAffairsModule = () => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (profile) {
      getMyAccessLogs(profile.uid).then(setLogs).catch(console.error);
    }
  }, [profile]);

  return (
    <VerifiedGuard serviceName="Home Affairs">
      <Layout title="🏛️ Ministry of Home Affairs">
        <Alert type={profile?.verified_by_home_affairs ? 'success' : 'warning'}>
          {profile?.verified_by_home_affairs
            ? '✓ Your identity is verified. You can now use all government services.'
            : '⚠ Your identity is not yet verified. Visit a Home Affairs office to complete verification.'}
        </Alert>

        <Card title="My Identity Record" style={{ marginTop: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
            <div><strong>Full Name:</strong> {profile?.full_name}</div>
            <div><strong>National ID:</strong> {profile?.national_id}</div>
            <div><strong>Date of Birth:</strong> {profile?.date_of_birth}</div>
            <div><strong>Gender:</strong> {profile?.gender}</div>
            <div><strong>Citizenship:</strong> {profile?.citizenship_status}</div>
            <div>
              <strong>Status:</strong>{' '}
              <Badge color={profile?.verified_by_home_affairs ? 'green' : 'yellow'}>
                {profile?.verified_by_home_affairs ? 'Verified' : 'Pending'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card title="Recent Access to My Data" style={{ marginTop: 20 }}>
          <Table
            headers={['Department', 'Action', 'Purpose', 'Date']}
            rows={logs.slice(0, 10).map((log) => [
              `Department ${log.department_id}`,
              log.action_type,
              log.purpose,
              log.accessed_at?.toDate?.().toLocaleDateString() || '—',
            ])}
            emptyMessage="No access records yet."
          />
        </Card>
      </Layout>
    </VerifiedGuard>
  );
};

export default HomeAffairsModule;