import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPoliceDocumentApplications,
  updateApplicationStatus,
} from '../../firebase/db';
import Card from '../common/Card';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';

const STATUS_TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const StaffPoliceDocuments = () => {
  const { profile } = useAuth();
  const [apps, setApps] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPoliceDocumentApplications(activeTab);
      setApps(data);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [activeTab]);

  const handleAction = async (id, action, reason) => {
    try {
      await updateApplicationStatus(id, action, profile.uid, reason || '');
      setMessage(
        action === 'request-info'
          ? 'Application sent back for more information.'
          : `Application ${action === 'approve' ? 'approved' : 'rejected'}.`
      );
      setSelected(null);
      load();
    } catch (err) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    }
  };

  const statusColor = (s) => {
    if (s === 'approved' || s === 'completed') return 'green';
    if (s === 'rejected') return 'red';
    if (s === 'processing') return 'yellow';
    return 'gray';
  };

  const subTabStyle = (tab) => ({
    padding: '8px 16px',
    background: activeTab === tab ? '#0055aa' : 'white',
    color: activeTab === tab ? 'white' : '#333',
    border: '1px solid #ddd',
    borderRadius: 999,
    cursor: 'pointer',
    marginRight: 8,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: activeTab === tab ? 'bold' : 'normal',
    transition: 'all 0.25s ease',
  });

  return (
    <div>
      {message && (
        <Alert
          type={message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') ? 'error' : 'success'}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
        {STATUS_TABS.map((t) => (
          <button key={t.key} style={subTabStyle(t.key)} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="module-card">
        <div className="module-section-title">Police Clearance Applications — {activeTab}</div>

        {loading ? (
          <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
        ) : apps.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>
            No applications in this category.
          </div>
        ) : (
          <Table
            headers={['Reference', 'Citizen', 'Purpose', 'Submitted', 'Status', 'Action']}
            rows={apps.map((a) => [
              a.application_reference,
              a.citizen_name,
              a.application_data?.purpose || '—',
              a.submitted_at?.toDate?.().toLocaleDateString() || '—',
              <Badge color={statusColor(a.status)}>{a.status}</Badge>,
              <button
                onClick={() => setSelected(a)}
                style={{
                  background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
                  color: 'white', border: 'none',
                  padding: '6px 14px', borderRadius: 999, fontSize: 12,
                  fontWeight: 'bold', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 51, 102, 0.2)',
                }}
              >
                Review
              </button>,
            ])}
          />
        )}
      </div>

      {selected && (
        <ReviewModal
          application={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
};

const ReviewModal = ({ application, onClose, onAction }) => {
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [pendingAction, setPendingAction] = useState('');

  const data = application.application_data || {};
  const uploads = data.documents_uploaded || {};
  const legacyDeclared = data.documents_declared || {};

  const askReason = (action) => {
    setPendingAction(action);
    setShowReason(true);
  };

  const confirm = () => {
    if (!reason.trim()) return alert('Please enter a reason.');
    onAction(application.id, pendingAction, reason.trim());
  };

  const hasUploads = Object.keys(uploads).length > 0 && Object.values(uploads).some(Boolean);
  const hasLegacyDeclared = Object.keys(legacyDeclared).length > 0 && Object.values(legacyDeclared).some(Boolean);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 1000, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 12, maxWidth: 640,
        width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#003366', fontSize: 20 }}>
            Police Clearance {application.application_reference}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <Section title="Citizen">
          <Field label="Full Name" value={application.citizen_name} />
          <Field label="National ID" value={application.citizen_national_id} />
        </Section>

        <Section title="Application">
          <Field label="Purpose" value={data.purpose} />
          <Field label="Destination" value={data.destination_country} />
          <Field label="Period of Stay" value={data.period_of_stay} />
          <Field label="Collection Branch" value={data.collection_branch} />
          <Field label="Payment Reference" value={data.payment?.reference} />
          <Field label="Fee" value={data.fees?.total ? `M ${data.fees.total}` : '—'} />
        </Section>

        {hasUploads && (
          <Section title="Documents Uploaded by Citizen">
            {uploads.national_id && <DocumentLink label="National ID" url={uploads.national_id} />}
            {uploads.fingerprints && <DocumentLink label="Fingerprint Record" url={uploads.fingerprints} />}
          </Section>
        )}

        {hasLegacyDeclared && !hasUploads && (
          <Section title="Documents Declared (legacy)">
            <Field label="Passport Photos" value={legacyDeclared.photos ? 'Yes' : 'No'} />
            <Field label="National ID" value={legacyDeclared.national_id ? 'Yes' : 'No'} />
            <Field label="Fingerprints" value={legacyDeclared.fingerprints ? 'Yes' : 'No'} />
          </Section>
        )}

        {showReason ? (
          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>
              Reason for "{pendingAction}" *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6, boxSizing: 'border-box' }}
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <button onClick={confirm} style={{
                background: pendingAction === 'reject'
                  ? 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)'
                  : 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
                color: 'white', border: 'none', padding: '10px 20px',
                borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
              }}>
                Confirm {pendingAction}
              </button>
              <button onClick={() => { setShowReason(false); setReason(''); }} style={{
                background: 'white', color: '#333', border: '1px solid #ccc',
                padding: '10px 20px', borderRadius: 999, fontSize: 14, cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => onAction(application.id, 'approve', 'Approved')} style={btnGreen}>
              ✓ Approve
            </button>
            <button onClick={() => askReason('request-info')} style={btnBlue}>
              ✉ Request Info
            </button>
            <button onClick={() => askReason('reject')} style={btnRed}>
              ✗ Reject
            </button>
          </div>
        )}
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

const Field = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
    <span style={{ color: '#666' }}>{label}:</span>
    <span style={{ fontWeight: 'bold', color: '#003366' }}>{value || '—'}</span>
  </div>
);

const DocumentLink = ({ label, url }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
    <span style={{ color: '#666' }}>{label}:</span>
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{ color: '#0055aa', fontWeight: 'bold', textDecoration: 'underline' }}
    >
      📄 View Document
    </a>
  </div>
);

const btnBlue = { background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 51, 102, 0.25)' };
const btnGreen = { background: 'linear-gradient(135deg, #006600 0%, #008800 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 102, 0, 0.25)' };
const btnRed = { background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(204, 0, 0, 0.25)' };

export default StaffPoliceDocuments;