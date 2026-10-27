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
  { value: '', labelKey: 'pension_select_bank', branch: '', type: '' },
  { value: 'Standard Lesotho Bank', label: 'Standard Lesotho Bank', branch: '060167', type: 'bank' },
  { value: 'Nedbank Lesotho', label: 'Nedbank Lesotho', branch: '330162', type: 'bank' },
  { value: 'First National Bank Lesotho', label: 'First National Bank Lesotho', branch: '280361', type: 'bank' },
  { value: 'Lesotho PostBank', label: 'Lesotho PostBank', branch: '700100', type: 'bank' },
  { value: 'Vodacom M-Pesa', label: 'Vodacom M-Pesa (mobile money)', branch: 'MPESA', type: 'mobile' },
  { value: 'EcoCash Lesotho', label: 'EcoCash Lesotho (mobile money)', branch: 'ECOCASH', type: 'mobile' },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'Cheque', labelKey: 'pension_account_cheque' },
  { value: 'Savings', labelKey: 'pension_account_savings' },
  { value: 'M-Pesa', labelKey: 'pension_account_mpesa' },
  { value: 'EcoCash', labelKey: 'pension_account_ecocash' },
];

const DISABILITY_TYPE_OPTIONS = [
  { value: '', labelKey: 'pension_select_type' },
  { value: 'Physical - mobility', labelKey: 'pension_dis_mobility' },
  { value: 'Physical - amputation', labelKey: 'pension_dis_amputation' },
  { value: 'Visual', labelKey: 'pension_dis_visual' },
  { value: 'Hearing', labelKey: 'pension_dis_hearing' },
  { value: 'Speech', labelKey: 'pension_dis_speech' },
  { value: 'Intellectual', labelKey: 'pension_dis_intellectual' },
  { value: 'Mental health', labelKey: 'pension_dis_mental' },
  { value: 'Chronic illness', labelKey: 'pension_dis_chronic' },
  { value: 'Multiple', labelKey: 'pension_dis_multiple' },
  { value: 'Other', labelKey: 'pension_dis_other' },
];

