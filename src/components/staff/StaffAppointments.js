import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDepartmentAppointments, DEPARTMENT_NAMES } from '../../firebase/db';
import StaffLayout from '../common/StaffLayout';
import Card from '../common/Card';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';

const StaffAppointments = () => {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!profile?.department_id) return;
      try {
        const appts = await getDepartmentAppointments(profile.department_id);
        setAppointments(appts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile]);

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
  };

  return (
    <StaffLayout title="📅 Upcoming Appointments">
      <Alert type="info">
        Upcoming appointments booked at <strong>{DEPARTMENT_NAMES[profile?.department_id]}</strong>.
        Citizens will arrive with their National ID and required documents.
      </Alert>

      <Card title="Appointment Schedule" style={{ marginTop: 20 }}>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <Table
            headers={['Date', 'Time', 'Citizen', 'National ID', 'Service', 'Branch', 'Status']}
            rows={appointments.map((a) => [
              formatDate(a.date),
              a.time_slot,
              a.citizen_name,
              a.citizen_national_id,
              a.service_type,
              a.branch,
              <Badge color="yellow">{a.status}</Badge>,
            ])}
            emptyMessage="No upcoming appointments."
          />
        )}
      </Card>
    </StaffLayout>
  );
};

export default StaffAppointments;