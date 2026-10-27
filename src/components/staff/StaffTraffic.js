import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getDepartmentApplications,
  updateApplicationStatus,
  issueTrafficFine,
  getAllTrafficFines,
  approveTrafficFinePayment, // <-- Imported
  searchCitizens,
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
  const [view, setView] = useState('applications');

  return (
    <StaffLayout title="Department of Traffic and Transport — Staff Portal">
      <div className="module-root">
        <div className="module-header">
          <h1>Department of Traffic and Transport</h1>
          <p>Process learner licenses, driver's licenses, roadworthy certificates, and issue fines</p>
        </div>

        <div className="module-tabs" style={{ marginBottom: 20 }}>
          <button
            onClick={() => setView('applications')}
            className={`module-tab ${view === 'applications' ? 'active' : ''}`}
          >
            📄 Applications Queue
          </button>
          <button
            onClick={() => setView('fines')}
            className={`module-tab ${view === 'fines' ? 'active' : ''}`}
          >
            🚨 Traffic Fines
          </button>
        </div>

        {view === 'applications' && <TrafficApplicationsQueue />}
        {view === 'fines' && <StaffTrafficFines />}
      </div>
    </StaffLayout>
  );
};

// ============================================================
// TAB 1: APPLICATIONS QUEUE
// ============================================================
const TrafficApplicationsQueue = () => {
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
    <>
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
    </>
  );
};

// ============================================================
// TAB 2: TRAFFIC FINES (WITH RECEIPT VERIFICATION)
// ============================================================
const StaffTrafficFines = () => {
  const { profile } = useAuth();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIssueForm, setShowIssueForm] = useState(false);

  // Form state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedCitizen, setSelectedCitizen] = useState(null);
  const [offence, setOffence] = useState('');
  const [amount, setAmount] = useState('');
  const [issuing, setIssuing] = useState(false);

  const loadFines = async () => {
    setLoading(true);
    try {
      const data = await getAllTrafficFines();
      setFines(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFines(); }, []);

  const handleSearch = async () => {
    if (searchQuery.length < 3) return;
    setIsSearching(true);
    try {
      const results = await searchCitizens(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleIssueFine = async (e) => {
    e.preventDefault();
    if (!selectedCitizen || !offence || !amount) return;
    setIssuing(true);
    try {
      const fineNum = `TF-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
      
      await issueTrafficFine({
        citizen_id: selectedCitizen.id,
        citizen_name: selectedCitizen.full_name,
        fine_number: fineNum,
        offence,
        amount: Number(amount),
        issued_by: profile.full_name || profile.uid,
      });
      
      alert(`Fine ${fineNum} issued successfully to ${selectedCitizen.full_name}!`);
      setShowIssueForm(false);
      resetForm();
      loadFines();
    } catch (err) {
      alert('Failed to issue fine: ' + err.message);
    } finally {
      setIssuing(false);
    }
  };

  const handleApprovePayment = async (fineId) => {
    if (!window.confirm("Approve this payment? The fine will be marked as PAID.")) return;
    try {
      await approveTrafficFinePayment(fineId);
      alert('Payment approved successfully!');
      loadFines();
    } catch (err) {
      alert('Failed to approve payment: ' + err.message);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCitizen(null);
    setOffence('');
    setAmount('');
  };

  return (
    <>
      <Alert type="warning">Manage fines issued to citizens. Click "View Receipt" to verify bank deposits before approving.</Alert>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => { setShowIssueForm(!showIssueForm); if(showIssueForm) resetForm(); }}
          style={{ background: '#006600', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 999, fontWeight: 'bold', cursor: 'pointer' }}
        >
          {showIssueForm ? 'Cancel' : '+ Issue New Fine'}
        </button>
      </div>

      {showIssueForm && (
        <div className="module-card" style={{ marginBottom: 20, background: '#f0fdf4' }}>
          <div className="module-section-title">Issue a Traffic Fine</div>
          
          {!selectedCitizen && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>Find Citizen by Name or National ID</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder="e.g. Mamoholi Pitso or 0355667882346" 
                  style={{ flex: 1, padding: 10, border: '1px solid #ccc', borderRadius: 6 }} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button type="button" onClick={handleSearch} disabled={isSearching} style={{ background: '#003366', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div style={{ marginTop: 12, background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, maxHeight: 200, overflowY: 'auto' }}>
                  {searchResults.map(c => (
                    <div key={c.id} onClick={() => setSelectedCitizen(c)} style={{ padding: 12, borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#003366' }}>{c.full_name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>ID: {c.national_id}</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#0055aa', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>Select →</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedCitizen && (
            <form onSubmit={handleIssueFine} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ background: '#dcfce7', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#166534', fontWeight: 'bold' }}>ISSUING FINE TO:</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>{selectedCitizen.full_name}</div>
                  <div style={{ fontSize: 13, color: '#166534' }}>National ID: {selectedCitizen.national_id}</div>
                </div>
                <button type="button" onClick={() => setSelectedCitizen(null)} style={{ background: 'transparent', border: 'none', color: '#166534', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}>Change Person</button>
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: 200 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Offence</label>
                  <input type="text" value={offence} onChange={(e) => setOffence(e.target.value)} placeholder="e.g. Speeding, No Seatbelt" style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }} required />
                </div>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Amount (M)</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="200" style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }} required />
                </div>
              </div>

              <div>
                <button type="submit" disabled={issuing} style={{ background: '#006600', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 6, fontWeight: 'bold', cursor: issuing ? 'not-allowed' : 'pointer', width: '100%' }}>
                  {issuing ? 'Issuing...' : 'Issue Fine'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="module-card">
        <div className="module-section-title">All Issued Fines</div>
        {loading ? <p>Loading...</p> : (
          <Table
            headers={['Fine No.', 'Citizen', 'Offence', 'Amount', 'Status', 'Proof of Payment', 'Action']}
            rows={fines.map((fine) => [
              fine.fine_number,
              <div>
                <div style={{ fontWeight: 'bold' }}>{fine.citizen_name || 'Unknown'}</div>
                <div style={{ fontSize: 11, color: '#666' }}>ID: {fine.citizen_id.slice(-6)}</div>
              </div>,
              fine.offence,
              `M ${fine.amount.toFixed(2)}`,
              <Badge color={fine.status === 'paid' ? 'green' : fine.status === 'processing' ? 'yellow' : 'red'}>
                {fine.status.toUpperCase()}
              </Badge>,
              fine.proof_of_payment_url ? (
                <a href={fine.proof_of_payment_url} target="_blank" rel="noreferrer" style={{ color: '#0055aa', fontWeight: 'bold', textDecoration: 'underline', fontSize: 12 }}>
                  📄 View Receipt
                </a>
              ) : (
                <span style={{ color: '#999', fontSize: 12 }}>—</span>
              ),
              fine.status === 'processing' ? (
                <button
                  onClick={() => handleApprovePayment(fine.id)}
                  style={{ background: '#006600', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ✓ Approve
                </button>
              ) : (
                <span style={{ color: '#999', fontSize: 12 }}>—</span>
              ),
            ])}
          />
        )}
      </div>
    </>
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