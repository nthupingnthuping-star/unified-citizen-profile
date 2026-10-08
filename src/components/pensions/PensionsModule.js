import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  submitApplication,
  getMyApplications,
  DEPARTMENTS,
} from '../../firebase/db';
import { calculateAge, checkEligibility } from '../../firebase/eligibility';
import Layout from '../common/Layout';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';
import FormField from '../common/FormField';
import VerifiedGuard from '../citizen/VerifiedGuard';
import '../../styles/module.css';

// ============================================================
// CONSTANTS
// ============================================================
const BANK_OPTIONS = [
  { value: '', label: '— Select bank —', branch: '', type: '' },
  { value: 'Standard Lesotho Bank', label: 'Standard Lesotho Bank', branch: '060167', type: 'bank' },
  { value: 'Nedbank Lesotho', label: 'Nedbank Lesotho', branch: '330162', type: 'bank' },
  { value: 'First National Bank Lesotho', label: 'First National Bank Lesotho', branch: '280361', type: 'bank' },
  { value: 'Lesotho PostBank', label: 'Lesotho PostBank', branch: '700100', type: 'bank' },
  { value: 'Vodacom M-Pesa', label: 'Vodacom M-Pesa (mobile money)', branch: 'MPESA', type: 'mobile' },
  { value: 'EcoCash Lesotho', label: 'EcoCash Lesotho (mobile money)', branch: 'ECOCASH', type: 'mobile' },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'Cheque', label: 'Cheque / Current account' },
  { value: 'Savings', label: 'Savings account' },
  { value: 'M-Pesa', label: 'M-Pesa wallet' },
  { value: 'EcoCash', label: 'EcoCash wallet' },
];

const DISABILITY_TYPE_OPTIONS = [
  { value: '', label: '— Select type —' },
  { value: 'Physical - mobility', label: 'Physical — mobility impairment' },
  { value: 'Physical - amputation', label: 'Physical — amputation' },
  { value: 'Visual', label: 'Visual impairment / blindness' },
  { value: 'Hearing', label: 'Hearing impairment / deafness' },
  { value: 'Speech', label: 'Speech impairment' },
  { value: 'Intellectual', label: 'Intellectual disability' },
  { value: 'Mental health', label: 'Mental health condition' },
  { value: 'Chronic illness', label: 'Chronic illness' },
  { value: 'Multiple', label: 'Multiple disabilities' },
  { value: 'Other', label: 'Other (describe below)' },
];

