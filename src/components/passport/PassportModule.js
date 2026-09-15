import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { submitApplication, getMyApplications, DEPARTMENTS } from '../../firebase/db';
import Layout from '../common/Layout';
import Card from '../common/Card';
import Button from '../common/Button';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';
import VerifiedGuard from '../citizen/VerifiedGuard';

const PassportModule = () => {
  const { profile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [newForm, setNewForm] = useState({ passport_type: 'Ordinary', purpose: '', has_birth_certificate: false, has_photos: false });
  const [renewForm, setRenewForm] = useState({ old_passport_number: '', has_old_passport: false, has_photos: false });

  const fetchApplications = async () => {
    if (!profile) return;
    try {
      const apps = await getMyApplications(profile.uid);
      setApplications(apps.filter((a) => a.department_id === DEPARTMENTS.PASSPORT));
    } catch (err) { console.error(err); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchApplications(); }, [profile]);

  const submit = async (serviceType, data) => {
    setLoading(true); setMessage('');
    try {
      const r = await submitApplication({
        citizen_id: profile.uid,
        citizen_name: profile.full_name,
        citizen_national_id: profile.national_id,
        department_id: DEPARTMENTS.PASSPORT,
        service_type: serviceType,
        application_data: data,
      });
      setMessage(`✓ Submitted. Reference: ${r.reference}`);
      fetchApplications();
    } catch (err) { setMessage(`✗ ${err.message}`); }
    finally { setLoading(false); }
  };

  const statusColor = (s) => {
    if (s === 'approved' || s === 'completed') return 'green';
    if (s === 'rejected') return 'red';
    if (s === 'processing') return 'yellow';
    return 'gray';
  };

  const tabStyle = (tab) => ({
    padding: '12px 24px',
    background: activeTab === tab ? '#003366' : 'white',
    color: activeTab === tab ? 'white' : '#333',
    border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', marginRight: 10,
  });

  return (
    <VerifiedGuard serviceName="Passport Services">
      <Layout title="Passport and Citizenship Office">
        <Alert type="info">
          Your <strong>citizenship</strong> is auto-verified from Home Affairs.
        </Alert>

        <div style={{ marginBottom: 20 }}>
          <button style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>My Applications</button>
          <button style={tabStyle('new')} onClick={() => setActiveTab('new')}>New Passport</button>
          <button style={tabStyle('renew')} onClick={() => setActiveTab('renew')}>Renewal</button>
        </div>

        {message && (
          <Alert type={message.startsWith('✓') ? 'success' : 'error'} onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}

        {activeTab === 'dashboard' && (
          <Card title="My Passport Applications">
            <Table
              headers={['Reference', 'Service', 'Status', 'Submitted', 'Action']}
              rows={applications.map((a) => [
                a.application_reference,
                a.service_type,
                <Badge color={statusColor(a.status)}>{a.status}</Badge>,
                a.submitted_at?.toDate?.().toLocaleDateString() || '—',
                (a.status === 'approved' || a.status === 'completed') ? (
                  <Link
                    to={`/certificate/${a.application_reference}`}
                    style={{
                      color: '#003366',
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                      fontSize: 13,
                    }}
                  >
                    View Certificate
                  </Link>
                ) : (
                  <span style={{ color: '#999', fontSize: 12 }}>—</span>
                ),
              ])}
              emptyMessage="No applications yet."
            />
          </Card>
        )}

        {activeTab === 'new' && (
          <Card title="Apply for New Passport">
            <form onSubmit={(e) => { e.preventDefault(); submit('New Passport Application', newForm); }}>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Passport Type *</label>
                <select value={newForm.passport_type}
                  onChange={(e) => setNewForm({ ...newForm, passport_type: e.target.value })}
                  style={inputStyle}>
                  <option>Ordinary</option>
                  <option>Diplomatic</option>
                  <option>Service</option>
                </select>
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Purpose *</label>
                <input type="text" value={newForm.purpose}
                  onChange={(e) => setNewForm({ ...newForm, purpose: e.target.value })}
                  required placeholder="e.g. Travel, Study" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={newForm.has_birth_certificate}
                    onChange={(e) => setNewForm({ ...newForm, has_birth_certificate: e.target.checked })} />
                  I have a birth certificate
                </label>
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={newForm.has_photos}
                    onChange={(e) => setNewForm({ ...newForm, has_photos: e.target.checked })} />
                  I have passport photos
                </label>
              </div>
              <Button type="submit" disabled={loading} fullWidth>
                {loading ? 'Submitting...' : 'Apply for New Passport'}
              </Button>
            </form>
          </Card>
        )}

        {activeTab === 'renew' && (
          <Card title="Renew Passport">
            <form onSubmit={(e) => { e.preventDefault(); submit('Passport Renewal', renewForm); }}>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Old Passport Number *</label>
                <input type="text" value={renewForm.old_passport_number}
                  onChange={(e) => setRenewForm({ ...renewForm, old_passport_number: e.target.value })}
                  required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={renewForm.has_old_passport}
                    onChange={(e) => setRenewForm({ ...renewForm, has_old_passport: e.target.checked })} />
                  I have my old passport
                </label>
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={renewForm.has_photos}
                    onChange={(e) => setRenewForm({ ...renewForm, has_photos: e.target.checked })} />
                  I have new passport photos
                </label>
              </div>
              <Button type="submit" disabled={loading} fullWidth>
                {loading ? 'Submitting...' : 'Renew Passport'}
              </Button>
            </form>
          </Card>
        )}
      </Layout>
    </VerifiedGuard>
  );
};

const labelStyle = { fontSize: 13, color: '#333' };
const checkboxStyle = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 };
const inputStyle = {
  width: '100%', padding: 10, border: '1px solid #ccc',
  borderRadius: 4, marginTop: 5, fontSize: 14,
};

export default PassportModule;