import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getApplicationByReference,
  cancelPoliceReport,
  isReportService,
} from '../../firebase/db';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/common/Layout';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';

const STATUS_META = {
  pending: {
    label: 'Reported',
    color: '#cc0000',
    bg: '#fff5f5',
    icon: '📝',
    desc: 'Your report has been received. Waiting for a unit to be dispatched.',
  },
  dispatched: {
    label: 'Unit Dispatched',
    color: '#cc0000',
    bg: '#fff5f5',
    icon: '🚨',
    desc: 'A response unit is on the way to the location you reported.',
  },
  'on-scene': {
    label: 'Officers On Scene',
    color: '#cc6600',
    bg: '#fff8ee',
    icon: '🚔',
    desc: 'Officers have arrived at the location.',
  },
  completed: {
    label: 'Case Closed',
    color: '#006600',
    bg: '#f0fff4',
    icon: '✓',
    desc: 'This case has been resolved and closed.',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#666',
    bg: '#f5f5f5',
    icon: '✕',
    desc: 'This report was cancelled.',
  },
};

const PoliceCaseTracker = () => {
  const { reference } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const app = await getApplicationByReference(reference);
        if (!app) {
          setNotFound(true);
        } else if (!isReportService(app.service_type)) {
          navigate(`/certificate/${reference}`, { replace: true });
          return;
        } else {
          setApplication(app);
        }
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reference, navigate]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setMessage('Please enter a reason for cancelling.');
      return;
    }
    try {
      await cancelPoliceReport(application.id, user.uid, cancelReason.trim());
      setMessage('Report cancelled.');
      setShowCancel(false);
      const refreshed = await getApplicationByReference(reference);
      setApplication(refreshed);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <Layout title="Case Tracker">
        <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
      </Layout>
    );
  }

  if (notFound || !application) {
    return (
      <Layout title="Case Tracker">
        <Card>
          <div style={{ textAlign: 'center', padding: 30 }}>
            <h2 style={{ color: '#cc0000' }}>Case not found</h2>
            <p style={{ color: '#666' }}>Reference: {reference}</p>
            <Link to="/police" style={{ color: '#0066cc' }}>← Back to Police Services</Link>
          </div>
        </Card>
      </Layout>
    );
  }

  const status = application.status || 'pending';
  const meta = STATUS_META[status] || STATUS_META.pending;
  const data = application.application_data || {};
  const caseNumber = application.assigned_case_number || application.application_reference || '—';
  const canCancel = status === 'pending' || status === 'dispatched';

  const submittedAt = application.submitted_at?.toDate?.();
  const dispatchedAt = application.dispatched_at?.toDate?.();
  const respondedAt = application.responded_at?.toDate?.();
  const closedAt = application.closed_at?.toDate?.();

  const timeline = [
    { key: 'pending', label: 'Report submitted', at: submittedAt },
    { key: 'dispatched', label: 'Unit dispatched', at: dispatchedAt },
    { key: 'on-scene', label: 'Officers on scene', at: respondedAt },
    { key: 'completed', label: 'Case closed', at: closedAt },
  ];

  return (
    <Layout title="Case Tracker">
      {message && (
        <Alert
          type={message.toLowerCase().includes('error') ? 'error' : 'success'}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      {status !== 'completed' && status !== 'cancelled' && (
        <div style={{
          background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}dd 100%)`,
          color: 'white',
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>{meta.icon}</div>
          <h2 style={{ margin: 0, fontSize: 22 }}>{meta.label}</h2>
          <p style={{ margin: '8px 0 0 0', opacity: 0.95, fontSize: 14 }}>{meta.desc}</p>
          <p style={{ margin: '12px 0 0 0', fontSize: 13, opacity: 0.9 }}>
            If the situation is still dangerous, call <strong>112</strong> immediately.
          </p>
        </div>
      )}

      {status === 'completed' && (
        <div style={{
          background: 'linear-gradient(135deg, #006600 0%, #008800 100%)',
          color: 'white',
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>✓</div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Case Closed</h2>
          <p style={{ margin: '8px 0 0 0', opacity: 0.95, fontSize: 14 }}>{meta.desc}</p>
        </div>
      )}

      {status === 'cancelled' && (
        <div style={{
          background: '#f5f5f5',
          border: '1px solid #ddd',
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>✕</div>
          <h2 style={{ margin: 0, fontSize: 22, color: '#666' }}>Cancelled</h2>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: 14 }}>{meta.desc}</p>
        </div>
      )}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={mini}>Report Type</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#003366' }}>
              {application.service_type}
            </div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
              Reported:{' '}
              {submittedAt?.toLocaleString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              }) || '—'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={mini}>Case Number</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#003366', fontFamily: 'monospace' }}>
              {caseNumber}
            </div>
            <div style={{
              display: 'inline-block',
              marginTop: 6,
              background: meta.bg,
              color: meta.color,
              border: `1px solid ${meta.color}`,
              padding: '4px 12px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 'bold',
            }}>
              {meta.label.toUpperCase()}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ marginTop: 20 }}>
        <Card title="Case Progress">
          {timeline.map((step, i) => {
            const done = !!step.at;
            const active = status === step.key;
            return (
              <div key={step.key} style={{
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
                marginBottom: 14,
                opacity: done || active ? 1 : 0.4,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: done ? meta.color : '#ddd',
                  color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: 14, flexShrink: 0,
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: done ? '#003366' : '#888', fontSize: 14 }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    {step.at
                      ? step.at.toLocaleString('en-GB', {
                          day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : 'Not yet'}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      <div style={{ marginTop: 20 }}>
        <Card title="Details You Submitted">
          <Row label="Location" value={data.location} />
          {data.crime_type && <Row label="Crime Type" value={data.crime_type} />}
          {data.cybercrime_type && <Row label="Cybercrime Type" value={data.cybercrime_type} />}
          {data.platform && <Row label="Platform" value={data.platform} />}
          {data.accident_date && <Row label="Date/Time" value={data.accident_date} />}
          {data.vehicles_involved && <Row label="Vehicles" value={data.vehicles_involved} />}
          {data.injuries && <Row label="Injuries" value={data.injuries} />}
          {data.financial_loss && <Row label="Financial Loss" value={data.financial_loss} />}
          <Row label="Description" value={data.description} />
        </Card>
      </div>

      {(application.notes || application.closure_notes) && (
        <div style={{ marginTop: 20 }}>
          <Card title="Updates from LMPS">
            {application.notes && (
              <div style={{ marginBottom: 10 }}>
                <div style={mini}>Progress Note</div>
                <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#333' }}>
                  {application.notes}
                </p>
              </div>
            )}
            {application.closure_notes && (
              <div>
                <div style={mini}>Resolution</div>
                <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#333' }}>
                  {application.closure_notes}
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {canCancel && !showCancel && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => setShowCancel(true)}
            style={{
              background: 'white',
              color: '#cc0000',
              border: '1px solid #cc0000',
              padding: '10px 20px',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Cancel this report
          </button>
        </div>
      )}

      {showCancel && (
        <div style={{ marginTop: 20 }}>
          <Card title="Cancel report">
            <p style={{ marginTop: 0, fontSize: 14, color: '#666' }}>
              If the situation has been resolved or you filed this by mistake, you can cancel it.
              The LMPS will be notified.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Reason for cancelling..."
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #ccc',
                borderRadius: 6,
                fontSize: 14,
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={handleCancel}
                style={{
                  background: '#cc0000',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Confirm cancellation
              </button>
              <button
                onClick={() => { setShowCancel(false); setCancelReason(''); }}
                style={{
                  background: 'white',
                  color: '#333',
                  border: '1px solid #ccc',
                  padding: '10px 20px',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Keep report
              </button>
            </div>
          </Card>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <Link to="/police" style={{ color: '#0066cc', fontSize: 14 }}>
          ← Back to Police Services
        </Link>
      </div>
    </Layout>
  );
};

const Row = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, gap: 12 }}>
    <span style={{ color: '#666', flexShrink: 0 }}>{label}:</span>
    <span style={{ fontWeight: 'bold', color: '#003366', textAlign: 'right' }}>{value || '—'}</span>
  </div>
);

const mini = { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 };

export default PoliceCaseTracker;