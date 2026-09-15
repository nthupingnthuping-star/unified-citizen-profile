import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  bookAppointment,
  getAvailableDates,
  getSlotAvailability,
  APPOINTMENT_CAPACITY,
  BRANCHES,
  TIME_SLOTS,
  DEPARTMENT_NAMES,
  APPOINTMENT_SERVICES,
} from '../../firebase/db';
import Layout from '../common/Layout';
import Card from '../common/Card';
import Button from '../common/Button';
import Alert from '../common/Alert';

const BookAppointment = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const dates = getAvailableDates();

  const appointmentDepartments = [
    { id: 1, name: 'Home Affairs' },
    { id: 2, name: 'Traffic' },
    { id: 5, name: 'Police' },
    { id: 6, name: 'Passport' },
  ];

  const [step, setStep] = useState(1);
  const [departmentId, setDepartmentId] = useState(2);
  const [serviceValue, setServiceValue] = useState('');
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [date, setDate] = useState(dates[0]);
  const [timeSlot, setTimeSlot] = useState('');
  const [slotAvailability, setSlotAvailability] = useState({});
  const [isDayFull, setIsDayFull] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSlots, setCheckingSlots] = useState(false);
  const [message, setMessage] = useState('');

  const availableServices = APPOINTMENT_SERVICES[departmentId] || [];
  const selectedService = availableServices.find((s) => s.value === serviceValue);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (availableServices.length > 0) {
      setServiceValue(availableServices[0].value);
    }
  }, [departmentId]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!branch || !date || !departmentId) return;
      setCheckingSlots(true);
      try {
        const result = await getSlotAvailability(departmentId, branch, date);
        setSlotAvailability(result.availability);
        setIsDayFull(result.isDayFull);
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingSlots(false);
      }
    };
    loadSlots();
  }, [branch, date, departmentId]);

  const handleConfirm = async () => {
    setMessage('');
    if (!timeSlot) {
      setMessage('Please select a time slot');
      return;
    }
    if (!serviceValue) {
      setMessage('Please select a service');
      return;
    }

    setLoading(true);
    try {
      await bookAppointment({
        citizen_id: profile.uid,
        citizen_name: profile.full_name,
        citizen_national_id: profile.national_id,
        application_id: null,
        application_reference: null,
        service_type: selectedService?.label || 'Appointment',
        department_id: departmentId,
        branch,
        date,
        time_slot: timeSlot,
      });

      setMessage('✓ Appointment confirmed!');
      setTimeout(() => navigate('/appointments'), 1500);
    } catch (err) {
      setMessage(`✗ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const dateLabel = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const stepStyle = (n) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: step === n ? '#003366' : step > n ? '#006600' : '#eee',
    color: step === n || step > n ? 'white' : '#666',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 'bold',
  });

  return (
    <Layout title="📅 Book a Visit">
      <Link to="/appointments" style={{ color: '#003366', fontSize: 13 }}>
        ← Back to My Appointments
      </Link>

      <Alert type="info">
        Book an in-person visit for services that require a physical presence
        (biometrics, roadworthy tests, exams, document collection).
        Each time slot has limited capacity.
      </Alert>

      {message && (
        <Alert type={message.startsWith('✓') ? 'success' : 'error'} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20, marginBottom: 25, flexWrap: 'wrap' }}>
        <div style={stepStyle(1)}>1. Department & Service</div>
        <div style={stepStyle(2)}>2. Branch & Date</div>
        <div style={stepStyle(3)}>3. Time Slot</div>
        <div style={stepStyle(4)}>4. Confirm</div>
      </div>

      {step === 1 && (
        <Card title="Which department do you need to visit?">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
            {appointmentDepartments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setDepartmentId(dept.id)}
                style={{
                  padding: 16,
                  border: departmentId === dept.id ? '2px solid #003366' : '1px solid #ddd',
                  background: departmentId === dept.id ? '#e6f0fa' : 'white',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#003366',
                }}
              >
                {dept.name}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Which service?</label>
            <select
              value={serviceValue}
              onChange={(e) => setServiceValue(e.target.value)}
              style={inputStyle}
            >
              {availableServices.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <Button onClick={() => setStep(2)} disabled={!serviceValue} fullWidth>
            Next →
          </Button>
        </Card>
      )}

      {step === 2 && (
        <Card title="Where and when?">
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} style={inputStyle}>
              {BRANCHES.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Date (next 14 working days)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginTop: 8 }}>
              {dates.map((d) => (
                <button
                  key={d}
                  onClick={() => setDate(d)}
                  style={{
                    padding: '10px 5px',
                    border: d === date ? '2px solid #003366' : '1px solid #ddd',
                    borderRadius: 6,
                    background: d === date ? '#003366' : 'white',
                    color: d === date ? 'white' : '#333',
                    cursor: 'pointer',
                    fontSize: 12,
                    textAlign: 'center',
                  }}
                >
                  {dateLabel(d)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
              ← Back
            </Button>
            <Button onClick={() => setStep(3)} style={{ flex: 2 }}>
              Next →
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card title="What time works for you?">
          {checkingSlots ? (
            <p>Checking availability...</p>
          ) : isDayFull ? (
            <Alert type="warning">
              This branch is fully booked on this date (max {APPOINTMENT_CAPACITY.PER_DAY} per day).
              Please go back and choose another date.
            </Alert>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
              {TIME_SLOTS.map((t) => {
                const slot = slotAvailability[t] || { remaining: APPOINTMENT_CAPACITY.PER_SLOT, isFull: false };
                const isFull = slot.isFull;
                const isSelected = t === timeSlot;
                return (
                  <button
                    key={t}
                    disabled={isFull}
                    onClick={() => setTimeSlot(t)}
                    style={{
                      padding: '10px 8px',
                      border: isSelected ? '2px solid #003366' : '1px solid #ddd',
                      borderRadius: 6,
                      background: isFull ? '#eee' : isSelected ? '#003366' : 'white',
                      color: isFull ? '#999' : isSelected ? 'white' : '#333',
                      cursor: isFull ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ textDecoration: isFull ? 'line-through' : 'none' }}>{t}</div>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 'normal',
                      marginTop: 2,
                      color: isFull ? '#999' : isSelected ? '#b3d4ff' : '#666',
                    }}>
                      {isFull ? 'FULL' : `${slot.remaining} left`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>
              ← Back
            </Button>
            <Button onClick={() => setStep(4)} disabled={!timeSlot || isDayFull} style={{ flex: 2 }}>
              Next →
            </Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card title="Confirm your appointment">
          <div style={{ background: '#f9f9f9', padding: 20, borderRadius: 8, marginBottom: 20 }}>
            <p style={{ margin: '8px 0' }}>
              <strong>Department:</strong> {DEPARTMENT_NAMES[departmentId]}
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>Service:</strong> {selectedService?.label}
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>Branch:</strong> {branch}
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>Date:</strong> {dateLabel(date)}
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>Time:</strong> {timeSlot}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={() => setStep(3)} style={{ flex: 1 }}>
              ← Back
            </Button>
            <Button onClick={handleConfirm} disabled={loading} style={{ flex: 2 }}>
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </Button>
          </div>
        </Card>
      )}
    </Layout>
  );
};

const labelStyle = { fontSize: 13, color: '#333', fontWeight: 'bold' };
const inputStyle = {
  width: '100%', padding: 12, border: '1px solid #ccc',
  borderRadius: 4, fontSize: 14, marginTop: 5,
};

export default BookAppointment;