import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { submitPensionClaim, saveCitizenMasterData, CLAIM_TYPES } from '../../firebase/db';
import { useAuth } from '../../contexts/AuthContext';
import { useAutoFill } from '../../hooks/useAutoFill';
import Layout from '../../components/common/Layout';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import FormField from '../../components/common/FormField';

const CLAIM_OPTIONS = [
  { value: CLAIM_TYPES.RETIREMENT, label: 'Retirement Claim', desc: 'Claim your full pension fund when you reach retirement age.' },
  { value: CLAIM_TYPES.WITHDRAWAL, label: 'Withdrawal', desc: 'Withdraw your fund credit when leaving service before retirement.' },
  { value: CLAIM_TYPES.DEATH, label: 'Death Benefit Claim', desc: 'Claim on behalf of a deceased member.' },
  { value: CLAIM_TYPES.ILL_HEALTH, label: 'Ill-Health Retirement', desc: 'Retire early on medical grounds.' },
];

const PensionClaim = () => {
  const { user, profile } = useAuth();
  const { prefill, isFromProfile, loading: masterLoading } = useAutoFill();

  const [claimType, setClaimType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successRef, setSuccessRef] = useState('');

  const [bankAccount, setBankAccount] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [notes, setNotes] = useState('');
  const [medicalReport, setMedicalReport] = useState(false);
  const [deathCertificate, setDeathCertificate] = useState(false);
  const [proofOfRelationship, setProofOfRelationship] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!masterLoading && !prefilled) {
      const filled = prefill({ bank_account: '', employer_name: '' });
      setBankAccount(filled.bank_account || '');
      setEmployerName(filled.employer_name || '');
      setPrefilled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterLoading, prefilled]);

  const employerRequired = claimType === CLAIM_TYPES.RETIREMENT || claimType === CLAIM_TYPES.WITHDRAWAL;

  const canSubmit =
    claimType &&
    bankAccount.trim() &&
    (!employerRequired || employerName.trim()) &&
    (claimType !== CLAIM_TYPES.ILL_HEALTH || medicalReport) &&
    (claimType !== CLAIM_TYPES.DEATH || (deathCertificate && proofOfRelationship));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!claimType) return setError('Please select a claim type.');
    if (!bankAccount.trim()) return setError('Please enter your bank account number.');
    if (employerRequired && !employerName.trim()) return setError('Please enter your employer.');
    if (claimType === CLAIM_TYPES.ILL_HEALTH && !medicalReport) return setError('Please confirm you have a medical report.');
    if (claimType === CLAIM_TYPES.DEATH && !deathCertificate) return setError('Please confirm you have the death certificate.');
    if (claimType === CLAIM_TYPES.DEATH && !proofOfRelationship) return setError('Please confirm proof of relationship.');

    setSubmitting(true);
    try {
      const r = await submitPensionClaim({
        citizen_id: user.uid,
        citizen_name: profile.full_name,
        national_id: profile.national_id,
        claim_type: claimType,
        documents: {
          bank_account: bankAccount,
          medical_report: medicalReport,
          death_certificate: deathCertificate,
          proof_of_relationship: proofOfRelationship,
        },
        additional_details: { notes },
        employer_name: employerName,
      });

      await saveCitizenMasterData(user.uid, {
        bank_account: bankAccount,
        employer_name: employerName.trim(),
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
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: '#d4edda', color: '#006600',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 36, fontWeight: 'bold',
            }}>✓</div>
            <h2 style={{ color: '#006600', marginBottom: 8 }}>Claim Submitted Successfully</h2>
            <p style={{ color: '#666' }}>Your reference number is:</p>
            <p style={{
              fontSize: 20, fontWeight: 'bold', color: '#003366',
              background: '#f0f6ff', padding: '12px 20px', borderRadius: 6,
              display: 'inline-block', marginTop: 4,
            }}>{successRef}</p>
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
            value={bankAccount}
            onChange={setBankAccount}
            placeholder="e.g. 0123456789"
            required
            fromProfile={isFromProfile('bank_account')}
          />

          <FormField
            label={`Employer / Department${employerRequired ? '' : ' (optional)'}`}
            value={employerName}
            onChange={setEmployerName}
            placeholder="e.g. Ministry of Education"
            required={employerRequired}
            fromProfile={isFromProfile('employer_name')}
          />

          {claimType === CLAIM_TYPES.ILL_HEALTH && (
            <Checkbox checked={medicalReport} onChange={setMedicalReport} label="I have a supporting medical report from a registered doctor *" />
          )}
          {claimType === CLAIM_TYPES.DEATH && (
            <>
              <Checkbox checked={deathCertificate} onChange={setDeathCertificate} label="I have the certified death certificate *" />
              <Checkbox checked={proofOfRelationship} onChange={setProofOfRelationship} label="I can prove my relationship to the deceased *" />
            </>
          )}

          <FormField
            label="Additional Notes (optional)"
            as="textarea"
            value={notes}
            onChange={setNotes}
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

const btnPrimary = {
  background: '#003366', color: 'white', padding: '10px 18px',
  borderRadius: 6, textDecoration: 'none', fontSize: 14, fontWeight: 'bold',
};
const btnSecondary = {
  background: 'white', color: '#003366', border: '1px solid #003366',
  padding: '10px 18px', borderRadius: 6, textDecoration: 'none', fontSize: 14,
};

export default PensionClaim;