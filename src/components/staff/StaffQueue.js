import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  getDepartmentApplications,
  updateApplicationStatus,
  DEPARTMENT_NAMES,
} from '../../firebase/db';
import StaffLayout from '../common/StaffLayout';
import Card from '../common/Card';
import Button from '../common/Button';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';

const StaffQueue = ({ departmentId }) => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('pending');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const apps = await getDepartmentApplications(departmentId, filter);
        setApplications(apps);
      } catch (err) {
        console.error(err);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [departmentId, filter, refreshKey]);

  const handleAction = async (applicationId, action) => {
    let reason = '';
    if (action === 'reject') {
      reason = window.prompt(t('reject') + ':') || '';
      if (!reason) return;
    } else if (action === 'request-info') {
      reason = window.prompt(t('request_info') + ':') || '';
      if (!reason) return;
    } else if (action === 'approve') {
      if (!window.confirm(t('approve') + '?')) return;
    }

    try {
      await updateApplicationStatus(applicationId, action, profile.uid, reason);
      setMessage(`✓ ${t(action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'processing')}`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setMessage(`✗ ${err.message}`);
    }
  };

  const statusColor = (s) => {
    if (s === 'approved' || s === 'completed') return 'green';
    if (s === 'rejected') return 'red';
    if (s === 'processing') return 'yellow';
    return 'gray';
  };

  const tabStyle = (s) => ({
    padding: '8px 16px',
    background: filter === s ? '#003366' : 'white',
    color: filter === s ? 'white' : '#333',
    border: '1px solid #ddd',
    borderRadius: 4,
    cursor: 'pointer',
    marginRight: 8,
    textTransform: 'capitalize',
    fontSize: 13,
  });

  const deptName = DEPARTMENT_NAMES[departmentId] || 'Department';

  return (
    <StaffLayout title={`${deptName} — ${t('application_queue')}`}>
      <Alert type="info">
        {t('role_help')}
      </Alert>

      {message && (
        <Alert
          type={message.startsWith('✓') ? 'success' : 'error'}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      <div style={{ marginBottom: 20 }}>
        {['pending', 'processing', 'approved', 'rejected', 'all'].map((s) => (
          <button key={s} style={tabStyle(s)} onClick={() => setFilter(s)}>
            {t(s)}
          </button>
        ))}
      </div>

      <Card title={`${t('application_queue')} — ${t(filter)}`}>
        {loading ? (
          <p style={{ color: '#666' }}>{t('loading_applications')}</p>
        ) : (
          <Table
            headers={[t('reference'), t('full_name'), t('service'), t('status'), t('submitted'), t('action')]}
            rows={applications.map((a) => [
              a.application_reference,
              <div>
                <div style={{ fontWeight: 'bold' }}>{a.citizen_name}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{a.citizen_national_id}</div>
              </div>,
              a.service_type,
              <Badge color={statusColor(a.status)}>{t(a.status)}</Badge>,
              a.submitted_at?.toDate?.().toLocaleDateString() || '—',
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {a.status === 'pending' || a.status === 'processing' ? (
                  <>
                    <Button
                      size="small"
                      variant="success"
                      onClick={() => handleAction(a.id, 'approve')}
                    >
                      {t('approve')}
                    </Button>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => handleAction(a.id, 'reject')}
                    >
                      {t('reject')}
                    </Button>
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => handleAction(a.id, 'request-info')}
                    >
                      {t('request_info')}
                    </Button>
                  </>
                ) : (
                  <span style={{ color: '#888', fontSize: 12 }}>
                    {a.status === 'approved' ? '✓' : '✗'} {t(a.status)}
                  </span>
                )}
              </div>,
            ])}
            emptyMessage={t('no_applications_yet')}
          />
        )}
      </Card>
    </StaffLayout>
  );
};

export default StaffQueue;