import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getDepartmentApplications,
  getTinRegistrations,
  updateApplicationStatus,
  approveTinRegistration,
  rejectTinRegistration,
  requestTinInfo,
  getCitizenById,
  getCitizenByNationalId,
  getMyPensionClaims,
  searchCitizens,
  DEPARTMENTS,
} from '../../firebase/db';
import StaffLayout from '../common/StaffLayout';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';
import CitizenSearchBar from '../common/CitizenSearchBar';
import '../../styles/module.css';

// Normalise any legacy citizenship value
const getCitizenshipDisplay = (raw) => {
  const value = (raw || '').toLowerCase();
  if (value.includes('mosotho') || value.includes('citizen')) return 'Mosotho';
  if (value.includes('resident')) return 'Permanent resident';
  return 'Mosotho';
};

const StaffFinance = () => {
  const { profile } = useAuth();
  const [view, setView] = useState('applications');

  // -------- Applications state --------
  const [applications, setApplications] = useState([]);
  const [appStatus, setAppStatus] = useState('pending');
  const [loadingApps, setLoadingApps] = useState(true);
  const [appMsg, setAppMsg] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  // -------- TIN registrations state --------
  const [tins, setTins] = useState([]);
  const [tinStatus, setTinStatus] = useState('pending');
  const [loadingTins, setLoadingTins] = useState(true);
  const [tinMsg, setTinMsg] = useState('');
  const [selectedTin, setSelectedTin] = useState(null);

  // -------- Citizen lookup state --------
  const [citizenCard, setCitizenCard] = useState(null);
  const [pensionClaims, setPensionClaims] = useState([]);

  // ---------- Loaders ----------
  const loadApplications = async () => {
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

  const loadTins = async () => {
    setLoadingTins(true);
    try {
      const data = await getTinRegistrations(tinStatus);
      setTins(data);
    } catch (err) {
      console.error(err);
      setTinMsg('Failed to load TIN registrations.');
    } finally {
      setLoadingTins(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (view === 'applications') loadApplications();
  }, [view, appStatus]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (view === 'tin') loadTins();
  }, [view, tinStatus]);

  // Load citizen + pension claims when an app is selected
  useEffect(() => {
    if (!selectedApp) {
      setCitizenCard(null);
      setPensionClaims([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Try by UID first
        let citizen = await getCitizenById(selectedApp.citizen_id);

        // Fallback: search by national ID
        if (!citizen && selectedApp.citizen_national_id) {
          citizen = await getCitizenByNationalId(selectedApp.citizen_national_id);
        }

        // Fallback: search by name
        if (!citizen && selectedApp.citizen_name) {
          const results = await searchCitizens(selectedApp.citizen_name);
          if (results.length === 1) citizen = results[0];
        }

        if (cancelled) return;
        setCitizenCard(citizen);

        // Load pension claims to detect double payout
        if (selectedApp.citizen_id) {
          const claims = await getMyPensionClaims(selectedApp.citizen_id);
          if (cancelled) return;
          // Only care about active/pending claims
          const active = claims.filter((c) =>
            ['pending', 'processing', 'audit', 'approved'].includes(c.status)
          );
          setPensionClaims(active);
        }
      } catch (err) {
        console.error('Failed to load citizen data:', err);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApp?.id]);

  // -------- Actions --------
  const handleAppAction = async (appId, action, reason) => {
    try {
      await updateApplicationStatus(appId, action, profile.uid, reason || '');
      setAppMsg(
        action === 'request-info'
          ? 'Application sent back for more information.'
          : `Application ${action === 'approve' ? 'approved' : 'rejected'}.`
      );
      setSelectedApp(null);
      loadApplications();
    } catch (err) {
      console.error(err);
      setAppMsg(`Error: ${err.message}`);
    }
  };

  const handleTinAction = async (regId, action, reason) => {
    try {
      if (action === 'approve') {
        const r = await approveTinRegistration(regId, profile.uid);
        setTinMsg(`TIN approved. Assigned: ${r.assignedTin}`);
      } else if (action === 'reject') {
        await rejectTinRegistration(regId, profile.uid, reason || '');
        setTinMsg('TIN registration rejected.');
      } else if (action === 'request-info') {
        await requestTinInfo(regId, profile.uid, reason || '');
        setTinMsg('TIN registration sent back for more information.');
      }
      setSelectedTin(null);
      loadTins();
    } catch (err) {
      console.error(err);
      setTinMsg(`Error: ${err.message}`);
    }
  };

  // -------- Derived --------
  const statusColor = (s) => {
    if (s === 'approved' || s === 'completed') return 'green';
    if (s === 'rejected' || s === 'cancelled') return 'red';
    if (s === 'processing') return 'yellow';
    return 'gray';
  };

  const appStatusTabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'processing', label: 'Processing' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
  ];

  const tinStatusTabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'processing', label: 'Processing' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
  ];

  return (
    <StaffLayout title="Ministry of Finance — Staff Portal">
      <div className="module-root">
        <div className="module-header">
          <h1>Ministry of Finance / RSL</h1>
          <p>Process tax registrations, clearances, and refunds</p>
        </div>

        <Alert type="info">
          RSL processes all tax services. Verify employment information against
          the citizen's profile before approving.
        </Alert>

        {/* Main view tabs */}
        <div className="module-tabs" style={{ marginBottom: 20 }}>
          <button
            onClick={() => setView('applications')}
            className={`module-tab ${view === 'applications' ? 'active' : ''}`}
          >
            Applications
          </button>
          <button
            onClick={() => setView('tin')}
            className={`module-tab ${view === 'tin' ? 'active' : ''}`}
          >
            TIN Registrations
          </button>
        </div>

        {/* ============ APPLICATIONS ============ */}
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
              {appStatusTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setAppStatus(t.key)}
                  style={{
                    padding: '8px 18px',
                    background: appStatus === t.key
                      ? 'linear-gradient(135deg, #003366 0%, #0055aa 100%)'
                      : 'white',
                    color: appStatus === t.key ? 'white' : '#333',
                    border: appStatus === t.key ? '1px solid transparent' : '1px solid #ddd',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: appStatus === t.key ? 'bold' : 'normal',
                    boxShadow: appStatus === t.key ? '0 4px 12px rgba(0, 51, 102, 0.2)' : 'none',
                    transition: 'all 0.25s ease',
                  }}
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

        {/* ============ TIN REGISTRATIONS ============ */}
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
              {tinStatusTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTinStatus(t.key)}
                  style={{
                    padding: '8px 18px',
                    background: tinStatus === t.key
                      ? 'linear-gradient(135deg, #003366 0%, #0055aa 100%)'
                      : 'white',
                    color: tinStatus === t.key ? 'white' : '#333',
                    border: tinStatus === t.key ? '1px solid transparent' : '1px solid #ddd',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: tinStatus === t.key ? 'bold' : 'normal',
                    boxShadow: tinStatus === t.key ? '0 4px 12px rgba(0, 51, 102, 0.2)' : 'none',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="module-card">
              <div className="module-section-title">TIN Registrations — {tinStatus}</div>

              {loadingTins ? (
                <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
              ) : tins.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>
                  No TIN registrations in this category.
                </div>
              ) : (
                <Table
                  headers={['Reference', 'Citizen', 'Type', 'Business', 'Submitted', 'Status', 'Action']}
                  rows={tins.map((t) => [
                    t.registration_reference,
                    t.citizen_name,
                    t.taxpayer_type,
                    t.business_name || '—',
                    t.submitted_at?.toDate?.().toLocaleDateString() || '—',
                    <Badge color={statusColor(t.status)}>{t.status}</Badge>,
                    <button
                      onClick={() => setSelectedTin(t)}
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

        {/* Review modals */}
        {selectedApp && (
          <ApplicationReviewModal
            application={selectedApp}
            citizenCard={citizenCard}
            pensionClaims={pensionClaims}
            onClose={() => setSelectedApp(null)}
            onAction={handleAppAction}
          />
        )}

        {selectedTin && (
          <TinReviewModal
            tin={selectedTin}
            onClose={() => setSelectedTin(null)}
            onAction={handleTinAction}
          />
        )}
      </div>
    </StaffLayout>
  );
};

// ============================================================
// APPLICATION REVIEW MODAL
// ============================================================
const ApplicationReviewModal = ({ application, citizenCard, pensionClaims, onClose, onAction }) => {
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [pendingAction, setPendingAction] = useState('');

  const data = application.application_data || {};
  const employment = data.employment || {};
  const citizenEmployment = citizenCard?.employment || {};

  // Use whichever employer info is available
  const employerName = employment.employer_name || citizenEmployment.employer_name || '';
  const employmentType = employment.employment_type || citizenEmployment.employment_type || '';
  const employeeNumber = employment.employee_number || citizenEmployment.employee_number || '';

  const isGovEmployee = employmentType === 'Government';
  const hasActivePension = pensionClaims && pensionClaims.length > 0;
  const activePensionTypes = hasActivePension
    ? [...new Set(pensionClaims.map((c) => c.claim_type))].join(', ')
    : '';

  const askReason = (action) => {
    setPendingAction(action);
    setShowReason(true);
  };

  const confirm = () => {
    if (!reason.trim()) return alert('Please enter a reason.');
    onAction(application.id, pendingAction, reason.trim());
  };

  const btnGreen = { background: 'linear-gradient(135deg, #006600 0%, #008800 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 102, 0, 0.25)' };
  const btnBlue = { background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 51, 102, 0.25)' };
  const btnRed = { background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(204, 0, 0, 0.25)' };

  const uploads = data.documents_uploaded || {};

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 1000, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 12, maxWidth: 720,
        width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#003366', fontSize: 20 }}>
            {application.service_type}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {/* ===== DUPLICATE PAYOUT WARNING ===== */}
        {hasActivePension && (
          <div style={{
            background: 'linear-gradient(135deg, #fff0f0 0%, #ffe5e5 100%)',
            border: '2px solid #cc0000',
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#8b0000', marginBottom: 6 }}>
              ⚠️ DUPLICATE PAYOUT RISK
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: 13, color: '#cc0000', lineHeight: 1.6 }}>
              This citizen has <strong>{pensionClaims.length}</strong> active pension claim(s)
              ({activePensionTypes}). Please verify before approving any tax refunds
              that could result in double payment.
            </p>
            <div style={{
              background: 'white',
              border: '1px solid #ffcccc',
              borderRadius: 6,
              padding: 10,
              fontSize: 12,
              color: '#7a0000',
            }}>
              <strong>Active claims:</strong>
              <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                {pensionClaims.map((c) => (
                  <li key={c.id}>
                    {c.claim_type} — <strong>{c.claim_reference}</strong> ({c.status})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ===== EMPLOYMENT BANNER ===== */}
        {isGovEmployee && (
          <div style={{
            background: '#fff8e0',
            border: '1px solid #ffe08a',
            borderRadius: 8,
            padding: 14,
            marginBottom: 20,
            fontSize: 13,
            color: '#7a5a00',
            lineHeight: 1.6,
          }}>
            <strong>ℹ️ Government employee.</strong>{' '}
            Citizen is employed at <strong>{employerName || 'Government'}</strong>
            {employeeNumber ? ` (Payroll: ${employeeNumber})` : ''}.
            Tax Clearance is still valid. Any refund will be cross-checked against payroll.
          </div>
        )}

        {/* ===== CITIZEN CARD WITH PHOTO ===== */}
        {citizenCard && (
          <div style={{
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            padding: 16,
            background: '#f9fbff',
            border: '1px solid #cce0ff',
            borderRadius: 10,
            marginBottom: 20,
          }}>
            <div style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 'bold',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 4px 16px rgba(0, 51, 102, 0.22)',
            }}>
              {citizenCard.photo_url ? (
                <img
                  src={citizenCard.photo_url}
                  alt={citizenCard.full_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (citizenCard.full_name || '?').charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#003366' }}>
                {citizenCard.full_name}
              </div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                National ID: <strong>{citizenCard.national_id}</strong>
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>
                Citizenship: <strong>{getCitizenshipDisplay(citizenCard.citizenship_status)}</strong>
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>
                Date of Birth: {citizenCard.date_of_birth || '—'}
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>
                Employment: {employerName || '—'} {employmentType && `(${employmentType})`}
              </div>
            </div>
          </div>
        )}

        {/* ===== REQUEST ===== */}
        <Section title="Request">
          <Field label="Document" value={application.service_type} />
          <Field label="Reference" value={application.application_reference} />
          <Field label="TIN" value={data.tin} />
          <Field label="Business Name" value={data.business_name} />
          <Field label="Purpose" value={data.purpose} />
          <Field label="Fee" value={data.fees?.total ? `M ${data.fees.total}` : 'Free'} />
          {data.employer && <Field label="Claimed Employer" value={data.employer} />}
          {data.amount && <Field label="Amount Claimed" value={`M ${data.amount}`} />}
          {data.has_form_p9 && <Field label="Form P9 Attached" value="Yes" />}
        </Section>

        {/* ===== EMPLOYMENT (from application) ===== */}
        {employment.employer_name && (
          <Section title="Employment (as declared)">
            <Field label="Where They Work" value={employment.employer_name} />
            <Field label="Employment Type" value={employment.employment_type} />
            <Field label="Employee Number" value={employment.employee_number} />
          </Section>
        )}

        {/* ===== UPLOADED DOCUMENTS ===== */}
        {Object.keys(uploads).length > 0 && Object.values(uploads).some(Boolean) && (
          <Section title="Documents Uploaded">
            {uploads.employment_contract && (
              <DocumentLink label="Employment Contract" url={uploads.employment_contract} />
            )}
            {uploads.traders_licence && (
              <DocumentLink label="Trader's Licence" url={uploads.traders_licence} />
            )}
            {uploads.business_registration && (
              <DocumentLink label="Business Registration" url={uploads.business_registration} />
            )}
            {uploads.national_id && (
              <DocumentLink label="National ID" url={uploads.national_id} />
            )}
          </Section>
        )}

        {/* ===== ACTIONS ===== */}
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
                background: pendingAction === 'reject' ? btnRed.background : btnBlue.background,
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

// ============================================================
// TIN REVIEW MODAL
// ============================================================
const TinReviewModal = ({ tin, onClose, onAction }) => {
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [pendingAction, setPendingAction] = useState('');

  const askReason = (action) => {
    setPendingAction(action);
    setShowReason(true);
  };

  const confirm = () => {
    if (!reason.trim()) return alert('Please enter a reason.');
    onAction(tin.id, pendingAction, reason.trim());
  };

  const btnGreen = { background: 'linear-gradient(135deg, #006600 0%, #008800 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 102, 0, 0.25)' };
  const btnBlue = { background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 51, 102, 0.25)' };
  const btnRed = { background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(204, 0, 0, 0.25)' };

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
          <h2 style={{ margin: 0, color: '#003366', fontSize: 20 }}>TIN Registration Review</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <Section title="Applicant">
          <Field label="Name" value={tin.citizen_name} />
          <Field label="National ID" value={tin.national_id} />
          <Field label="Phone" value={tin.phone_number} />
          <Field label="Email" value={tin.email} />
        </Section>

        <Section title="Registration">
          <Field label="Reference" value={tin.registration_reference} />
          <Field label="Taxpayer Type" value={tin.taxpayer_type} />
          {tin.business_name && <Field label="Business Name" value={tin.business_name} />}
          {tin.business_type && <Field label="Business Type" value={tin.business_type} />}
          {tin.traders_license_number && (
            <Field label="Trader's Licence No." value={tin.traders_license_number} />
          )}
          <Field label="Submitted" value={tin.submitted_at?.toDate?.().toLocaleDateString() || '—'} />
        </Section>

        {tin.employment_contract_url && (
          <Section title="Documents">
            <DocumentLink label="Employment Contract" url={tin.employment_contract_url} />
            {tin.traders_licence_url && (
              <DocumentLink label="Trader's Licence" url={tin.traders_licence_url} />
            )}
            {tin.business_registration_url && (
              <DocumentLink label="Business Registration" url={tin.business_registration_url} />
            )}
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
                background: pendingAction === 'reject' ? btnRed.background : btnBlue.background,
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
            <button onClick={() => onAction(tin.id, 'approve')} style={btnGreen}>
              ✓ Approve & Assign TIN
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
      📄 View
    </a>
  </div>
);

export default StaffFinance;