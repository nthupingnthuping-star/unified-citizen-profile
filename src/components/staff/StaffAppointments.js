import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getDepartmentAppointments,
  DEPARTMENT_NAMES,
} from '../../firebase/db';
import StaffLayout from '../common/StaffLayout';
import Card from '../common/Card';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';
import '../../styles/module.css';

const BRANCH_FILTERS = [
  { key: 'all', label: 'All Branches' },
  { key: 'Maseru', label: 'Maseru' },
  { key: 'Leribe', label: 'Leribe' },
  { key: 'Berea', label: 'Berea' },
  { key: 'Mafeteng', label: 'Mafeteng' },
  { key: "Mohale's Hoek", label: "Mohale's Hoek" },
  { key: 'Butha-Buthe', label: 'Butha-Buthe' },
  { key: 'Mokhotlong', label: 'Mokhotlong' },
  { key: "Qacha's Nek", label: "Qacha's Nek" },
  { key: 'Quthing', label: 'Quthing' },
  { key: 'Thaba-Tseka', label: 'Thaba-Tseka' },
];

const StaffAppointments = () => {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [branchFilter, setBranchFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!profile?.department_id) return;
    setLoading(true);
    try {
      const data = await getDepartmentAppointments(profile.department_id);
      setAppointments(data);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [profile]);

  const filtered = appointments.filter((a) => {
    if (branchFilter === 'all') return true;
    return a.branch === branchFilter;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = filtered.filter((a) => a.date === todayStr).length;
  const upcomingCount = filtered.filter((a) => a.date > todayStr).length;

  const subTabStyle = (tab) => ({
    padding: '8px 18px',
    background: branchFilter === tab
      ? 'linear-gradient(135deg, #003366 0%, #0055aa 100%)'
      : 'white',
    color: branchFilter === tab ? 'white' : '#333',
    border: branchFilter === tab ? '1px solid transparent' : '1px solid #ddd',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: branchFilter === tab ? 'bold' : 'normal',
    boxShadow: branchFilter === tab ? '0 4px 12px rgba(0, 51, 102, 0.2)' : 'none',
    transition: 'all 0.25s ease',
    marginRight: 8,
    marginBottom: 8,
  });

  return (
    <StaffLayout title="Appointments — Staff Portal">
      <div className="module-root">
        <div className="module-header">
          <h1>Appointments</h1>
          <p>
            {DEPARTMENT_NAMES[profile?.department_id] || 'Department'} — Citizen visit schedule
          </p>
        </div>

        <Alert type="info">
          Citizens booked the following appointments at your department. Use this list to prepare for the day.
        </Alert>

        {message && (
          <Alert type="error" onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}

        {/* KPI row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 15,
          marginBottom: 20,
        }}>
          <KpiCard label="Total Booked" value={filtered.length} color="#003366" />
          <KpiCard label="Today" value={todayCount} color="#ffcc00" />
          <KpiCard label="Upcoming" value={upcomingCount} color="#006600" />
        </div>

        {/* Branch filter pills */}
        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {BRANCH_FILTERS.map((b) => (
            <button
              key={b.key}
              style={subTabStyle(b.key)}
              onClick={() => setBranchFilter(b.key)}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="module-card">
          <div className="module-section-title">
            Booked Appointments {branchFilter !== 'all' ? `— ${branchFilter}` : ''}
          </div>

          {loading ? (
            <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>
              No appointments booked in this category.
            </div>
          ) : (
            <Table
              headers={['Date', 'Time', 'Citizen', 'National ID', 'Service', 'Branch', 'Status']}
              rows={filtered.map((a) => [
                a.date
                  ? new Date(a.date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  : '—',
                a.time_slot || '—',
                a.citizen_name,
                a.citizen_national_id,
                a.service_type,
                a.branch,
                <Badge color={a.date === todayStr ? 'yellow' : 'green'}>
                  {a.date === todayStr ? 'Today' : 'Upcoming'}
                </Badge>,
              ])}
            />
          )}
        </div>
      </div>
    </StaffLayout>
  );
};

// ============================================================
// KPI CARD
// ============================================================
const KpiCard = ({ label, value, color }) => (
  <div style={{
    background: 'white',
    border: '1px solid #e0e6ef',
    borderLeft: `4px solid ${color}`,
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0, 51, 102, 0.06)',
  }}>
    <div style={{
      fontSize: 12,
      color: '#888',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: 'bold',
    }}>
      {label}
    </div>
    <div style={{ fontSize: 32, color, fontWeight: 'bold', marginTop: 8 }}>
      {value}
    </div>
  </div>
);

export default StaffAppointments;