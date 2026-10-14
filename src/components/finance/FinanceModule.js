import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  submitApplication,
  getMyApplications,
  getMyTinRegistration,
  submitTinRegistration,
  getCitizenMasterData,
  updateCitizenEmployment,
  DEPARTMENTS,
} from '../../firebase/db';
import useAutoFill from '../../hooks/useAutoFill';
import Layout from '../common/Layout';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';
import FormField from '../common/FormField';
import CloudinaryUpload from '../common/CloudinaryUpload';
import PaymentBlock from '../common/PaymentBlock';
import VerifiedGuard from '../citizen/VerifiedGuard';
import '../../styles/module.css';

// ============================================================
// CONSTANTS
// ============================================================
const TAX_CLEARANCE_FEE = 100;

const EMPLOYMENT_TYPES = [
  { value: '', label: '— Select —' },
  { value: 'Government', label: 'Government employee' },
  { value: 'Private sector', label: 'Private sector employee' },
  { value: 'Self-employed', label: 'Self-employed' },
  { value: 'Unemployed', label: 'Unemployed' },
  { value: 'Retired', label: 'Retired' },
];

// Initial form states — used for reset after submit
const INITIAL_TAX_FORM = {
  business_name: '',
  business_type: '',
  traders_license_number: '',
  tin: '',
  purpose: '',
  is_new_business: false,
  bank_name: '',
};

const INITIAL_REFUND_FORM = {
  employer: '',
  amount: '',
  has_form_p9: false,
  employer_name: '',
  employment_type: '',
  employee_number: '',
};

const INITIAL_TIN_FORM = {
  taxpayer_type: 'Individual',
  business_name: '',
  business_type: 'Sole Proprietor',
  traders_license_number: '',
};

const INITIAL_TIN_UPLOADS = {
  employment_contract: null,
  traders_licence: null,
  business_registration: null,
};

