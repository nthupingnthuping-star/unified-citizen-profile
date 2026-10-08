import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getMyFundRecord,
  createFundRecord,
  saveCitizenMasterData,
  RETIREMENT_AGES,
} from '../../firebase/db';
import { useAuth } from '../../contexts/AuthContext';
import { useAutoFill } from '../../hooks/useAutoFill';
import Layout from '../../components/common/Layout';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import FormField from '../../components/common/FormField';

const BRANCHES = Object.keys(RETIREMENT_AGES);
const BRANCH_OPTIONS = BRANCHES.map((b) => ({
  value: b,
  label: `${b} (retire at ${RETIREMENT_AGES[b]})`,
}));

const PensionFundProfile = () => {
  const { user, profile } = useAuth();
  const { prefill, isFromProfile, loading: masterLoading } = useAutoFill();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    employment_branch: 'Public Service',
    employer_name: '',
    months_of_service: '',
    monthly_contribution: '',
    total_member_contributions: '',
    total_employer_contributions: '',
    investment_returns: '',
  });
  const [prefilled, setPrefilled] = useState(false);

  const load = async () => {
    if (!user?.uid) return;
    try {
      const data = await getMyFundRecord(user.uid);
      setRecord(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user]);

  // Prefill form once master data is available, but only when creating a new record
  useEffect(() => {
    if (!masterLoading && !prefilled && !record) {
      setForm((f) => prefill(f));
      setPrefilled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterLoading, prefilled, record]);

  // When the user clicks Edit, populate the form from the existing record
  const startEditing = () => {
    if (!record) return;
    setForm({
      employment_branch: record.employment_branch || 'Public Service',
      employer_name: record.employer_name || '',
      months_of_service: String(record.months_of_service || ''),
      monthly_contribution: String(record.monthly_contribution || ''),
      total_member_contributions: String(record.total_member_contributions || ''),
      total_employer_contributions: String(record.total_employer_contributions || ''),
      investment_returns: String(record.investment_returns || ''),
    });
    setError('');
    setMessage('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError('');
    setMessage('');
  };

  const handleRecalculate = () => {
    const months = Number(form.months_of_service) || 0;
    const monthly = Number(form.monthly_contribution) || 0;

    if (months <= 0 || monthly <= 0) {
      setError('Enter months of service and monthly contribution first.');
      return;
    }

    const member = Math.round(months * monthly * 0.5);
    const employer = Math.round(months * monthly * 0.5);
    const investment = Math.round((member + employer) * 0.085);

    setForm((f) => ({
      ...f,
      total_member_contributions: String(member),
      total_employer_contributions: String(employer),
      investment_returns: String(investment),
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.employer_name.trim()) return setError('Please enter your employer name.');
    if (!form.months_of_service || Number(form.months_of_service) < 1)
      return setError('Please enter your months of service.');

    setSaving(true);
    try {
      await createFundRecord(user.uid, {
        employment_branch: form.employment_branch,
        employer_name: form.employer_name.trim(),
        months_of_service: Number(form.months_of_service),
        monthly_contribution: Number(form.monthly_contribution) || 0,
        total_member_contributions: Number(form.total_member_contributions) || 0,
        total_employer_contributions: Number(form.total_employer_contributions) || 0,
        investment_returns: Number(form.investment_returns) || 0,
      });

      await saveCitizenMasterData(user.uid, {
        employer_name: form.employer_name.trim(),
        employment_branch: form.employment_branch,
        months_of_service: Number(form.months_of_service),
        monthly_contribution: Number(form.monthly_contribution) || 0,
      });

      setMessage(
        isEditing
          ? '✓ Fund record updated. Staff will re-verify it.'
          : '✓ Fund record submitted. Pensions staff will verify it within 3 business days.'
      );
      setIsEditing(false);
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save fund record.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || masterLoading) {
    return (
      <Layout title="My Pension Fund Profile">
        <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
      </Layout>
    );
  }

  // ============ FORM (create or edit) ============
  if (!record || isEditing) {
    const estimatedTotal =
      (Number(form.total_member_contributions) || 0) +
      (Number(form.total_employer_contributions) || 0) +
      (Number(form.investment_returns) || 0);

    return (
      <Layout title={isEditing ? 'Edit Pension Fund Profile' : 'My Pension Fund Profile'}>
        <Card>
          <Alert type="info">
            Fields marked <strong>✓ from profile</strong> were auto-filled from your saved data.
          </Alert>

          {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
          {message && <Alert type="success" onClose={() => setMessage('')}>{message}</Alert>}

          <form onSubmit={handleSubmit}>
            <FormField
              label="Employment Branch"
              as="select"
              value={form.employment_branch}
              onChange={(v) => setForm({ ...form, employment_branch: v })}
              options={BRANCH_OPTIONS}
              required
              fromProfile={!isEditing && isFromProfile('employment_branch')}
            />

            <FormField
              label="Employer / Ministry"
              value={form.employer_name}
              onChange={(v) => setForm({ ...form, employer_name: v })}
              placeholder="e.g. Ministry of Education"
              required
              fromProfile={!isEditing && isFromProfile('employer_name')}
            />

            <FormField
              label="Months of Service"
              type="number"
              value={form.months_of_service}
              onChange={(v) => setForm({ ...form, months_of_service: v })}
              placeholder="e.g. 120"
              required
              fromProfile={!isEditing && isFromProfile('months_of_service')}
            />

            <FormField
              label="Monthly Contribution (M)"
              type="number"
              value={form.monthly_contribution}
              onChange={(v) => setForm({ ...form, monthly_contribution: v })}
              placeholder="e.g. 500"
              fromProfile={!isEditing && isFromProfile('monthly_contribution')}
            />

            <div style={{ background: '#f0f6ff', padding: 16, borderRadius: 6, marginBottom: 18 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 12,
              }}>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#003366' }}>
                  Total contributions to date
                </div>
                <button
                  type="button"
                  onClick={handleRecalculate}
                  style={{
                    background: '#0066cc',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  ↻ Estimate from months × monthly
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <FormField
                  label="Member Contributions (M)"
                  type="number"
                  value={form.total_member_contributions}
                  onChange={(v) => setForm({ ...form, total_member_contributions: v })}
                />
                <FormField
                  label="Employer Contributions (M)"
                  type="number"
                  value={form.total_employer_contributions}
                  onChange={(v) => setForm({ ...form, total_employer_contributions: v })}
                />
                <FormField
                  label="Investment Returns (M)"
                  type="number"
                  value={form.investment_returns}
                  onChange={(v) => setForm({ ...form, investment_returns: v })}
                />
              </div>

              <div style={{
                marginTop: 12,
                padding: '10px 14px',
                background: 'white',
                border: '1px solid #cce0ff',
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, color: '#666' }}>Estimated total fund credit:</span>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#003366' }}>
                  M {estimatedTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
              <button type="submit" disabled={saving} style={btnPrimary}>
                {saving
                  ? 'Saving...'
                  : isEditing
                  ? 'Save Changes'
                  : 'Submit for Verification'}
              </button>
              {isEditing ? (
                <button type="button" onClick={cancelEditing} style={btnSecondary}>
                  Cancel
                </button>
              ) : (
                <Link to="/pensions" style={btnSecondary}>Cancel</Link>
              )}
            </div>
          </form>
        </Card>
      </Layout>
    );
  }

  // ============ READ-ONLY VIEW (with Edit button) ============
  return (
    <Layout title="My Pension Fund Profile">
      {message && <Alert type="success" onClose={() => setMessage('')}>{message}</Alert>}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={mini}>Member</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#003366' }}>
              {profile?.full_name || '—'}
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>Member No: {record.member_number}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={mini}>Verification Status</div>
            <StatusBadge status={record.verification_status} />
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={startEditing} style={btnSecondary}>
            ✎ Edit Fund Record
          </button>
        </div>
      </Card>

      {record.verification_status === 'pending' && (
        <div style={{ marginTop: 16 }}>
          <Alert type="warning">Your fund record is awaiting verification.</Alert>
        </div>
      )}
      {record.verification_status === 'needs_info' && (
        <div style={{ marginTop: 16 }}>
          <Alert type="warning">
            Pensions Department requests more information: {record.verification_notes}
          </Alert>
        </div>
      )}
      {record.verification_status === 'verified' && (
        <div style={{ marginTop: 16 }}>
          <Alert type="success">Your fund record is verified.</Alert>
        </div>
      )}
      {record.verification_status === 'rejected' && (
        <div style={{ marginTop: 16 }}>
          <Alert type="error">Your record was rejected. Reason: {record.verification_notes}</Alert>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <Card title="Employment Details">
          <Row label="Employment Branch" value={record.employment_branch} />
          <Row label="Employer" value={record.employer_name || '—'} />
          <Row label="Months of Service" value={`${record.months_of_service || 0} months`} />
          <Row label="Monthly Contribution" value={`M ${(record.monthly_contribution || 0).toLocaleString()}`} />
        </Card>
      </div>

      <div style={{ marginTop: 20 }}>
        <Card title="Contribution Breakdown">
          <Row label="Member Contributions" value={`M ${(record.total_member_contributions || 0).toLocaleString()}`} />
          <Row label="Employer Contributions" value={`M ${(record.total_employer_contributions || 0).toLocaleString()}`} />
          <Row label="Investment Returns" value={`M ${(record.investment_returns || 0).toLocaleString()}`} />
          <Row label="Total Fund Credit" value={`M ${(record.total_fund_credit || 0).toLocaleString()}`} bold />
        </Card>
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/pension/statement" style={btnPrimary}>View Full Statement</Link>
        <Link to="/pensions" style={btnSecondary}>← Back to Pensions</Link>
      </div>
    </Layout>
  );
};

const Row = ({ label, value, bold }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between',
    padding: '10px 0', borderBottom: '1px solid #eee', fontSize: 14,
  }}>
    <span style={{ color: '#666' }}>{label}</span>
    <span style={{ fontWeight: bold ? 'bold' : 'normal', color: '#003366' }}>{value}</span>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    pending: { bg: '#ffcc00', color: '#000', label: 'Pending Verification' },
    needs_info: { bg: '#ff9933', color: '#fff', label: 'Info Requested' },
    verified: { bg: '#006600', color: '#fff', label: 'Verified' },
    rejected: { bg: '#cc0000', color: '#fff', label: 'Rejected' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '6px 14px', borderRadius: 20,
      fontSize: 12, fontWeight: 'bold',
    }}>
      {s.label}
    </span>
  );
};

const mini = { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 };
const btnPrimary = {
  background: '#003366', color: 'white', border: 'none',
  padding: '10px 18px', borderRadius: 6, fontSize: 14,
  fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
};
const btnSecondary = {
  background: 'white', color: '#003366', border: '1px solid #003366',
  padding: '10px 18px', borderRadius: 6, fontSize: 14,
  fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
};

export default PensionFundProfile;