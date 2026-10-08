import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getDepartmentApplications,
  updateApplicationStatus,
  DEPARTMENTS,
} from '../../firebase/db';
import StaffLayout from '../common/StaffLayout';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';
import '../../styles/module.css';

const STATUS_TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const StaffTraffic = () => {
  const { profile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [activeStatus, setActiveStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getDepartmentApplications(DEPARTMENTS.TRAFFIC, activeStatus);
      setApplications(data);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [activeStatus]);

  const handleAction = async (appId, action, reason = '') => {
    try {
      await updateApplicationStatus(appId, action, profile.uid, reason);
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

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  const subTabStyle = (tab) => ({
    padding: '8px 18px',
    background: activeStatus === tab
      ? 'linear-gradient(135deg, #003366 0%, #0055aa 100%)'
      : 'white',
    color: activeStatus === tab ? 'white' : '#333',
    border: activeStatus === tab ? '1px solid transparent' : '1px solid #ddd',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: activeStatus === tab ? 'bold' : 'normal',
    boxShadow: activeStatus === tab ? '0 4px 12px rgba(0, 51, 102, 0.2)' : 'none',
    transition: 'all 0.25s ease',
  });

  return (
    <StaffLayout title="Department of Traffic and Transport — Staff Portal">
      <div className="module-root">
        <div className="module-header">
          <h1>Department of Traffic and Transport</h1>
          <p>Process learner licenses, driver's licenses, roadworthy certificates, and vehicle registrations</p>
        </div>

        <Alert type="info">
          Review applications submitted by citizens. Approve, reject, or request more information.
        </Alert>

        {message && (
          <Alert
            type={message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') ? 'error' : 'success'}
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        )}

        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              style={subTabStyle(t.key)}
              onClick={() => setActiveStatus(t.key)}
            >
              {t.label}
              {t.key === 'pending' && pendingCount > 0 && activeStatus === 'pending' && (
                <span style={{
                  background: 'white',
                  color: '#003366',
                  borderRadius: 12,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 'bold',
                  marginLeft: 8,
                }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="module-card">
          <div className="module-section-title">
            Traffic Applications — {activeStatus}
          </div>

          {loading ? (
            <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
          ) : applications.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>
              No applications in this category.
            </div>
          ) : (
            <Table
              headers={['Reference', 'Citizen', 'Service', 'Submitted', 'Status', 'Action']}
              rows={applications.map((a) => [
                a.application_reference,
                a.citizen_name,
                a.service_type,
                a.submitted_at?.toDate?.().toLocaleDateString() || '—',
                <Badge color={statusColor(a.status)}>{a.status}</Badge>,
                <button
                  onClick={() => setSelected(a)}
                  style={{
                    background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 'bold',
                    cursor: 'pointer',
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
    </StaffLayout>
  );
};

// ============================================================
// REVIEW MODAL
// ============================================================
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
        background: 'white', borderRadius: 12, maxWidth: 680,
        width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#003366', fontSize: 20 }}>
            {application.service_type}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <Section title="Citizen">
          <Field label="Full Name" value={application.citizen_name} />
          <Field label="National ID" value={application.citizen_national_id} />
        </Section>

        <Section title="Application Details">
          <Field label="Reference" value={application.application_reference} />
          <Field label="Submitted" value={application.submitted_at?.toDate?.().toLocaleString('en-GB') || '—'} />
          <Field label="Status" value={application.status} />
        </Section>

        <Section title="Service Details">
          {renderServiceDetails(application)}
        </Section>

        {hasUploads && (
          <Section title="Documents Uploaded by Citizen">
            {uploads.eye_test && <DocumentLink label="Eye Test Certificate" url={uploads.eye_test} />}
            {uploads.photos && <DocumentLink label="Passport Photos" url={uploads.photos} />}
            {uploads.learner_license && <DocumentLink label="Learner License" url={uploads.learner_license} />}
            {uploads.certificate_of_competence && <DocumentLink label="Certificate of Competence" url={uploads.certificate_of_competence} />}
            {uploads.customs_clearance && <DocumentLink label="Customs Clearance" url={uploads.customs_clearance} />}
            {uploads.vat_clearance && <DocumentLink label="VAT Clearance" url={uploads.vat_clearance} />}
            {uploads.proof_of_purchase && <DocumentLink label="Proof of Purchase" url={uploads.proof_of_purchase} />}
          </Section>
        )}

        {hasLegacyDeclared && !hasUploads && (
          <Section title="Documents Declared (legacy)">
            <Field label="Eye Test" value={legacyDeclared.eye_test ? 'Yes' : 'No'} />
            <Field label="Passport Photos" value={legacyDeclared.photos ? 'Yes' : 'No'} />
            <Field label="Learner License" value={legacyDeclared.learner_license ? 'Yes' : 'No'} />
            <Field label="Certificate of Competence" value={legacyDeclared.certificate_of_competence ? 'Yes' : 'No'} />
            <Field label="Customs Clearance" value={legacyDeclared.customs_clearance ? 'Yes' : 'No'} />
            <Field label="VAT Clearance" value={legacyDeclared.vat_clearance ? 'Yes' : 'No'} />
            <Field label="Proof of Purchase" value={legacyDeclared.proof_of_purchase ? 'Yes' : 'No'} />
          </Section>
        )}

        {application.rejection_reason && (
          <Section title="Previous Rejection">
            <p style={{ fontSize: 13, color: '#cc0000', margin: 0 }}>
              {application.rejection_reason}
            </p>
          </Section>
        )}

        {application.notes && (
          <Section title="Staff Notes">
            <p style={{ fontSize: 13, color: '#333', margin: 0 }}>{application.notes}</p>
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
              placeholder="Enter the reason that will be shown to the citizen..."
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <button onClick={confirm} style={{
                background: pendingAction === 'reject'
                  ? 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)'
                  : 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
                color: 'white', border: 'none', padding: '10px 22px',
                borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
              }}>
                Confirm {pendingAction}
              </button>
              <button onClick={() => { setShowReason(false); setReason(''); }} style={{
                background: 'white', color: '#333', border: '1px solid #ccc',
                padding: '10px 22px', borderRadius: 999, fontSize: 14, cursor: 'pointer',
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

// ============================================================
// SERVICE-SPECIFIC FIELDS
// ============================================================
const renderServiceDetails = (application) => {
  const service = application.service_type;
  const data = application.application_data || {};

  if (service === 'Learner License') {
    return (
      <>
        <Field label="Vehicle Type" value={data.vehicle_type} />
        <Field label="Collection Branch" value={data.collection_branch} />
        <Field label="Payment Reference" value={data.payment?.reference} />
        <Field label="Fee" value={data.fees?.total ? `M ${data.fees.total}` : '—'} />
      </>
    );
  }

  if (service === "Driver's License") {
    return (
      <>
        <Field label="Application Type" value={data.application_type} />
        <Field label="License Code" value={data.licence_code} />
        <Field label="Transmission" value={data.transmission} />
        <Field label="Collection Branch" value={data.collection_branch} />
        <Field label="Payment Reference" value={data.payment?.reference} />
        <Field label="Fee" value={data.fees?.total ? `M ${data.fees.total}` : '—'} />
      </>
    );
  }

  if (service === 'Roadworthy Certificate') {
    return (
      <>
        <Field label="Plate Number" value={data.vehicle?.plate_number} />
        <Field label="Make" value={data.vehicle?.make} />
        <Field label="Model" value={data.vehicle?.model} />
        <Field label="Year" value={data.vehicle?.year} />
        <Field label="Chassis / VIN" value={data.vehicle?.vin} />
        <Field label="Inspection Branch" value={data.inspection_branch} />
        <Field label="Payment Reference" value={data.payment?.reference} />
        <Field label="Fee" value={data.fees?.total ? `M ${data.fees.total}` : '—'} />
      </>
    );
  }

  if (service === 'Vehicle Registration') {
    return (
      <>
        <Field label="Registration Type" value={data.registration_type} />
        <Field label="Plate Number" value={data.vehicle?.plate_number} />
        <Field label="Make / Model" value={`${data.vehicle?.make || ''} ${data.vehicle?.model || ''}`.trim()} />
        <Field label="Year" value={data.vehicle?.year} />
        <Field label="Class" value={data.vehicle?.vehicle_class} />
        <Field label="Colour" value={data.vehicle?.colour} />
        <Field label="Chassis Number" value={data.vehicle?.chassis_number} />
        <Field label="Engine Number" value={data.vehicle?.engine_number} />
        <Field label="Collection Branch" value={data.collection_branch} />
        <Field label="Payment Reference" value={data.payment?.reference} />
        <Field label="Fee" value={data.fees?.total ? `M ${data.fees.total}` : '—'} />
      </>
    );
  }

  return <Field label="Service" value={service} />;
};

// ============================================================
// REUSABLE PIECES
// ============================================================
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
    <span style={{ fontWeight: 'bold', color: '#003366', textAlign: 'right', maxWidth: '65%' }}>
      {value || '—'}
    </span>
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

export default StaffTraffic;