const generatePaymentReference = (prefix = 'PAY-RSL') => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}-${year}-${random}`;
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const FinanceModule = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const [applications, setApplications] = useState([]);
  const [tinRegistration, setTinRegistration] = useState(null);
  const [masterData, setMasterData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastSubmission, setLastSubmission] = useState(null);

  // Track which tab was just submitted so we can hide its form
  const [submittedTab, setSubmittedTab] = useState(null);

  // ---------- TAX CLEARANCE ----------
  const [taxForm, setTaxForm] = useState(INITIAL_TAX_FORM);
  const [taxPaymentRef, setTaxPaymentRef] = useState(() => generatePaymentReference('PAY-RSL-TCC'));

  // ---------- PAYE REFUND ----------
  const [refundForm, setRefundForm] = useState(INITIAL_REFUND_FORM);
  const [refundPaymentRef, setRefundPaymentRef] = useState(() => generatePaymentReference('PAY-RSL-REF'));

  // ---------- TIN REGISTRATION ----------
  const [tinForm, setTinForm] = useState(INITIAL_TIN_FORM);
  const [tinUploads, setTinUploads] = useState(INITIAL_TIN_UPLOADS);

  const fetchData = async () => {
    if (!profile) return;
    try {
      const [apps, tin, master] = await Promise.all([
        getMyApplications(profile.uid),
        getMyTinRegistration(profile.uid),
        getCitizenMasterData(profile.uid),
      ]);
      setApplications(apps.filter((a) => a.department_id === DEPARTMENTS.FINANCE));
      setTinRegistration(tin);
      setMasterData(master);
    } catch (err) {
      console.error(err);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [profile]);

  const hasApprovedTin = tinRegistration?.status === 'approved';
  const hasPendingTin = tinRegistration?.status === 'pending' || tinRegistration?.status === 'processing';
  const hasRejectedTin = tinRegistration?.status === 'rejected';

  const submit = async (serviceType, data) => {
    setLoading(true);
    setMessage('');
    setLastSubmission(null);
    try {
      const r = await submitApplication({
        citizen_id: profile.uid,
        citizen_name: profile.full_name,
        citizen_national_id: profile.national_id,
        department_id: DEPARTMENTS.FINANCE,
        service_type: serviceType,
        application_data: data,
      });

      if (data.employment && (data.employment.employer_name || data.employment.employment_type)) {
        try {
          await updateCitizenEmployment(profile.uid, data.employment);
        } catch (e) {
          console.warn('Could not save employment to citizen record:', e);
        }
      }

      setMessage(`✓ ${r.reference}`);
      setLastSubmission({
        reference: r.reference,
        serviceType,
        paymentReference: data.payment?.reference,
        amount: data.fees?.total || 0,
      });
      // 👇 Mark this service as submitted so its form is hidden
      setSubmittedTab(serviceType);
      fetchData();
    } catch (err) {
      setMessage(`✗ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTinSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const r = await submitTinRegistration({
        citizen_id: profile.uid,
        citizen_name: profile.full_name,
        national_id: profile.national_id,
        ...tinForm,
        employment_contract_url: tinUploads.employment_contract,
        traders_licence_url: tinUploads.traders_licence,
        business_registration_url: tinUploads.business_registration,
        phone_number: profile.phone_number || '',
        email: profile.email || '',
      });
      setMessage(`✓ TIN registration submitted: ${r.reference}`);
      fetchData();
    } catch (err) {
      setMessage(`✗ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // -------- Tab change clears submitted state --------
  const handleTabChange = (key) => {
    setActiveTab(key);
    setSubmittedTab(null);
    setLastSubmission(null);
    setMessage('');
  };

  // -------- Reset handlers (called from "File Another") --------
  const resetTaxForm = () => {
    setSubmittedTab(null);
    setLastSubmission(null);
    setMessage('');
    setTaxForm(INITIAL_TAX_FORM);
    setTaxPaymentRef(generatePaymentReference('PAY-RSL-TCC'));
  };

  const resetRefundForm = () => {
    setSubmittedTab(null);
    setLastSubmission(null);
    setMessage('');
    setRefundForm(INITIAL_REFUND_FORM);
    setRefundPaymentRef(generatePaymentReference('PAY-RSL-REF'));
  };

  const statusColor = (s) => {
    if (s === 'approved' || s === 'completed') return 'green';
    if (s === 'rejected' || s === 'cancelled') return 'red';
    if (s === 'processing') return 'yellow';
    return 'gray';
  };

  const tinStatusColor = (s) => {
    if (s === 'approved') return 'green';
    if (s === 'rejected') return 'red';
    if (s === 'processing') return 'yellow';
    return 'gray';
  };

  const isIndividual = tinForm.taxpayer_type === 'Individual';
  const isBusiness = tinForm.taxpayer_type === 'Business';

  const canSubmitTin = isIndividual
    ? !!tinUploads.employment_contract
    : (!!tinUploads.traders_licence && !!tinUploads.business_registration);

  const canSubmitTax =
    taxForm.business_name.trim() &&
    taxForm.purpose.trim() &&
    taxForm.bank_name;

  const canSubmitRefund =
    refundForm.employer.trim() &&
    refundForm.amount &&
    Number(refundForm.amount) > 0 &&
    refundForm.employer_name.trim() &&
    refundForm.employment_type;

  const TABS = [
    { key: 'dashboard', label: 'My Applications' },
    { key: 'tin', label: 'Register for TIN' },
    { key: 'tax', label: 'Tax Clearance' },
    { key: 'refund', label: 'PAYE Refund' },
  ];

  const TAX_SERVICE = 'Tax Clearance Certificate (e-TCC)';
  const REFUND_SERVICE = 'PAYE Tax Refund';

  return (
    <VerifiedGuard serviceName={t('ministry_of_finance')}>
      <Layout title={t('ministry_of_finance')}>
        <div className="module-root">
          <div className="module-header">
            <h1>Ministry of Finance / RSL</h1>
            <p>Tax registration, clearance certificates, and refunds</p>
          </div>

          <Alert type="info">{t('verified_by_home_affairs')}</Alert>

          <div className="module-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
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

          {/* ---------- SUCCESS BANNER (only when a form was just submitted) ---------- */}
          {lastSubmission && submittedTab && (
            <div className="module-card" style={{ marginBottom: 20 }}>
              <div style={{ padding: 10, textAlign: 'center' }}>
                <h3 style={{ color: '#006600', marginTop: 0, marginBottom: 12 }}>
                  ✓ Submission received
                </h3>

                <div style={{
                  display: 'inline-block',
                  background: '#f0f6ff',
                  padding: '12px 24px',
                  borderRadius: 6,
                  marginBottom: 12,
                }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Reference
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#003366', fontFamily: 'monospace' }}>
                    {lastSubmission.reference}
                  </div>
                </div>

                {lastSubmission.paymentReference && lastSubmission.amount > 0 ? (
                  <>
                    <div style={{
                      display: 'inline-block',
                      background: '#f0f6ff',
                      padding: '12px 24px',
                      borderRadius: 6,
                      marginBottom: 12,
                      marginLeft: 8,
                    }}>
                      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Payment Reference
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 'bold', color: '#003366', fontFamily: 'monospace' }}>
                        {lastSubmission.paymentReference}
                      </div>
                    </div>
                    <p style={{ color: '#666', fontSize: 13, margin: '12px 0 0 0' }}>
                      Pay <strong>M {lastSubmission.amount.toLocaleString()}</strong> at any listed bank.
                    </p>
                  </>
                ) : (
                  <p style={{ color: '#006600', fontSize: 14, margin: '12px 0 0 0', fontWeight: 'bold' }}>
                    ✓ Free government service — no payment required.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="module-card">
              <div className="module-section-title">My Finance Applications</div>
              <Table
                headers={['Reference', 'Service', 'Status', 'Submitted', 'Action']}
                rows={applications.map((a) => [
                  a.application_reference,
                  a.service_type,
                  <Badge color={statusColor(a.status)}>{a.status}</Badge>,
                  a.submitted_at?.toDate?.().toLocaleDateString() || '—',
                  (a.status === 'approved' || a.status === 'completed') ? (
                    <Link
                      to={`/certificate/${a.application_reference}`}
                      style={{ color: '#003366', fontWeight: 'bold', textDecoration: 'underline', fontSize: 13 }}
                    >
                      View Certificate
                    </Link>
                  ) : (
                    <span style={{ color: '#999', fontSize: 12 }}>—</span>
                  ),
                ])}
                emptyMessage="No applications yet."
              />
            </div>
          )}

          {activeTab === 'tin' && (
            <div className="module-card">
              <div className="module-section-title">Register for Tax Identification Number (TIN)</div>

              {!tinRegistration ? (
                <>
                  <Alert type="info">
                    A TIN is required before you can apply for Tax Clearance or PAYE Refunds.
                    Upload the required document to prove your taxpayer status.
                  </Alert>

                  <form onSubmit={handleTinSubmit}>
                    <div className="module-section">
                      <div className="module-section-title">1 · Taxpayer type</div>
                      <FormField
                        label="Taxpayer Type *"
                        as="select"
                        value={tinForm.taxpayer_type}
                        onChange={(v) => setTinForm({ ...tinForm, taxpayer_type: v })}
                        options={[
                          { value: 'Individual', label: 'Individual' },
                          { value: 'Business', label: 'Business' },
                        ]}
                        required
                      />
                    </div>

                    {isBusiness && (
                      <div className="module-section">
                        <div className="module-section-title">2 · Business details</div>
                        <FormField
                          label="Business Name *"
                          value={tinForm.business_name}
                          onChange={(v) => setTinForm({ ...tinForm, business_name: v })}
                          required
                        />
                        <FormField
                          label="Business Type *"
                          as="select"
                          value={tinForm.business_type}
                          onChange={(v) => setTinForm({ ...tinForm, business_type: v })}
                          options={[
                            { value: 'Sole Proprietor', label: 'Sole Proprietor' },
                            { value: 'Partnership', label: 'Partnership' },
                            { value: 'Private Company', label: 'Private Company' },
                            { value: 'Public Company', label: 'Public Company' },
                          ]}
                          required
                        />
                        <FormField
                          label="Trader's Licence Number *"
                          value={tinForm.traders_license_number}
                          onChange={(v) => setTinForm({ ...tinForm, traders_license_number: v })}
                          required
                        />
                      </div>
                    )}

                    <div className="module-section">
                      <div className="module-section-title">
                        {isIndividual ? '2 · Upload your employment contract' : '3 · Upload your documents'}
                      </div>

                      {isIndividual && (
                        <CloudinaryUpload
                          label="Employment Contract (JPG, PNG, or PDF) *"
                          onUpload={(url) =>
                            setTinUploads({ ...tinUploads, employment_contract: url })
                          }
                        />
                      )}

                      {isBusiness && (
                        <>
                          <CloudinaryUpload
                            label="Trader's Licence (JPG, PNG, or PDF) *"
                            onUpload={(url) =>
                              setTinUploads({ ...tinUploads, traders_licence: url })
                            }
                          />
                          <CloudinaryUpload
                            label="Business Registration Certificate (JPG, PNG, or PDF) *"
                            onUpload={(url) =>
                              setTinUploads({ ...tinUploads, business_registration: url })
                            }
                          />
                        </>
                      )}
                    </div>

                    <div className="module-section">
                      <div className="module-section-title">
                        {isIndividual ? '3 · Auto-filled from Home Affairs' : '4 · Auto-filled from Home Affairs'}
                      </div>
                      <div style={{
                        background: '#f9f9f9',
                        padding: 15,
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#555',
                      }}>
                        <div style={{ marginBottom: 6 }}><strong>Name:</strong> {profile?.full_name}</div>
                        <div style={{ marginBottom: 6 }}><strong>National ID:</strong> {profile?.national_id}</div>
                        <div style={{ marginBottom: 6 }}><strong>Phone:</strong> {profile?.phone_number || '—'}</div>
                        <div><strong>Email:</strong> {profile?.email || '—'}</div>
                      </div>
                    </div>

                    <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                      <div className="module-section-title">
                        {isIndividual ? '4 · Submit' : '5 · Submit'}
                      </div>
                      <SubmitButton
                        canSubmit={canSubmitTin && !loading}
                        submitting={loading}
                        label="Submit TIN Registration"
                      />
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <Badge color={tinStatusColor(tinRegistration.status)}>
                      {tinRegistration.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div style={{
                    background: '#f9f9f9',
                    padding: 20,
                    borderRadius: 8,
                    marginBottom: 20,
                  }}>
                    <Field label="Registration Reference" value={tinRegistration.registration_reference} />
                    <Field label="Taxpayer Type" value={tinRegistration.taxpayer_type} />
                    {tinRegistration.business_name && (
                      <Field label="Business Name" value={tinRegistration.business_name} />
                    )}
                    {tinRegistration.assigned_tin && (
                      <div style={{
                        marginTop: 16,
                        padding: 14,
                        background: '#e6f4ea',
                        border: '1px solid #a8d5b8',
                        borderRadius: 6,
                      }}>
                        <div style={{ fontSize: 11, color: '#006600', textTransform: 'uppercase', letterSpacing: 1 }}>
                          Your Tax Identification Number
                        </div>
                        <div style={{
                          fontSize: 22,
                          fontWeight: 'bold',
                          color: '#006600',
                          fontFamily: 'monospace',
                          marginTop: 4,
                        }}>
                          {tinRegistration.assigned_tin}
                        </div>
                      </div>
                    )}
                    <Field
                      label="Submitted"
                      value={tinRegistration.submitted_at?.toDate?.().toLocaleDateString()}
                    />
                    {tinRegistration.rejection_reason && (
                      <div style={{
                        marginTop: 12,
                        padding: 12,
                        background: '#fff0f0',
                        border: '1px solid #ffcccc',
                        borderRadius: 6,
                        color: '#cc0000',
                        fontSize: 13,
                      }}>
                        <strong>Rejection Reason:</strong> {tinRegistration.rejection_reason}
                      </div>
                    )}
                    {tinRegistration.notes && (
                      <div style={{
                        marginTop: 12,
                        padding: 12,
                        background: '#fff8e0',
                        border: '1px solid #ffe08a',
                        borderRadius: 6,
                        color: '#7a5a00',
                        fontSize: 13,
                      }}>
                        <strong>RSL Note:</strong> {tinRegistration.notes}
                      </div>
                    )}
                  </div>

                  {hasPendingTin && (
                    <Alert type="warning">
                      Your TIN registration is being reviewed by RSL. You will be notified when a decision is made.
                    </Alert>
                  )}
                  {hasApprovedTin && (
                    <Alert type="success">
                      Your TIN is active. You can now apply for Tax Clearance and PAYE Refunds.
                    </Alert>
                  )}
                  {hasRejectedTin && (
                    <Alert type="error">
                      Your registration was rejected. Contact RSL for more information.
                    </Alert>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'tax' && (
            <>
              {!hasApprovedTin ? (
                <div className="module-card">
                  <div className="module-section-title">Tax Clearance Certificate</div>
                  <Alert type="warning">
                    You must have an <strong>approved TIN</strong> before applying for Tax Clearance.
                    {hasPendingTin && ' Your TIN registration is currently being reviewed.'}
                    {hasRejectedTin && ' Your previous TIN registration was rejected.'}
                    {!tinRegistration && ' You have not yet registered for a TIN.'}
                  </Alert>
                  <button
                    onClick={() => handleTabChange('tin')}
                    style={{
                      background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 26px',
                      borderRadius: 999,
                      fontSize: 15,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(0, 51, 102, 0.25)',
                    }}
                  >
                    {tinRegistration ? 'View TIN Status' : 'Register for TIN'}
                  </button>
                </div>
              ) : submittedTab === TAX_SERVICE ? (
                <SuccessPanel
                  serviceName="Tax Clearance Certificate"
                  reference={lastSubmission?.reference}
                  onReset={resetTaxForm}
                />
              ) : (
                <TaxClearanceForm
                  form={taxForm}
                  setForm={setTaxForm}
                  tin={tinRegistration.assigned_tin}
                  tinRegistration={tinRegistration}
                  profile={profile}
                  masterData={masterData}
                  paymentRef={taxPaymentRef}
                  submitting={loading}
                  canSubmit={canSubmitTax}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!canSubmitTax) return;
                    submit(TAX_SERVICE, {
                      ...taxForm,
                      tin: tinRegistration.assigned_tin,
                      payment: {
                        reference: taxPaymentRef,
                        bank: taxForm.bank_name,
                        status: 'awaiting_payment',
                      },
                      fees: { base: TAX_CLEARANCE_FEE, total: TAX_CLEARANCE_FEE },
                    });
                  }}
                />
              )}
            </>
          )}

          {activeTab === 'refund' && (
            <>
              {!hasApprovedTin ? (
                <div className="module-card">
                  <div className="module-section-title">PAYE Refund</div>
                  <Alert type="warning">
                    You must have an <strong>approved TIN</strong> before claiming a PAYE refund.
                  </Alert>
                  <button
                    onClick={() => handleTabChange('tin')}
                    style={{
                      background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 26px',
                      borderRadius: 999,
                      fontSize: 15,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(0, 51, 102, 0.25)',
                    }}
                  >
                    {tinRegistration ? 'View TIN Status' : 'Register for TIN'}
                  </button>
                </div>
              ) : submittedTab === REFUND_SERVICE ? (
                <SuccessPanel
                  serviceName="PAYE Refund"
                  reference={lastSubmission?.reference}
                  onReset={resetRefundForm}
                />
              ) : (
                <PayeRefundForm
                  form={refundForm}
                  setForm={setRefundForm}
                  tin={tinRegistration.assigned_tin}
                  profile={profile}
                  masterData={masterData}
                  paymentRef={refundPaymentRef}
                  submitting={loading}
                  canSubmit={canSubmitRefund}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!canSubmitRefund) return;
                    submit(REFUND_SERVICE, {
                      ...refundForm,
                      tin: tinRegistration.assigned_tin,
                      employment: {
                        employer_name: refundForm.employer_name,
                        employment_type: refundForm.employment_type,
                        employee_number: refundForm.employee_number,
                      },
                      payment: {
                        reference: refundPaymentRef,
                        status: 'no_payment_required',
                      },
                      fees: { base: 0, total: 0 },
                    });
                  }}
                />
              )}
            </>
          )}
        </div>
      </Layout>
    </VerifiedGuard>
  );
};

// ============================================================
// SUCCESS PANEL — shown instead of the form after submit
// ============================================================
const SuccessPanel = ({ serviceName, reference, onReset }) => (
  <div className="module-card">
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div style={{
        width: 84,
        height: 84,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #d4edda 0%, #b8e0c4 100%)',
        color: '#006600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        fontSize: 46,
        fontWeight: 'bold',
        boxShadow: '0 8px 24px rgba(0, 102, 0, 0.15)',
      }}>
        ✓
      </div>

      <h2 style={{ color: '#006600', marginTop: 0, fontSize: 26, marginBottom: 10 }}>
        {serviceName} submitted
      </h2>

      <p style={{
        color: '#666',
        fontSize: 15,
        maxWidth: 480,
        margin: '12px auto 24px',
        lineHeight: 1.6,
      }}>
        Your application has been received and is now in the queue.
        You'll receive a notification once it's processed.
      </p>

      {reference && (
        <div style={{
          display: 'inline-block',
          background: '#f0f6ff',
          padding: '12px 24px',
          borderRadius: 6,
          marginBottom: 28,
        }}>
          <div style={{
            fontSize: 11,
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 4,
          }}>
            Reference
          </div>
          <div style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#003366',
            fontFamily: 'monospace',
          }}>
            {reference}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onReset}
          style={{
            background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 28px',
            borderRadius: 999,
            fontSize: 15,
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 51, 102, 0.25)',
          }}
        >
          File Another Application
        </button>
        <Link
          to="/finance"
          style={{
            background: 'white',
            color: '#003366',
            border: '1px solid #003366',
            padding: '11px 24px',
            borderRadius: 999,
            fontSize: 14,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Back to My Applications
        </Link>
      </div>
    </div>
  </div>
);

// ============================================================
// TAX CLEARANCE FORM
// ============================================================
const TaxClearanceForm = ({
  form,
  setForm,
  tin,
  tinRegistration,
  profile,
  masterData,
  paymentRef,
  submitting,
  canSubmit,
  onSubmit,
}) => {
  const update = (k, v) => setForm({ ...form, [k]: v });

  useAutoFill(profile, form, setForm);

  useEffect(() => {
    if (!tinRegistration) return;

    setForm((prev) => {
      const next = { ...prev };

      if (tin && !next.tin) next.tin = tin;

      if (!next.business_name && tinRegistration.business_name) {
        next.business_name = tinRegistration.business_name;
      }
      if (!next.business_type && tinRegistration.business_type) {
        next.business_type = tinRegistration.business_type;
      }
      if (!next.traders_license_number && tinRegistration.traders_license_number) {
        next.traders_license_number = tinRegistration.traders_license_number;
      }

      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tinRegistration, tin]);

  return (
    <div className="module-card">
      <div className="module-section-title">Tax Clearance Certificate (e-TCC)</div>

      <Alert type="info">
        Valid for 12 months. Fee: <strong>M {TAX_CLEARANCE_FEE}</strong>.
        New businesses get 14-day clearance.
      </Alert>

      <form onSubmit={onSubmit}>
        <div className="module-section">
          <div className="module-section-title">1 · TIN</div>
          <div style={{
            background: '#eef7ee',
            padding: 12,
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#006600',
            fontFamily: 'monospace',
          }}>
            {tin || '—'}
          </div>
        </div>

        <div className="module-section">
          <div className="module-section-title">2 · Business details</div>
          <FormField
            label="Business Name"
            value={form.business_name}
            onChange={(v) => update('business_name', v)}
            placeholder="e.g. AfterHours Club"
            required
          />
          <FormField
            label="Purpose"
            value={form.purpose}
            onChange={(v) => update('purpose', v)}
            placeholder="e.g. Tender application, bank loan, contract work"
            required
          />
          <Checkbox
            checked={form.is_new_business}
            onChange={(v) => update('is_new_business', v)}
            label="This is a newly registered business"
          />
        </div>

        <div className="module-section">
          <div className="module-section-title">3 · Payment</div>
          <PaymentBlock
            reference={paymentRef}
            bankName={form.bank_name}
            onBankChange={(v) => update('bank_name', v)}
            rows={[{ label: 'Tax Clearance Certificate', amount: TAX_CLEARANCE_FEE }]}
            total={TAX_CLEARANCE_FEE}
          />
        </div>

        <SubmitButton
          canSubmit={canSubmit && !submitting}
          submitting={submitting}
          label="Submit Application"
        />
      </form>
    </div>
  );
};

// ============================================================
// PAYE REFUND FORM
// ============================================================
const PayeRefundForm = ({
  form,
  setForm,
  tin,
  profile,
  masterData,
  paymentRef,
  submitting,
  canSubmit,
  onSubmit,
}) => {
  const update = (k, v) => setForm({ ...form, [k]: v });

  useAutoFill(profile, form, setForm);

  const isGovEmployee =
    form.employment_type === 'Government' ||
    masterData?.employment?.employment_type === 'Government';

  return (
    <div className="module-card">
      <div className="module-section-title">PAYE Tax Refund</div>

      <Alert type="info">
        If your employer deducted more tax than you owe.
        <strong> No fee</strong> — this is a free service.
      </Alert>

      {isGovEmployee && (
        <div style={{
          background: '#e6f4ea',
          border: '1px solid #a8d5b8',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          fontSize: 13,
          color: '#006600',
          lineHeight: 1.6,
        }}>
          <strong>Government employees are eligible for PAYE refunds.</strong>{' '}
          This claim will be verified against your payroll records at{' '}
          {form.employer_name || masterData?.employment?.employer_name || 'your employer'}.
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="module-section">
          <div className="module-section-title">1 · TIN</div>
          <div style={{
            background: '#eef7ee',
            padding: 12,
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#006600',
            fontFamily: 'monospace',
          }}>
            {tin || '—'}
          </div>
        </div>

        <div className="module-section">
          <div className="module-section-title">2 · Refund details</div>
          <FormField
            label="Employer"
            value={form.employer}
            onChange={(v) => update('employer', v)}
            placeholder="e.g. Ministry of Education (as on payslip)"
            required
          />
          <FormField
            label="Amount claimed (M)"
            type="number"
            value={form.amount}
            onChange={(v) => update('amount', v)}
            placeholder="e.g. 1500"
            required
          />
          <Checkbox
            checked={form.has_form_p9}
            onChange={(v) => update('has_form_p9', v)}
            label="I have my employer's Form P9 (tax certificate)"
          />
        </div>

        <div className="module-section">
          <div className="module-section-title">3 · Employment</div>
          <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 12 }}>
            This helps RSL verify your payroll records and prevent duplicate
            payouts between Finance and Pensions.
          </p>
          <FormField
            label="Where do you work? *"
            value={form.employer_name}
            onChange={(v) => update('employer_name', v)}
            placeholder="e.g. Ministry of Finance, Private company"
            required
          />
          <FormField
            label="Employment type *"
            as="select"
            value={form.employment_type}
            onChange={(v) => update('employment_type', v)}
            options={EMPLOYMENT_TYPES}
            required
          />
          <FormField
            label="Employee / Payroll number (if any)"
            value={form.employee_number}
            onChange={(v) => update('employee_number', v)}
            placeholder="e.g. MoF-2019-04521"
          />
        </div>

        <div className="module-section">
          <div className="module-section-title">4 · Reference</div>
          <div style={{
            background: '#f0f6ff',
            padding: 16,
            borderRadius: 6,
          }}>
            <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>
              Tracking reference
            </div>
            <div style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#003366',
              fontFamily: 'monospace',
              marginTop: 4,
            }}>
              {paymentRef}
            </div>
            <p style={{ fontSize: 12, color: '#666', margin: '8px 0 0 0' }}>
              Keep this reference for tracking. No payment is required for this service.
            </p>
          </div>
        </div>

        <SubmitButton
          canSubmit={canSubmit && !submitting}
          submitting={submitting}
          label="Submit Refund Claim"
        />
      </form>
    </div>
  );
};

// ============================================================
// SHARED PIECES
// ============================================================
const Field = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
    <span style={{ color: '#666' }}>{label}:</span>
    <span style={{ fontWeight: 'bold', color: '#003366' }}>{value || '—'}</span>
  </div>
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

const SubmitButton = ({ canSubmit, submitting, label = 'Submit' }) => (
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
    <Link to="/finance" style={{
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

export default FinanceModule;