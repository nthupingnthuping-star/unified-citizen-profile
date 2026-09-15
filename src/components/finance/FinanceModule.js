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

const FinanceModule = () => {
  const { profile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [taxForm, setTaxForm] = useState({ business_name: '', tin: '', purpose: '', is_new_business: false });
  const [refundForm, setRefundForm] = useState({ employer: '', amount: '', has_form_p9: false });

  const fetchApplications = async () => {
    if (!profile) return;
    try {
      const apps = await getMyApplications(profile.uid);
      setApplications(apps.filter((a) => a.department_id === DEPARTMENTS.FINANCE));
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
        department_id: DEPARTMENTS.FINANCE,
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
    <VerifiedGuard serviceName="Finance / RSL">
      <Layout title="Ministry of Finance / Revenue Services Lesotho (RSL)">
        <Alert type="info">
          Your identity is auto-verified from <strong>Home Affairs</strong>. No physical ID copies needed.
        </Alert>

        <div style={{ marginBottom: 20 }}>
          <button style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>My Applications</button>
          <button style={tabStyle('tax')} onClick={() => setActiveTab('tax')}>Tax Clearance (e-TCC)</button>
          <button style={tabStyle('refund')} onClick={() => setActiveTab('refund')}>PAYE Refund</button>
        </div>

        {message && (
          <Alert type={message.startsWith('✓') ? 'success' : 'error'} onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}

        {activeTab === 'dashboard' && (
          <Card title="My RSL Applications">
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

        {activeTab === 'tax' && (
          <Card title="Apply for Tax Clearance Certificate (e-TCC)">
            <p style={{ color: '#555', marginTop: 0 }}>
              Valid for 12 months. New businesses get 14-day clearance.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); submit('Tax Clearance Certificate (e-TCC)', taxForm); }}>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Business Name *</label>
                <input type="text" value={taxForm.business_name}
                  onChange={(e) => setTaxForm({ ...taxForm, business_name: e.target.value })}
                  required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Tax Identification Number (TIN) *</label>
                <input type="text" value={taxForm.tin}
                  onChange={(e) => setTaxForm({ ...taxForm, tin: e.target.value })}
                  required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Purpose *</label>
                <input type="text" value={taxForm.purpose}
                  onChange={(e) => setTaxForm({ ...taxForm, purpose: e.target.value })}
                  required placeholder="e.g. Business loan, tender" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={taxForm.is_new_business}
                    onChange={(e) => setTaxForm({ ...taxForm, is_new_business: e.target.checked })} />
                  I am a new business
                </label>
              </div>
              <Button type="submit" disabled={loading} fullWidth>
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </Card>
        )}

        {activeTab === 'refund' && (
          <Card title="Claim PAYE Tax Refund">
            <p style={{ color: '#555', marginTop: 0 }}>
              If your employer deducted more tax than you owe.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); submit('PAYE Tax Refund', refundForm); }}>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Employer *</label>
                <input type="text" value={refundForm.employer}
                  onChange={(e) => setRefundForm({ ...refundForm, employer: e.target.value })}
                  required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Amount (Maloti) *</label>
                <input type="number" value={refundForm.amount}
                  onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                  required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={refundForm.has_form_p9}
                    onChange={(e) => setRefundForm({ ...refundForm, has_form_p9: e.target.checked })} />
                  I have Form P9 from my employer
                </label>
              </div>
              <Button type="submit" disabled={loading} fullWidth>
                {loading ? 'Submitting...' : 'Submit Refund Claim'}
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

export default FinanceModule;