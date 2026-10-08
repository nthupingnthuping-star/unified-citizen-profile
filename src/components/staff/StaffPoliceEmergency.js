import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPoliceEmergencyReports,
  dispatchPoliceUnit,
  markPoliceOnScene,
  closePoliceCase,
} from '../../firebase/db';
import Card from '../common/Card';
import Alert from '../common/Alert';

const PRIORITY_COLORS = {
  critical: { bg: '#cc0000', label: 'CRITICAL', sla: '30 minutes' },
  high: { bg: '#cc6600', label: 'HIGH', sla: '2 hours' },
  normal: { bg: '#0066cc', label: 'NORMAL', sla: '24 hours' },
  low: { bg: '#666', label: 'LOW', sla: '5 working days' },
};

const CARD_THEME = {
  pending: { border: '#cc0000', bg: '#fff5f5', pulse: true },
  dispatched: { border: '#cc0000', bg: '#fff5f5', pulse: true },
  'on-scene': { border: '#cc6600', bg: '#fff8ee', pulse: false },
};

const StaffPoliceEmergency = () => {
  const { profile } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPoliceEmergencyReports();
      setReports(data);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load emergency reports.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleAction = async (reportId, action, payload) => {
    try {
      if (action === 'dispatch') await dispatchPoliceUnit(reportId, profile.uid, payload);
      else if (action === 'on-scene') await markPoliceOnScene(reportId, profile.uid, payload);
      else if (action === 'close') await closePoliceCase(reportId, profile.uid, payload);
      setMessage(
        action === 'dispatch'
          ? 'Unit dispatched.'
          : action === 'on-scene'
          ? 'Marked on scene.'
          : 'Case closed.'
      );
      setSelected(null);
      load();
    } catch (err) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    }
  };

  const activeReports = reports.filter((r) => r.status === 'pending' || r.status === 'dispatched');
  const onSceneReports = reports.filter((r) => r.status === 'on-scene');

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)',
        color: 'white',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 8px 24px rgba(204, 0, 0, 0.25)',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>🚨 Active Emergency Reports</h2>
          <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: 13 }}>
            Respond to life-threatening incidents. SLA for critical reports: 30 minutes.
          </p>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '10px 20px',
          borderRadius: 6,
          fontSize: 28,
          fontWeight: 'bold',
        }}>
          {activeReports.length}
        </div>
      </div>

      {message && (
        <Alert
          type={message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') ? 'error' : 'success'}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      {loading ? (
        <Card><div style={{ padding: 30, textAlign: 'center' }}>Loading...</div></Card>
      ) : reports.length === 0 ? (
        <Card>
          <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <h3 style={{ color: '#006600', marginTop: 0 }}>No active emergencies</h3>
            <p>All reports have been resolved.</p>
          </div>
        </Card>
      ) : (
        <>
          {activeReports.length > 0 && (
            <>
              <div style={{
                fontSize: 12,
                color: '#cc0000',
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontWeight: 'bold',
                marginBottom: 10,
              }}>
                Needs Response ({activeReports.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {activeReports.map((r) => (
                  <EmergencyCard key={r.id} report={r} onOpen={() => setSelected(r)} />
                ))}
              </div>
            </>
          )}

          {onSceneReports.length > 0 && (
            <>
              <div style={{
                fontSize: 12,
                color: '#cc6600',
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontWeight: 'bold',
                marginBottom: 10,
              }}>
                Officers On Scene ({onSceneReports.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {onSceneReports.map((r) => (
                  <EmergencyCard key={r.id} report={r} onOpen={() => setSelected(r)} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {selected && (
        <ActionModal
          report={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
};

const EmergencyCard = ({ report, onOpen }) => {
  const priority = PRIORITY_COLORS[report.priority] || PRIORITY_COLORS.normal;
  const theme = CARD_THEME[report.status] || CARD_THEME.pending;
  const data = report.application_data || {};
  const submittedAt = report.submitted_at?.toDate?.() || new Date();
  const caseNumber = report.assigned_case_number || report.application_reference || '—';

  return (
    <div style={{
      background: 'white',
      border: `2px solid ${theme.border}`,
      borderLeft: `8px solid ${theme.border}`,
      borderRadius: 8,
      padding: 16,
      boxShadow: theme.pulse ? '0 4px 14px rgba(204, 0, 0, 0.10)' : '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 20 }}>{report.status === 'on-scene' ? '🚔' : '🚨'}</span>
            <span style={{
              background: priority.bg,
              color: 'white',
              padding: '3px 10px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 'bold',
              letterSpacing: 1,
            }}>
              {priority.label}
            </span>
            <span style={{
              background: theme.bg,
              color: theme.border,
              padding: '3px 10px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 'bold',
              border: `1px solid ${theme.border}`,
            }}>
              {(report.status || '').replace('-', ' ').toUpperCase()}
            </span>
          </div>
          <h3 style={{ margin: '8px 0 4px 0', color: '#003366', fontSize: 18 }}>
            {report.service_type}
          </h3>
          <div style={{ fontSize: 13, color: '#666' }}>
            {report.citizen_name} · {report.citizen_national_id}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            Case Number
          </div>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#003366', fontFamily: 'monospace' }}>
            {caseNumber}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
        fontSize: 13,
        marginBottom: 12,
      }}>
        {data.location && <Field label="Location" value={data.location} />}
        {data.crime_type && <Field label="Crime Type" value={data.crime_type} />}
        {data.cybercrime_type && <Field label="Type" value={data.cybercrime_type} />}
        {data.accident_date && <Field label="When" value={data.accident_date} />}
        <Field
          label="Reported"
          value={submittedAt.toLocaleString('en-GB', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        />
        <Field label="SLA Target" value={priority.sla} />
      </div>

      {data.description && (
        <div style={{
          background: theme.bg,
          border: `1px solid ${theme.border}33`,
          borderRadius: 4,
          padding: 10,
          fontSize: 13,
          color: '#444',
          marginBottom: 12,
        }}>
          <strong>Description: </strong>
          {data.description}
        </div>
      )}

      <button
        onClick={onOpen}
        style={{
          background: theme.border,
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        {report.status === 'on-scene' ? 'Close Case →' : 'Respond →'}
      </button>
    </div>
  );
};

const Field = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
      {label}
    </div>
    <div style={{ color: '#003366', fontWeight: 'bold', marginTop: 2 }}>
      {value || '—'}
    </div>
  </div>
);

const ActionModal = ({ report, onClose, onAction }) => {
  const [notes, setNotes] = useState('');
  const data = report.application_data || {};
  const priority = PRIORITY_COLORS[report.priority] || PRIORITY_COLORS.normal;
  const caseNumber = report.assigned_case_number || report.application_reference || '—';

  const canDispatch = report.status === 'pending';
  const canMarkOnScene = report.status === 'dispatched';
  const canClose = report.status === 'dispatched' || report.status === 'on-scene';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 1000, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 12, maxWidth: 680,
        width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)',
          color: 'white',
          padding: 16,
          borderRadius: 8,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: 1 }}>EMERGENCY RESPONSE</div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{report.service_type}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', color: 'white',
              border: '1px solid white', borderRadius: 4,
              padding: '6px 12px', cursor: 'pointer', fontSize: 13,
            }}
          >
            Close
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}>
          <InfoBlock label="Case Number" value={caseNumber} mono />
          <InfoBlock label="Priority" value={priority.label} />
          <InfoBlock label="Status" value={(report.status || 'pending').replace('-', ' ')} />
          <InfoBlock label="SLA Target" value={priority.sla} />
        </div>

        <Section title="Reporter">
          <Row label="Full Name" value={report.citizen_name} />
          <Row label="National ID" value={report.citizen_national_id} />
        </Section>

        <Section title="Incident Details">
          {data.location && <Row label="Location" value={data.location} />}
          {data.crime_type && <Row label="Crime Type" value={data.crime_type} />}
          {data.cybercrime_type && <Row label="Cybercrime Type" value={data.cybercrime_type} />}
          {data.platform && <Row label="Platform" value={data.platform} />}
          {data.accident_date && <Row label="Date/Time" value={data.accident_date} />}
          {data.vehicles_involved && <Row label="Vehicles" value={data.vehicles_involved} />}
          {data.injuries && <Row label="Injuries" value={data.injuries} />}
          {data.witnesses && <Row label="Witnesses" value={data.witnesses} />}
          {data.financial_loss && <Row label="Financial Loss" value={data.financial_loss} />}
        </Section>

        <Section title="Description">
          <p style={{ fontSize: 13, color: '#333', margin: 0, lineHeight: 1.5 }}>
            {data.description || '—'}
          </p>
        </Section>

        <Section title="Response Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Unit assigned, estimated ETA, on-scene observations, resolution..."
            style={{
              width: '100%', padding: 10, border: '1px solid #ccc',
              borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </Section>

        <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {canDispatch && (
            <button onClick={() => onAction(report.id, 'dispatch', notes)} style={btnRed}>
              🚨 Dispatch Unit
            </button>
          )}
          {canMarkOnScene && (
            <button onClick={() => onAction(report.id, 'on-scene', notes)} style={btnOrange}>
              🚔 Mark On Scene
            </button>
          )}
          {canClose && (
            <button
              onClick={() => {
                if (!notes.trim() && !window.confirm('Close case without resolution notes?')) return;
                onAction(report.id, 'close', notes);
              }}
              style={btnGreen}
            >
              ✓ Close Case
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{
      fontSize: 11, color: '#888', textTransform: 'uppercase',
      letterSpacing: 1, fontWeight: 'bold', marginBottom: 8,
    }}>
      {title}
    </div>
    <div style={{ background: '#f9f9f9', borderRadius: 6, padding: 12 }}>{children}</div>
  </div>
);

const Row = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
    <span style={{ color: '#666' }}>{label}:</span>
    <span style={{ fontWeight: 'bold', color: '#003366', textAlign: 'right', maxWidth: '65%' }}>
      {value || '—'}
    </span>
  </div>
);

const InfoBlock = ({ label, value, mono }) => (
  <div style={{ background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 6, padding: 10 }}>
    <div style={{
      fontSize: 10, color: '#888', textTransform: 'uppercase',
      letterSpacing: 1, fontWeight: 'bold', marginBottom: 4,
    }}>
      {label}
    </div>
    <div style={{
      fontSize: 14, fontWeight: 'bold', color: '#003366',
      fontFamily: mono ? 'monospace' : 'inherit', letterSpacing: mono ? 1 : 0,
    }}>
      {value}
    </div>
  </div>
);

const btnRed = { background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(204,0,0,0.25)' };
const btnOrange = { background: 'linear-gradient(135deg, #cc6600 0%, #e68a00 100%)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(204,102,0,0.25)' };
const btnGreen = { background: 'linear-gradient(135deg, #006600 0%, #008800 100%)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,102,0,0.25)' };

export default StaffPoliceEmergency;