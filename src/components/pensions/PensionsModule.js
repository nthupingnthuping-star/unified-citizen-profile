import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { submitApplication, getMyApplications, DEPARTMENTS } from '../../firebase/db';
import { calculateAge, checkEligibility } from '../../firebase/eligibility';
import Layout from '../common/Layout';
import Card from '../common/Card';
import Button from '../common/Button';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';
import VerifiedGuard from '../citizen/VerifiedGuard';

const PensionsModule = () => {
  const { profile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [oldAgeForm, setOldAgeForm] = useState({ bank_account: '', has_bank_statement: false });
  const [disabilityForm, setDisabilityForm] = useState({ disability_type: '', bank_account: '', has_medical_report: false });

  const age = calculateAge(profile?.date_of_birth);
  const oldAgeEligibility = checkEligibility('OLD_AGE_PENSION', profile?.date_of_birth);

  const fetchApplications = async () => {
    if (!profile) return;
    try {
      const apps = await getMyApplications(profile.uid);
      setApplications(apps.filter((a) => a.department_id === DEPARTMENTS.PENSIONS));
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
        department_id: DEPARTMENTS.PENSIONS,
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
    <VerifiedGuard serviceName="Pension Services">
      <Layout title="Pensions Department">
        <Alert type="info">
          Your <strong>identity and age</strong> are verified from Home Affairs.
        </Alert>

        <div style={{ marginBottom: 20 }}>
          <button style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>My Applications</button>
          <button style={tabStyle('oldage')} onClick={() => setActiveTab('oldage')}>Old Age Pension</button>
          <button style={tabStyle('disability')} onClick={() => setActiveTab('disability')}>Disability Grant</button>
        </div>

        {message && (
          <Alert type={message.startsWith('✓') ? 'success' : 'error'} onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}

        {activeTab === 'dashboard' && (
          <Card title="My Pension Applications">
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

        {activeTab === 'oldage' && (
          <Card title="Apply for Old Age Pension">
            <p style={{ color: '#555', marginTop: 0 }}>
              Available to citizens aged <strong>65 years or older</strong>.
              {age !== null && <> Your current age: <strong>{age}</strong>.</>}
            </p>

            {!oldAgeEligibility.eligible ? (
              <Alert type="warning">{oldAgeEligibility.message}</Alert>
            ) : (
              <>
                <Alert type="success">{oldAgeEligibility.message}</Alert>
                <form onSubmit={(e) => { e.preventDefault(); submit('Old Age Pension', oldAgeForm); }}>
                  <div style={{ marginBottom: 15 }}>
                    <label style={labelStyle}>Bank Account Number *</label>
                    <input type="text" value={oldAgeForm.bank_account}
                      onChange={(e) => setOldAgeForm({ ...oldAgeForm, bank_account: e.target.value })}
                      required style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label style={checkboxStyle}>
                      <input type="checkbox" checked={oldAgeForm.has_bank_statement}
                        onChange={(e) => setOldAgeForm({ ...oldAgeForm, has_bank_statement: e.target.checked })} />
                      I have a bank statement as proof
                    </label>
                  </div>
                  <Button type="submit" disabled={loading} fullWidth>
                    {loading ? 'Submitting...' : 'Apply for Old Age Pension'}
                  </Button>
                </form>
              </>
            )}
          </Card>
        )}

        {activeTab === 'disability' && (
          <Card title="Apply for Disability Grant">
            <form onSubmit={(e) => { e.preventDefault(); submit('Disability Grant', disabilityForm); }}>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Disability Type *</label>
                <input type="text" value={disabilityForm.disability_type}
                  onChange={(e) => setDisabilityForm({ ...disabilityForm, disability_type: e.target.value })}
                  required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Bank Account *</label>
                <input type="text" value={disabilityForm.bank_account}
                  onChange={(e) => setDisabilityForm({ ...disabilityForm, bank_account: e.target.value })}
                  required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={disabilityForm.has_medical_report}
                    onChange={(e) => setDisabilityForm({ ...disabilityForm, has_medical_report: e.target.checked })} />
                  I have a medical report
                </label>
              </div>
              <Button type="submit" disabled={loading} fullWidth>
                {loading ? 'Submitting...' : 'Apply for Disability Grant'}
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

export default PensionsModule;