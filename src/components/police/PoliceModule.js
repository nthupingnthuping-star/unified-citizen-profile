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

const PoliceModule = () => {
  const { profile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [clearanceForm, setClearanceForm] = useState({
    purpose: '', destination_country: '', has_photos: false, has_id_copy: false,
  });
  const [crimeForm, setCrimeForm] = useState({
    crime_type: '', location: '', date_of_incident: '', description: '', has_evidence: false,
  });

  const fetchApplications = async () => {
    if (!profile) return;
    try {
      const apps = await getMyApplications(profile.uid);
      setApplications(apps.filter((a) => a.department_id === DEPARTMENTS.POLICE));
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
        department_id: DEPARTMENTS.POLICE,
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
    <VerifiedGuard serviceName="Police Service">
      <Layout title="Lesotho Mounted Police Service">
        <Alert type="info">
          All services require a <strong>Home Affairs verified identity</strong>.
        </Alert>

        <div style={{ marginBottom: 20 }}>
          <button style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>My Applications</button>
          <button style={tabStyle('clearance')} onClick={() => setActiveTab('clearance')}>Police Clearance</button>
          <button style={tabStyle('crime')} onClick={() => setActiveTab('crime')}>Report a Crime</button>
        </div>

        {message && (
          <Alert type={message.startsWith('✓') ? 'success' : 'error'} onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}

        {activeTab === 'dashboard' && (
          <Card title="My Police Applications">
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

        {activeTab === 'clearance' && (
          <Card title="Apply for Police Clearance Certificate">
            <p style={{ color: '#555', marginTop: 0 }}>
              Processing time: ~3 weeks. Fee: M150–M250.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); submit('Police Clearance Certificate', clearanceForm); }}>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Purpose *</label>
                <input type="text" value={clearanceForm.purpose}
                  onChange={(e) => setClearanceForm({ ...clearanceForm, purpose: e.target.value })}
                  required placeholder="e.g. Employment, Study abroad" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Destination Country</label>
                <input type="text" value={clearanceForm.destination_country}
                  onChange={(e) => setClearanceForm({ ...clearanceForm, destination_country: e.target.value })}
                  placeholder="e.g. South Africa, UK" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={clearanceForm.has_photos}
                    onChange={(e) => setClearanceForm({ ...clearanceForm, has_photos: e.target.checked })} />
                  I have 2 passport photos
                </label>
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={clearanceForm.has_id_copy}
                    onChange={(e) => setClearanceForm({ ...clearanceForm, has_id_copy: e.target.checked })} />
                  I have my original National ID
                </label>
              </div>
              <Button type="submit" disabled={loading} fullWidth>
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </Card>
        )}

        {activeTab === 'crime' && (
          <Card title="Report a Crime (OB Entry)">
            <Alert type="warning">
              For emergencies, call <strong>112</strong> or visit your nearest police station.
            </Alert>
            <form onSubmit={(e) => { e.preventDefault(); submit('Crime Report (OB Entry)', crimeForm); }}>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Crime Type *</label>
                <select value={crimeForm.crime_type}
                  onChange={(e) => setCrimeForm({ ...crimeForm, crime_type: e.target.value })}
                  required style={inputStyle}>
                  <option value="">-- Select --</option>
                  <option>Theft</option>
                  <option>Assault</option>
                  <option>Fraud</option>
                  <option>Domestic Violence</option>
                  <option>Robbery</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Location *</label>
                <input type="text" value={crimeForm.location}
                  onChange={(e) => setCrimeForm({ ...crimeForm, location: e.target.value })}
                  required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Date of Incident *</label>
                <input type="date" value={crimeForm.date_of_incident}
                  onChange={(e) => setCrimeForm({ ...crimeForm, date_of_incident: e.target.value })}
                  required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Description *</label>
                <textarea value={crimeForm.description}
                  onChange={(e) => setCrimeForm({ ...crimeForm, description: e.target.value })}
                  required rows={4} placeholder="Describe what happened..."
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'Arial' }} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={crimeForm.has_evidence}
                    onChange={(e) => setCrimeForm({ ...crimeForm, has_evidence: e.target.checked })} />
                  I have evidence
                </label>
              </div>
              <Button type="submit" disabled={loading} variant="danger" fullWidth>
                {loading ? 'Submitting...' : 'Report Crime'}
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

export default PoliceModule;