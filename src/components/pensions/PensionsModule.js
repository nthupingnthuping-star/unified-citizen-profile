import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  submitApplication,
  getMyApplications,
  resubmitApplication,
  getMyFundRecord,
  DEPARTMENTS,
  updateCitizenEmployment,
} from '../../firebase/db';
import { calculateAge, checkEligibility } from '../../firebase/eligibility';
import useAutoFill from '../../hooks/useAutoFill';
import Layout from '../common/Layout';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';
import FormField from '../common/FormField';
import CloudinaryUpload from '../common/CloudinaryUpload';
import EmploymentSection from '../common/EmploymentSection';
import RequestedInfoBanner from '../common/RequestedInfoBanner';
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

const EMPTY_EMPLOYMENT = {
  employer_name: '',
  employment_type: '',
  employee_number: '',
  monthly_salary: '',
  payslip_url: null,
};

// ============================================================
// HELPERS
// ============================================================
const getCitizenshipDisplay = (raw) => {
  const value = (raw || '').toLowerCase();
  if (value.includes('mosotho') || value.includes('citizen')) return 'Mosotho';
  if (value.includes('resident')) return 'Permanent resident';
  return 'Mosotho';
};

// Which type of pension fund does this citizen qualify for?
const getFundEligibility = (age, employment) => {
  const isGov = employment?.employment_type === 'Government';
  const isRetired = employment?.employment_type === 'Retired';
  const isPrivate = employment?.employment_type === 'Private sector';
  const isSelf = employment?.employment_type === 'Self-employed';

  // Still working in government = no pension yet (has Retirement Fund accruing)
  if (isGov && age < 60) {
    return {
      type: 'none_yet',
      label: 'Still employed — no payout yet',
      message: 'You are on the government payroll. You will qualify for the Retirement Fund when you retire.',
    };
  }

  // Retired government employee → Retirement Fund
  if ((isGov || isRetired) && age >= 55) {
    return {
      type: 'retirement',
      label: 'Retirement Fund',
      message: 'As a former Government employee, you qualify for the Retirement Fund — not Old Age Pension.',
    };
  }

  // Private sector or self-employed, 65+ → Old Age Pension
  if ((isPrivate || isSelf) && age >= 65) {
    return {
      type: 'old_age',
      label: 'Old Age Pension',
      message: 'As a private sector worker at 65+, you qualify for the Old Age Pension — not the Retirement Fund.',
    };
  }

  // Unemployed at 65+ → Old Age Pension
  if (employment?.employment_type === 'Unemployed' && age >= 65) {
    return {
      type: 'old_age',
      label: 'Old Age Pension',
      message: 'At 65+ with no current employment, you qualify for the Old Age Pension.',
    };
  }

  return {
    type: 'none_yet',
    label: 'Not eligible yet',
    message: 'You do not currently qualify for either pension fund.',
  };
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const PensionsModule = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const [applications, setApplications] = useState([]);
  const [fundRecord, setFundRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastSubmission, setLastSubmission] = useState(null);
  const [editingApplication, setEditingApplication] = useState(null);

  // ---------- OLD AGE ----------
  const [oldAge, setOldAge] = useState({
    employment: { ...EMPTY_EMPLOYMENT },
    bank_name: '',
    account_number: '',
    branch_code: '',
    account_holder: '',
    account_type: 'Cheque',
    chief_name: '',
    chief_confirmation_number: '',
    chief_letter_url: '',
    chief_confirmed: false,
    applying_for: 'self',
    applicant_name: '',
    applicant_id: '',
    applicant_relationship: '',
    truth_declaration: false,
    data_consent: false,
  });
  const [oldAgeTouched, setOldAgeTouched] = useState(false);

  // ---------- DISABILITY ----------
  const [disability, setDisability] = useState({
    disability_type: '',
    disability_description: '',
    doctor_name: '',
    clinic_name: '',
    diagnosis_date: '',
    employment: { ...EMPTY_EMPLOYMENT },
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
  const fundEligibility = getFundEligibility(age, profile?.employment);

  const fetchData = async () => {
    if (!profile) return;
    try {
      const [apps, fund] = await Promise.all([
        getMyApplications(profile.uid),
        getMyFundRecord(profile.uid),
      ]);
      setApplications(apps.filter((a) => a.department_id === DEPARTMENTS.PENSIONS));
      setFundRecord(fund);
    } catch (err) {
      console.error(err);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [profile]);

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

      if (data.employment && (data.employment.employer_name || data.employment.employment_type)) {
        try {
          await updateCitizenEmployment(profile.uid, data.employment);
        } catch (e) {
          console.warn('Could not save employment:', e);
        }
      }

      setMessage(`✓ Submitted: ${r.reference}`);
      setLastSubmission({
        reference: r.reference,
        serviceType,
        bankName: data.payment?.bank_name,
        accountNumber: data.payment?.account_number,
        accountHolder: data.payment?.account_holder,
      });
      fetchData();
    } catch (err) {
      setMessage(`✗ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (app) => {
    setEditingApplication(app);
    setMessage('');
    setLastSubmission(null);
    if (app.service_type === 'Old Age Pension') setActiveTab('oldage');
    else if (app.service_type === 'Disability Grant') setActiveTab('disability');
  };

  const handleCancelEdit = () => {
    setEditingApplication(null);
  };

  const handleResubmitted = () => {
    setEditingApplication(null);
    setActiveTab('dashboard');
    setMessage('✓ Your updated application has been resubmitted for review.');
    fetchData();
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

  const needsInfo = applications.filter(
    (a) => a.status === 'processing' && (a.notes || a.rejection_reason)
  );

  return (
    <VerifiedGuard serviceName={t('pensions_department')}>
      <Layout title={t('pensions_department')}>
        <div className="module-root">
          <div className="module-header">
            <h1>Pensions Department</h1>
            <p>Fund management, retirement, old age and disability services</p>
          </div>

          <Alert type="info">{t('verified_by_home_affairs')}</Alert>

          {/* 🔔 Fund eligibility banner — shows which fund the citizen qualifies for */}
          {fundEligibility && (
            <div style={{
              background:
                fundEligibility.type === 'retirement' ? '#e6f4ea'
                : fundEligibility.type === 'old_age' ? '#f0f6ff'
                : '#f9f9f9',
              border: `1px solid ${
                fundEligibility.type === 'retirement' ? '#a8d5b8'
                : fundEligibility.type === 'old_age' ? '#cce0ff'
                : '#e0e0e0'
              }`,
              borderRadius: 10,
              padding: 16,
              marginBottom: 20,
            }}>
              <div style={{
                fontSize: 13,
                fontWeight: 'bold',
                color: fundEligibility.type === 'retirement' ? '#006600'
                     : fundEligibility.type === 'old_age' ? '#003366'
                     : '#666',
                marginBottom: 6,
              }}>
                🎯 Your pension eligibility: <u>{fundEligibility.label}</u>
              </div>
              <div style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: fundEligibility.type === 'retirement' ? '#006600'
                     : fundEligibility.type === 'old_age' ? '#003366'
                     : '#666',
              }}>
                {fundEligibility.message}
                {fundEligibility.type === 'retirement' && (
                  <>
                    {' '}
                    <Link to="/pension/fund" style={{ fontWeight: 'bold', color: '#006600' }}>
                      Go to your Fund Profile →
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

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
                <p style={{ color: '#666', margin: '0 0 10px 0' }}>Reference number:</p>
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
                      💰 Payout account
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
            <>
              {needsInfo.map((a) => (
                <RequestedInfoBanner
                  key={a.id}
                  application={a}
                  onEdit={() => handleStartEdit(a)}
                />
              ))}

              <div className="module-card">
                <div className="module-section-title">My Pension Applications</div>
                <Table
                  headers={['Reference', 'Service', 'Status', 'Submitted', 'Action']}
                  rows={applications.map((a) => [
                    a.application_reference,
                    a.service_type,
                    <Badge color={statusColor(a.status)}>{a.status}</Badge>,
                    a.submitted_at?.toDate?.().toLocaleDateString() || '—',
                    a.status === 'processing' && (a.notes || a.rejection_reason) ? (
                      <button
                        onClick={() => handleStartEdit(a)}
                        style={{
                          background: 'linear-gradient(135deg, #ffcc00 0%, #ff9900 100%)',
                          color: '#003366',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(255, 153, 0, 0.35)',
                        }}
                      >
                        ✎ Edit & Resubmit
                      </button>
                    ) : a.status === 'approved' || a.status === 'completed' ? (
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
                  emptyMessage="No applications yet."
                />
              </div>
            </>
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

              {/* 🔗 Show fund record summary if it exists */}
              {fundRecord && (
                <div style={{
                  marginTop: 24,
                  background: '#f9fbff',
                  border: '1px solid #cce0ff',
                  borderRadius: 10,
                  padding: 16,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#003366', marginBottom: 10 }}>
                    💼 Your pension fund summary
                  </div>
                  <SummaryRow label="Member Number" value={fundRecord.member_number} mono />
                  <SummaryRow label="Employer" value={fundRecord.employer_name} />
                  <SummaryRow label="Months of Service" value={`${fundRecord.months_of_service || 0} months`} />
                  <SummaryRow label="Total Fund Credit" value={`M ${(fundRecord.total_fund_credit || 0).toLocaleString()}`} />
                  <SummaryRow label="Status" value={fundRecord.verification_status} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'oldage' && (
            <OldAgePensionForm
              form={oldAge}
              setForm={(next) => { setOldAge(next); setOldAgeTouched(true); }}
              profile={profile}
              age={age}
              eligibility={oldAgeEligibility}
              fundEligibility={fundEligibility}
              submitting={loading}
              existingApplication={
                editingApplication?.service_type === 'Old Age Pension'
                  ? editingApplication
                  : null
              }
              onSubmit={submit}
              onCancelEdit={handleCancelEdit}
              onResubmitted={handleResubmitted}
            />
          )}

          {activeTab === 'disability' && (
            <DisabilityGrantForm
              form={disability}
              setForm={(next) => { setDisability(next); setDisabilityTouched(true); }}
              profile={profile}
              submitting={loading}
              existingApplication={
                editingApplication?.service_type === 'Disability Grant'
                  ? editingApplication
                  : null
              }
              onSubmit={submit}
              onCancelEdit={handleCancelEdit}
              onResubmitted={handleResubmitted}
            />
          )}
        </div>
      </Layout>
    </VerifiedGuard>
  );
};

// ============================================================
// OLD-AGE PENSION FORM (create or edit)
// ============================================================
const OldAgePensionForm = ({
  form,
  setForm,
  profile,
  age,
  eligibility,
  fundEligibility,
  submitting,
  existingApplication = null,
  onSubmit,
  onCancelEdit,
  onResubmitted,
}) => {
  const isEditing = !!existingApplication;
  const update = (key, value) => setForm({ ...form, [key]: value });

  const [resubmitting, setResubmitting] = useState(false);
  useAutoFill(profile, form, setForm);

  const handleBankChange = (bankName) => {
    const bank = BANK_OPTIONS.find((b) => b.value === bankName);
    setForm({ ...form, bank_name: bankName, branch_code: bank?.branch || '' });
  };

  const eligible = eligibility?.eligible;
  const isGovernmentEmployee = form.employment?.employment_type === 'Government';
  const isRetirementFundEligible = fundEligibility?.type === 'retirement';
  const blocked = isGovernmentEmployee || isRetirementFundEligible;

  const canSubmit =
    eligible &&
    !blocked &&
    form.employment?.employment_type &&
    form.employment?.employer_name?.trim() &&
    form.bank_name &&
    form.account_number.trim() &&
    form.account_holder.trim() &&
    form.truth_declaration &&
    form.data_consent &&
    (!form.chief_confirmed || (form.chief_name.trim() && form.chief_letter_url)) &&
    (form.applying_for !== 'other' ||
      (form.applicant_name && form.applicant_id && form.applicant_relationship));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      scheme: 'Old Age Pension',
      age_at_application: age,
      employment: form.employment,
      payment: {
        bank_name: form.bank_name,
        account_number: form.account_number,
        branch_code: form.branch_code,
        account_holder: form.account_holder,
        account_type: form.account_type,
      },
      chief_confirmation: form.chief_confirmed
        ? {
            chief_name: form.chief_name,
            confirmation_number: form.chief_confirmation_number,
            letter_url: form.chief_letter_url,
          }
        : null,
      applying_for: form.applying_for,
      on_behalf_of:
        form.applying_for === 'other'
          ? {
              full_name: form.applicant_name,
              national_id: form.applicant_id,
              relationship: form.applicant_relationship,
            }
          : null,
      declarations: {
        truth: form.truth_declaration,
        data_consent: form.data_consent,
        declared_at: new Date().toISOString(),
      },
    };

    if (isEditing) {
      setResubmitting(true);
      try {
        await resubmitApplication(existingApplication.id, payload);
        if (onResubmitted) onResubmitted();
      } catch (err) {
        alert('Failed to resubmit: ' + err.message);
      } finally {
        setResubmitting(false);
      }
    } else {
      await onSubmit('Old Age Pension', payload);
    }
  };

  return (
    <div className="module-card">
      {isEditing && (
        <div style={{
          background: '#fff8e0',
          border: '2px solid #ffcc00',
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: '#7a5a00', marginBottom: 6 }}>
            ✎ Editing — {existingApplication.application_reference}
          </div>
          <div style={{ fontSize: 13, color: '#7a5a00', lineHeight: 1.6, marginBottom: 10 }}>
            <strong>What Pensions needs:</strong>{' '}
            {existingApplication.notes || existingApplication.rejection_reason}
          </div>
          <button
            type="button"
            onClick={onCancelEdit}
            style={{
              background: 'transparent',
              border: '1px solid #7a5a00',
              color: '#7a5a00',
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Cancel editing
          </button>
        </div>
      )}

      <div className="module-section-title">
        {isEditing ? 'Update Old Age Pension Application' : 'Old Age Pension Application'}
      </div>

      {!isEditing && (
        <Alert type="info">
          Lesotho Old Age Pension is available to citizens aged{' '}
          <strong>65 years and above</strong>.
        </Alert>
      )}

      {/* ⛔ Government employee block */}
      {isGovernmentEmployee && (
        <div style={{
          background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)',
          color: 'white',
          borderRadius: 12,
          padding: 24,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⛔</div>
          <h2 style={{ margin: '0 0 10px 0', fontSize: 20, color: 'white' }}>
            You cannot apply for Old Age Pension
          </h2>
          <p style={{ margin: '0 0 16px 0', fontSize: 14, opacity: 0.95, lineHeight: 1.6 }}>
            As a <strong>Government employee</strong>, you receive a civil-service
            pension funded by the taxpayer. Old Age Pension is reserved for
            citizens <strong>not</strong> on the government payroll.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/pension/fund" style={{
              background: 'white',
              color: '#8b0000',
              padding: '10px 20px',
              borderRadius: 999,
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: 13,
            }}>
              Go to Pension Fund →
            </Link>
            <button
              type="button"
              onClick={() => update('employment', { ...form.employment, employment_type: '' })}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.4)',
                padding: '10px 20px',
                borderRadius: 999,
                fontWeight: 'bold',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              I selected this by mistake
            </button>
          </div>
        </div>
      )}

      {/* ⛔ Retirement Fund block */}
      {!isGovernmentEmployee && isRetirementFundEligible && (
        <div style={{
          background: '#e6f4ea',
          border: '1px solid #a8d5b8',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🏦</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 17, color: '#006600' }}>
            You qualify for the Retirement Fund — not Old Age Pension
          </h3>
          <p style={{ margin: '0 0 14px 0', fontSize: 13, color: '#006600', lineHeight: 1.6 }}>
            {fundEligibility.message}
          </p>
          <Link to="/pension/fund" style={{
            display: 'inline-block',
            background: '#006600',
            color: 'white',
            padding: '10px 22px',
            borderRadius: 999,
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: 13,
          }}>
            Go to my Fund Profile →
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* 1 · APPLICANT */}
        <div className="module-section">
          <div className="module-section-title">1 · Applicant</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 'bold', flexShrink: 0,
              overflow: 'hidden',
            }}>
              {profile?.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile?.full_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (profile?.full_name || '?').charAt(0).toUpperCase()
              )}
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
              <div style={{ fontSize: 13, color: '#666' }}>
                Citizenship: <strong>{getCitizenshipDisplay(profile?.citizenship_status)}</strong>
              </div>
              {eligible && !blocked && (
                <div style={{
                  display: 'inline-block', marginTop: 8,
                  background: '#d4edda', color: '#006600',
                  padding: '4px 12px', borderRadius: 12,
                  fontSize: 12, fontWeight: 'bold',
                }}>
                  ✓ Eligible (age {age})
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
              <FormField label="Full Name" value={form.applicant_name} onChange={(v) => update('applicant_name', v)} required />
              <FormField label="National ID" value={form.applicant_id} onChange={(v) => update('applicant_id', v)} required />
              <FormField label="Relationship" as="select" value={form.applicant_relationship} onChange={(v) => update('applicant_relationship', v)} options={RELATIONSHIP_OPTIONS} required />
            </div>
          )}
        </div>

        {/* 2 · EMPLOYMENT (reusable) */}
        <EmploymentSection
          value={form.employment}
          onChange={(employment) => update('employment', employment)}
        />

        {/* 3 · PAYOUT ACCOUNT */}
        <div className="module-section">
          <div className="module-section-title">3 · Payout account</div>
          <PayoutInfoBanner />
          <FormField label="Bank / Mobile Money" as="select" value={form.bank_name} onChange={handleBankChange} options={BANK_OPTIONS} required />
          <FormField label="Account Number" value={form.account_number} onChange={(v) => update('account_number', v)} placeholder="e.g. 0123456789" required />
          <FormField label="Branch Code" value={form.branch_code} onChange={(v) => update('branch_code', v)} />
          <FormField label="Account Holder Name" value={form.account_holder} onChange={(v) => update('account_holder', v)} required />
          <FormField label="Account Type" as="select" value={form.account_type} onChange={(v) => update('account_type', v)} options={ACCOUNT_TYPE_OPTIONS} />
          <PayoutSummary bankName={form.bank_name} accountHolder={form.account_holder} accountNumber={form.account_number} accountType={form.account_type} />
        </div>

        {/* 4 · CHIEF */}
        <div className="module-section">
          <div className="module-section-title">4 · Chief's confirmation (where applicable)</div>
          <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 12 }}>
            If your Chief has certified this application, enter their details below and upload a photo or scan of the signed letter.
          </p>
          <Checkbox checked={form.chief_confirmed} onChange={(v) => update('chief_confirmed', v)} label="My Chief has certified this application" />
          {form.chief_confirmed && (
            <div style={{ marginTop: 12 }}>
              <FormField label="Chief's Full Name *" value={form.chief_name} onChange={(v) => update('chief_name', v)} required />
              <FormField label="Chief's Confirmation Number" value={form.chief_confirmation_number} onChange={(v) => update('chief_confirmation_number', v)} placeholder="Optional" />
              <CloudinaryUpload label="Upload the signed Chief's Letter (JPG, PNG, or PDF) *" onUpload={(url) => update('chief_letter_url', url)} />
            </div>
          )}
        </div>

        {/* 5 · DECLARATIONS */}
        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">5 · Declarations</div>
          <Checkbox checked={form.truth_declaration} onChange={(v) => update('truth_declaration', v)} label="I declare that the information provided is true and correct." />
          <Checkbox checked={form.data_consent} onChange={(v) => update('data_consent', v)} label="I consent to a data verification against Home Affairs, the Ministry of Finance, and RSL." />
        </div>

        <SubmitButton
          canSubmit={canSubmit && !resubmitting}
          submitting={submitting || resubmitting}
          label={
            blocked ? 'Not eligible'
            : isEditing ? 'Resubmit Application'
            : 'Submit Application'
          }
        />
      </form>
    </div>
  );
};

// ============================================================
// DISABILITY GRANT FORM
// ============================================================
const DisabilityGrantForm = ({
  form,
  setForm,
  profile,
  submitting,
  existingApplication = null,
  onSubmit,
  onCancelEdit,
  onResubmitted,
}) => {
  const isEditing = !!existingApplication;
  const update = (key, value) => setForm({ ...form, [key]: value });

  const [resubmitting, setResubmitting] = useState(false);
  useAutoFill(profile, form, setForm);

  const handleBankChange = (bankName) => {
    const bank = BANK_OPTIONS.find((b) => b.value === bankName);
    setForm({ ...form, bank_name: bankName, branch_code: bank?.branch || '' });
  };

  const canSubmit =
    form.disability_type &&
    form.employment?.employment_type &&
    form.employment?.employer_name?.trim() &&
    form.bank_name &&
    form.account_number.trim() &&
    form.account_holder.trim() &&
    form.has_medical_report &&
    form.truth_declaration &&
    form.data_consent;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      scheme: 'Disability Grant',
      disability: {
        type: form.disability_type,
        description: form.disability_description,
      },
      medical: {
        doctor_name: form.doctor_name,
        clinic_name: form.clinic_name,
        diagnosis_date: form.diagnosis_date,
        has_medical_report: form.has_medical_report,
      },
      employment: form.employment,
      payment: {
        bank_name: form.bank_name,
        account_number: form.account_number,
        branch_code: form.branch_code,
        account_holder: form.account_holder,
        account_type: form.account_type,
      },
      declarations: {
        truth: form.truth_declaration,
        data_consent: form.data_consent,
        declared_at: new Date().toISOString(),
      },
    };

    if (isEditing) {
      setResubmitting(true);
      try {
        await resubmitApplication(existingApplication.id, payload);
        if (onResubmitted) onResubmitted();
      } catch (err) {
        alert('Failed to resubmit: ' + err.message);
      } finally {
        setResubmitting(false);
      }
    } else {
      await onSubmit('Disability Grant', payload);
    }
  };

  return (
    <div className="module-card">
      {isEditing && (
        <div style={{
          background: '#fff8e0',
          border: '2px solid #ffcc00',
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: '#7a5a00', marginBottom: 6 }}>
            ✎ Editing — {existingApplication.application_reference}
          </div>
          <div style={{ fontSize: 13, color: '#7a5a00', lineHeight: 1.6, marginBottom: 10 }}>
            <strong>What Pensions needs:</strong>{' '}
            {existingApplication.notes || existingApplication.rejection_reason}
          </div>
          <button
            type="button"
            onClick={onCancelEdit}
            style={{
              background: 'transparent',
              border: '1px solid #7a5a00',
              color: '#7a5a00',
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Cancel editing
          </button>
        </div>
      )}

      <div className="module-section-title">
        {isEditing ? 'Update Disability Grant Application' : 'Disability Grant Application'}
      </div>

      {!isEditing && (
        <Alert type="info">
          The Disability Grant is available to citizens with a certified disability. A medical report
          from a registered doctor or clinic is required.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* 1 · APPLICANT */}
        <div className="module-section">
          <div className="module-section-title">1 · Applicant</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 'bold', flexShrink: 0,
              overflow: 'hidden',
            }}>
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt={profile?.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (profile?.full_name || '?').charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#003366' }}>{profile?.full_name}</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>National ID: {profile?.national_id}</div>
              <div style={{ fontSize: 13, color: '#666' }}>
                Citizenship: <strong>{getCitizenshipDisplay(profile?.citizenship_status)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 2 · DISABILITY DETAILS */}
        <div className="module-section">
          <div className="module-section-title">2 · Disability details</div>
          <FormField label="Type of Disability" as="select" value={form.disability_type} onChange={(v) => update('disability_type', v)} options={DISABILITY_TYPE_OPTIONS} required />
          <FormField label="Description (optional)" as="textarea" value={form.disability_description} onChange={(v) => update('disability_description', v)} placeholder="Briefly describe the disability" />
          <FormField label="Doctor / Practitioner Name" value={form.doctor_name} onChange={(v) => update('doctor_name', v)} placeholder="e.g. Dr T. Mokoena" />
          <FormField label="Clinic / Hospital" value={form.clinic_name} onChange={(v) => update('clinic_name', v)} placeholder="e.g. Queen Mamohato Memorial Hospital" />
          <FormField label="Date of Diagnosis" type="date" value={form.diagnosis_date} onChange={(v) => update('diagnosis_date', v)} />
        </div>

        {/* 3 · EMPLOYMENT (reusable) */}
        <EmploymentSection value={form.employment} onChange={(employment) => update('employment', employment)} />

        {/* 4 · PAYOUT ACCOUNT */}
        <div className="module-section">
          <div className="module-section-title">4 · Payout account</div>
          <PayoutInfoBanner />
          <FormField label="Bank / Mobile Money" as="select" value={form.bank_name} onChange={handleBankChange} options={BANK_OPTIONS} required />
          <FormField label="Account Number" value={form.account_number} onChange={(v) => update('account_number', v)} placeholder="e.g. 0123456789" required />
          <FormField label="Branch Code" value={form.branch_code} onChange={(v) => update('branch_code', v)} />
          <FormField label="Account Holder Name" value={form.account_holder} onChange={(v) => update('account_holder', v)} required />
          <FormField label="Account Type" as="select" value={form.account_type} onChange={(v) => update('account_type', v)} options={ACCOUNT_TYPE_OPTIONS} />
          <PayoutSummary bankName={form.bank_name} accountHolder={form.account_holder} accountNumber={form.account_number} accountType={form.account_type} />
        </div>

        {/* 5 · DECLARATIONS */}
        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">5 · Declarations</div>
          <Checkbox checked={form.has_medical_report} onChange={(v) => update('has_medical_report', v)} label="I have a supporting medical report from a registered doctor or clinic." />
          <Checkbox checked={form.truth_declaration} onChange={(v) => update('truth_declaration', v)} label="I declare that the information provided is true and correct." />
          <Checkbox checked={form.data_consent} onChange={(v) => update('data_consent', v)} label="I consent to a data verification against Home Affairs and the Ministry of Health." />
        </div>

        <SubmitButton
          canSubmit={canSubmit && !resubmitting}
          submitting={submitting || resubmitting}
          label={isEditing ? 'Resubmit Application' : 'Submit Application'}
        />
      </form>
    </div>
  );
};

// ============================================================
// SHARED PIECES
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
    Make sure the account details are correct. Wrong details delay your payments.
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
      {!isMobile && <SummaryRow label="Account Type" value={accountType || '—'} />}
    </div>
  );
};

const SummaryRow = ({ label, value, mono }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 0', gap: 12, fontSize: 13, color: '#333',
  }}>
    <span style={{ color: '#666' }}>{label}:</span>
    <span style={{
      fontWeight: 'bold', color: '#003366',
      fontFamily: mono ? 'monospace' : 'inherit',
      letterSpacing: mono ? 1 : 0, textAlign: 'right', wordBreak: 'break-all',
    }}>
      {value}
    </span>
  </div>
);

const PensionTile = ({ to, icon, title, desc }) => (
  <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
    <div style={{
      border: '1px solid #cce0ff', borderRadius: 10, padding: 20, background: 'white',
      cursor: 'pointer', height: '100%', boxSizing: 'border-box',
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
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#333', cursor: 'pointer' }}>
    <input type="radio" checked={checked} onChange={onChange} />
    {label}
  </label>
);

const Checkbox = ({ checked, onChange, label }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#333', cursor: 'pointer', lineHeight: 1.4 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3 }} />
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
        color: 'white', border: 'none', padding: '12px 26px',
        borderRadius: 999, fontSize: 15, fontWeight: 'bold',
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
      background: 'white', color: '#003366', border: '1px solid #003366',
      padding: '11px 24px', borderRadius: 999, fontSize: 14,
      textDecoration: 'none', display: 'inline-block',
    }}>
      Cancel
    </Link>
  </div>
);

export default PensionsModule;