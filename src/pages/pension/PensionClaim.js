import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { submitPensionClaim, saveCitizenMasterData, CLAIM_TYPES } from '../../firebase/db';
import { useAuth } from '../../contexts/AuthContext';
import useAutoFill from '../../hooks/useAutoFill';
import Layout from '../../components/common/Layout';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import FormField from '../../components/common/FormField';
import CloudinaryUpload from '../../components/common/CloudinaryUpload';

const CLAIM_OPTIONS = [
  { value: CLAIM_TYPES.RETIREMENT, label: 'Retirement Claim', desc: 'Claim your full pension fund when you reach retirement age.' },
  { value: CLAIM_TYPES.WITHDRAWAL, label: 'Withdrawal', desc: 'Withdraw your fund credit when leaving service before retirement.' },
  { value: CLAIM_TYPES.DEATH, label: 'Death Benefit Claim', desc: 'Claim on behalf of a deceased member.' },
  { value: CLAIM_TYPES.ILL_HEALTH, label: 'Ill-Health Retirement', desc: 'Retire early on medical grounds.' },
];

const PensionClaim = () => {
  const { user, profile } = useAuth();

  const [claimType, setClaimType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successRef, setSuccessRef] = useState('');
  const [prefilled, setPrefilled] = useState(false);

  // One combined form object so useAutoFill can populate it
  const [form, setForm] = useState({
    bank_account: '',
    employer_name: '',
    notes: '',
  });

  const [medicalReport, setMedicalReport] = useState(false);

  // Real file URLs for the death-claim documents
  const [deathCertificateUrl, setDeathCertificateUrl] = useState(null);
  const [proofOfRelationshipUrl, setProofOfRelationshipUrl] = useState(null);

  // Auto-fill from the citizen's profile — runs once on mount
  useAutoFill(profile, form, setForm);

  // Mark as prefilled for the "✓ from profile" badge
  useEffect(() => {
    if (profile && !prefilled) {
      const t = setTimeout(() => setPrefilled(true), 50);
      return () => clearTimeout(t);
    }
  }, [profile, prefilled]);

  const isFromProfile = (key) => {
    if (!prefilled || !profile) return false;
    const profileValue =
      key === 'bank_account' ? profile.bank_account?.account_number || profile.bank_account
      : key === 'employer_name' ? profile.employment?.employer_name || profile.employer_name
      : undefined;
    return Boolean(profileValue);
  };

  const employerRequired = claimType === CLAIM_TYPES.RETIREMENT || claimType === CLAIM_TYPES.WITHDRAWAL;

  const canSubmit =
    claimType &&
    form.bank_account.trim() &&
    (!employerRequired || form.employer_name.trim()) &&
    (claimType !== CLAIM_TYPES.ILL_HEALTH || medicalReport) &&
    (claimType !== CLAIM_TYPES.DEATH || (deathCertificateUrl && proofOfRelationshipUrl));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!claimType) return setError('Please select a claim type.');
    if (!form.bank_account.trim()) return setError('Please enter your bank account number.');
    if (employerRequired && !form.employer_name.trim()) return setError('Please enter your employer.');
    if (claimType === CLAIM_TYPES.ILL_HEALTH && !medicalReport)
      return setError('Please confirm you have a medical report.');
    if (claimType === CLAIM_TYPES.DEATH && !deathCertificateUrl)
      return setError('Please upload the certified death certificate.');
    if (claimType === CLAIM_TYPES.DEATH && !proofOfRelationshipUrl)
      return setError('Please upload proof of relationship to the deceased.');

    setSubmitting(true);
    try {
      const r = await submitPensionClaim({
        citizen_id: user.uid,
        citizen_name: profile.full_name,
        national_id: profile.national_id,
        claim_type: claimType,
        documents: {
          bank_account: form.bank_account,
          medical_report: medicalReport,
          death_certificate_url: deathCertificateUrl,
          proof_of_relationship_url: proofOfRelationshipUrl,
        },
        additional_details: { notes: form.notes },
        employer_name: form.employer_name,
      });

      await saveCitizenMasterData(user.uid, {
        bank_account: form.bank_account,
        employer_name: form.employer_name.trim(),
      });

      setSuccessRef(r.reference);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit claim.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successRef) {
    return (
      <Layout title="Claim Submitted">
        <Card>
          <div style={{ textAlign: 'center', padding: 30 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#d4edda', color: '#006600', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36, fontWeight: 'bold' }}>✓</div>
            <h2 style={{ color: '#006600', marginBottom: 8 }}>Claim Submitted Successfully</h2>
            <p style={{ color: '#666' }}>Your reference number is:</p>
            <p style={{ fontSize: 20, fontWeight: 'bold', color: '#003366', background: '#f0f6ff', padding: '12px 20px', borderRadius: 6, display: 'inline-block', marginTop: 4 }}>{successRef}</p>
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/pension/status" style={btnPrimary}>Track This Claim</Link>
              <Link to="/pensions" style={btnSecondary}>Back to Pensions</Link>
            </div>
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="Submit a Pension Claim">
      <Card>
        <Alert type="info">
          Fields marked <strong>✓ from profile</strong> were auto-filled from your saved data.
        </Alert>

        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#333', marginBottom: 4, fontWeight: 'bold' }}>Claim Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 8 }}>
              {CLAIM_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => setClaimType(opt.value)}
                  style={{
                    border: claimType === opt.value ? '2px solid #003366' : '1px solid #ddd',
                    background: claimType === opt.value ? '#f0f6ff' : 'white',
                    borderRadius: 8, padding: 16, cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#003366', marginBottom: 4 }}>{opt.label}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <FormField
            label="Bank Account Number"
            value={form.bank_account}
            onChange={(v) => setForm({ ...form, bank_account: v })}
            placeholder="e.g. 0123456789"
            required
            fromProfile={isFromProfile('bank_account')}
          />

          <FormField
            label={`Employer / Department${employerRequired ? '' : ' (optional)'}`}
            value={form.employer_name}
            onChange={(v) => setForm({ ...form, employer_name: v })}
            placeholder="e.g. Ministry of Education"
            required={employerRequired}
            fromProfile={isFromProfile('employer_name')}
          />

          {/* -------- ILL-HEALTH: checkbox (medical report is declared, not uploaded) -------- */}
          {claimType === CLAIM_TYPES.ILL_HEALTH && (
            <Checkbox
              checked={medicalReport}
              onChange={setMedicalReport}
              label="I have a supporting medical report from a registered doctor *"
            />
          )}

          {/* -------- DEATH: real uploads instead of checkboxes -------- */}
          {claimType === CLAIM_TYPES.DEATH && (
            <>
              <div style={{ marginBottom: 16 }}>
                <CloudinaryUpload
                  label="Upload the Certified Death Certificate (JPG, PNG, or PDF) *"
                  onUpload={(url) => setDeathCertificateUrl(url)}
                />
                {deathCertificateUrl && (
                  <div style={{ fontSize: 12, color: '#006600', fontWeight: 'bold', marginTop: 6 }}>
                    ✓ Death certificate uploaded
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <CloudinaryUpload
                  label="Upload Proof of Relationship (e.g. birth certificate, marriage certificate) *"
                  onUpload={(url) => setProofOfRelationshipUrl(url)}
                />
                {proofOfRelationshipUrl && (
                  <div style={{ fontSize: 12, color: '#006600', fontWeight: 'bold', marginTop: 6 }}>
                    ✓ Proof of relationship uploaded
                  </div>
                )}
              </div>
            </>
          )}

          <FormField
            label="Additional Notes (optional)"
            as="textarea"
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
            placeholder="Anything else you want the Pensions Department to know..."
          />

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <button type="submit" disabled={submitting || !canSubmit} style={{
              background: submitting || !canSubmit ? '#999' : '#003366',
              color: 'white', border: 'none', padding: '12px 24px',
              borderRadius: 6, fontSize: 15, fontWeight: 'bold',
              cursor: submitting || !canSubmit ? 'not-allowed' : 'pointer',
            }}>
              {submitting ? 'Submitting...' : 'Submit Claim'}
            </button>
            <Link to="/pensions" style={btnSecondary}>Cancel</Link>
          </div>
        </form>
      </Card>
    </Layout>
  );
};

const Checkbox = ({ checked, onChange, label }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#333' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  </div>
);

const btnPrimary = { background: '#003366', color: 'white', padding: '10px 18px', borderRadius: 6, textDecoration: 'none', fontSize: 14, fontWeight: 'bold' };
const btnSecondary = { background: 'white', color: '#003366', border: '1px solid #003366', padding: '10px 18px', borderRadius: 6, textDecoration: 'none', fontSize: 14 };

export default PensionClaim;