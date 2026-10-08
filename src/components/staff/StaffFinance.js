import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getTinRegistrations,
  approveTinRegistration,
  rejectTinRegistration,
  requestTinInfo,
  getDepartmentApplications,
  updateApplicationStatus,
  DEPARTMENTS,
} from '../../firebase/db';
import StaffLayout from '../common/StaffLayout';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';
import '../../styles/module.css';

const StaffFinance = () => {
  const { profile } = useAuth();
  const [view, setView] = useState('tin');

  // TIN state
  const [tinStatus, setTinStatus] = useState('pending');
  const [registrations, setRegistrations] = useState([]);
  const [loadingTin, setLoadingTin] = useState(true);
  const [tinMsg, setTinMsg] = useState('');
  const [selectedTin, setSelectedTin] = useState(null);

  // Applications state
  const [appStatus, setAppStatus] = useState('pending');
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appMsg, setAppMsg] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  const loadTin = async () => {
    setLoadingTin(true);
    try {
      const data = await getTinRegistrations(tinStatus);
      setRegistrations(data);
    } catch (err) {
      console.error(err);
      setTinMsg('Failed to load TIN registrations.');
    } finally {
      setLoadingTin(false);
    }
  };

  const loadApps = async () => {
    setLoadingApps(true);
    try {
      const data = await getDepartmentApplications(DEPARTMENTS.FINANCE, appStatus);
      setApplications(data);
    } catch (err) {
      console.error(err);
      setAppMsg('Failed to load applications.');
    } finally {
      setLoadingApps(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (view === 'tin') loadTin();
  }, [view, tinStatus]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (view === 'applications') loadApps();
  }, [view, appStatus]);

  const handleTinAction = async (action, regId, reason = '') => {
    try {
      if (action === 'approve') {
        const r = await approveTinRegistration(regId, profile.uid);
        setTinMsg(`Approved. Assigned TIN: ${r.assignedTin}`);
      } else if (action === 'reject') {
        await rejectTinRegistration(regId, profile.uid, reason);
        setTinMsg('TIN registration rejected.');
      } else if (action === 'request-info') {
        await requestTinInfo(regId, profile.uid, reason);
        setTinMsg('More information requested.');
      }
      setSelectedTin(null);
      loadTin();
    } catch (err) {
      console.error(err);
      setTinMsg(`Error: ${err.message}`);
    }
  };

  const handleAppAction = async (appId, action, reason = '') => {
    try {
      await updateApplicationStatus(appId, action, profile.uid, reason);
      setAppMsg(
        action === 'request-info'
          ? 'Application sent back for more information.'
          : `Application ${action === 'approve' ? 'approved' : 'rejected'}.`
      );
      setSelectedApp(null);
      loadApps();
    } catch (err) {
      console.error(err);
      setAppMsg(`Error: ${err.message}`);
    }
  };

  const statusColor = (s) => {
    if (s === 'approved') return 'green';
    if (s === 'rejected') return 'red';
    if (s === 'processing') return 'yellow';
    return 'gray';
  };

  const subTabStyle = (tab, current) => ({
    padding: '8px 18px',
    background: current === tab
      ? 'linear-gradient(135deg, #003366 0%, #0055aa 100%)'
      : 'white',
    color: current === tab ? 'white' : '#333',
    border: current === tab ? '1px solid transparent' : '1px solid #ddd',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: current === tab ? 'bold' : 'normal',
    boxShadow: current === tab ? '0 4px 12px rgba(0, 51, 102, 0.2)' : 'none',
    transition: 'all 0.25s ease',
    marginRight: 8,
    marginBottom: 8,
  });

  return (
    <StaffLayout title="Ministry of Finance / RSL — Staff Portal">
      <div className="module-root">
        <div className="module-header">
          <h1>Ministry of Finance / RSL</h1>
          <p>Process TIN registrations and tax clearance / PAYE applications</p>
        </div>

        <Alert type="info">
          Review TIN registrations and process tax clearance / PAYE applications submitted by citizens.
        </Alert>

        <div className="module-tabs" style={{ marginBottom: 20 }}>
          <button
            onClick={() => setView('tin')}
            className={`module-tab ${view === 'tin' ? 'active' : ''}`}
          >
            📋 TIN Queue
          </button>
          <button
            onClick={() => setView('applications')}
            className={`module-tab ${view === 'applications' ? 'active' : ''}`}
          >
            📄 Applications
          </button>
        </div>

        {view === 'tin' && (
          <>
            {tinMsg && (
              <Alert
                type={tinMsg.toLowerCase().includes('error') || tinMsg.toLowerCase().includes('failed') ? 'error' : 'success'}
                onClose={() => setTinMsg('')}
              >
                {tinMsg}
              </Alert>
            )}

            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { key: 'pending', label: 'Pending' },
                { key: 'processing', label: 'Processing' },
                { key: 'approved', label: 'Approved' },
                { key: 'rejected', label: 'Rejected' },
                { key: 'all', label: 'All' },
              ].map((t) => (
                <button
                  key={t.key}
                  style={subTabStyle(t.key, tinStatus)}
                  onClick={() => setTinStatus(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="module-card">
              <div className="module-section-title">TIN Registrations — {tinStatus}</div>

              {loadingTin ? (
                <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
              ) : registrations.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>
                  No TIN registrations in this category.
                </div>
              ) : (
                <Table
                  headers={['Reference', 'Citizen', 'Type', 'Business', 'Submitted', 'Status', 'Action']}
                  rows={registrations.map((r) => [
                    r.registration_reference,
                    r.citizen_name,
                    r.taxpayer_type,
                    r.business_name || '—',
                    r.submitted_at?.toDate?.().toLocaleDateString() || '—',
                    <Badge color={statusColor(r.status)}>{r.status}</Badge>,
                    <button
                      onClick={() => setSelectedTin(r)}
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
          </>
        )}

        {view === 'applications' && (
          <>
            {appMsg && (
              <Alert
                type={appMsg.toLowerCase().includes('error') || appMsg.toLowerCase().includes('failed') ? 'error' : 'success'}
                onClose={() => setAppMsg('')}
              >
                {appMsg}
              </Alert>
            )}

            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { key: 'pending', label: 'Pending' },
                { key: 'processing', label: 'Processing' },
                { key: 'approved', label: 'Approved' },
                { key: 'rejected', label: 'Rejected' },
                { key: 'all', label: 'All' },
              ].map((t) => (
                <button
                  key={t.key}
                  style={subTabStyle(t.key, appStatus)}
                  onClick={() => setAppStatus(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="module-card">
              <div className="module-section-title">Applications — {appStatus}</div>

              {loadingApps ? (
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
                      onClick={() => setSelectedApp(a)}
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
          </>
        )}

        {selectedTin && (
          <TinReviewModal
            registration={selectedTin}
            onClose={() => setSelectedTin(null)}
            onAction={handleTinAction}
          />
        )}

        {selectedApp && (
          <ApplicationReviewModal
            application={selectedApp}
            onClose={() => setSelectedApp(null)}
            onAction={handleAppAction}
          />
        )}
      </div>
    </StaffLayout>
  );
};

// ============================================================
// TIN REVIEW MODAL
// ============================================================
const TinReviewModal = ({ registration, onClose, onAction }) => {
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [pendingAction, setPendingAction] = useState('');

  const askReason = (action) => {
    setPendingAction(action);
    setShowReason(true);
  };

  const confirm = () => {
    if (!reason.trim()) return alert('Please enter a reason.');
    onAction(pendingAction, registration.id, reason.trim());
  };

  const hasUploads =
    registration.employment_contract_url ||
    registration.traders_licence_url ||
    registration.business_registration_url;

  const hasLegacyCheckboxes =
    registration.has_employment_contract || registration.has_traders_license;

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
            TIN Registration {registration.registration_reference}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <Section title="Citizen">
          <Field label="Full Name" value={registration.citizen_name} />
          <Field label="National ID" value={registration.national_id} />
          <Field label="Phone" value={registration.phone_number} />
          <Field label="Email" value={registration.email} />
        </Section>

        <Section title="Taxpayer Details">
          <Field label="Taxpayer Type" value={registration.taxpayer_type} />
          {registration.business_name && <Field label="Business Name" value={registration.business_name} />}
          {registration.business_type && <Field label="Business Type" value={registration.business_type} />}
          {registration.traders_license_number && (
            <Field label="Trader's Licence No." value={registration.traders_license_number} />
          )}
        </Section>

        {hasUploads && (
          <Section title="Documents Uploaded">
            {registration.employment_contract_url && (
              <DocumentLink label="Employment Contract" url={registration.employment_contract_url} />
            )}
            {registration.traders_licence_url && (
              <DocumentLink label="Trader's Licence" url={registration.traders_licence_url} />
            )}
            {registration.business_registration_url && (
              <DocumentLink label="Business Registration Certificate" url={registration.business_registration_url} />
            )}
          </Section>
        )}

        {hasLegacyCheckboxes && !hasUploads && (
          <Section title="Documents Declared (legacy)">
            <Field
              label="Employment Contract"
              value={registration.has_employment_contract ? 'Yes' : 'No'}
            />
            <Field
              label="Trader's Licence"
              value={registration.has_traders_license ? 'Yes' : 'No'}
            />
          </Section>
        )}

        <Section title="Status">
          <Field label="Current Status" value={registration.status} />
          <Field
            label="Submitted"
            value={registration.submitted_at?.toDate?.().toLocaleString('en-GB') || '—'}
          />
        </Section>

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
            {registration.status !== 'approved' && (
              <button onClick={() => onAction('approve', registration.id)} style={btnGreen}>
                ✓ Approve & Generate TIN
              </button>
            )}
            <button onClick={() => askReason('request-info')} style={btnBlue}>
              ✉ Request More Info
            </button>
            {registration.status !== 'rejected' && (
              <button onClick={() => askReason('reject')} style={btnRed}>
                ✗ Reject
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// APPLICATION REVIEW MODAL
// ============================================================
const ApplicationReviewModal = ({ application, onClose, onAction }) => {
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [pendingAction, setPendingAction] = useState('');

  const data = application.application_data || {};

  const askReason = (action) => {
    setPendingAction(action);
    setShowReason(true);
  };

  const confirm = () => {
    if (!reason.trim()) return alert('Please enter a reason.');
    onAction(application.id, pendingAction, reason.trim());
  };

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
            {application.service_type}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <Section title="Citizen">
          <Field label="Full Name" value={application.citizen_name} />
          <Field label="National ID" value={application.citizen_national_id} />
        </Section>

        <Section title="Application">
          <Field label="Reference" value={application.application_reference} />
          <Field label="Service" value={application.service_type} />
          {data.tin && <Field label="TIN" value={data.tin} />}
          {data.business_name && <Field label="Business Name" value={data.business_name} />}
          {data.purpose && <Field label="Purpose" value={data.purpose} />}
          {data.employer && <Field label="Employer" value={data.employer} />}
          {data.amount && <Field label="Amount Claimed" value={`M ${data.amount}`} />}
          {data.is_new_business !== undefined && (
            <Field label="New Business" value={data.is_new_business ? 'Yes' : 'No'} />
          )}
          {data.has_form_p9 !== undefined && (
            <Field label="Has Form P9" value={data.has_form_p9 ? 'Yes' : 'No'} />
          )}
          <Field
            label="Submitted"
            value={application.submitted_at?.toDate?.().toLocaleString('en-GB') || '—'}
          />
        </Section>

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

export default StaffFinance;