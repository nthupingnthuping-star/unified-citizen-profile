import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  submitApplication,
  getMyApplications,
  resubmitApplication,
  DEPARTMENTS,
  DISTRICTS,
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

// CONSTANTS & HELPERS
const PASSPORT_TYPES = [{ value: 'Ordinary', label: 'Ordinary passport (green cover)' }, { value: 'Service', label: 'Service passport (blue cover)' }, { value: 'Diplomatic', label: 'Diplomatic passport (red cover)' }, { value: 'Official', label: 'Official passport' }];
const BOOK_FORMATS = [{ value: '32-page', label: '32 pages (standard)', baseSurcharge: 0 }, { value: '48-page', label: '48 pages (frequent traveller)', baseSurcharge: 200 }];
const PROCESSING_SPEEDS = [{ value: 'Standard', label: 'Standard (10 working days)', days: 10, surcharge: 0 }, { value: 'Express', label: 'Express (3 working days)', days: 3, surcharge: 300 }, { value: 'Urgent', label: 'Urgent (24 hours)', days: 1, surcharge: 600 }];
const TRAVEL_PURPOSES = [{ value: '', label: '— Select purpose —' }, { value: 'Tourism', label: 'Tourism / holiday' }, { value: 'Business', label: 'Business' }, { value: 'Study', label: 'Study abroad' }, { value: 'Medical', label: 'Medical treatment' }, { value: 'Work', label: 'Employment abroad' }, { value: 'Family', label: 'Family visit' }, { value: 'Other', label: 'Other' }];
const BASE_FEES = { Ordinary: { '32-page': 600, '48-page': 800 }, Service: { '32-page': 400, '48-page': 500 }, Diplomatic: { '32-page': 0, '48-page': 0 }, Official: { '32-page': 0, '48-page': 0 } };

