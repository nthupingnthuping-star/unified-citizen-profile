import { useState, useEffect } from 'react';
import {
  getPendingFundRecords,
  updateFundRecordVerification,
  getCitizenById,
} from '../../firebase/db';
import { useAuth } from '../../contexts/AuthContext';
import Table from '../common/Table';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Card from '../common/Card';

const StaffFundVerify = () => {
  const { profile } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPendingFundRecords();
      
      // Fetch citizen details for each record to show their name
      const populated = await Promise.all(
        data.map(async (rec) => {
          const citizen = await getCitizenById(rec.citizen_id);
          return { ...rec, citizen_name: citizen?.full_name || 'Unknown Citizen' };
        })
      );
      
      setRecords(populated);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load fund records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (recordId, action) => {
    let reason = '';
    if (action === 'request-info' || action === 'reject') {
      reason = prompt(`Enter reason for ${action}:`);
      if (!reason) return; // Cancelled
    }

    try {
      await updateFundRecordVerification(recordId, action, profile.uid, reason);
      setMessage(`Record ${action}d successfully.`);
      load(); // Refresh list
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div>
      {message && <Alert type={message.includes('Error') ? 'error' : 'success'} onClose={() => setMessage('')}>{message}</Alert>}

      <Alert type="warning">
        Review the citizen's declared contributions. You <strong>must</strong> click the document links to verify their payslip or employment letter before approving.
      </Alert>

      <div className="module-card" style={{ marginTop: 20 }}>
        <div className="module-section-title">Pending Fund Verifications</div>
        
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
        ) : records.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>No pending fund records to verify.</div>
        ) : (
          <Table
            headers={['Citizen', 'Employer', 'Months', 'Fund Credit', 'Proof Uploaded', 'Action']}
            rows={records.map((rec) => [
              <div>
                <div style={{ fontWeight: 'bold', color: '#003366' }}>{rec.citizen_name}</div>
                <div style={{ fontSize: 11, color: '#666' }}>ID: {rec.citizen_id.slice(-6)}</div>
              </div>,
              rec.employer_name || '—',
              `${rec.months_of_service} months`,
              `M ${(rec.total_fund_credit || 0).toLocaleString()}`,
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rec.documents_uploaded?.payslip_url && (
                  <a href={rec.documents_uploaded.payslip_url} target="_blank" rel="noreferrer" style={{ color: '#0055aa', fontWeight: 'bold', textDecoration: 'underline', fontSize: 12 }}>
                    📄 View Payslip
                  </a>
                )}
                {rec.documents_uploaded?.employment_letter_url && (
                  <a href={rec.documents_uploaded.employment_letter_url} target="_blank" rel="noreferrer" style={{ color: '#0055aa', fontWeight: 'bold', textDecoration: 'underline', fontSize: 12 }}>
                    📄 View Letter
                  </a>
                )}
                {!rec.documents_uploaded?.payslip_url && !rec.documents_uploaded?.employment_letter_url && (
                  <span style={{ color: '#cc0000', fontSize: 11, fontWeight: 'bold' }}>⚠ No Proof</span>
                )}
              </div>,
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleAction(rec.id, 'approve')}
                  style={{ background: '#006600', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ✓ Verify
                </button>
                <button
                  onClick={() => handleAction(rec.id, 'request-info')}
                  style={{ background: '#ffcc00', color: '#003366', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ✉ Info
                </button>
                <button
                  onClick={() => handleAction(rec.id, 'reject')}
                  style={{ background: '#cc0000', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ✗ Reject
                </button>
              </div>,
            ])}
          />
        )}
      </div>
    </div>
  );
};

export default StaffFundVerify;