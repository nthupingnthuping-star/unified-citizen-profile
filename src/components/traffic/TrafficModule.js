import { useState, useEffect } from 'react';
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

const TrafficModule = () => {
  const { profile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [learnerForm, setLearnerForm] = useState({ vehicle_type: 'standard', has_eye_test: false, has_photos: false });
  const [licenseForm, setLicenseForm] = useState({ license_code: '', has_learner: false, has_certificate: false, transmission_type: 'manual' });
  const [vehicleForm, setVehicleForm] = useState({ plate_number: '', make: '', model: '', year: '', chassis_number: '', has_customs: false, has_vat: false });

  const age = calculateAge(profile?.date_of_birth);
  const learnerEligibilityKey = learnerForm.vehicle_type === 'motorcycle'
    ? 'LEARNER_LICENSE_MOTORCYCLE'
    : 'LEARNER_LICENSE_STANDARD';
  const learnerEligibility = checkEligibility(learnerEligibilityKey, profile?.date_of_birth);

  const fetchApplications = async () => {
    if (!profile) return;
    try {
      const apps = await getMyApplications(profile.uid);
      setApplications(apps.filter((a) => a.department_id === DEPARTMENTS.TRAFFIC));
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
        department_id: DEPARTMENTS.TRAFFIC,
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
    border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', marginRight: 10, marginBottom: 10,
  });

  return (
    <VerifiedGuard serviceName="Traffic Department">
      <Layout title="🚗 Department of Traffic and Transport">
        <Alert type="info">
          Your citizenship is confirmed from <strong>Home Affairs</strong>.
          Need to visit in person (roadworthy test, driving exam)? Book an appointment from the sidebar.
        </Alert>

        <div style={{ marginBottom: 20 }}>
          <button style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>My Applications</button>
          <button style={tabStyle('learner')} onClick={() => setActiveTab('learner')}>Learner License</button>
          <button style={tabStyle('license')} onClick={() => setActiveTab('license')}>Driver's License</button>
          <button style={tabStyle('vehicle')} onClick={() => setActiveTab('vehicle')}>Vehicle Registration</button>
        </div>

        {message && (
          <Alert type={message.startsWith('✓') ? 'success' : 'error'} onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}

        {activeTab === 'dashboard' && (
          <Card title="My Traffic Applications">
            <Table
              headers={['Reference', 'Service', 'Status', 'Submitted']}
              rows={applications.map((a) => [
                a.application_reference,
                a.service_type,
                <Badge color={statusColor(a.status)}>{a.status}</Badge>,
                a.submitted_at?.toDate?.().toLocaleDateString() || '—',
              ])}
              emptyMessage="No applications yet."
            />
          </Card>
        )}

        {activeTab === 'learner' && (
          <Card title="Apply for Learner's License (Form T.C. 14)">
            <p style={{ color: '#555', marginTop: 0 }}>
              Minimum age: <strong>16 (motorcycle)</strong> / <strong>18 (standard car)</strong>.
              {age !== null && <> Your current age: <strong>{age}</strong>.</>}
            </p>

            <form onSubmit={(e) => { e.preventDefault(); submit('Learner License', learnerForm); }}>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Vehicle Type</label>
                <select value={learnerForm.vehicle_type}
                  onChange={(e) => setLearnerForm({ ...learnerForm, vehicle_type: e.target.value })}
                  style={inputStyle}>
                  <option value="standard">Standard Car (18+)</option>
                  <option value="motorcycle">Motorcycle (16+)</option>
                </select>
              </div>

              {!learnerEligibility.eligible ? (
                <Alert type="warning">{learnerEligibility.message}</Alert>
              ) : (
                <Alert type="success">{learnerEligibility.message}</Alert>
              )}

              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={learnerForm.has_eye_test}
                    onChange={(e) => setLearnerForm({ ...learnerForm, has_eye_test: e.target.checked })} />
                  I have a medical eye test certificate
                </label>
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={learnerForm.has_photos}
                    onChange={(e) => setLearnerForm({ ...learnerForm, has_photos: e.target.checked })} />
                  I have 2 passport-size photos
                </label>
              </div>

              <Button type="submit" disabled={loading || !learnerEligibility.eligible} fullWidth>
                {loading ? 'Submitting...' : 'Apply for Learner License'}
              </Button>
            </form>
          </Card>
        )}

        {activeTab === 'license' && (
          <Card title="Apply for Permanent Driver's License">
            <form onSubmit={(e) => { e.preventDefault(); submit('Permanent Driver License', licenseForm); }}>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>License Code *</label>
                <input type="text" value={licenseForm.license_code}
                  onChange={(e) => setLicenseForm({ ...licenseForm, license_code: e.target.value })}
                  required placeholder="e.g. B, C1, EB" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Transmission</label>
                <select value={licenseForm.transmission_type}
                  onChange={(e) => setLicenseForm({ ...licenseForm, transmission_type: e.target.value })}
                  style={inputStyle}>
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={licenseForm.has_learner}
                    onChange={(e) => setLicenseForm({ ...licenseForm, has_learner: e.target.checked })} />
                  I have a valid Learner License
                </label>
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={licenseForm.has_certificate}
                    onChange={(e) => setLicenseForm({ ...licenseForm, has_certificate: e.target.checked })} />
                  I have a Certificate of Competence
                </label>
              </div>
              <Button type="submit" disabled={loading} fullWidth>
                {loading ? 'Submitting...' : 'Apply for Driver License'}
              </Button>
            </form>
          </Card>
        )}

        {activeTab === 'vehicle' && (
          <Card title="Register New or Imported Vehicle">
            <form onSubmit={(e) => { e.preventDefault(); submit('Vehicle Registration', vehicleForm); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
                <div>
                  <label style={labelStyle}>Plate Number *</label>
                  <input type="text" value={vehicleForm.plate_number}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })}
                    required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Year *</label>
                  <input type="number" value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                    required style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
                <div>
                  <label style={labelStyle}>Make *</label>
                  <input type="text" value={vehicleForm.make}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                    required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Model *</label>
                  <input type="text" value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    required style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Chassis Number *</label>
                <input type="text" value={vehicleForm.chassis_number}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, chassis_number: e.target.value })}
                  required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={vehicleForm.has_customs}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, has_customs: e.target.checked })} />
                  I have customs clearance (for imports)
                </label>
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={checkboxStyle}>
                  <input type="checkbox" checked={vehicleForm.has_vat}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, has_vat: e.target.checked })} />
                  I have VAT clearance from RSL
                </label>
              </div>
              <Button type="submit" disabled={loading} fullWidth>
                {loading ? 'Submitting...' : 'Register Vehicle'}
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

export default TrafficModule;