const RELATIONSHIP_OPTIONS = [
  { value: '', label: '— Select relationship —' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Son', label: 'Son' },
  { value: 'Daughter', label: 'Daughter' },
  { value: 'Sibling', label: 'Brother / Sister' },
  { value: 'Grandchild', label: 'Grandchild' },
  { value: 'Legal guardian', label: 'Legal guardian' },
  { value: 'Other', label: 'Other' },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const PensionsModule = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastSubmission, setLastSubmission] = useState(null);

  // Old-age pension state
  const [oldAge, setOldAge] = useState({
    bank_name: '',
    account_number: '',
    branch_code: '',
    account_holder: '',
    account_type: 'Cheque',
    chief_name: '',
    chief_confirmation_number: '',
    chief_confirmed: false,
    applying_for: 'self',
    applicant_name: '',
    applicant_id: '',
    applicant_relationship: '',
    truth_declaration: false,
    data_consent: false,
  });
  const [oldAgeTouched, setOldAgeTouched] = useState(false);

  // Disability grant state
  const [disability, setDisability] = useState({
    disability_type: '',
    disability_description: '',
    doctor_name: '',
    clinic_name: '',
    diagnosis_date: '',
    bank_name: '',
    account_number: '',
    branch_code: '',
    account_holder: '',
    account_type: 'Cheque',
    has_medical_report: false,
    truth_declaration: false,
    data_consent: false,
  });
  const [disabilityTouched, setDisabilityTouched] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (!oldAgeTouched) {
      setOldAge((s) => ({
        ...s,
        account_holder: s.account_holder || profile.full_name || '',
        applicant_name: s.applicant_name || profile.full_name || '',
        applicant_id: s.applicant_id || profile.national_id || '',
      }));
    }
    if (!disabilityTouched) {
      setDisability((s) => ({
        ...s,
        account_holder: s.account_holder || profile.full_name || '',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, oldAgeTouched, disabilityTouched]);

  const age = calculateAge(profile?.date_of_birth);
  const oldAgeEligibility = checkEligibility('OLD_AGE_PENSION', profile?.date_of_birth);

  const fetchApplications = async () => {
    if (!profile) return;
    try {
      const apps = await getMyApplications(profile.uid);
      setApplications(apps.filter((a) => a.department_id === DEPARTMENTS.PENSIONS));
    } catch (err) {
      console.error(err);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchApplications(); }, [profile]);

  const submit = async (serviceType, data) => {
    setLoading(true);
    setMessage('');
    setLastSubmission(null);
    try {
      const r = await submitApplication({
        citizen_id: profile.uid,
        citizen_name: profile.full_name,
        citizen_national_id: profile.national_id,
        department_id: DEPARTMENTS.PENSIONS,
        service_type: serviceType,
        application_data: data,
      });
      setMessage(`✓ Submitted: ${r.reference}`);
      setLastSubmission({
        reference: r.reference,
        serviceType,
        bankName: data.payment?.bank_name,
        accountNumber: data.payment?.account_number,
        accountHolder: data.payment?.account_holder,
      });
      fetchApplications();
    } catch (err) {
      setMessage(`✗ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOldAgeSubmit = async (e) => {
    e.preventDefault();
    if (!oldAgeEligibility.eligible) return setMessage('✗ You are not yet eligible for Old Age Pension.');
    if (!oldAge.bank_name) return setMessage('✗ Please select your bank.');
    if (!oldAge.account_number.trim()) return setMessage('✗ Please enter your account number.');
    if (!oldAge.account_holder.trim()) return setMessage('✗ Please enter the account holder name.');
    if (!oldAge.truth_declaration || !oldAge.data_consent)
      return setMessage('✗ Please tick both declaration boxes before submitting.');
    if (oldAge.applying_for === 'other') {
      if (!oldAge.applicant_name.trim() || !oldAge.applicant_id.trim() || !oldAge.applicant_relationship.trim())
        return setMessage('✗ Please complete the applicant (on behalf) details.');
    }
    if (oldAge.chief_confirmed && !oldAge.chief_name.trim())
      return setMessage('✗ Please enter the Chief\'s name if you ticked the Chief confirmation box.');

    await submit('Old Age Pension', {
      scheme: 'Old Age Pension',
      age_at_application: age,
      payment: {
        bank_name: oldAge.bank_name,
        account_number: oldAge.account_number,
        branch_code: oldAge.branch_code,
        account_holder: oldAge.account_holder,
        account_type: oldAge.account_type,
      },
      chief_confirmation: oldAge.chief_confirmed
        ? { chief_name: oldAge.chief_name, confirmation_number: oldAge.chief_confirmation_number }
        : null,
      applying_for: oldAge.applying_for,
      on_behalf_of: oldAge.applying_for === 'other'
        ? {
            full_name: oldAge.applicant_name,
            national_id: oldAge.applicant_id,
            relationship: oldAge.applicant_relationship,
          }
        : null,
      declarations: {
        truth: oldAge.truth_declaration,
        data_consent: oldAge.data_consent,
        declared_at: new Date().toISOString(),
      },
    });
  };

  const handleDisabilitySubmit = async (e) => {
    e.preventDefault();
    if (!disability.disability_type) return setMessage('✗ Please select a disability type.');
    if (!disability.bank_name) return setMessage('✗ Please select your bank.');
    if (!disability.account_number.trim()) return setMessage('✗ Please enter your account number.');
    if (!disability.account_holder.trim()) return setMessage('✗ Please enter the account holder name.');
    if (!disability.has_medical_report) return setMessage('✗ Please confirm you have a supporting medical report.');
    if (!disability.truth_declaration || !disability.data_consent)
      return setMessage('✗ Please tick both declaration boxes before submitting.');

    await submit('Disability Grant', {
      scheme: 'Disability Grant',
      disability: {
        type: disability.disability_type,
        description: disability.disability_description,
      },
      medical: {
        doctor_name: disability.doctor_name,
        clinic_name: disability.clinic_name,
        diagnosis_date: disability.diagnosis_date,
        has_medical_report: disability.has_medical_report,
      },
      payment: {
        bank_name: disability.bank_name,
        account_number: disability.account_number,
        branch_code: disability.branch_code,
        account_holder: disability.account_holder,
        account_type: disability.account_type,
      },
      declarations: {
        truth: disability.truth_declaration,
        data_consent: disability.data_consent,
        declared_at: new Date().toISOString(),
      },
    });
  };

  const statusColor = (s) => {
    if (s === 'approved' || s === 'completed') return 'green';
    if (s === 'rejected' || s === 'cancelled') return 'red';
    if (s === 'processing') return 'yellow';
    return 'gray';
  };

  const TABS = [
    { key: 'dashboard', label: 'My Applications' },
    { key: 'fund', label: 'Fund & Retirement' },
    { key: 'oldage', label: 'Old Age Pension' },
    { key: 'disability', label: 'Disability Grant' },
  ];

  return (
    <VerifiedGuard serviceName={t('pensions_department')}>
      <Layout title={t('pensions_department')}>
        <div className="module-root">
          <div className="module-header">
            <h1>Pensions Department</h1>
            <p>Fund management, retirement, old age and disability services</p>
          </div>

          <Alert type="info">{t('verified_by_home_affairs')}</Alert>

          <div className="module-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`module-tab ${activeTab === tab.key ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {message && (
            <Alert
              type={message.startsWith('✓') ? 'success' : 'error'}
              onClose={() => setMessage('')}
            >
              {message}
            </Alert>
          )}

          {lastSubmission && (
            <div className="module-card" style={{ marginBottom: 20 }}>
              <div style={{ textAlign: 'center', padding: 10 }}>
                <h3 style={{ color: '#006600', marginTop: 0, marginBottom: 8 }}>
                  Application received
                </h3>
                <p style={{ color: '#666', margin: '0 0 10px 0' }}>
                  Reference number:
                </p>
                <div style={{
                  display: 'inline-block',
                  background: '#f0f6ff',
                  color: '#003366',
                  padding: '10px 20px',
                  borderRadius: 6,
                  fontSize: 20,
                  fontWeight: 'bold',
                  letterSpacing: 1,
                  fontFamily: 'monospace',
                }}>
                  {lastSubmission.reference}
                </div>

                {lastSubmission.bankName && (
                  <div style={{
                    marginTop: 16,
                    background: '#f8fbff',
                    border: '1px solid #cce0ff',
                    borderRadius: 6,
                    padding: 14,
                    textAlign: 'left',
                    maxWidth: 420,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    fontSize: 13,
                    color: '#333',
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#003366', marginBottom: 8, fontSize: 13 }}>
                      💰 Payout account (as submitted)
                    </div>
                    <SummaryRow label="Bank / Mobile" value={lastSubmission.bankName} />
                    <SummaryRow label="Account Holder" value={lastSubmission.accountHolder} />
                    <SummaryRow label="Account Number" value={lastSubmission.accountNumber} mono />
                  </div>
                )}

                <p style={{ color: '#666', marginTop: 14, fontSize: 13 }}>
                  Expected review within <strong>14 working days</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="module-card">
              <div className="module-section-title">My Pension Applications</div>
              <Table
                headers={['Reference', 'Service', 'Status', 'Submitted', 'Action']}
                rows={applications.map((a) => [
                  a.application_reference,
                  a.service_type,
                  <Badge color={statusColor(a.status)}>{t(a.status)}</Badge>,
                  a.submitted_at?.toDate?.().toLocaleDateString() || '—',
                  a.status === 'approved' || a.status === 'completed' ? (
                    <Link
                      to={`/certificate/${a.application_reference}`}
                      style={{ color: '#003366', fontWeight: 'bold', textDecoration: 'underline', fontSize: 13 }}
                    >
                      View Document
                    </Link>
                  ) : (
                    <span style={{ color: '#999', fontSize: 12 }}>—</span>
                  ),
                ])}
                emptyMessage={t('no_applications_yet')}
              />
            </div>
          )}

          {activeTab === 'fund' && (
            <div className="module-card">
              <div className="module-section-title">Fund & Retirement Services</div>
              <p style={{ color: '#555', marginTop: 0, marginBottom: 20 }}>
                Access your pension fund statement, retirement projection calculator,
                claim submission, beneficiary management, and claim tracking.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16,
              }}>
                <PensionTile to="/pension/fund" icon="🗂️" title="My Fund Profile" desc="Declare and manage your pension fund record" />
                <PensionTile to="/pension/statement" icon="📄" title="Fund Statement" desc="View your current fund balance and contribution history" />
                <PensionTile to="/pension/projection" icon="📈" title="Retirement Projection" desc="Estimate your pension value at retirement" />
                <PensionTile to="/pension/claims" icon="📝" title="Submit a Claim" desc="Retirement, withdrawal, death, or ill-health claim" />
                <PensionTile to="/pension/beneficiaries" icon="👥" title="Beneficiaries" desc="Manage your nominated beneficiaries" />
                <PensionTile to="/pension/status" icon="🔍" title="Claim Status" desc="Track the progress of your submitted claims" />
              </div>
            </div>
          )}

          {activeTab === 'oldage' && (
            <OldAgePensionForm
              form={oldAge}
              setForm={(next) => { setOldAge(next); setOldAgeTouched(true); }}
              profile={profile}
              age={age}
              eligibility={oldAgeEligibility}
              submitting={loading}
              onSubmit={handleOldAgeSubmit}
            />
          )}

          {activeTab === 'disability' && (
            <DisabilityGrantForm
              form={disability}
              setForm={(next) => { setDisability(next); setDisabilityTouched(true); }}
              profile={profile}
              submitting={loading}
              onSubmit={handleDisabilitySubmit}
            />
          )}
        </div>
      </Layout>
    </VerifiedGuard>
  );
};

// ============================================================
// OLD-AGE PENSION FORM
// ============================================================
const OldAgePensionForm = ({ form, setForm, profile, age, eligibility, submitting, onSubmit }) => {
  const update = (key, value) => setForm({ ...form, [key]: value });

  const handleBankChange = (bankName) => {
    const bank = BANK_OPTIONS.find((b) => b.value === bankName);
    setForm({ ...form, bank_name: bankName, branch_code: bank?.branch || '' });
  };

  const eligible = eligibility?.eligible;

  const canSubmit =
    eligible &&
    form.bank_name &&
    form.account_number.trim() &&
    form.account_holder.trim() &&
    form.truth_declaration &&
    form.data_consent &&
    (form.applying_for !== 'other' ||
      (form.applicant_name && form.applicant_id && form.applicant_relationship));

  return (
    <div className="module-card">
      <div className="module-section-title">Old Age Pension Application</div>

      <Alert type="info">
        Lesotho Old Age Pension is available to citizens aged <strong>65 years and above</strong>.
      </Alert>

      <form onSubmit={onSubmit}>
        <div className="module-section">
          <div className="module-section-title">1 · Applicant</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 'bold', flexShrink: 0,
              letterSpacing: 1,
            }}>
              {(profile?.full_name || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#003366' }}>
                {profile?.full_name}
              </div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                National ID: {profile?.national_id}
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>
                Date of Birth: {profile?.date_of_birth} · Age: <strong>{age}</strong>
              </div>
              {eligible ? (
                <div style={{
                  display: 'inline-block', marginTop: 8,
                  background: '#d4edda', color: '#006600',
                  padding: '4px 12px', borderRadius: 12,
                  fontSize: 12, fontWeight: 'bold',
                }}>
                  ✓ Eligible (age {age})
                </div>
              ) : (
                <div style={{
                  display: 'inline-block', marginTop: 8,
                  background: '#fff3cd', color: '#856404',
                  padding: '4px 12px', borderRadius: 12,
                  fontSize: 12, fontWeight: 'bold',
                }}>
                  Not yet eligible — must be 65+
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>
              Who is this application for?
            </label>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <Radio
                checked={form.applying_for === 'self'}
                onChange={() => update('applying_for', 'self')}
                label="For myself"
              />
              <Radio
                checked={form.applying_for === 'other'}
                onChange={() => update('applying_for', 'other')}
                label="On behalf of someone else (next-of-kin)"
              />
            </div>
          </div>

          {form.applying_for === 'other' && (
            <div style={{ marginTop: 18, padding: 16, background: '#f9f9f9', borderRadius: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#003366', marginBottom: 10 }}>
                Applicant (on behalf of)
              </div>
              <FormField
                label="Full Name"
                value={form.applicant_name}
                onChange={(v) => update('applicant_name', v)}
                required
              />
              <FormField
                label="National ID"
                value={form.applicant_id}
                onChange={(v) => update('applicant_id', v)}
                required
              />
              <FormField
                label="Relationship"
                as="select"
                value={form.applicant_relationship}
                onChange={(v) => update('applicant_relationship', v)}
                options={RELATIONSHIP_OPTIONS}
                required
              />
            </div>
          )}
        </div>

        <div className="module-section">
          <div className="module-section-title">2 · Payout account</div>
          <PayoutInfoBanner />
          <FormField
            label="Bank / Mobile Money"
            as="select"
            value={form.bank_name}
            onChange={handleBankChange}
            options={BANK_OPTIONS}
            required
          />
          <FormField
            label="Account Number"
            value={form.account_number}
            onChange={(v) => update('account_number', v)}
            placeholder="e.g. 0123456789"
            required
          />
          <FormField
            label="Branch Code"
            value={form.branch_code}
            onChange={(v) => update('branch_code', v)}
          />
          <FormField
            label="Account Holder Name"
            value={form.account_holder}
            onChange={(v) => update('account_holder', v)}
            required
          />
          <FormField
            label="Account Type"
            as="select"
            value={form.account_type}
            onChange={(v) => update('account_type', v)}
            options={ACCOUNT_TYPE_OPTIONS}
          />

          <PayoutSummary
            bankName={form.bank_name}
            accountHolder={form.account_holder}
            accountNumber={form.account_number}
            accountType={form.account_type}
          />
        </div>

        <div className="module-section">
          <div className="module-section-title">3 · Chief's confirmation (where applicable)</div>
          <Checkbox
            checked={form.chief_confirmed}
            onChange={(v) => update('chief_confirmed', v)}
            label="My Chief has certified this application"
          />
          {form.chief_confirmed && (
            <div style={{ marginTop: 12 }}>
              <FormField
                label="Chief's Full Name"
                value={form.chief_name}
                onChange={(v) => update('chief_name', v)}
              />
              <FormField
                label="Chief's Confirmation Number"
                value={form.chief_confirmation_number}
                onChange={(v) => update('chief_confirmation_number', v)}
                placeholder="Optional"
              />
            </div>
          )}
        </div>

        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">4 · Declarations</div>
          <Checkbox
            checked={form.truth_declaration}
            onChange={(v) => update('truth_declaration', v)}
            label="I declare that the information provided is true and correct."
          />
          <Checkbox
            checked={form.data_consent}
            onChange={(v) => update('data_consent', v)}
            label="I consent to a data verification against Home Affairs, the Ministry of Finance, and RSL."
          />
        </div>

        <SubmitButton canSubmit={canSubmit} submitting={submitting} label="Submit Application" />
      </form>
    </div>
  );
};

// ============================================================
// DISABILITY GRANT FORM
// ============================================================
const DisabilityGrantForm = ({ form, setForm, profile, submitting, onSubmit }) => {
  const update = (key, value) => setForm({ ...form, [key]: value });

  const handleBankChange = (bankName) => {
    const bank = BANK_OPTIONS.find((b) => b.value === bankName);
    setForm({ ...form, bank_name: bankName, branch_code: bank?.branch || '' });
  };

  const canSubmit =
    form.disability_type &&
    form.bank_name &&
    form.account_number.trim() &&
    form.account_holder.trim() &&
    form.has_medical_report &&
    form.truth_declaration &&
    form.data_consent;

  return (
    <div className="module-card">
      <div className="module-section-title">Disability Grant Application</div>

      <Alert type="info">
        The Disability Grant is available to citizens with a certified disability. A medical report
        from a registered doctor or clinic is required.
      </Alert>

      <form onSubmit={onSubmit}>
        <div className="module-section">
          <div className="module-section-title">1 · Applicant</div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#003366' }}>
            {profile?.full_name}
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
            National ID: {profile?.national_id}
          </div>
        </div>

        <div className="module-section">
          <div className="module-section-title">2 · Disability details</div>
          <FormField
            label="Type of Disability"
            as="select"
            value={form.disability_type}
            onChange={(v) => update('disability_type', v)}
            options={DISABILITY_TYPE_OPTIONS}
            required
          />
          <FormField
            label="Description (optional)"
            as="textarea"
            value={form.disability_description}
            onChange={(v) => update('disability_description', v)}
            placeholder="Describe the disability briefly if you selected 'Other' or want to add detail"
          />
          <FormField
            label="Doctor / Practitioner Name"
            value={form.doctor_name}
            onChange={(v) => update('doctor_name', v)}
            placeholder="e.g. Dr T. Mokoena"
          />
          <FormField
            label="Clinic / Hospital"
            value={form.clinic_name}
            onChange={(v) => update('clinic_name', v)}
            placeholder="e.g. Queen Mamohato Memorial Hospital"
          />
          <FormField
            label="Date of Diagnosis"
            type="date"
            value={form.diagnosis_date}
            onChange={(v) => update('diagnosis_date', v)}
          />
        </div>

        <div className="module-section">
          <div className="module-section-title">3 · Payout account</div>
          <PayoutInfoBanner />
          <FormField
            label="Bank / Mobile Money"
            as="select"
            value={form.bank_name}
            onChange={handleBankChange}
            options={BANK_OPTIONS}
            required
          />
          <FormField
            label="Account Number"
            value={form.account_number}
            onChange={(v) => update('account_number', v)}
            placeholder="e.g. 0123456789"
            required
          />
          <FormField
            label="Branch Code"
            value={form.branch_code}
            onChange={(v) => update('branch_code', v)}
          />
          <FormField
            label="Account Holder Name"
            value={form.account_holder}
            onChange={(v) => update('account_holder', v)}
            required
          />
          <FormField
            label="Account Type"
            as="select"
            value={form.account_type}
            onChange={(v) => update('account_type', v)}
            options={ACCOUNT_TYPE_OPTIONS}
          />

          <PayoutSummary
            bankName={form.bank_name}
            accountHolder={form.account_holder}
            accountNumber={form.account_number}
            accountType={form.account_type}
          />
        </div>

        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">4 · Declarations</div>
          <Checkbox
            checked={form.has_medical_report}
            onChange={(v) => update('has_medical_report', v)}
            label="I have a supporting medical report from a registered doctor or clinic."
          />
          <Checkbox
            checked={form.truth_declaration}
            onChange={(v) => update('truth_declaration', v)}
            label="I declare that the information provided is true and correct."
          />
          <Checkbox
            checked={form.data_consent}
            onChange={(v) => update('data_consent', v)}
            label="I consent to a data verification against Home Affairs and the Ministry of Health."
          />
        </div>

        <SubmitButton canSubmit={canSubmit} submitting={submitting} label="Submit Application" />
      </form>
    </div>
  );
};

// ============================================================
// SHARED PIECES (payout — pension-specific, NOT PaymentBlock)
// ============================================================
const PayoutInfoBanner = () => (
  <div style={{
    background: '#e6f4ea',
    border: '1px solid #a8d5b8',
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
    fontSize: 13,
    color: '#006600',
    lineHeight: 1.6,
  }}>
    <strong>💰 This is where you will receive your pension payments.</strong>
    <br />
    Please make sure the account details below are correct. If they are wrong,
    your pension payments may be delayed or sent to the wrong account.
  </div>
);

const PayoutSummary = ({ bankName, accountHolder, accountNumber, accountType }) => {
  const hasAny = bankName || accountHolder || accountNumber;
  if (!hasAny) return null;

  const bank = BANK_OPTIONS.find((b) => b.value === bankName);
  const isMobile = bank?.type === 'mobile';

  return (
    <div style={{
      marginTop: 16,
      background: '#f8fbff',
      border: '1px solid #cce0ff',
      borderRadius: 6,
      padding: 16,
    }}>
      <div style={{ fontSize: 13, fontWeight: 'bold', color: '#003366', marginBottom: 10 }}>
        {isMobile ? '📱 Payout summary — Mobile money' : '💳 Payout summary — Bank account'}
      </div>
      <SummaryRow label="Bank / Service" value={bankName || '—'} />
      <SummaryRow label="Account Holder" value={accountHolder || '—'} />
      <SummaryRow label="Account Number" value={accountNumber || '—'} mono />
      {!isMobile && (
        <SummaryRow label="Account Type" value={accountType || '—'} />
      )}
      {isMobile && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#7a5a00' }}>
          Mobile money payouts will be sent to the number above. Please make sure
          the number is registered in the account holder's name.
        </div>
      )}
    </div>
  );
};

const SummaryRow = ({ label, value, mono }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    gap: 12,
    fontSize: 13,
    color: '#333',
  }}>
    <span style={{ color: '#666' }}>{label}:</span>
    <span style={{
      fontWeight: 'bold',
      color: '#003366',
      fontFamily: mono ? 'monospace' : 'inherit',
      letterSpacing: mono ? 1 : 0,
      textAlign: 'right',
      wordBreak: 'break-all',
    }}>
      {value}
    </span>
  </div>
);

// ============================================================
// REUSABLE PIECES
// ============================================================
const PensionTile = ({ to, icon, title, desc }) => (
  <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
    <div style={{
      border: '1px solid #cce0ff',
      borderRadius: 10,
      padding: 20,
      background: 'white',
      cursor: 'pointer',
      height: '100%',
      boxSizing: 'border-box',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 24px rgba(0, 51, 102, 0.15)';
        e.currentTarget.style.borderColor = '#0055aa';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#cce0ff';
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 'bold', color: '#003366', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#666' }}>{desc}</div>
    </div>
  </Link>
);

const Radio = ({ checked, onChange, label }) => (
  <label style={{
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 14, color: '#333', cursor: 'pointer',
  }}>
    <input type="radio" checked={checked} onChange={onChange} />
    {label}
  </label>
);

const Checkbox = ({ checked, onChange, label }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      fontSize: 14,
      color: '#333',
      cursor: 'pointer',
      lineHeight: 1.4,
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 3 }}
      />
      <span>{label}</span>
    </label>
  </div>
);

const SubmitButton = ({ canSubmit, submitting, label = 'Submit Application' }) => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
    <button
      type="submit"
      disabled={!canSubmit || submitting}
      style={{
        background: canSubmit && !submitting
          ? 'linear-gradient(135deg, #003366 0%, #0055aa 100%)'
          : '#999',
        color: 'white',
        border: 'none',
        padding: '12px 26px',
        borderRadius: 999,
        fontSize: 15,
        fontWeight: 'bold',
        cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
        boxShadow: canSubmit && !submitting ? '0 4px 14px rgba(0, 51, 102, 0.25)' : 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (canSubmit && !submitting) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 22px rgba(0, 51, 102, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = canSubmit && !submitting
          ? '0 4px 14px rgba(0, 51, 102, 0.25)'
          : 'none';
      }}
    >
      {submitting ? 'Submitting...' : label}
    </button>
    <Link to="/pensions" style={{
      background: 'white',
      color: '#003366',
      border: '1px solid #003366',
      padding: '11px 24px',
      borderRadius: 999,
      fontSize: 14,
      textDecoration: 'none',
      display: 'inline-block',
    }}>
      Cancel
    </Link>
  </div>
);

export default PensionsModule;