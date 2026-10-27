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
import '../../styles/StaffPensionsModern.css'; // Ensure this path matches where you saved the CSS

const STATUS_TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'audit', label: 'Audit' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

const StaffPensions = () => {
  const { profile } = useAuth();
  const [view, setView] = useState('queue');
  const [items, setItems] = useState([]);
  const [activeStatus, setActiveStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);
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

  useEffect(() => { load(); }, []);

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
          const active = claims.filter((c) => ['pending', 'processing', 'audit', 'approved'].includes(c.status));
          setPensionClaims(active.filter((c) => c.id !== selected.id));
        }
      } catch (err) {
        console.error('Failed to load citizen data:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [selected?.id]);

  const handleAction = async (itemId, itemType, action, reason = '') => {
    try {
      if (itemType === 'claim') {
        await updatePensionClaimStatus(itemId, action, profile.uid, reason);
      } else {
        await updateApplicationStatus(itemId, action, profile.uid, reason);
      }
      setMessage(`Item ${action}.`);
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
    return 'gray';
  };

  const filteredItems = items.filter((item) => activeStatus === 'all' || item.status === activeStatus);
  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <StaffLayout title="Pensions Department — Staff Portal">
      <div className="module-root">
        <div className="module-header">
          <h1>Pensions Department</h1>
          <p>Review pension claims, applications, and verify fund records</p>
        </div>

        <Alert type="info">Review pension claims and applications.</Alert>

        <div className="module-tabs" style={{ marginBottom: 20 }}>
          <button onClick={() => setView('queue')} className={`module-tab ${view === 'queue' ? 'active' : ''}`}>
            📋 Pension Queue {pendingCount > 0 && <span style={{ background: 'white', color: '#003366', borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 'bold', marginLeft: 8 }}>{pendingCount}</span>}
          </button>
          <button onClick={() => setView('fund')} className={`module-tab ${view === 'fund' ? 'active' : ''}`}>💼 Fund Verifications</button>
        </div>

        {message && <Alert type={message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') ? 'error' : 'success'} onClose={() => setMessage('')}>{message}</Alert>}

        {view === 'queue' && (
          <>
            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STATUS_TABS.map((t) => (
                <button key={t.key} onClick={() => setActiveStatus(t.key)} style={{ padding: '8px 18px', background: activeStatus === t.key ? 'linear-gradient(135deg, #003366 0%, #0055aa 100%)' : 'white', color: activeStatus === t.key ? 'white' : '#333', border: activeStatus === t.key ? '1px solid transparent' : '1px solid #ddd', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: activeStatus === t.key ? 'bold' : 'normal' }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="module-card">
              <div className="module-section-title">Pension Work Queue — {activeStatus}</div>
              {loading ? (
                <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
              ) : filteredItems.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>No items in this category.</div>
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
                    <button onClick={() => setSelected(item)} style={{ background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>Review</button>,
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

  const askReason = (action) => { setPendingAction(action); setShowReason(true); };
  const confirm = () => { if (!reason.trim()) return alert('Please enter a reason.'); onAction(item.id, item._type, pendingAction, reason.trim()); };

  const data = item.application_data || {};
  const isDeceased = citizenCard?.deceased === true;

  const handleApproveClick = () => {
    if (isDeceased) {
      setBlockedConfirm(true);
      return;
    }
    onAction(item.id, item._type, 'approve', 'Approved');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 12, maxWidth: 720, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#003366', fontSize: 20 }}>{item._ref}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {isDeceased && (
          <div style={{ background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: 6, padding: '10px 16px', marginBottom: 16, fontSize: 14, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ DECEASED — do not approve
          </div>
        )}

        {citizenCard && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
              {citizenCard.photo_url ? <img src={citizenCard.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 24, fontWeight: 'bold', color: '#475569' }}>{(citizenCard.full_name || '?').charAt(0)}</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>{citizenCard.full_name}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>National ID: {citizenCard.national_id}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Citizenship: <span style={{ fontWeight: 'bold', color: '#0f172a' }}>Mosotho</span></div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Date of Birth: {citizenCard.date_of_birth}</div>
            </div>
          </div>
        )}

        {/* Side-by-side Details */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>👤 CITIZEN DETAILS</div>
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Full Name:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>{citizenCard?.full_name || item.citizen_name}</span></div>
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>National ID:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>{citizenCard?.national_id || '—'}</span></div>
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Phone:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>{citizenCard?.phone_number || '—'}</span></div>
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Email:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>{citizenCard?.email || '—'}</span></div>
          </div>
          
          <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>📄 REQUEST DETAILS</div>
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Type:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>Application</span></div>
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Service:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.service_type}</span></div>
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Status:</span><span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 'bold' }}>{item.status}</span></div>
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Submitted:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>{item._submitted?.toDate?.().toLocaleString('en-GB') || '—'}</span></div>
            {data.payment?.bank_name && <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Payment Bank:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>{data.payment.bank_name}</span></div>}
            {data.payment?.account_number && <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Account Number:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>{data.payment.account_number}</span></div>}
            {data.disability?.type && <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Disability Type:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>{data.disability.type}</span></div>}
          </div>
        </div>

        {/* Audit History */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 12 }}>AUDIT HISTORY</div>
          {item.audit_trail && item.audit_trail.length > 0 ? (
             <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#333' }}>
               {item.audit_trail.map((audit, idx) => (
                 <li key={idx} style={{ marginBottom: 6 }}>
                   <strong>{audit.action}</strong> by {audit.staff_name || audit.staff_id} on {new Date(audit.date).toLocaleString()}
                 </li>
               ))}
             </ul>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: '#999' }}>No audit history available for this item.</p>
          )}
        </div>

        {blockedConfirm ? (
          <div style={{ marginTop: 20, background: '#fff0f0', border: '2px solid #cc0000', borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#8b0000', marginBottom: 10 }}>⛔ Cannot approve this application</div>
            <p style={{ fontSize: 13, color: '#cc0000', marginTop: 0, lineHeight: 1.6 }}>This citizen is recorded as DECEASED in the Home Affairs database. You cannot approve this application.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={() => onAction(item.id, item._type, 'reject', 'Ineligible — Citizen is deceased')} style={btnRed}>Reject as ineligible</button>
              <button onClick={() => setBlockedConfirm(false)} style={{ background: 'white', color: '#333', border: '1px solid #ccc', padding: '10px 22px', borderRadius: 999, fontSize: 14, cursor: 'pointer' }}>Back</button>
            </div>
          </div>
        ) : showReason ? (
          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>Reason for "{pendingAction}" *</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6, boxSizing: 'border-box' }} />
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <button onClick={confirm} style={{ background: pendingAction === 'reject' ? 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)' : 'linear-gradient(135deg, #003366 0%, #0055aa 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>Confirm {pendingAction}</button>
              <button onClick={() => { setShowReason(false); setReason(''); }} style={{ background: 'white', color: '#333', border: '1px solid #ccc', padding: '10px 22px', borderRadius: 999, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleApproveClick} disabled={isDeceased} style={isDeceased ? { ...btnGreen, opacity: 0.5, cursor: 'not-allowed' } : btnGreen}>✓ Approve</button>
            <button onClick={() => askReason('request-info')} style={btnBlue}>✉ Request Info</button>
            <button onClick={() => askReason('reject')} style={btnRed}>✗ Reject</button>
          </div>
        )}
      </div>
    </div>
  );
};

const btnBlue = { background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 51, 102, 0.25)' };
const btnGreen = { background: 'linear-gradient(135deg, #006600 0%, #008800 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 102, 0, 0.25)' };
const btnRed = { background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(204, 0, 0, 0.25)' };

export default StaffPensions;