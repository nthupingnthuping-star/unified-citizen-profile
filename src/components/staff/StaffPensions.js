import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllPensionWork,
  updatePensionClaimStatus,
  updateApplicationStatus,
  getCitizenById,
  getCitizenByNationalId,
  getMyPensionClaims,
  searchCitizens,
} from '../../firebase/db';
import StaffLayout from '../common/StaffLayout';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';
import StaffFundVerify from './StaffFundVerify';
import '../../styles/module.css';

// ============================================================
// HELPERS
// ============================================================
const getCitizenshipDisplay = (raw) => {
  const value = (raw || '').toLowerCase();
  if (value.includes('mosotho') || value.includes('citizen')) return 'Mosotho';
  if (value.includes('resident')) return 'Permanent resident';
  return 'Mosotho';
};

const STATUS_TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'audit', label: 'Audit' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

const ACTION_LABELS = {
  approve: 'approved',
  reject: 'rejected',
  'request-info': 'sent back for more information',
  'mark-audit': 'moved to audit review',
  'mark-complete': 'marked as completed',
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const StaffPensions = () => {
  const { profile } = useAuth();
  const [view, setView] = useState('queue');
  const [items, setItems] = useState([]);
  const [activeStatus, setActiveStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);

  // Cross-check data loaded when a review opens
  const [citizenCard, setCitizenCard] = useState(null);
  const [pensionClaims, setPensionClaims] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllPensionWork();
      setItems(data);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load pension work queue.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  // Load citizen + pension history when a review modal opens
  useEffect(() => {
    if (!selected) {
      setCitizenCard(null);
      setPensionClaims([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const citizenId = selected.citizen_id;
        const natId = selected.national_id || selected.citizen_national_id;
        const name = selected.citizen_name;

        let citizen = null;
        if (citizenId) citizen = await getCitizenById(citizenId);
        if (!citizen && natId) citizen = await getCitizenByNationalId(natId);
        if (!citizen && name) {
          const found = await searchCitizens(name);
          if (found.length === 1) citizen = found[0];
        }

        if (cancelled) return;
        setCitizenCard(citizen);

        if (citizenId) {
          const claims = await getMyPensionClaims(citizenId);
          if (cancelled) return;
          const active = claims.filter((c) =>
            ['pending', 'processing', 'audit', 'approved'].includes(c.status)
          );
          const others = active.filter((c) => c.id !== selected.id);
          setPensionClaims(others);
        }
      } catch (err) {
        console.error('Failed to load citizen data:', err);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const handleAction = async (itemId, itemType, action, reason = '') => {
    try {
      if (itemType === 'claim') {
        await updatePensionClaimStatus(itemId, action, profile.uid, reason);
      } else {
        await updateApplicationStatus(itemId, action, profile.uid, reason);
      }
      setMessage(`Item ${ACTION_LABELS[action] || action}.`);
      setSelected(null);
      load();
    } catch (err) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    }
  };

  const statusColor = (s) => {
    if (s === 'approved' || s === 'completed') return 'green';
    if (s === 'rejected' || s === 'cancelled') return 'red';
    if (s === 'processing' || s === 'audit' || s === 'on-scene') return 'yellow';
    if (s === 'dispatched') return 'red';
    return 'gray';
  };

  const filteredItems = items.filter((item) => {
    if (activeStatus === 'all') return true;
    return item.status === activeStatus;
  });

  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <StaffLayout title="Pensions Department — Staff Portal">
      <div className="module-root">
        <div className="module-header">
          <h1>Pensions Department</h1>
          <p>Review pension claims, applications, and verify fund records</p>
        </div>

        <Alert type="info">
          Review pension claims (retirement, withdrawal, ill-health, death) and pension applications
          (Old Age Pension, Disability Grant).
        </Alert>

        <div className="module-tabs" style={{ marginBottom: 20 }}>
          <button
            onClick={() => setView('queue')}
            className={`module-tab ${view === 'queue' ? 'active' : ''}`}
          >
            📋 Pension Queue
            {pendingCount > 0 && (
              <span style={{
                background: 'white',
                color: '#003366',
                borderRadius: 12,
                padding: '2px 10px',
                fontSize: 12,
                fontWeight: 'bold',
                marginLeft: 8,
              }}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setView('fund')}
            className={`module-tab ${view === 'fund' ? 'active' : ''}`}
          >
            💼 Fund Verifications
          </button>
        </div>

        {message && (
          <Alert
            type={message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') ? 'error' : 'success'}
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        )}

        {view === 'queue' && (
          <>
            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STATUS_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveStatus(t.key)}
                  style={{
                    padding: '8px 18px',
                    background: activeStatus === t.key
                      ? 'linear-gradient(135deg, #003366 0%, #0055aa 100%)'
                      : 'white',
                    color: activeStatus === t.key ? 'white' : '#333',
                    border: activeStatus === t.key ? '1px solid transparent' : '1px solid #ddd',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: activeStatus === t.key ? 'bold' : 'normal',
                    boxShadow: activeStatus === t.key ? '0 4px 12px rgba(0, 51, 102, 0.2)' : 'none',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="module-card">
              <div className="module-section-title">
                Pension Work Queue — {activeStatus}
              </div>

              {loading ? (
                <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
              ) : filteredItems.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>
                  No items in this category.
                </div>
              ) : (
                <Table
                  headers={['Reference', 'Type', 'Citizen', 'Service', 'Submitted', 'Status', 'Action']}
                  rows={filteredItems.map((item) => [
                    item._ref,
                    item._type === 'claim' ? 'Fund Claim' : 'Application',
                    item.citizen_name,
                    item.claim_type || item.service_type || '—',
                    item._submitted?.toDate?.().toLocaleDateString() || '—',
                    <Badge color={statusColor(item.status)}>{item.status}</Badge>,
                    <button
                      onClick={() => setSelected(item)}
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

        {view === 'fund' && <StaffFundVerify />}

        {selected && (
          <ReviewModal
            item={selected}
            citizenCard={citizenCard}
            pensionClaims={pensionClaims}
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
const ReviewModal = ({ item, citizenCard, pensionClaims, onClose, onAction }) => {
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [pendingAction, setPendingAction] = useState('');
  const [blockedConfirm, setBlockedConfirm] = useState(false);

  const askReason = (action) => {
    setPendingAction(action);
    setShowReason(true);
  };

  const confirm = () => {
    if (!reason.trim()) return alert('Please enter a reason.');
    onAction(item.id, item._type, pendingAction, reason.trim());
  };

  const data = item.application_data || {};
  const docs = item.documents || {};

  // -------- Employment cross-check --------
  const empFromApp = data.employment || {};
  const empFromCitizen = citizenCard?.employment || {};
  const employerName = empFromApp.employer_name || empFromCitizen.employer_name || item.employer_name || '';
  const employmentType = empFromApp.employment_type || empFromCitizen.employment_type || '';
  const employeeNumber = empFromApp.employee_number || empFromCitizen.employee_number || '';
  const isGovEmployee = employmentType === 'Government';

  // -------- Duplicate payout check --------
  const hasOtherActiveClaims = pensionClaims && pensionClaims.length > 0;
  const activeClaimTypes = hasOtherActiveClaims
    ? [...new Set(pensionClaims.map((c) => c.claim_type))].join(', ')
    : '';

  // -------- Gov employee block on Old Age Pension --------
  const isOldAgePension = item.service_type === 'Old Age Pension';
  const cannotApproveOldAge = isOldAgePension && isGovEmployee;

  // -------- Chief's confirmation (with letter) --------
  const chiefConf = data.chief_confirmation || {};

  const handleApproveClick = () => {
    if (cannotApproveOldAge) {
      setBlockedConfirm(true);
      return;
    }
    onAction(item.id, item._type, 'approve', 'Approved');
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#003366', fontSize: 20 }}>{item._ref}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {/* ===== DUPLICATE PAYOUT WARNING ===== */}
        {hasOtherActiveClaims && (
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
              This citizen already has <strong>{pensionClaims.length}</strong> other active
              claim(s) ({activeClaimTypes}). Approving this item may result in a double
              payment. Verify carefully before proceeding.
            </p>
            <div style={{
              background: 'white',
              border: '1px solid #ffcccc',
              borderRadius: 6,
              padding: 10,
              fontSize: 12,
              color: '#7a0000',
            }}>
              <strong>Other active claims:</strong>
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

        {/* ===== GOV EMPLOYEE BANNER ===== */}
        {isGovEmployee && (
          <div style={{
            background: cannotApproveOldAge
              ? 'linear-gradient(135deg, #fff0f0 0%, #ffe5e5 100%)'
              : '#fff8e0',
            border: `1px solid ${cannotApproveOldAge ? '#cc0000' : '#ffe08a'}`,
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            fontSize: 13,
            color: cannotApproveOldAge ? '#8b0000' : '#7a5a00',
            lineHeight: 1.6,
          }}>
            {cannotApproveOldAge ? (
              <>
                <strong>⛔ INELIGIBLE — Government employee applying for Old Age Pension.</strong>
                <br />
                Applicant works at <strong>{employerName || 'Government'}</strong>
                {employeeNumber ? ` (Payroll: ${employeeNumber})` : ''}.
                Old Age Pension cannot be approved while they are on the government payroll.
                They should apply through the civil-service pension fund instead.
              </>
            ) : (
              <>
                <strong>ℹ️ Government employee.</strong> Applicant works at{' '}
                <strong>{employerName || 'Government'}</strong>
                {employeeNumber ? ` (Payroll: ${employeeNumber})` : ''}.
                {isOldAgePension ? '' : ' This scheme is available to government employees.'}
              </>
            )}
          </div>
        )}

        {/* ===== CITIZEN CARD ===== */}
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
              {citizenCard.deceased && (
                <div style={{
                  display: 'inline-block',
                  marginTop: 6,
                  background: '#fff0f0',
                  color: '#cc0000',
                  padding: '3px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 'bold',
                }}>
                  🕯️ DECEASED — do not approve
                </div>
              )}
            </div>
          </div>
        )}

        <Section title="Citizen">
          <Field label="Full Name" value={item.citizen_name} />
          <Field label="National ID" value={item.national_id || item.citizen_national_id} />
          {citizenCard?.phone_number && <Field label="Phone" value={citizenCard.phone_number} />}
          {citizenCard?.email && <Field label="Email" value={citizenCard.email} />}
        </Section>

        <Section title="Request details">
          <Field label="Type" value={item._type === 'claim' ? 'Fund Claim' : 'Application'} />
          <Field
            label="Service"
            value={item._type === 'claim' ? item.claim_type : item.service_type}
          />
          <Field label="Status" value={item.status} />
          <Field
            label="Submitted"
            value={item._submitted?.toDate?.().toLocaleString('en-GB') || '—'}
          />
          {item.employer_name && <Field label="Claimed Employer" value={item.employer_name} />}
          {data.bank_account && <Field label="Bank Account" value={data.bank_account} />}
          {data.payment?.bank_name && (
            <Field label="Payment Bank" value={data.payment.bank_name} />
          )}
          {data.payment?.account_number && (
            <Field label="Account Number" value={data.payment.account_number} />
          )}
          {data.payment?.account_holder && (
            <Field label="Account Holder" value={data.payment.account_holder} />
          )}
          {data.collection_branch && <Field label="Collection Branch" value={data.collection_branch} />}
          {data.age_at_application && <Field label="Age at Application" value={data.age_at_application} />}
          {data.disability?.type && <Field label="Disability Type" value={data.disability.type} />}
          {data.medical?.doctor_name && <Field label="Doctor" value={data.medical.doctor_name} />}
          {data.medical?.clinic_name && <Field label="Clinic" value={data.medical.clinic_name} />}
        </Section>

        {/* ===== EMPLOYMENT ===== */}
        {(employerName || employmentType || employeeNumber) && (
          <Section title="Employment">
            <Field label="Where They Work" value={employerName} />
            <Field label="Employment Type" value={employmentType} />
            <Field label="Employee / Payroll No." value={employeeNumber} />
          </Section>
        )}

        {/* ===== CHIEF'S CONFIRMATION (with uploaded letter) ===== */}
        {(chiefConf.chief_name || chiefConf.letter_url) && (
          <Section title="Chief's Confirmation">
            {chiefConf.chief_name && (
              <Field label="Chief's Name" value={chiefConf.chief_name} />
            )}
            {chiefConf.confirmation_number && (
              <Field label="Chief's Reference" value={chiefConf.confirmation_number} />
            )}
            {chiefConf.letter_url && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
                fontSize: 13,
                gap: 12,
              }}>
                <span style={{ color: '#666' }}>Signed Letter:</span>
                <a
                  href={chiefConf.letter_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#0055aa',
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                  }}
                >
                  📄 View Letter
                </a>
              </div>
            )}
          </Section>
        )}

        {(docs.bank_account || docs.medical_report || docs.death_certificate || docs.proof_of_relationship) && (
          <Section title="Documents Declared">
            {docs.bank_account && <Field label="Bank Account" value={docs.bank_account} />}
            <Field label="Medical Report" value={docs.medical_report ? 'Yes' : 'No'} />
            <Field label="Death Certificate" value={docs.death_certificate ? 'Yes' : 'No'} />
            <Field label="Proof of Relationship" value={docs.proof_of_relationship ? 'Yes' : 'No'} />
          </Section>
        )}

        {data.reason && (
          <Section title="Citizen Reason">
            <p style={{ fontSize: 13, color: '#333', margin: 0 }}>{data.reason}</p>
          </Section>
        )}

        {item.additional_details?.notes && (
          <Section title="Citizen Notes">
            <p style={{ fontSize: 13, color: '#333', margin: 0 }}>{item.additional_details.notes}</p>
          </Section>
        )}

        {item.rejection_reason && (
          <Section title="Previous Rejection Reason">
            <p style={{ fontSize: 13, color: '#cc0000', margin: 0 }}>{item.rejection_reason}</p>
          </Section>
        )}

        {/* ===== ACTIONS ===== */}
        {blockedConfirm ? (
          <div style={{
            marginTop: 20,
            background: '#fff0f0',
            border: '2px solid #cc0000',
            borderRadius: 8,
            padding: 20,
          }}>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#8b0000', marginBottom: 10 }}>
              ⛔ Cannot approve this application
            </div>
            <p style={{ fontSize: 13, color: '#cc0000', marginTop: 0, lineHeight: 1.6 }}>
              This citizen is a <strong>Government employee</strong>. Old Age Pension is
              reserved for citizens not on the government payroll.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => onAction(item.id, item._type, 'reject', 'Ineligible — Government employee')}
                style={btnRed}
              >
                Reject as ineligible
              </button>
              <button
                onClick={() => setBlockedConfirm(false)}
                style={{
                  background: 'white', color: '#333', border: '1px solid #ccc',
                  padding: '10px 22px', borderRadius: 999, fontSize: 14, cursor: 'pointer',
                }}
              >
                Back
              </button>
            </div>
          </div>
        ) : showReason ? (
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
            <button
              onClick={handleApproveClick}
              disabled={cannotApproveOldAge}
              style={cannotApproveOldAge ? { ...btnGreen, opacity: 0.5, cursor: 'not-allowed' } : btnGreen}
            >
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

const btnBlue = { background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 51, 102, 0.25)' };
const btnGreen = { background: 'linear-gradient(135deg, #006600 0%, #008800 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 102, 0, 0.25)' };
const btnRed = { background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(204, 0, 0, 0.25)' };

export default StaffPensions;