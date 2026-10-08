import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  submitApplication,
  getMyApplications,
  getMyTinRegistration,
  submitTinRegistration,
  DEPARTMENTS,
} from '../../firebase/db';
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
// FEES
// ============================================================
const TAX_CLEARANCE_FEE = 100;

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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastSubmission, setLastSubmission] = useState(null);

  const [taxForm, setTaxForm] = useState({
    business_name: '',
    tin: '',
    purpose: '',
    is_new_business: false,
    bank_name: '',
  });
  const [taxPaymentRef] = useState(() => generatePaymentReference('PAY-RSL-TCC'));

  const [refundForm, setRefundForm] = useState({
    employer: '',
    amount: '',
    has_form_p9: false,
  });
  const [refundPaymentRef] = useState(() => generatePaymentReference('PAY-RSL-REF'));

  const [tinForm, setTinForm] = useState({
    taxpayer_type: 'Individual',
    business_name: '',
    business_type: 'Sole Proprietor',
    traders_license_number: '',
  });

  const [tinUploads, setTinUploads] = useState({
    employment_contract: null,
    traders_licence: null,
    business_registration: null,
  });

  const fetchData = async () => {
    if (!profile) return;
    try {
      const [apps, tin] = await Promise.all([
        getMyApplications(profile.uid),
        getMyTinRegistration(profile.uid),
      ]);
      setApplications(apps.filter((a) => a.department_id === DEPARTMENTS.FINANCE));
      setTinRegistration(tin);
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
      setMessage(`✓ ${r.reference}`);
      setLastSubmission({
        reference: r.reference,
        serviceType,
        paymentReference: data.payment?.reference,
        amount: data.fees?.total || 0,
      });
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
    Number(refundForm.amount) > 0;

  const TABS = [
    { key: 'dashboard', label: 'My Applications' },
    { key: 'tin', label: 'Register for TIN' },
    { key: 'tax', label: 'Tax Clearance' },
    { key: 'refund', label: 'PAYE Refund' },
  ];

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
                headers={[t('reference'), t('service'), t('status'), t('submitted'), t('action')]}
                rows={applications.map((a) => [
                  a.application_reference,
                  a.service_type,
                  <Badge color={statusColor(a.status)}>{t(a.status)}</Badge>,
                  a.submitted_at?.toDate?.().toLocaleDateString() || '—',
                  (a.status === 'approved' || a.status === 'completed') ? (
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
                    onClick={() => setActiveTab('tin')}
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
              ) : (
                <div className="module-card">
                  <div className="module-section-title">Tax Clearance Certificate (e-TCC)</div>
                  <p style={{ color: '#555', marginTop: 0 }}>
                    Valid for 12 months. Fee: <strong>M {TAX_CLEARANCE_FEE}</strong>.
                    New businesses get 14-day clearance.
                  </p>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!canSubmitTax) return;
                    submit('Tax Clearance Certificate (e-TCC)', {
                      ...taxForm,
                      tin: tinRegistration.assigned_tin,
                      payment: {
                        reference: taxPaymentRef,
                        bank: taxForm.bank_name,
                        status: 'awaiting_payment',
                      },
                      fees: { base: TAX_CLEARANCE_FEE, total: TAX_CLEARANCE_FEE },
                    });
                  }}>
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
                        {tinRegistration.assigned_tin}
                      </div>
                    </div>

                    <div className="module-section">
                      <div className="module-section-title">2 · Business details</div>
                      <FormField
                        label={t('business_name')}
                        value={taxForm.business_name}
                        onChange={(v) => setTaxForm({ ...taxForm, business_name: v })}
                        required
                      />
                      <FormField
                        label={t('purpose')}
                        value={taxForm.purpose}
                        onChange={(v) => setTaxForm({ ...taxForm, purpose: v })}
                        required
                      />
                      <Checkbox
                        checked={taxForm.is_new_business}
                        onChange={(v) => setTaxForm({ ...taxForm, is_new_business: v })}
                        label={t('is_new_business')}
                      />
                    </div>

                    <div className="module-section">
                      <div className="module-section-title">3 · Payment</div>
                      <PaymentBlock
                        reference={taxPaymentRef}
                        bankName={taxForm.bank_name}
                        onBankChange={(v) => setTaxForm({ ...taxForm, bank_name: v })}
                        rows={[{ label: 'Tax Clearance Certificate', amount: TAX_CLEARANCE_FEE }]}
                        total={TAX_CLEARANCE_FEE}
                      />
                    </div>

                    <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                      <div className="module-section-title">4 · Submit</div>
                      <SubmitButton
                        canSubmit={canSubmitTax && !loading}
                        submitting={loading}
                        label={t('submit_application')}
                      />
                    </div>
                  </form>
                </div>
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
                    onClick={() => setActiveTab('tin')}
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
              ) : (
                <div className="module-card">
                  <div className="module-section-title">PAYE Tax Refund</div>
                  <p style={{ color: '#555', marginTop: 0 }}>
                    If your employer deducted more tax than you owe.
                    <strong> No fee</strong> — this is a free service.
                  </p>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!canSubmitRefund) return;
                    submit('PAYE Tax Refund', {
                      ...refundForm,
                      tin: tinRegistration.assigned_tin,
                      payment: {
                        reference: refundPaymentRef,
                        status: 'no_payment_required',
                      },
                      fees: { base: 0, total: 0 },
                    });
                  }}>
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
                        {tinRegistration.assigned_tin}
                      </div>
                    </div>

                    <div className="module-section">
                      <div className="module-section-title">2 · Refund details</div>
                      <FormField
                        label={t('employer')}
                        value={refundForm.employer}
                        onChange={(v) => setRefundForm({ ...refundForm, employer: v })}
                        required
                      />
                      <FormField
                        label={t('amount_maloti')}
                        type="number"
                        value={refundForm.amount}
                        onChange={(v) => setRefundForm({ ...refundForm, amount: v })}
                        required
                      />
                      <Checkbox
                        checked={refundForm.has_form_p9}
                        onChange={(v) => setRefundForm({ ...refundForm, has_form_p9: v })}
                        label={t('have_form_p9')}
                      />
                    </div>

                    <div className="module-section">
                      <div className="module-section-title">3 · Reference</div>
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
                          {refundPaymentRef}
                        </div>
                        <p style={{ fontSize: 12, color: '#666', margin: '8px 0 0 0' }}>
                          Keep this reference for tracking. No payment is required for this service.
                        </p>
                      </div>
                    </div>

                    <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                      <div className="module-section-title">4 · Submit</div>
                      <SubmitButton
                        canSubmit={canSubmitRefund && !loading}
                        submitting={loading}
                        label={t('submit_refund_claim')}
                      />
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </VerifiedGuard>
  );
};

// ============================================================
// REUSABLE PIECES
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