const generatePaymentReference = () => `PAY-PAS-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
const computeFees = (passportType, bookFormat, speed) => {
  const base = BASE_FEES[passportType]?.[bookFormat] ?? 0;
  const formatSurcharge = BOOK_FORMATS.find((f) => f.value === bookFormat)?.baseSurcharge ?? 0;
  const speedSurcharge = PROCESSING_SPEEDS.find((s) => s.value === speed)?.surcharge ?? 0;
  return { base, formatSurcharge, speedSurcharge, total: base + formatSurcharge + speedSurcharge };
};
const computeReadyDate = (speed) => {
  const days = PROCESSING_SPEEDS.find((s) => s.value === speed)?.days ?? 10;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

// MAIN COMPONENT
const PassportModule = () => {
  const { profile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastSubmission, setLastSubmission] = useState(null);
  const [editingApplication, setEditingApplication] = useState(null);

  const fetchApplications = async () => {
    if (!profile) return;
    try {
      const apps = await getMyApplications(profile.uid);
      setApplications(apps.filter((a) => a.department_id === DEPARTMENTS.PASSPORT));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchApplications(); }, [profile]);

  const submit = async (serviceType, data) => {
    setLoading(true); setMessage(''); setLastSubmission(null);
    try {
      const r = await submitApplication({
        citizen_id: profile.uid, citizen_name: profile.full_name, citizen_national_id: profile.national_id,
        department_id: DEPARTMENTS.PASSPORT, service_type: serviceType, application_data: data,
      });
      setMessage(`✓ Application submitted: ${r.reference}`);
      setLastSubmission({
        reference: r.reference, serviceType, paymentReference: data.payment.reference,
        amount: data.fees.total, readyDate: new Date(data.estimated_ready_date), collectionBranch: data.collection_branch,
      });
      fetchApplications();
    } catch (err) { setMessage(`✗ ${err.message}`); } finally { setLoading(false); }
  };

  const handleStartEdit = (app) => {
    setEditingApplication(app); setMessage(''); setLastSubmission(null);
    if (app.service_type === 'New Passport') setActiveTab('new');
    else if (app.service_type === 'Passport Renewal') setActiveTab('renewal');
  };

  const TABS = [{ key: 'dashboard', label: 'My Applications' }, { key: 'new', label: 'New Passport' }, { key: 'renewal', label: 'Renewal' }];
  const needsInfo = applications.filter((a) => a.status === 'processing' && (a.notes || a.rejection_reason));

  return (
    <VerifiedGuard serviceName="Passport and Citizenship Office">
      <Layout title="Passport and Citizenship Office">
        <div className="module-root">
          
          <div className="module-header">
            <h1>Passport & Citizenship</h1>
            <p>Apply for new passports, renewals, and citizenship documents.</p>
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
            <div className="module-card" style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#15803d', marginTop: 0, marginBottom: 20 }}>✓ Application Received</h3>
              <div className="info-grid">
                <div className="info-block"><div className="info-label">Reference</div><div className="info-value mono">{lastSubmission.reference}</div></div>
                <div className="info-block"><div className="info-label">Payment Ref</div><div className="info-value mono">{lastSubmission.paymentReference}</div></div>
                <div className="info-block"><div className="info-label">Amount Due</div><div className="info-value big">M {lastSubmission.amount.toLocaleString()}</div></div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              {needsInfo.map((a) => (<RequestedInfoBanner key={a.id} application={a} onEdit={() => handleStartEdit(a)} />))}
              <div className="module-card">
                <div className="module-section-title">My Passport Applications</div>
                <Table
                  headers={['Reference', 'Service', 'Status', 'Submitted', 'Action']}
                  rows={applications.map((a) => [
                    a.application_reference, a.service_type,
                    <Badge color={a.status === 'approved' ? 'green' : a.status === 'processing' ? 'yellow' : 'gray'}>{a.status}</Badge>,
                    a.submitted_at?.toDate?.().toLocaleDateString() || '—',
                    a.status === 'processing' && (a.notes || a.rejection_reason) ? (
                      <button onClick={() => handleStartEdit(a)} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>✎ Edit</button>
                    ) : a.status === 'approved' ? (
                      <Link to={`/certificate/${a.application_reference}`} style={{ color: '#003366', fontWeight: 'bold', textDecoration: 'none' }}>View Document</Link>
                    ) : (<span style={{ color: '#94a3b8' }}>—</span>),
                  ])}
                  emptyMessage="No applications yet."
                />
              </div>
            </>
          )}

          {activeTab === 'new' && <PassportForm mode="new" profile={profile} submitting={loading} existingApplication={editingApplication?.service_type === 'New Passport' ? editingApplication : null} onSubmit={submit} onCancelEdit={() => setEditingApplication(null)} onResubmitted={() => { setEditingApplication(null); setActiveTab('dashboard'); fetchApplications(); }} />}
          {activeTab === 'renewal' && <PassportForm mode="renewal" profile={profile} submitting={loading} existingApplication={editingApplication?.service_type === 'Passport Renewal' ? editingApplication : null} onSubmit={submit} onCancelEdit={() => setEditingApplication(null)} onResubmitted={() => { setEditingApplication(null); setActiveTab('dashboard'); fetchApplications(); }} />}
        </div>
      </Layout>
    </VerifiedGuard>
  );
};

// PASSPORT FORM (WIZARD VERSION)
const PassportForm = ({ mode, profile, submitting, existingApplication = null, onSubmit, onCancelEdit, onResubmitted }) => {
  const isRenewal = mode === 'renewal';
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};
  const existingPrev = existingData.previous_passport || {};
  const existingGuarantor = existingData.guarantor || {};
  const existingUploads = existingData.documents_uploaded || {};

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    passport_type: existingData.passport_type || 'Ordinary', book_format: existingData.book_format || '32-page', processing_speed: existingData.processing_speed || 'Standard',
    travel_purpose: existingData.travel_purpose || '', departure_date: existingData.departure_date || '',
    old_passport_number: existingPrev.number || '', old_passport_issued: existingPrev.issued_date || '', old_passport_expiry: existingPrev.expiry_date || '',
    guarantor_name: existingGuarantor.full_name || '', guarantor_id: existingGuarantor.national_id || '', guarantor_phone: existingGuarantor.phone || '',
    collection_branch: existingData.collection_branch || 'Maseru', payment_bank: existingData.payment?.bank || '',
    truth_declaration: existingData.declarations?.truth || false, data_consent: existingData.declarations?.data_consent || false,
  });

  const [uploads, setUploads] = useState({
    birth_certificate: existingUploads.birth_certificate || null, photos: existingUploads.photos || null, chief_letter: existingUploads.chief_letter || null, old_passport: existingUploads.old_passport || null,
  });

  const [paymentRef] = useState(() => existingData.payment?.reference || generatePaymentReference());
  useAutoFill(profile, form, setForm);

  const update = (key, value) => setForm({ ...form, [key]: value });
  const setUpload = (k, v) => setUploads({ ...uploads, [k]: v });

  const fees = computeFees(form.passport_type, form.book_format, form.processing_speed);
  const readyDate = computeReadyDate(form.processing_speed);

  const handleSubmit = async () => {
    const requiredDocsOK = isRenewal ? (uploads.old_passport && uploads.photos) : (uploads.birth_certificate && uploads.photos);
    const guarantorOK = isRenewal || (form.guarantor_name.trim() && form.guarantor_id.trim() && form.guarantor_phone.trim());
    const renewalFieldsOK = !isRenewal || (form.old_passport_number.trim() && form.old_passport_issued && form.old_passport_expiry);
    const canSubmit = form.travel_purpose && form.departure_date && form.payment_bank && requiredDocsOK && guarantorOK && renewalFieldsOK && form.truth_declaration && form.data_consent;

    if (!canSubmit) return alert('Please fill all required fields and accept declarations.');

    const payload = {
      passport_type: form.passport_type, book_format: form.book_format, processing_speed: form.processing_speed, travel_purpose: form.travel_purpose, departure_date: form.departure_date,
      documents_uploaded: isRenewal ? { old_passport: uploads.old_passport, photos: uploads.photos } : { birth_certificate: uploads.birth_certificate, photos: uploads.photos, chief_letter: uploads.chief_letter },
      previous_passport: isRenewal ? { number: form.old_passport_number, issued_date: form.old_passport_issued, expiry_date: form.old_passport_expiry } : null,
      guarantor: isRenewal ? null : { full_name: form.guarantor_name, national_id: form.guarantor_id, phone: form.guarantor_phone },
      collection_branch: form.collection_branch, payment: { reference: paymentRef, bank: form.payment_bank, status: existingData.payment?.status || 'awaiting_payment' },
      fees, estimated_ready_date: readyDate.toISOString(), declarations: { truth: form.truth_declaration, data_consent: form.data_consent, declared_at: new Date().toISOString() },
    };

    if (isEditing) {
      try { await resubmitApplication(existingApplication.id, payload); if (onResubmitted) onResubmitted(); } catch (err) { alert('Failed to resubmit: ' + err.message); }
    } else { await onSubmit(isRenewal ? 'Passport Renewal' : 'New Passport', payload); }
  };

  const steps = [
    {
      title: 'Type & Travel',
      pageTitle: 'Passport Application',
      pageDesc: 'Apply for your Ordinary Passport',
      content: (
        <div>
          <div className="module-section-title">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg> Passport Details
          </div>
          <FormField label="Passport Type *" as="select" value={form.passport_type} onChange={(v) => update('passport_type', v)} options={PASSPORT_TYPES} required />
          
          <label className="form-label" style={{ marginTop: 24 }}>Book Format</label>
          <div className="radio-cards-grid">
            {BOOK_FORMATS.map((f) => (
              <div key={f.value} className={`radio-card ${form.book_format === f.value ? 'active' : ''}`} onClick={() => update('book_format', f.value)}>
                <div className="radio-dot" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{f.label}</div>
                </div>
              </div>
            ))}
          </div>

          <label className="form-label">Processing Speed</label>
          <div className="radio-cards-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {PROCESSING_SPEEDS.map((s) => (
              <div key={s.value} className={`radio-card ${form.processing_speed === s.value ? 'active' : ''}`} onClick={() => update('processing_speed', s.value)}>
                <div className="radio-dot" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{s.label.split(' ')[0]}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{s.label.substring(s.label.indexOf('('))}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="module-section-title" style={{ marginTop: 32 }}>
            <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Travel Plans
          </div>
          <FormField label="Purpose of Travel *" as="select" value={form.travel_purpose} onChange={(v) => update('travel_purpose', v)} options={TRAVEL_PURPOSES} required />
          <FormField label="Planned Departure Date *" type="date" value={form.departure_date} onChange={(v) => update('departure_date', v)} required />
        </div>
      )
    },
    {
      title: 'Documents',
      pageTitle: 'Supporting Documents',
      pageDesc: 'Upload the required documents for your application.',
      content: (
        <div>
          <div className="module-section-title">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Required Documents
          </div>
          <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: 8, fontSize: 13, color: '#003366', marginBottom: 24 }}>
            ℹ️ Accepted file types: PDF, JPG, PNG | Max size: 5MB per file
          </div>
          
          {isRenewal ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <FormField label="Old Passport Number *" value={form.old_passport_number} onChange={(v) => update('old_passport_number', v.toUpperCase())} required />
                <FormField label="Date Issued *" type="date" value={form.old_passport_issued} onChange={(v) => update('old_passport_issued', v)} required />
              </div>
              <FormField label="Date of Expiry *" type="date" value={form.old_passport_expiry} onChange={(v) => update('old_passport_expiry', v)} required />
              <CloudinaryUpload label="Old Passport Data Page *" onUpload={(url) => setUpload('old_passport', url)} />
              <CloudinaryUpload label="2 Passport Photos *" onUpload={(url) => setUpload('photos', url)} />
            </>
          ) : (
            <>
              <CloudinaryUpload label="Birth Certificate *" onUpload={(url) => setUpload('birth_certificate', url)} />
              <CloudinaryUpload label="2 Passport Photos *" onUpload={(url) => setUpload('photos', url)} />
              <CloudinaryUpload label="Chief's Letter (optional)" onUpload={(url) => setUpload('chief_letter', url)} />
              
              <div className="module-section-title" style={{ marginTop: 32 }}>
                <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Guarantor Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField label="Full Name *" value={form.guarantor_name} onChange={(v) => update('guarantor_name', v)} required />
                <FormField label="National ID *" value={form.guarantor_id} onChange={(v) => update('guarantor_id', v)} required />
              </div>
              <FormField label="Phone Number *" value={form.guarantor_phone} onChange={(v) => update('guarantor_phone', v)} required />
            </>
          )}

          <div style={{ background: '#eff6ff', padding: 16, borderRadius: 8, marginTop: 24 }}>
            <div style={{ fontWeight: 700, color: '#003366', fontSize: 14, marginBottom: 8 }}>💡 Tips</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              <li>Passport photos must be recent, clear and meet ICAO standards.</li>
              <li>The chief's letter is not mandatory for all applicants.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Payment',
      pageTitle: 'Payment Details',
      pageDesc: 'Complete your payment to submit your application.',
      content: (
        <div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 24, textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#003366', fontWeight: 700, marginBottom: 8 }}>Payment Reference</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#003366', fontFamily: 'monospace', marginBottom: 8 }}>{paymentRef}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Use this reference when paying. Your application will not be processed without it.</div>
          </div>

          <FormField label="Where will you pay? *" as="select" value={form.payment_bank} onChange={(v) => update('payment_bank', v)} options={[{value:'', label:'— Select bank —'}, {value:'Standard Lesotho Bank', label:'Standard Lesotho Bank'}, {value:'Nedbank Lesotho', label:'Nedbank'}, {value:'Vodacom M-Pesa', label:'M-Pesa'}]} required />

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>{form.passport_type} passport - {form.book_format}</span>
              <span style={{ fontWeight: 600 }}>M {fees.base}</span>
            </div>
            {fees.formatSurcharge > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}><span style={{ color: '#64748b' }}>Format Surcharge</span><span style={{ fontWeight: 600 }}>M {fees.formatSurcharge}</span></div>}
            {fees.speedSurcharge > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}><span style={{ color: '#64748b' }}>Speed Surcharge</span><span style={{ fontWeight: 600 }}>M {fees.speedSurcharge}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: 12, marginTop: 12, fontWeight: 800, fontSize: 18, color: '#003366' }}>
              <span>Total to pay</span>
              <span>M {fees.total}</span>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16, fontSize: 14, color: '#15803d', marginBottom: 24 }}>
            📅 Estimated ready date: <strong>{readyDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
          </div>

          <div className="module-section-title">Declarations</div>
          <Checkbox checked={form.truth_declaration} onChange={(v) => update('truth_declaration', v)} label="I declare that the information provided is true and correct." />
          <Checkbox checked={form.data_consent} onChange={(v) => update('data_consent', v)} label="I consent to a data verification against Home Affairs." />
        </div>
      )
    }
  ];

  return (
    <div>
      {isEditing && <EditBanner application={existingApplication} onCancel={onCancelEdit} />}
      <FormWizard steps={steps} currentStep={currentStep} setCurrentStep={setCurrentStep} onComplete={handleSubmit} submitting={submitting} />
    </div>
  );
};

// SHARED PIECES
const EditBanner = ({ application, onCancel }) => (
  <div style={{ background: '#fff8e0', border: '1px solid #fef08a', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#854d0e', marginBottom: 8 }}>✎ Editing Application</div>
    <div style={{ fontSize: 14, color: '#a16207', lineHeight: 1.5, marginBottom: 12 }}><strong>Action required:</strong> {application.notes || application.rejection_reason}</div>
    <button type="button" onClick={onCancel} style={{ background: 'white', border: '1px solid #ca8a04', color: '#854d0e', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>Cancel editing</button>
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

export default PassportModule;