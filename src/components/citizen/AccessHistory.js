import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { getMyAccessLogs, DEPARTMENT_NAMES } from '../../firebase/db';
import Layout from '../common/Layout';
import Card from '../common/Card';
import Alert from '../common/Alert';
import Table from '../common/Table';

const AccessHistory = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
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
    <Layout title={t('who_accessed_my_data')}>
      <Alert type="info">
        {t('access_help')}
      </Alert>

      <Card title={t('access_history')} style={{ marginTop: 20 }}>
        {loading ? (
          <p style={{ color: '#666' }}>{t('loading')}</p>
        ) : (
          <Table
            headers={[t('department'), t('action'), t('purpose'), t('date_time')]}
            rows={logs.map((log) => [
              DEPARTMENT_NAMES[log.department_id] || `Department ${log.department_id}`,
              <span style={{ textTransform: 'capitalize' }}>{log.action_type}</span>,
              log.purpose || '—',
              log.accessed_at?.toDate?.().toLocaleString() || '—',
            ])}
            emptyMessage={t('no_access_records')}
          />
        )}
      </Card>

      <div style={{
        background: '#e6f0fa', padding: 20, borderRadius: 8,
        marginTop: 25, border: '1px solid #b3d4f0',
      }}>
        <strong style={{ color: '#003366' }}>ℹ️ {t('role_permissions')}</strong>
        <p style={{ margin: '8px 0 0 0', color: '#333', fontSize: 14, lineHeight: 1.6 }}>
          {t('role_help')}
        </p>
      </div>
    </Layout>
  );
};

export default AccessHistory;