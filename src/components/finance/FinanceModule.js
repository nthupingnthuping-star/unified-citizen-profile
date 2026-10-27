import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  submitApplication,
  getMyApplications,
  resubmitApplication,
  getMyTinRegistration,
  submitTinRegistration,
  getCitizenMasterData,
  getMyPensionClaims,
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
import RequestedInfoBanner from '../common/RequestedInfoBanner';
import VerifiedGuard from '../citizen/VerifiedGuard';
import FormWizard from '../common/FormWizard';
import '../../styles/module.css';

// ============================================================
// CONSTANTS & HELPERS
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

  const [applications, setApplications] = useState([]);
  const [tinRegistration, setTinRegistration] = useState(null);
  const [activePensionClaims, setActivePensionClaims] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastSubmission, setLastSubmission] = useState(null);
  const [editingApplication, setEditingApplication] = useState(null);

  const fetchData = async () => {
    if (!profile) return;
    try {
      const [apps, tin, master, claims] = await Promise.all([
        getMyApplications(profile.uid),
        getMyTinRegistration(profile.uid),
        getCitizenMasterData(profile.uid),
        getMyPensionClaims(profile.uid),
      ]);
      setApplications(apps.filter((a) => a.department_id === DEPARTMENTS.FINANCE));
      setTinRegistration(tin);
      setActivePensionClaims(
        claims.filter((c) =>
          ['pending', 'processing', 'audit', 'approved'].includes(c.status)
        )
      );
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
    setLoading(true); setMessage(''); setLastSubmission(null);
    try {
      const r = await submitApplication({
        citizen_id: profile.uid, citizen_name: profile.full_name, citizen_national_id: profile.national_id,
        department_id: DEPARTMENTS.FINANCE, service_type: serviceType, application_data: data,
      });

      setMessage(`✓ ${r.reference}`);
      setLastSubmission({
        reference: r.reference, serviceType, paymentReference: data.payment?.reference, amount: data.fees?.total || 0,
      });
      fetchData();
    } catch (err) {
      setMessage(`✗ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTinSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setMessage('');
    try {
      const r = await submitTinRegistration({
        citizen_id: profile.uid, citizen_name: profile.full_name, national_id: profile.national_id,
        ...tinForm,
        employment_contract_url: tinUploads.employment_contract, traders_licence_url: tinUploads.traders_licence, business_registration_url: tinUploads.business_registration,
        phone_number: profile.phone_number || '', email: profile.email || '',
      });
      setMessage(`✓ TIN registration submitted: ${r.reference}`);
      fetchData();
    } catch (err) {
      setMessage(`✗ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const [tinForm, setTinForm] = useState({ taxpayer_type: 'Individual', business_name: '', business_type: 'Sole Proprietor', traders_license_number: '' });
  const [tinUploads, setTinUploads] = useState({ employment_contract: null, traders_licence: null, business_registration: null });

  const handleStartEdit = (app) => {
    setEditingApplication(app); setMessage(''); setLastSubmission(null);
    if (app.service_type === 'Tax Clearance Certificate (e-TCC)') setActiveTab('tax');
    else if (app.service_type === 'PAYE Tax Refund') setActiveTab('refund');
  };

  const handleCancelEdit = () => setEditingApplication(null);
  const handleResubmitted = () => { setEditingApplication(null); setActiveTab('dashboard'); setMessage('✓ Your updated application has been resubmitted for review.'); fetchData(); };

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
  const canSubmitTin = isIndividual ? !!tinUploads.employment_contract : (!!tinUploads.traders_licence && !!tinUploads.business_registration);

  // --- HARDCODED TABS (NO TRANSLATION BUGS) ---
  const TABS = [
    { key: 'dashboard', label: 'My Applications' },
    { key: 'tin', label: 'Register for TIN' },
    { key: 'tax', label: 'Tax Clearance (e-TCC)' },
    { key: 'refund', label: 'PAYE Refund' },
  ];

  const needsInfo = applications.filter((a) => a.status === 'processing' && (a.notes || a.rejection_reason));

  return (
    <VerifiedGuard serviceName="Ministry of Finance / RSL">
      <Layout title="Ministry of Finance / RSL">
        <div className="module-root">
          
          <div className="module-header">
            <h1>Ministry of Finance / RSL</h1>
            <p>Tax registration, clearance certificates, and refunds</p>
          </div>

          <Alert type="info">Verified by Home Affairs</Alert>

          <div className="module-tabs">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`module-tab ${activeTab === tab.key ? 'active' : ''}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {message && <Alert type={message.startsWith('✓') ? 'success' : 'error'} onClose={() => setMessage('')}>{message}</Alert>}

          {lastSubmission && (
            <div className="module-card" style={{ marginBottom: 20 }}>
              <div style={{ padding: 10, textAlign: 'center' }}>
                <h3 style={{ color: '#006600', marginTop: 0, marginBottom: 12 }}>✓ Submission received</h3>
                <div style={{ display: 'inline-block', background: '#f0f6ff', padding: '12px 24px', borderRadius: 6, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Reference</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#003366', fontFamily: 'monospace' }}>{lastSubmission.reference}</div>
                </div>
                {lastSubmission.paymentReference && lastSubmission.amount > 0 ? (
                  <>
                    <div style={{ display: 'inline-block', background: '#f0f6ff', padding: '12px 24px', borderRadius: 6, marginBottom: 12, marginLeft: 8 }}>
                      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Payment Reference</div>
                      <div style={{ fontSize: 20, fontWeight: 'bold', color: '#003366', fontFamily: 'monospace' }}>{lastSubmission.paymentReference}</div>
                    </div>
                    <p style={{ color: '#666', fontSize: 13, margin: '12px 0 0 0' }}>Pay <strong>M {lastSubmission.amount.toLocaleString()}</strong> at any listed bank.</p>
                  </>
                ) : (
                  <p style={{ color: '#006600', fontSize: 14, margin: '12px 0 0 0', fontWeight: 'bold' }}>✓ Free government service — no payment required.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              {needsInfo.map((a) => (<RequestedInfoBanner key={a.id} application={a} onEdit={() => handleStartEdit(a)} />))}
              <div className="module-card">
                <div className="module-section-title">My Finance Applications</div>
                <Table
                  headers={['Reference', 'Service', 'Status', 'Submitted', 'Action']}
                  rows={applications.map((a) => [
                    a.application_reference, a.service_type,
                    <Badge color={statusColor(a.status)}>{a.status}</Badge>,
                    a.submitted_at?.toDate?.().toLocaleDateString() || '—',
                    a.status === 'processing' && (a.notes || a.rejection_reason) ? (
                      <button onClick={() => handleStartEdit(a)} style={{ background: 'linear-gradient(135deg, #ffcc00 0%, #ff9900 100%)', color: '#003366', border: 'none', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>✎ Edit & Resubmit</button>
                    ) : a.status === 'approved' || a.status === 'completed' ? (
                      <Link to={`/certificate/${a.application_reference}`} style={{ color: '#003366', fontWeight: 'bold', textDecoration: 'underline', fontSize: 13 }}>View Document</Link>
                    ) : (<span style={{ color: '#999', fontSize: 12 }}>—</span>),
                  ])}
                  emptyMessage="No applications yet."
                />
              </div>
            </>
          )}

          {activeTab === 'tin' && (
            <div className="module-card">
              <div className="module-section-title">Register for Tax Identification Number (TIN)</div>
              {!tinRegistration ? (
                <>
                  <Alert type="info">A TIN is required before you can apply for Tax Clearance or PAYE Refunds. Upload the required document to prove your taxpayer status.</Alert>
                  <form onSubmit={handleTinSubmit}>
                    <div className="module-section">
                      <div className="module-section-title">1 · Taxpayer type</div>
                      <FormField label="Taxpayer Type *" as="select" value={tinForm.taxpayer_type} onChange={(v) => setTinForm({ ...tinForm, taxpayer_type: v })} options={[{ value: 'Individual', label: 'Individual' }, { value: 'Business', label: 'Business' }]} required />
                    </div>
                    {isBusiness && (
                      <div className="module-section">
                        <div className="module-section-title">2 · Business details</div>
                        <FormField label="Business Name *" value={tinForm.business_name} onChange={(v) => setTinForm({ ...tinForm, business_name: v })} required />
                        <FormField label="Business Type *" as="select" value={tinForm.business_type} onChange={(v) => setTinForm({ ...tinForm, business_type: v })} options={[{ value: 'Sole Proprietor', label: 'Sole Proprietor' }, { value: 'Partnership', label: 'Partnership' }, { value: 'Private Company', label: 'Private Company' }, { value: 'Public Company', label: 'Public Company' }]} required />
                        <FormField label="Trader's Licence Number *" value={tinForm.traders_license_number} onChange={(v) => setTinForm({ ...tinForm, traders_license_number: v })} required />
                      </div>
                    )}
                    <div className="module-section">
                      <div className="module-section-title">{isIndividual ? '2 · Upload your employment contract' : '3 · Upload your documents'}</div>
                      {isIndividual && <CloudinaryUpload label="Employment Contract (JPG, PNG, or PDF) *" onUpload={(url) => setTinUploads({ ...tinUploads, employment_contract: url })} />}
                      {isBusiness && (<><CloudinaryUpload label="Trader's Licence (JPG, PNG, or PDF) *" onUpload={(url) => setTinUploads({ ...tinUploads, traders_licence: url })} /><CloudinaryUpload label="Business Registration Certificate (JPG, PNG, or PDF) *" onUpload={(url) => setTinUploads({ ...tinUploads, business_registration: url })} /></>)}
                    </div>
                    <div className="module-section">
                      <div className="module-section-title">{isIndividual ? '3 · Auto-filled from Home Affairs' : '4 · Auto-filled from Home Affairs'}</div>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 16, borderRadius: 8, fontSize: 13, color: '#475569' }}>
                        <div style={{ marginBottom: 6 }}><strong>Name:</strong> {profile?.full_name}</div>
                        <div style={{ marginBottom: 6 }}><strong>National ID:</strong> {profile?.national_id}</div>
                        <div style={{ marginBottom: 6 }}><strong>Phone:</strong> {profile?.phone_number || '—'}</div>
                        <div><strong>Email:</strong> {profile?.email || '—'}</div>
                      </div>
                    </div>
                    <SubmitButton canSubmit={canSubmitTin && !loading} submitting={loading} label="Submit TIN Registration" />
                  </form>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 20 }}><Badge color={tinStatusColor(tinRegistration.status)}>{tinRegistration.status.toUpperCase()}</Badge></div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 20, borderRadius: 8, marginBottom: 20 }}>
                    <Field label="Registration Reference" value={tinRegistration.registration_reference} />
                    <Field label="Taxpayer Type" value={tinRegistration.taxpayer_type} />
                    {tinRegistration.business_name && <Field label="Business Name" value={tinRegistration.business_name} />}
                    {tinRegistration.assigned_tin && (
                      <div style={{ marginTop: 16, padding: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: '#15803d', textTransform: 'uppercase', fontWeight: 700 }}>Your Tax Identification Number</div>
                        <div style={{ fontSize: 22, fontWeight: 'bold', color: '#15803d', fontFamily: 'monospace', marginTop: 4 }}>{tinRegistration.assigned_tin}</div>
                      </div>
                    )}
                    <Field label="Submitted" value={tinRegistration.submitted_at?.toDate?.().toLocaleDateString()} />
                  </div>
                  {hasPendingTin && <Alert type="warning">Your TIN registration is being reviewed by RSL. You will be notified when a decision is made.</Alert>}
                  {hasApprovedTin && <Alert type="success">Your TIN is active. You can now apply for Tax Clearance and PAYE Refunds.</Alert>}
                  {hasRejectedTin && <Alert type="error">Your registration was rejected. Contact RSL for more information.</Alert>}
                </>
              )}
            </div>
          )}

          {activeTab === 'tax' && (
            <>
              {!hasApprovedTin ? (
                <div className="module-card">
                  <div className="module-section-title">Tax Clearance Certificate</div>
                  <Alert type="warning">You must have an <strong>approved TIN</strong> before applying for Tax Clearance.</Alert>
                  <button onClick={() => setActiveTab('tin')} className="btn-wizard next" style={{ marginTop: 16 }}>{tinRegistration ? 'View TIN Status' : 'Register for TIN'}</button>
                </div>
              ) : (
                <TaxClearanceForm profile={profile} tinRegistration={tinRegistration} activePensionClaims={activePensionClaims} existingApplication={editingApplication?.service_type === 'Tax Clearance Certificate (e-TCC)' ? editingApplication : null} submitting={loading} onSubmit={submit} onCancelEdit={handleCancelEdit} onResubmitted={handleResubmitted} />
              )}
            </>
          )}

          {activeTab === 'refund' && (
            <>
              {!hasApprovedTin ? (
                <div className="module-card">
                  <div className="module-section-title">PAYE Refund</div>
                  <Alert type="warning">You must have an <strong>approved TIN</strong> before claiming a PAYE refund.</Alert>
                  <button onClick={() => setActiveTab('tin')} className="btn-wizard next" style={{ marginTop: 16 }}>{tinRegistration ? 'View TIN Status' : 'Register for TIN'}</button>
                </div>
              ) : (
                <PayeRefundForm profile={profile} tinRegistration={tinRegistration} activePensionClaims={activePensionClaims} existingApplication={editingApplication?.service_type === 'PAYE Tax Refund' ? editingApplication : null} submitting={loading} onSubmit={submit} onCancelEdit={handleCancelEdit} onResubmitted={handleResubmitted} />
              )}
            </>
          )}
        </div>
      </Layout>
    </VerifiedGuard>
  );
};

// ============================================================
// TAX CLEARANCE FORM (WIZARD VERSION)
// ============================================================
const TaxClearanceForm = ({ profile, tinRegistration, activePensionClaims, existingApplication = null, submitting, onSubmit, onCancelEdit, onResubmitted }) => {
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};
  const [currentStep, setCurrentStep] = useState(0);

  const [form, setForm] = useState({
    business_name: existingData.business_name || tinRegistration?.business_name || '',
    business_type: existingData.business_type || tinRegistration?.business_type || '',
    traders_license_number: existingData.traders_license_number || tinRegistration?.traders_license_number || '',
    tin: tinRegistration?.assigned_tin || '',
    purpose: existingData.purpose || '',
    is_new_business: existingData.is_new_business || false,
    bank_name: existingData.payment?.bank_name || '',
  });

  const [paymentRef] = useState(() => existingData.payment?.reference || generatePaymentReference('PAY-RSL-TCC'));
  const [resubmitting, setResubmitting] = useState(false);

  useAutoFill(profile, form, setForm);
  const update = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async () => {
    if (!form.business_name.trim() || !form.purpose.trim() || !form.bank_name) return alert('Please fill all required fields.');

    const payload = {
      business_name: form.business_name, business_type: form.business_type, traders_license_number: form.traders_license_number,
      purpose: form.purpose, is_new_business: form.is_new_business, tin: tinRegistration?.assigned_tin,
      payment: { reference: paymentRef, bank: form.bank_name, status: existingData.payment?.status || 'awaiting_payment' },
      fees: { base: TAX_CLEARANCE_FEE, total: TAX_CLEARANCE_FEE },
    };

    if (isEditing) {
      setResubmitting(true);
      try { await resubmitApplication(existingApplication.id, payload); if (onResubmitted) onResubmitted(); } 
      catch (err) { alert('Failed to resubmit: ' + err.message); } 
      finally { setResubmitting(false); }
    } else {
      await onSubmit('Tax Clearance Certificate (e-TCC)', payload);
    }
  };

  const steps = [
    {
      title: 'Business Details',
      pageTitle: 'Tax Clearance Certificate',
      pageDesc: 'Apply for your e-TCC',
      content: (
        <div>
          <div className="module-section-title">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> Business Details
          </div>
          {activePensionClaims.length > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fef08a', borderRadius: 8, padding: 16, marginBottom: 20, fontSize: 13, color: '#854d0e', lineHeight: 1.6 }}>
              <strong>ℹ️ Note:</strong> You have active pension claims on file. RSL will cross-check this application against those claims to prevent duplicate payouts.
            </div>
          )}
          <FormField label="Business Name *" value={form.business_name} onChange={(v) => update('business_name', v)} required />
          <FormField label="Purpose *" value={form.purpose} onChange={(v) => update('purpose', v)} required />
          <Checkbox checked={form.is_new_business} onChange={(v) => update('is_new_business', v)} label="This is a newly registered business" />
        </div>
      )
    },
    {
      title: 'Payment',
      pageTitle: 'Payment',
      pageDesc: 'Pay for your Tax Clearance Certificate.',
      content: (
        <div>
          <div className="module-section-title">Payment Details</div>
          <PaymentBlock reference={paymentRef} bankName={form.bank_name} onBankChange={(v) => update('bank_name', v)} rows={[{ label: 'Tax Clearance Certificate', amount: TAX_CLEARANCE_FEE }]} total={TAX_CLEARANCE_FEE} />
        </div>
      )
    }
  ];

  return (
    <div>
      {isEditing && <EditBanner application={existingApplication} onCancel={onCancelEdit} />}
      <FormWizard steps={steps} currentStep={currentStep} setCurrentStep={setCurrentStep} onComplete={handleSubmit} submitting={submitting || resubmitting} />
    </div>
  );
};

// ============================================================
// PAYE REFUND FORM (WIZARD VERSION)
// ============================================================
const PayeRefundForm = ({ profile, tinRegistration, activePensionClaims, existingApplication = null, submitting, onSubmit, onCancelEdit, onResubmitted }) => {
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};
  const [currentStep, setCurrentStep] = useState(0);

  const [form, setForm] = useState({
    employer: existingData.employer || '', amount: existingData.amount || '', has_form_p9: existingData.has_form_p9 || false,
  });

  const [paymentRef] = useState(() => existingData.payment?.reference || generatePaymentReference('PAY-RSL-REF'));
  const [resubmitting, setResubmitting] = useState(false);

  useAutoFill(profile, form, setForm);
  const update = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async () => {
    if (!form.employer.trim() || !form.amount || Number(form.amount) <= 0) return alert('Please fill all required fields.');

    const payload = {
      employer: form.employer, amount: form.amount, has_form_p9: form.has_form_p9, tin: tinRegistration?.assigned_tin,
      payment: { reference: paymentRef, status: existingData.payment?.status || 'no_payment_required' },
      fees: { base: 0, total: 0 },
    };

    if (isEditing) {
      setResubmitting(true);
      try { await resubmitApplication(existingApplication.id, payload); if (onResubmitted) onResubmitted(); } 
      catch (err) { alert('Failed to resubmit: ' + err.message); } 
      finally { setResubmitting(false); }
    } else {
      await onSubmit('PAYE Tax Refund', payload);
    }
  };

  const steps = [
    {
      title: 'Refund Details',
      pageTitle: 'PAYE Refund',
      pageDesc: 'Claim back overpaid tax.',
      content: (
        <div>
          <div className="module-section-title">
            <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Refund Details
          </div>
          <Alert type="info">If your employer deducted more tax than you owe. <strong>No fee</strong> — this is a free service.</Alert>
          {activePensionClaims.length > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fef08a', borderRadius: 8, padding: 16, marginBottom: 20, fontSize: 13, color: '#854d0e', lineHeight: 1.6 }}>
              <strong>ℹ️ Note:</strong> You have active pension claims on file. RSL will cross-check this claim against those to prevent duplicate payouts.
            </div>
          )}
          <FormField label="Employer (as on payslip) *" value={form.employer} onChange={(v) => update('employer', v)} required />
          <FormField label="Amount claimed (M) *" type="number" value={form.amount} onChange={(v) => update('amount', v)} required />
          <Checkbox checked={form.has_form_p9} onChange={(v) => update('has_form_p9', v)} label="I have my employer's Form P9 (tax certificate)" />
        </div>
      )
    },
    {
      title: 'Confirm',
      pageTitle: 'Confirm & Submit',
      pageDesc: 'Review your tracking reference.',
      content: (
        <div>
          <div className="module-section-title">Tracking Reference</div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#003366', fontWeight: 700, marginBottom: 8 }}>Tracking Reference</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#003366', fontFamily: 'monospace', marginBottom: 8 }}>{paymentRef}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Keep this reference for tracking. No payment is required for this service.</div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div>
      {isEditing && <EditBanner application={existingApplication} onCancel={onCancelEdit} />}
      <FormWizard steps={steps} currentStep={currentStep} setCurrentStep={setCurrentStep} onComplete={handleSubmit} submitting={submitting || resubmitting} />
    </div>
  );
};

// ============================================================
// SHARED PIECES
// ============================================================
const EditBanner = ({ application, onCancel }) => (
  <div style={{ background: '#fff8e0', border: '1px solid #fef08a', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#854d0e', marginBottom: 8 }}>✎ Editing Application</div>
    <div style={{ fontSize: 14, color: '#a16207', lineHeight: 1.5, marginBottom: 12 }}><strong>Action required:</strong> {application.notes || application.rejection_reason}</div>
    <button type="button" onClick={onCancel} style={{ background: 'white', border: '1px solid #ca8a04', color: '#854d0e', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>Cancel editing</button>
  </div>
);

const Field = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
    <span style={{ color: '#64748b' }}>{label}:</span>
    <span style={{ fontWeight: 600, color: '#0f172a' }}>{value || '—'}</span>
  </div>
);

const Checkbox = ({ checked, onChange, label }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#334155', cursor: 'pointer', lineHeight: 1.5 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3, accentColor: '#003366', width: 16, height: 16 }} />
      <span>{label}</span>
    </label>
  </div>
);

const SubmitButton = ({ canSubmit, submitting, label = 'Submit' }) => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
    <button
      type="submit" disabled={!canSubmit || submitting}
      style={{
        background: canSubmit && !submitting ? '#003366' : '#94a3b8',
        color: 'white', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
        cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
        boxShadow: canSubmit && !submitting ? '0 4px 12px rgba(0, 51, 102, 0.25)' : 'none',
      }}
    >
      {submitting ? 'Submitting...' : label}
    </button>
    <Link to="/finance" style={{ background: 'white', color: '#475569', border: '1px solid #cbd5e1', padding: '12px 24px', borderRadius: 8, fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
      Cancel
    </Link>
  </div>
);

export default FinanceModule;