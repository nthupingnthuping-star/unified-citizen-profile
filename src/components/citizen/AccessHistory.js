import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyAccessLogs, DEPARTMENT_NAMES } from '../../firebase/db';
import Layout from '../common/Layout';
import Card from '../common/Card';
import Alert from '../common/Alert';
import Table from '../common/Table';

const AccessHistory = () => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!profile) return;
      try {
        const data = await getMyAccessLogs(profile.uid);
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile]);

  return (
    <Layout title="🔒 Who Viewed My Data">
      <Alert type="info">
        Every time a government department accesses your data, it is recorded here.
        This ensures transparency and accountability.
      </Alert>

      <Card title="Access Log" style={{ marginTop: 20 }}>
        {loading ? (
          <p style={{ color: '#666' }}>Loading access history...</p>
        ) : (
          <Table
            headers={['Department', 'Action', 'Purpose', 'Date & Time']}
            rows={logs.map((log) => [
              DEPARTMENT_NAMES[log.department_id] || `Department ${log.department_id}`,
              <span style={{ textTransform: 'capitalize' }}>{log.action_type}</span>,
              log.purpose || '—',
              log.accessed_at?.toDate?.().toLocaleString() || '—',
            ])}
            emptyMessage="No one has accessed your data yet."
          />
        )}
      </Card>

      <div style={{
        background: '#e6f0fa', padding: 20, borderRadius: 8,
        marginTop: 25, border: '1px solid #b3d4f0',
      }}>
        <strong style={{ color: '#003366' }}>ℹ️ How This Works</strong>
        <p style={{ margin: '8px 0 0 0', color: '#333', fontSize: 14, lineHeight: 1.6 }}>
          Each department can only access the specific fields they need to perform their service.
          No department can see your full profile, and no one can access your data without a valid reason.
        </p>
      </div>
    </Layout>
  );
};

export default AccessHistory;