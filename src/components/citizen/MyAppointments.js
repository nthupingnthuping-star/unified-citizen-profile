import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMyAppointments, cancelAppointment, DEPARTMENT_NAMES } from '../../firebase/db';
import Layout from '../common/Layout';
import Card from '../common/Card';
import Button from '../common/Button';
import Alert from '../common/Alert';
import Badge from '../common/Badge';

const MyAppointments = () => {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!profile) return;
      try {
        const appts = await getMyAppointments(profile.uid);
        setAppointments(appts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile, refreshKey]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await cancelAppointment(id);
      setMessage('✓ Appointment cancelled');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setMessage(`✗ ${err.message}`);
    }
  };

  const statusColor = (s) => {
    if (s === 'completed') return 'green';
    if (s === 'cancelled') return 'red';
    return 'yellow';
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  return (
    <Layout title="📅 My Appointments">
      <Alert type="info">
        These are your booked visits to government offices. Arrive 15 minutes early with your National ID.
      </Alert>

      {message && (
        <Alert type={message.startsWith('✓') ? 'success' : 'error'} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      <div style={{ marginBottom: 20 }}>
        <Link to="/appointments/book">
          <Button size="large">➕ Book a New Visit</Button>
        </Link>
      </div>

      {loading ? (
        <Card><p>Loading appointments...</p></Card>
      ) : appointments.length === 0 ? (
        <Card>
          <p style={{ color: '#666' }}>You have no appointments booked yet.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 15 }}>
          {appointments.map((appt) => (
            <Card key={appt.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 15 }}>
                <div style={{ flex: 1, minWidth: 250 }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#003366' }}>
                    {appt.service_type}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14, color: '#555' }}>
                    <div><strong>Department:</strong> {DEPARTMENT_NAMES[appt.department_id]}</div>
                    <div><strong>Branch:</strong> {appt.branch}</div>
                    <div><strong>Date:</strong> {formatDate(appt.date)}</div>
                    <div><strong>Time:</strong> {appt.time_slot}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge color={statusColor(appt.status)}>{appt.status}</Badge>
                  {appt.status === 'booked' && (
                    <div style={{ marginTop: 10 }}>
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => handleCancel(appt.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default MyAppointments;