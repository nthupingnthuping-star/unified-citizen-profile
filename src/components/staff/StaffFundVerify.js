import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPendingFundRecords,
  updateFundRecordVerification,
} from '../../firebase/db';
import Alert from '../common/Alert';
import Card from '../common/Card';
import Table from '../common/Table';

const ACTION_LABELS = {
  approve: 'verified',
  reject: 'rejected',
  'request-info': 'sent back for more information',
};

const StaffFundVerify = () => {
  const { profile } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPendingFundRecords();
      setRecords(data);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load fund records.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleAction = async (recordId, action, reason = '') => {
    try {
      await updateFundRecordVerification(recordId, action, profile.uid, reason);
      setMessage(`Fund record ${ACTION_LABELS[action] || action}.`);
      setSelected(null);
      load();
    } catch (err) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div>
      {message && (
        <Alert
          type={message.toLowerCase().includes('error') ? 'error' : 'success'}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      <Card title={`Fund Records Awaiting Verification (${records.length})`}>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
        ) : records.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>
            No fund records awaiting verification.
          </div>
        ) : (
          <Table
            headers={['Member No', 'Citizen UID', 'Branch', 'Employer', 'Service', 'Submitted', 'Action']}
            rows={records.map((r) => [
              r.member_number,
              r.citizen_id ? r.citizen_id.slice(0, 8) + '…' : '—',
              r.employment_branch,
              r.employer_name || '—',
              `${r.months_of_service || 0} months`,
              r.submitted_for_verification_at?.toDate?.().toLocaleDateString() || '—',
              <button
                onClick={() => setSelected(r)}
                style={{
                  background: '#003366', color: 'white', border: 'none',
                  padding: '6px 12px', borderRadius: 4, fontSize: 12,
                  fontWeight: 'bold', cursor: 'pointer',
                }}
              >
                Review
              </button>,
            ])}
          />
        )}
      </Card>

      {selected && (
        <ReviewModal
          record={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
};

const ReviewModal = ({ record, onClose, onAction }) => {
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [pendingAction, setPendingAction] = useState('');

  const askForReason = (action) => {
    setPendingAction(action);
    setShowReason(true);
  };

  const confirm = () => {
    if (!reason.trim()) return alert('Please enter a reason.');
    onAction(record.id, pendingAction, reason.trim());
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 1000, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 8, maxWidth: 640,
        width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#003366', fontSize: 20 }}>
            Fund Record {record.member_number}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer' }}>
            ×
          </button>
        </div>

        <Section title="Employment">
          <Field label="Branch" value={record.employment_branch} />
          <Field label="Employer" value={record.employer_name} />
          <Field label="Months of Service" value={`${record.months_of_service || 0} months`} />
          <Field label="Monthly Contribution" value={`M ${(record.monthly_contribution || 0).toLocaleString()}`} />
        </Section>

        <Section title="Contributions">
          <Field label="Member" value={`M ${(record.total_member_contributions || 0).toLocaleString()}`} />
          <Field label="Employer" value={`M ${(record.total_employer_contributions || 0).toLocaleString()}`} />
          <Field label="Investment Returns" value={`M ${(record.investment_returns || 0).toLocaleString()}`} />
          <Field label="Total Fund Credit" value={`M ${(record.total_fund_credit || 0).toLocaleString()}`} />
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
              style={{
                width: '100%', padding: 10, border: '1px solid #ccc',
                borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
              }}
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <button onClick={confirm} style={{
                background: pendingAction === 'reject' ? '#cc0000' : '#003366',
                color: 'white', border: 'none', padding: '10px 18px',
                borderRadius: 6, fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
              }}>
                Confirm {pendingAction}
              </button>
              <button onClick={() => { setShowReason(false); setReason(''); }} style={{
                background: 'white', color: '#333', border: '1px solid #ccc',
                padding: '10px 18px', borderRadius: 6, fontSize: 14, cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => onAction(record.id, 'approve')} style={btnSuccess}>
              ✓ Verify Record
            </button>
            <button onClick={() => askForReason('request-info')} style={btnPrimary}>
              ✉ Request More Info
            </button>
            <button onClick={() => askForReason('reject')} style={btnDanger}>
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

const btnPrimary = { background: '#003366', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 6, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' };
const btnSuccess = { background: '#006600', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 6, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' };
const btnDanger = { background: '#cc0000', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 6, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' };

export default StaffFundVerify;