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
        let citizen = await getCitizenById(selectedApp.citizen_id);
        if (!citizen && selectedApp.citizen_national_id) citizen = await getCitizenByNationalId(selectedApp.citizen_national_id);
        if (!citizen && selectedApp.citizen_name) {
          const results = await searchCitizens(selectedApp.citizen_name);
          if (results.length === 1) citizen = results[0];
        }
        if (cancelled) return;
        setCitizenCard(citizen);

        if (selectedApp.citizen_id) {
          const claims = await getMyPensionClaims(selectedApp.citizen_id);
          if (cancelled) return;
          const active = claims.filter((c) => ['pending', 'processing', 'audit', 'approved'].includes(c.status));
          setPensionClaims(active);
        }
      } catch (err) { console.error('Failed to load citizen data:', err); }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApp?.id]);

  // -------- Actions --------
  const handleAppAction = async (appId, action, reason) => {
    try {
      await updateApplicationStatus(appId, action, profile.uid, reason || '');
      setAppMsg(action === 'request-info' ? 'Application sent back for more information.' : `Application ${action === 'approve' ? 'approved' : 'rejected'}.`);
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

  const statusColor = (s) => {
    if (s === 'approved' || s === 'completed') return 'green';
    if (s === 'rejected' || s === 'cancelled') return 'red';
    if (s === 'processing') return 'yellow';
    return 'gray';
  };

  const appStatusTabs = ['pending', 'processing', 'approved', 'rejected', 'all'];

  return (
    <StaffLayout title="Ministry of Finance — Staff Portal">
      <div className="module-root">
        <div className="module-header">
          <h1>Ministry of Finance / RSL</h1>
          <p>Process tax registrations, clearances, and refunds</p>
        </div>

        <Alert type="info">
          RSL processes all tax services. Verify employment information against the citizen's profile before approving.
        </Alert>

        <div className="module-tabs" style={{ marginBottom: 20 }}>
          <button onClick={() => setView('applications')} className={`module-tab ${view === 'applications' ? 'active' : ''}`}>
            Applications
          </button>
          <button onClick={() => setView('tin')} className={`module-tab ${view === 'tin' ? 'active' : ''}`}>
            TIN Registrations
          </button>
        </div>

        {view === 'applications' && (
          <>
            {appMsg && <Alert type={appMsg.toLowerCase().includes('error') || appMsg.toLowerCase().includes('failed') ? 'error' : 'success'} onClose={() => setAppMsg('')}>{appMsg}</Alert>}

            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {appStatusTabs.map((s) => (
                <button
                  key={s}
                  onClick={() => setAppStatus(s)}
                  style={{
                    padding: '8px 18px', background: appStatus === s ? '#003366' : 'white',
                    color: appStatus === s ? 'white' : '#333', border: appStatus === s ? '1px solid transparent' : '1px solid #ddd',
                    borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: appStatus === s ? 'bold' : 'normal',
                    textTransform: 'capitalize', boxShadow: appStatus === s ? '0 4px 12px rgba(0, 51, 102, 0.2)' : 'none',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="module-card">
              <div className="module-section-title">Finance Applications — {appStatus}</div>
              {loadingApps ? (
                <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
              ) : applications.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>No applications in this category.</div>
              ) : (
                <Table
                  headers={['Reference', 'Citizen', 'Service', 'Submitted', 'Status', 'Action']}
                  rows={applications.map((a) => [
                    a.application_reference, a.citizen_name, a.service_type,
                    a.submitted_at?.toDate?.().toLocaleDateString() || '—',
                    <Badge color={statusColor(a.status)}>{a.status}</Badge>,
                    <button onClick={() => setSelectedApp(a)} style={{ background: '#003366', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>Review</button>,
                  ])}
                />
              )}
            </div>
          </>
        )}

        {view === 'tin' && (
          <>
            {tinMsg && <Alert type={tinMsg.toLowerCase().includes('error') || tinMsg.toLowerCase().includes('failed') ? 'error' : 'success'} onClose={() => setTinMsg('')}>{tinMsg}</Alert>}

            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {appStatusTabs.map((s) => (
                <button
                  key={s}
                  onClick={() => setTinStatus(s)}
                  style={{
                    padding: '8px 18px', background: tinStatus === s ? '#003366' : 'white',
                    color: tinStatus === s ? 'white' : '#333', border: tinStatus === s ? '1px solid transparent' : '1px solid #ddd',
                    borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: tinStatus === s ? 'bold' : 'normal',
                    textTransform: 'capitalize', boxShadow: tinStatus === s ? '0 4px 12px rgba(0, 51, 102, 0.2)' : 'none',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="module-card">
              <div className="module-section-title">TIN Registrations — {tinStatus}</div>
              {loadingTins ? (
                <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
              ) : tins.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>No TIN registrations in this category.</div>
              ) : (
                <Table
                  headers={['Reference', 'Citizen', 'Type', 'Business', 'Submitted', 'Status', 'Action']}
                  rows={tins.map((t) => [
                    t.registration_reference, t.citizen_name, t.taxpayer_type, t.business_name || '—',
                    t.submitted_at?.toDate?.().toLocaleDateString() || '—',
                    <Badge color={statusColor(t.status)}>{t.status}</Badge>,
                    <button onClick={() => setSelectedTin(t)} style={{ background: '#003366', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>Review</button>,
                  ])}
                />
              )}
            </div>
          </>
        )}

        {selectedApp && <ApplicationReviewModal application={selectedApp} citizenCard={citizenCard} pensionClaims={pensionClaims} onClose={() => setSelectedApp(null)} onAction={handleAppAction} />}
        {selectedTin && <TinReviewModal tin={selectedTin} onClose={() => setSelectedTin(null)} onAction={handleTinAction} />}
      </div>
    </StaffLayout>
  );
};

// ============================================================
// APPLICATION REVIEW MODAL (UPDATED DESIGN)
// ============================================================
const ApplicationReviewModal = ({ application, citizenCard, pensionClaims, onClose, onAction }) => {
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [pendingAction, setPendingAction] = useState('');

  const data = application.application_data || {};
  const employment = data.employment || {};
  const citizenEmployment = citizenCard?.employment || {};

  const employerName = employment.employer_name || citizenEmployment.employer_name || '';
  const employmentType = employment.employment_type || citizenEmployment.employment_type || '';
  const employeeNumber = employment.employee_number || citizenEmployment.employee_number || '';

  const isGovEmployee = employmentType === 'Government';
  const hasActivePension = pensionClaims && pensionClaims.length > 0;
  const activePensionTypes = hasActivePension ? [...new Set(pensionClaims.map((c) => c.claim_type))].join(', ') : '';

  const askReason = (action) => { setPendingAction(action); setShowReason(true); };
  const confirm = () => { if (!reason.trim()) return alert('Please enter a reason.'); onAction(application.id, pendingAction, reason.trim()); };

  const uploads = data.documents_uploaded || {};

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#f8fafc', borderRadius: 16, maxWidth: 720, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 800 }}>{application.service_type}</h2>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Reference: {application.application_reference}</div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: 36, height: 36, borderRadius: '50%', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        <div style={{ padding: 32 }}>
          {hasActivePension && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: '#991b1b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>⚠️ DUPLICATE PAYOUT RISK</div>
              <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#b91c1c', lineHeight: 1.6 }}>
                This citizen has <strong>{pensionClaims.length}</strong> active pension claim(s) ({activePensionTypes}). Please verify before approving any tax refunds that could result in double payment.
              </p>
              <div style={{ background: 'white', border: '1px solid #fca5a5', borderRadius: 8, padding: 12, fontSize: 13, color: '#7f1d1d' }}>
                <strong>Active claims:</strong>
                <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                  {pensionClaims.map((c) => (<li key={c.id}>{c.claim_type} — <strong>{c.claim_reference}</strong> ({c.status})</li>))}
                </ul>
              </div>
            </div>
          )}

          {isGovEmployee && (
            <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 14, color: '#854d0e', lineHeight: 1.6 }}>
              <strong>ℹ️ Government employee.</strong> Citizen is employed at <strong>{employerName || 'Government'}</strong>{employeeNumber ? ` (Payroll: ${employeeNumber})` : ''}. Any refund will be cross-checked against payroll.
            </div>
          )}

          {citizenCard && (
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', padding: 20, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 24 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
                {citizenCard.photo_url ? (<img src={citizenCard.photo_url} alt={citizenCard.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : ((citizenCard.full_name || '?').charAt(0).toUpperCase())}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{citizenCard.full_name}</div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>ID: <strong>{citizenCard.national_id}</strong> • {getCitizenshipDisplay(citizenCard.citizenship_status)}</div>
                <div style={{ fontSize: 13, color: '#475569' }}>DOB: {citizenCard.date_of_birth || '—'}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Request Details</div>
              <Field label="Document" value={application.service_type} />
              <Field label="Reference" value={application.application_reference} />
              <Field label="TIN" value={data.tin} />
              <Field label="Business Name" value={data.business_name} />
              <Field label="Purpose" value={data.purpose} />
              <Field label="Fee" value={data.fees?.total ? `M ${data.fees.total}` : 'Free'} />
              {data.employer && <Field label="Claimed Employer" value={data.employer} />}
              {data.amount && <Field label="Amount Claimed" value={`M ${data.amount}`} />}
            </div>
            
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
               <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Employment & Documents</div>
               {employment.employer_name && (
                 <>
                  <Field label="Employer" value={employment.employer_name} />
                  <Field label="Type" value={employment.employment_type} />
                 </>
               )}
               {Object.keys(uploads).length > 0 && Object.values(uploads).some(Boolean) && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Attachments</div>
                    {uploads.employment_contract && <DocumentLink label="Employment Contract" url={uploads.employment_contract} />}
                    {uploads.traders_licence && <DocumentLink label="Trader's Licence" url={uploads.traders_licence} />}
                    {uploads.business_registration && <DocumentLink label="Business Registration" url={uploads.business_registration} />}
                    {uploads.national_id && <DocumentLink label="National ID" url={uploads.national_id} />}
                  </div>
               )}
            </div>
          </div>

          {showReason ? (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#0f172a' }}>Reason for "{pendingAction}" *</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} style={{ width: '100%', padding: 12, border: '1px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box', fontSize: 14 }} placeholder="Provide a clear reason..." />
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button onClick={confirm} style={{ background: pendingAction === 'reject' ? '#dc2626' : '#003366', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>Confirm {pendingAction}</button>
                <button onClick={() => { setShowReason(false); setReason(''); }} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => onAction(application.id, 'approve', 'Approved')} style={{ background: '#059669', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>✓ Approve</button>
              <button onClick={() => askReason('request-info')} style={{ background: '#003366', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>✉ Request Info</button>
              <button onClick={() => askReason('reject')} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>✗ Reject</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TIN REVIEW MODAL (UPDATED DESIGN)
// ============================================================
const TinReviewModal = ({ tin, onClose, onAction }) => {
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [pendingAction, setPendingAction] = useState('');

  const askReason = (action) => { setPendingAction(action); setShowReason(true); };
  const confirm = () => { if (!reason.trim()) return alert('Please enter a reason.'); onAction(tin.id, pendingAction, reason.trim()); };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#f8fafc', borderRadius: 16, maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 800 }}>TIN Registration Review</h2>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: 36, height: 36, borderRadius: '50%', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        <div style={{ padding: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Applicant</div>
              <Field label="Name" value={tin.citizen_name} />
              <Field label="National ID" value={tin.national_id} />
              <Field label="Phone" value={tin.phone_number} />
              <Field label="Email" value={tin.email} />
            </div>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Registration</div>
              <Field label="Reference" value={tin.registration_reference} />
              <Field label="Type" value={tin.taxpayer_type} />
              {tin.business_name && <Field label="Business" value={tin.business_name} />}
              {tin.traders_license_number && <Field label="Licence No." value={tin.traders_license_number} />}
            </div>
          </div>

          {(tin.employment_contract_url || tin.traders_licence_url) && (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Attachments</div>
              {tin.employment_contract_url && <DocumentLink label="Employment Contract" url={tin.employment_contract_url} />}
              {tin.traders_licence_url && <DocumentLink label="Trader's Licence" url={tin.traders_licence_url} />}
              {tin.business_registration_url && <DocumentLink label="Business Registration" url={tin.business_registration_url} />}
            </div>
          )}

          {showReason ? (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#0f172a' }}>Reason for "{pendingAction}" *</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} style={{ width: '100%', padding: 12, border: '1px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box', fontSize: 14 }} placeholder="Provide a clear reason..." />
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button onClick={confirm} style={{ background: pendingAction === 'reject' ? '#dc2626' : '#003366', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>Confirm</button>
                <button onClick={() => { setShowReason(false); setReason(''); }} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => onAction(tin.id, 'approve')} style={{ background: '#059669', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>✓ Approve & Assign TIN</button>
              <button onClick={() => askReason('request-info')} style={{ background: '#003366', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>✉ Request Info</button>
              <button onClick={() => askReason('reject')} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>✗ Reject</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// REUSABLE PIECES
// ============================================================
const Field = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
    <span style={{ color: '#64748b' }}>{label}:</span>
    <span style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right', maxWidth: '65%' }}>{value || '—'}</span>
  </div>
);

const DocumentLink = ({ label, url }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
    <span style={{ color: '#64748b' }}>{label}:</span>
    <a href={url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>📄 View File</a>
  </div>
);

export default StaffFinance;