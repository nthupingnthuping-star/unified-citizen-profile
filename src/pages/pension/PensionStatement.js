import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyFundRecord, RETIREMENT_AGES } from '../../firebase/db';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/common/Layout';
import Card from '../../components/common/Card';

const PensionStatement = () => {
  const { user, profile } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      try {
        const data = await getMyFundRecord(user.uid);
        setRecord(data);
      } catch (err) {
        console.error('Failed to load fund record:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const fmt = (n) =>
    n == null
      ? '—'
      : `M ${Number(n).toLocaleString('en-LS', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  return (
    <Layout title="Pension Fund Statement">
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : !record ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 30 }}>
            <h2 style={{ color: '#003366' }}>No Pension Fund Record Found</h2>
            <p style={{ color: '#666' }}>
              No fund record exists for <strong>{profile?.full_name || 'this account'}</strong>.
              Please contact the Pensions Department if you believe this is an error.
            </p>
            <Link to="/pensions" style={{ color: '#0066cc' }}>← Back to Pensions</Link>
          </div>
        </Card>
      ) : (
        <StatementContent record={record} profile={profile} fmt={fmt} />
      )}
    </Layout>
  );
};

const StatementContent = ({ record, profile, fmt }) => {
  const totalCredit =
    (record.total_member_contributions || 0) +
    (record.total_employer_contributions || 0) +
    (record.investment_returns || 0);

  const retirementAge =
    RETIREMENT_AGES[record.employment_branch] || record.retirement_age || 60;

  return (
    <>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={labelMini}>Member</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#003366' }}>
              {profile?.full_name || '—'}
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>National ID: {profile?.national_id || '—'}</div>
            <div style={{ fontSize: 13, color: '#666' }}>Member No: {record.member_number || '—'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={labelMini}>Employment Branch</div>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
              {record.employment_branch || 'Public Service'}
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>Retirement Age: {retirementAge}</div>
          </div>
        </div>
      </Card>

      <div style={{
        marginTop: 20,
        background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
        color: 'white',
        borderRadius: 8,
        padding: 28,
      }}>
        <div style={{ fontSize: 12, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Total Fund Credit
        </div>
        <div style={{ fontSize: 36, fontWeight: 'bold', marginTop: 6 }}>{fmt(totalCredit)}</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          As at{' '}
          {record.updated_at?.toDate?.().toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
          }) || 'today'}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <Card title="Contribution Breakdown">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              <Row label="Member Contributions" value={fmt(record.total_member_contributions)} />
              <Row label="Employer Contributions" value={fmt(record.total_employer_contributions)} />
              <Row label="Investment Returns" value={fmt(record.investment_returns)} />
              <Row label="Total Fund Credit" value={fmt(totalCredit)} bold />
            </tbody>
          </table>
        </Card>
      </div>

      <div style={{ marginTop: 20 }}>
        <Card title="Service Information">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              <Row label="Months of Service" value={`${record.months_of_service || 0} months`} />
              <Row
                label="Last Contribution Date"
                value={record.last_contribution_date?.toDate?.().toLocaleDateString('en-GB') || '—'}
              />
              <Row label="Fund Administrator" value="Pensions Department, Ministry of Finance" />
            </tbody>
          </table>
        </Card>
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/pension/projection" style={btnPrimary}>View Retirement Projection</Link>
        <Link to="/pensions" style={btnSecondary}>← Back to Pensions</Link>
      </div>
    </>
  );
};

const Row = ({ label, value, bold }) => (
  <tr style={{ borderBottom: '1px solid #eee' }}>
    <td style={{ padding: '10px 0', color: '#666' }}>{label}</td>
    <td style={{ padding: '10px 0', textAlign: 'right', color: '#003366', fontWeight: bold ? 'bold' : 'normal' }}>
      {value}
    </td>
  </tr>
);

const labelMini = {
  fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1,
};
const btnPrimary = {
  background: '#003366', color: 'white', padding: '10px 18px',
  borderRadius: 6, textDecoration: 'none', fontSize: 14, fontWeight: 'bold',
};
const btnSecondary = {
  background: 'white', color: '#003366', border: '1px solid #003366',
  padding: '10px 18px', borderRadius: 6, textDecoration: 'none', fontSize: 14,
};

export default PensionStatement;