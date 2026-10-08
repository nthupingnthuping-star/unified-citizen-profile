import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyPensionClaims, CLAIM_STATUS } from '../../firebase/db';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/common/Layout';
import Card from '../../components/common/Card';

const STATUS_LABELS = {
  [CLAIM_STATUS.PENDING]: 'Pending',
  [CLAIM_STATUS.PROCESSING]: 'Processing',
  [CLAIM_STATUS.AUDIT]: 'Under Audit',
  [CLAIM_STATUS.APPROVED]: 'Approved',
  [CLAIM_STATUS.REJECTED]: 'Rejected',
  [CLAIM_STATUS.COMPLETED]: 'Completed',
};

const STATUS_COLORS = {
  [CLAIM_STATUS.PENDING]: '#ffcc00',
  [CLAIM_STATUS.PROCESSING]: '#0066cc',
  [CLAIM_STATUS.AUDIT]: '#856404',
  [CLAIM_STATUS.APPROVED]: '#006600',
  [CLAIM_STATUS.REJECTED]: '#cc0000',
  [CLAIM_STATUS.COMPLETED]: '#666666',
};

const PensionStatus = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      try {
        const data = await getMyPensionClaims(user.uid);
        setClaims(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <Layout title="Claim Status Tracking">
      <Card>
        <h3 style={{ marginTop: 0, color: '#003366' }}>Your Pension Claims</h3>
        <p style={{ color: '#666', marginTop: 0, fontSize: 13 }}>
          Track the progress of every pension claim you have submitted.
        </p>

        {loading ? (
          <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
        ) : claims.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>
            <p>You have not submitted any pension claims yet.</p>
            <Link to="/pension/claims" style={btnPrimary}>Submit a Claim</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            {claims.map((c) => (
              <ClaimCard key={c.id} claim={c} />
            ))}
          </div>
        )}
      </Card>

      <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/pension/claims" style={btnPrimary}>Submit New Claim</Link>
        <Link to="/pensions" style={btnSecondary}>← Back to Pensions</Link>
      </div>
    </Layout>
  );
};

const ClaimCard = ({ claim }) => {
  const status = claim.status || CLAIM_STATUS.PENDING;
  const color = STATUS_COLORS[status] || '#666';

  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderLeft: `4px solid ${color}`,
      borderRadius: 6,
      padding: 16,
      background: 'white',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
      }}>
        <div>
          <div style={labelMini}>Reference</div>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
            {claim.claim_reference}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            background: color,
            color: 'white',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}>
            {STATUS_LABELS[status] || status}
          </span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        fontSize: 13,
        color: '#555',
        marginTop: 10,
      }}>
        <Info label="Claim Type" value={claim.claim_type} />
        <Info
          label="Submitted"
          value={claim.submitted_at?.toDate?.().toLocaleDateString('en-GB') || '—'}
        />
        <Info
          label="Expected Completion"
          value={claim.expected_completion?.toDate?.().toLocaleDateString('en-GB') || '—'}
        />
      </div>

      {claim.rejection_reason && (
        <div style={{
          marginTop: 12, padding: 10,
          background: '#fff0f0', border: '1px solid #ffcccc',
          borderRadius: 6, color: '#cc0000', fontSize: 13,
        }}>
          <strong>Reason:</strong> {claim.rejection_reason}
        </div>
      )}

      {claim.notes && !claim.rejection_reason && (
        <div style={{
          marginTop: 12, padding: 10,
          background: '#f0f6ff', border: '1px solid #cce0ff',
          borderRadius: 6, color: '#003366', fontSize: 13,
        }}>
          <strong>Note:</strong> {claim.notes}
        </div>
      )}
    </div>
  );
};

const Info = ({ label, value }) => (
  <div>
    <div style={labelMini}>{label}</div>
    <div style={{ fontWeight: 'bold', color: '#003366', marginTop: 2 }}>{value || '—'}</div>
  </div>
);

const labelMini = {
  fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1,
};
const btnPrimary = {
  background: '#003366', color: 'white',
  padding: '10px 18px', borderRadius: 6,
  textDecoration: 'none', fontSize: 14, fontWeight: 'bold',
  display: 'inline-block',
};
const btnSecondary = {
  background: 'white', color: '#003366', border: '1px solid #003366',
  padding: '10px 18px', borderRadius: 6, textDecoration: 'none', fontSize: 14,
  display: 'inline-block',
};

export default PensionStatus;