const RELATIONSHIP_OPTIONS = [
  { value: '', labelKey: 'pension_select_relationship' },
  { value: 'Spouse', labelKey: 'pension_rel_spouse' },
  { value: 'Son', labelKey: 'pension_rel_son' },
  { value: 'Daughter', labelKey: 'pension_rel_daughter' },
  { value: 'Sibling', labelKey: 'pension_rel_sibling' },
  { value: 'Grandchild', labelKey: 'pension_rel_grandchild' },
  { value: 'Legal guardian', labelKey: 'pension_rel_guardian' },
  { value: 'Other', labelKey: 'pension_rel_other' },
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
const getCitizenshipDisplay = (raw, t) => {
  const value = (raw || '').toLowerCase();
  if (value.includes('mosotho') || value.includes('citizen')) return 'Mosotho';
  if (value.includes('resident')) return t ? t('traffic_permanent_resident') : 'Permanent resident';
  return 'Mosotho';
};

const getFundEligibility = (age, employment, t) => {
  const isGov = employment?.employment_type === 'Government';
  const isRetired = employment?.employment_type === 'Retired';
  const isPrivate = employment?.employment_type === 'Private sector';
  const isSelf = employment?.employment_type === 'Self-employed';

  if (isGov && age < 60) {
    return { type: 'none_yet', labelKey: 'pension_fund_none_label', messageKey: 'pension_fund_none_still_employed' };
  }
  if ((isGov || isRetired) && age >= 55) {
    return { type: 'retirement', labelKey: 'pension_fund_retirement_label', messageKey: 'pension_fund_retirement_message' };
  }
  if ((isPrivate || isSelf) && age >= 65) {
    return { type: 'old_age', labelKey: 'pension_fund_old_age_label', messageKey: 'pension_fund_old_age_message' };
  }
  if (employment?.employment_type === 'Unemployed' && age >= 65) {
    return { type: 'old_age', labelKey: 'pension_fund_old_age_label', messageKey: 'pension_fund_old_age_unemployed_message' };
  }
  return { type: 'none_yet', labelKey: 'pension_fund_none_eligible_label', messageKey: 'pension_fund_none_eligible_message' };
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

  const [oldAge, setOldAge] = useState({
    employment: { ...EMPTY_EMPLOYMENT },
    bank_name: '', account_number: '', branch_code: '', account_holder: '', account_type: 'Cheque',
    chief_name: '', chief_confirmation_number: '', chief_letter_url: '', chief_confirmed: false,
    applying_for: 'self', applicant_name: '', applicant_id: '', applicant_relationship: '',
    truth_declaration: false, data_consent: false,
  });
  const [oldAgeTouched, setOldAgeTouched] = useState(false);

  const [disability, setDisability] = useState({
    disability_type: '', disability_description: '', doctor_name: '', clinic_name: '', diagnosis_date: '',
    medical_report_url: '',
    employment: { ...EMPTY_EMPLOYMENT },
    bank_name: '', account_number: '', branch_code: '', account_holder: '', account_type: 'Cheque',
    has_medical_report: false, truth_declaration: false, data_consent: false,
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
  }, [profile, oldAgeTouched, disabilityTouched]);

  const age = calculateAge(profile?.date_of_birth);
  const oldAgeEligibility = checkEligibility('OLD_AGE_PENSION', profile?.date_of_birth);
  const fundEligibility = getFundEligibility(age, profile?.employment, t);

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

      setMessage(`✓ ${t('submitted')}: ${r.reference}`);
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

  const handleCancelEdit = () => setEditingApplication(null);

  const handleResubmitted = () => {
    setEditingApplication(null);
    setActiveTab('dashboard');
    setMessage(`✓ ${t('pension_resubmitted_ok')}`);
    fetchData();
  };

  const statusColor = (s) => {
    if (s === 'approved' || s === 'completed') return 'green';
    if (s === 'rejected' || s === 'cancelled') return 'red';
    if (s === 'processing') return 'yellow';
    return 'gray';
  };

  const TABS = [
    { key: 'dashboard', label: t('my_applications_tab') },
    { key: 'fund', label: t('fund_retirement_tab') },
    { key: 'oldage', label: t('old_age_pension_tab') },
    { key: 'disability', label: t('disability_grant_tab') },
  ];

  const needsInfo = applications.filter(
    (a) => a.status === 'processing' && (a.notes || a.rejection_reason)
  );

  return (
    <VerifiedGuard serviceName={t('pensions_department')}>
      <Layout title={t('pensions_department')}>
        <div className="module-root">
          <div className="module-header">
            <h1>{t('pensions_department')}</h1>
            <p>{t('pension_subtitle')}</p>
          </div>

          <Alert type="info">{t('verified_by_home_affairs')}</Alert>

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
                🎯 {t('pension_eligibility_header')} <u>{t(fundEligibility.labelKey)}</u>
              </div>
              <div style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: fundEligibility.type === 'retirement' ? '#006600'
                     : fundEligibility.type === 'old_age' ? '#003366'
                     : '#666',
              }}>
                {t(fundEligibility.messageKey)}
                {fundEligibility.type === 'retirement' && (
                  <>
                    {' '}
                    <Link to="/pension/fund" style={{ fontWeight: 'bold', color: '#006600' }}>
                      {t('pension_go_to_fund')} →
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
                  {t('pension_application_received')}
                </h3>
                <p style={{ color: '#666', margin: '0 0 10px 0' }}>{t('pension_reference_label')}</p>
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
                      💰 {t('pension_payout_account_title')}
                    </div>
                    <SummaryRow label={t('pension_bank_service')} value={lastSubmission.bankName} />
                    <SummaryRow label={t('account_holder')} value={lastSubmission.accountHolder} />
                    <SummaryRow label={t('account_number')} value={lastSubmission.accountNumber} mono />
                  </div>
                )}

                <p style={{ color: '#666', marginTop: 14, fontSize: 13 }}>
                  {t('pension_expected_review')} <strong>{t('pension_review_days')}</strong>.
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
                <div className="module-section-title">{t('pension_my_apps')}</div>
                <Table
                  headers={[
                    t('reference'),
                    t('service'),
                    t('status'),
                    t('submitted'),
                    t('action'),
                  ]}
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
                        {t('edit_and_resubmit')}
                      </button>
                    ) : a.status === 'approved' || a.status === 'completed' ? (
                      <Link
                        to={`/certificate/${a.application_reference}`}
                        style={{ color: '#003366', fontWeight: 'bold', textDecoration: 'underline', fontSize: 13 }}
                      >
                        {t('view_certificate')}
                      </Link>
                    ) : (
                      <span style={{ color: '#999', fontSize: 12 }}>—</span>
                    ),
                  ])}
                  emptyMessage={t('no_applications_yet')}
                />
              </div>
            </>
          )}

          {activeTab === 'fund' && (
            <div className="module-card">
              <div className="module-section-title">{t('pension_fund_services')}</div>
              <p style={{ color: '#555', marginTop: 0, marginBottom: 20 }}>
                {t('pension_fund_intro')}
              </p>

              {/* NEW: Vertical List instead of Tiles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <PensionLink to="/pension/fund" icon="🗂️" title="Pension Fund Profile" desc={t('pension_tile_profile_desc')} />
                <PensionLink to="/pension/statement" icon="📄" title="Pension Statement" desc={t('pension_tile_statement_desc')} />
                <PensionLink to="/pension/projection" icon="📈" title="Retirement Projection" desc={t('pension_tile_projection_desc')} />
                <PensionLink to="/pension/claims" icon="📝" title="Submit a Claim" desc={t('pension_tile_claim_desc')} />
                <PensionLink to="/pension/beneficiaries" icon="👥" title="Beneficiaries" desc={t('pension_tile_beneficiaries_desc')} />
                <PensionLink to="/pension/status" icon="🔍" title="Claim Status" desc={t('pension_tile_status_desc')} />
              </div>

              {fundRecord && (
                <div style={{
                  marginTop: 24,
                  background: '#f9fbff',
                  border: '1px solid #cce0ff',
                  borderRadius: 10,
                  padding: 16,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#003366', marginBottom: 10 }}>
                    💼 {t('pension_fund_summary')}
                  </div>
                  <SummaryRow label={t('pension_member_number')} value={fundRecord.member_number} mono />
                  <SummaryRow label={t('employer')} value={fundRecord.employer_name} />
                  <SummaryRow label={t('pension_months_service')} value={`${fundRecord.months_of_service || 0} ${t('months')}`} />
                  <SummaryRow label={t('pension_total_credit')} value={`M ${(fundRecord.total_fund_credit || 0).toLocaleString()}`} />
                  <SummaryRow label={t('status')} value={fundRecord.verification_status} />
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
// PENSION LINK (Replaces Tile)
// ============================================================
const PensionLink = ({ to, icon, title, desc }) => (
  <Link to={to} style={{ textDecoration: 'none' }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16,
      transition: 'all 0.2s ease', cursor: 'pointer',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#0055aa';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 51, 102, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{desc}</div>
      </div>
      <div style={{ color: '#0055aa', fontSize: 18, fontWeight: 'bold' }}>→</div>
    </div>
  </Link>
);

// ============================================================
// OLD-AGE PENSION FORM
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
  const { t } = useLanguage();
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
        alert(t('pension_resubmit_failed') + err.message);
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
            ✎ {t('edit_banner')} — {existingApplication.application_reference}
          </div>
          <div style={{ fontSize: 13, color: '#7a5a00', lineHeight: 1.6, marginBottom: 10 }}>
            <strong>{t('pension_what_needs')}</strong>{' '}
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
            {t('cancel_editing')}
          </button>
        </div>
      )}

      <div className="module-section-title">
        {isEditing ? t('pension_update_old_age') : t('pension_old_age_app')}
      </div>

      {!isEditing && (
        <Alert type="info">{t('pension_old_age_info')}</Alert>
      )}

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
            {t('pension_cannot_apply_title')}
          </h2>
          <p style={{ margin: '0 0 16px 0', fontSize: 14, opacity: 0.95, lineHeight: 1.6 }}>
            {t('pension_cannot_apply_body')}
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
              {t('pension_go_to_fund')} →
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
              {t('pension_selected_by_mistake')}
            </button>
          </div>
        </div>
      )}

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
            {t('pension_retirement_title')}
          </h3>
          <p style={{ margin: '0 0 14px 0', fontSize: 13, color: '#006600', lineHeight: 1.6 }}>
            {t(fundEligibility.messageKey)}
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
            {t('pension_go_to_my_fund')} →
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="module-section">
          <div className="module-section-title">{t('pension_step1_applicant')}</div>
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
                {t('national_id')}: {profile?.national_id}
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>
                {t('date_of_birth')}: {profile?.date_of_birth} · {t('traffic_age')}: <strong>{age}</strong>
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>
                {t('citizenship')}: <strong>{getCitizenshipDisplay(profile?.citizenship_status, t)}</strong>
              </div>
              {eligible && !blocked && (
                <div style={{
                  display: 'inline-block', marginTop: 8,
                  background: '#d4edda', color: '#006600',
                  padding: '4px 12px', borderRadius: 12,
                  fontSize: 12, fontWeight: 'bold',
                }}>
                  ✓ {t('pension_eligible').replace('{age}', age)}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>
              {t('applying_for')}
            </label>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <Radio
                checked={form.applying_for === 'self'}
                onChange={() => update('applying_for', 'self')}
                label={t('for_self')}
              />
              <Radio
                checked={form.applying_for === 'other'}
                onChange={() => update('applying_for', 'other')}
                label={t('for_other')}
              />
            </div>
          </div>

          {form.applying_for === 'other' && (
            <div style={{ marginTop: 18, padding: 16, background: '#f9f9f9', borderRadius: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#003366', marginBottom: 10 }}>
                {t('pension_applicant_on_behalf')}
              </div>
              <FormField label={t('full_name')} value={form.applicant_name} onChange={(v) => update('applicant_name', v)} required />
              <FormField label={t('national_id')} value={form.applicant_id} onChange={(v) => update('applicant_id', v)} required />
              <FormField label={t('relationship')} as="select" value={form.applicant_relationship} onChange={(v) => update('applicant_relationship', v)} options={RELATIONSHIP_OPTIONS.map((r) => ({ value: r.value, label: t(r.labelKey) }))} required />
            </div>
          )}
        </div>

        <EmploymentSection
          value={form.employment}
          onChange={(employment) => update('employment', employment)}
        />

        <div className="module-section">
          <div className="module-section-title">{t('pension_step3_payout')}</div>
          <PayoutInfoBanner />
          <FormField label={t('bank_mobile')} as="select" value={form.bank_name} onChange={handleBankChange} options={BANK_OPTIONS.map((b) => ({ value: b.value, label: b.labelKey ? t(b.labelKey) : b.label }))} required />
          <FormField label={t('account_number')} value={form.account_number} onChange={(v) => update('account_number', v)} placeholder={t('pension_placeholder_account')} required />
          <FormField label={t('branch_code')} value={form.branch_code} onChange={(v) => update('branch_code', v)} />
          <FormField label={t('account_holder')} value={form.account_holder} onChange={(v) => update('account_holder', v)} required />
          <FormField label={t('account_type')} as="select" value={form.account_type} onChange={(v) => update('account_type', v)} options={ACCOUNT_TYPE_OPTIONS.map((a) => ({ value: a.value, label: t(a.labelKey) }))} />
          <PayoutSummary bankName={form.bank_name} accountHolder={form.account_holder} accountNumber={form.account_number} accountType={form.account_type} />
        </div>

        <div className="module-section">
          <div className="module-section-title">{t('pension_step4_chief')}</div>
          <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 12 }}>
            {t('pension_chief_help')}
          </p>
          <Checkbox checked={form.chief_confirmed} onChange={(v) => update('chief_confirmed', v)} label={t('my_chief_confirmed')} />
          {form.chief_confirmed && (
            <div style={{ marginTop: 12 }}>
              <FormField label={`${t('chief_name')} *`} value={form.chief_name} onChange={(v) => update('chief_name', v)} required />
              <FormField label={t('chief_ref')} value={form.chief_confirmation_number} onChange={(v) => update('chief_confirmation_number', v)} placeholder={t('police_optional')} />
              <CloudinaryUpload label={`${t('chief_letter')} *`} onUpload={(url) => update('chief_letter_url', url)} />
            </div>
          )}
        </div>

        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">{t('pension_step5_declarations')}</div>
          <Checkbox checked={form.truth_declaration} onChange={(v) => update('truth_declaration', v)} label={t('pension_declaration_truth')} />
          <Checkbox checked={form.data_consent} onChange={(v) => update('data_consent', v)} label={t('data_consent')} />
        </div>

        <SubmitButton
          canSubmit={canSubmit && !resubmitting}
          submitting={submitting || resubmitting}
          label={
            blocked ? t('pension_not_eligible_btn')
            : isEditing ? t('resubmit_application')
            : t('submit_application')
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
  const { t } = useLanguage();
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
    form.medical_report_url &&
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
        report_url: form.medical_report_url,
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
        alert(t('pension_resubmit_failed') + err.message);
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
            ✎ {t('edit_banner')} — {existingApplication.application_reference}
          </div>
          <div style={{ fontSize: 13, color: '#7a5a00', lineHeight: 1.6, marginBottom: 10 }}>
            <strong>{t('pension_what_needs')}</strong>{' '}
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
            {t('cancel_editing')}
          </button>
        </div>
      )}

      <div className="module-section-title">
        {isEditing ? t('pension_update_disability') : t('pension_disability_app')}
      </div>

      {!isEditing && <Alert type="info">{t('pension_disability_info')}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="module-section">
          <div className="module-section-title">{t('pension_step1_applicant')}</div>
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
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{t('national_id')}: {profile?.national_id}</div>
              <div style={{ fontSize: 13, color: '#666' }}>
                {t('citizenship')}: <strong>{getCitizenshipDisplay(profile?.citizenship_status, t)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="module-section">
          <div className="module-section-title">{t('pension_step2_disability')}</div>
          <FormField label={t('disability_type')} as="select" value={form.disability_type} onChange={(v) => update('disability_type', v)} options={DISABILITY_TYPE_OPTIONS.map((d) => ({ value: d.value, label: t(d.labelKey) }))} required />
          <FormField label={`${t('description')} (${t('police_optional')})`} as="textarea" value={form.disability_description} onChange={(v) => update('disability_description', v)} placeholder={t('pension_placeholder_disability')} />
          <FormField label={t('doctor_name')} value={form.doctor_name} onChange={(v) => update('doctor_name', v)} placeholder={t('pension_placeholder_doctor')} />
          <FormField label={t('clinic_name')} value={form.clinic_name} onChange={(v) => update('clinic_name', v)} placeholder={t('pension_placeholder_clinic')} />
          <FormField label={t('diagnosis_date')} type="date" value={form.diagnosis_date} onChange={(v) => update('diagnosis_date', v)} />
        </div>

        <EmploymentSection value={form.employment} onChange={(employment) => update('employment', employment)} />

        <div className="module-section">
          <div className="module-section-title">{t('pension_step3_payout')}</div>
          <PayoutInfoBanner />
          <FormField label={t('bank_mobile')} as="select" value={form.bank_name} onChange={handleBankChange} options={BANK_OPTIONS.map((b) => ({ value: b.value, label: b.labelKey ? t(b.labelKey) : b.label }))} required />
          <FormField label={t('account_number')} value={form.account_number} onChange={(v) => update('account_number', v)} placeholder={t('pension_placeholder_account')} required />
          <FormField label={t('branch_code')} value={form.branch_code} onChange={(v) => update('branch_code', v)} />
          <FormField label={t('account_holder')} value={form.account_holder} onChange={(v) => update('account_holder', v)} required />
          <FormField label={t('account_type')} as="select" value={form.account_type} onChange={(v) => update('account_type', v)} options={ACCOUNT_TYPE_OPTIONS.map((a) => ({ value: a.value, label: t(a.labelKey) }))} />
          <PayoutSummary bankName={form.bank_name} accountHolder={form.account_holder} accountNumber={form.account_number} accountType={form.account_type} />
        </div>

        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">{t('pension_step5_medical')}</div>

          <div style={{ background: '#f0f6ff', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid #cce0ff' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#003366' }}>
              {t('pension_medical_help')}
            </p>
            <CloudinaryUpload label={`${t('upload_medical_report')} *`} onUpload={(url) => update('medical_report_url', url)} />
          </div>

          <Checkbox checked={form.has_medical_report} onChange={(v) => update('has_medical_report', v)} label={t('confirm_medical')} />
          <Checkbox checked={form.truth_declaration} onChange={(v) => update('truth_declaration', v)} label={t('pension_declaration_truth')} />
          <Checkbox checked={form.data_consent} onChange={(v) => update('data_consent', v)} label={t('pension_data_consent_health')} />
        </div>

        <SubmitButton canSubmit={canSubmit && !resubmitting} submitting={submitting || resubmitting} label={isEditing ? t('resubmit_application') : t('submit_application')} />
      </form>
    </div>
  );
};

// ============================================================
// SHARED PIECES
// ============================================================
const PayoutInfoBanner = () => {
  const { t } = useLanguage();
  return (
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
      <strong>💰 {t('pension_payout_banner_title')}</strong>
      <br />
      {t('pension_payout_banner_body')}
    </div>
  );
};

const PayoutSummary = ({ bankName, accountHolder, accountNumber, accountType }) => {
  const { t } = useLanguage();
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
        {isMobile ? `📱 ${t('pension_summary_mobile')}` : `💳 ${t('pension_summary_bank')}`}
      </div>
      <SummaryRow label={t('pension_bank_service')} value={bankName || '—'} />
      <SummaryRow label={t('account_holder')} value={accountHolder || '—'} />
      <SummaryRow label={t('account_number')} value={accountNumber || '—'} mono />
      {!isMobile && <SummaryRow label={t('account_type')} value={accountType || '—'} />}
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

const SubmitButton = ({ canSubmit, submitting, label = 'Submit Application' }) => {
  const { t } = useLanguage();
  return (
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
        {submitting ? t('submitting') : label}
      </button>
      <Link to="/pensions" style={{
        background: 'white', color: '#003366', border: '1px solid #003366',
        padding: '11px 24px', borderRadius: 999, fontSize: 14,
        textDecoration: 'none', display: 'inline-block',
      }}>
        {t('cancel')}
      </Link>
    </div>
  );
};

export default PensionsModule;