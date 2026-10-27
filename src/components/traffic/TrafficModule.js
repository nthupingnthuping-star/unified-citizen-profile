import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  submitApplication,
  getMyApplications,
  getMyTrafficFines,
  payTrafficFine,
  resubmitApplication,
  DEPARTMENTS,
  DISTRICTS,
} from '../../firebase/db';
import { calculateAge } from '../../firebase/eligibility';
import useAutoFill from '../../hooks/useAutoFill';
import Layout from '../common/Layout';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';
import FormField from '../common/FormField';
import CloudinaryUpload from '../common/CloudinaryUpload';
import PaymentBlock from '../common/PaymentBlock';
import VoiceFillButton from '../common/VoiceFillButton';
import RequestedInfoBanner from '../common/RequestedInfoBanner';
import VerifiedGuard from '../citizen/VerifiedGuard';
import FormWizard from '../common/FormWizard';
import '../../styles/module.css';

// ============================================================
// CONSTANTS & HELPERS
// ============================================================
const LEARNER_FEE = 100;
const DRIVER_NEW_FEE = 200;
const DRIVER_RENEWAL_FEE = 150;
const ROADWORTHY_FEE = 250;
const REGISTRATION_NEW_FEE = 500;
const REGISTRATION_TRANSFER_FEE = 250;
const REGISTRATION_REREG_FEE = 300;

const VEHICLE_TYPES = [
  { value: 'Motorcycle', labelKey: 'traffic_vehicle_motorcycle', minAge: 16 },
  { value: 'Standard Car', labelKey: 'traffic_vehicle_car', minAge: 18 },
  { value: 'Heavy Vehicle', labelKey: 'traffic_vehicle_heavy', minAge: 21 },
];

const LICENCE_CODES = [
  { value: '', labelKey: 'traffic_select_code' },
  { value: 'A', labelKey: 'traffic_code_a' },
  { value: 'B', labelKey: 'traffic_code_b' },
  { value: 'C1', labelKey: 'traffic_code_c1' },
  { value: 'C', labelKey: 'traffic_code_c' },
  { value: 'EB', labelKey: 'traffic_code_eb' },
  { value: 'EC', labelKey: 'traffic_code_ec' },
  { value: 'D', labelKey: 'traffic_code_d' },
];

const TRANSMISSION = [
  { value: 'Manual', labelKey: 'manual' },
  { value: 'Automatic', labelKey: 'automatic' },
];

const REGISTRATION_TYPES = [
  { value: 'First Registration', labelKey: 'traffic_first_registration', fee: REGISTRATION_NEW_FEE },
  { value: 'Change of Ownership', labelKey: 'traffic_change_ownership', fee: REGISTRATION_TRANSFER_FEE },
  { value: 'Re-registration', labelKey: 'traffic_reregistration', fee: REGISTRATION_REREG_FEE },
];

const VEHICLE_CLASSES = [
  { value: '', labelKey: 'traffic_select_class' },
  { value: 'Sedan', labelKey: 'traffic_class_sedan' },
  { value: 'SUV', labelKey: 'traffic_class_suv' },
  { value: 'Pickup', labelKey: 'traffic_class_pickup' },
  { value: 'Minibus', labelKey: 'traffic_class_minibus' },
  { value: 'Bus', labelKey: 'traffic_class_bus' },
  { value: 'Truck', labelKey: 'traffic_class_truck' },
  { value: 'Motorcycle', labelKey: 'traffic_class_motorcycle' },
  { value: 'Other', labelKey: 'traffic_class_other' },
];

const generatePaymentReference = (prefix = 'PAY-TRF') => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}-${year}-${random}`;
};

const getCitizenshipDisplay = (raw, t) => {
  const value = (raw || '').toLowerCase();
  if (value.includes('mosotho') || value.includes('citizen')) return 'Mosotho';
  if (value.includes('resident')) return t ? t('traffic_permanent_resident') : 'Permanent resident';
  return 'Mosotho';
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const TrafficModule = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();

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
      setApplications(apps.filter((a) => a.department_id === DEPARTMENTS.TRAFFIC));
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
        department_id: DEPARTMENTS.TRAFFIC,
        service_type: serviceType,
        application_data: data,
      });
      setMessage(`✓ ${t('submitted')}: ${r.reference}`);
      setLastSubmission({
        reference: r.reference, serviceType, paymentReference: data.payment?.reference, amount: data.fees?.total || 0, collectionBranch: data.collection_branch,
      });
      fetchApplications();
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
    if (app.service_type === 'Learner License') setActiveTab('learner');
    else if (app.service_type === 'Driver License') setActiveTab('driver');
    else if (app.service_type === 'Roadworthy Certificate') setActiveTab('roadworthy');
    else if (app.service_type === 'Vehicle Registration') setActiveTab('registration');
  };

  const handleCancelEdit = () => setEditingApplication(null);

  const handleResubmitted = () => {
    setEditingApplication(null);
    setActiveTab('dashboard');
    setMessage(`✓ ${t('traffic_resubmitted_ok')}`);
    fetchApplications();
  };

  const statusColor = (s) => {
    if (s === 'approved' || s === 'completed') return 'green';
    if (s === 'rejected' || s === 'cancelled') return 'red';
    if (s === 'processing') return 'yellow';
    return 'gray';
  };

  const TABS = [
    { key: 'dashboard', label: t('my_applications_tab') },
    { key: 'fines', label: t('traffic_fines') },
    { key: 'learner', label: t('learner_license_tab') },
    { key: 'driver', label: t('drivers_license_tab') },
    { key: 'roadworthy', label: t('traffic_roadworthy_tab') },
    { key: 'registration', label: t('vehicle_registration_tab') },
    { key: 'accident', label: t('traffic_accident_tab') },
  ];

  const needsInfo = applications.filter(
    (a) => a.status === 'processing' && (a.notes || a.rejection_reason)
  );

  return (
    <VerifiedGuard serviceName={t('traffic_department')}>
      <Layout title={t('traffic_department')}>
        <div className="module-root">
          <div className="module-header">
            <h1>{t('traffic_department')}</h1>
            <p>{t('traffic_subtitle')}</p>
          </div>

          <Alert type="info">{t('verified_by_home_affairs')}</Alert>

          <div className="module-tabs">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`module-tab ${activeTab === tab.key ? 'active' : ''}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {message && <Alert type={message.startsWith('✓') ? 'success' : 'error'} onClose={() => setMessage('')}>{message}</Alert>}

          {lastSubmission && lastSubmission.paymentReference && (
            <div className="module-card" style={{ marginBottom: 20 }}>
              <div style={{ padding: 10, textAlign: 'center' }}>
                <h3 style={{ color: '#006600', marginTop: 0, marginBottom: 8 }}>✓ {t('application_received')}</h3>
                <div style={{ display: 'inline-block', background: '#f0f6ff', padding: '12px 24px', borderRadius: 6, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{t('payment_ref')}</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#003366', fontFamily: 'monospace' }}>{lastSubmission.paymentReference}</div>
                </div>
                <p style={{ color: '#666', fontSize: 13, margin: 0 }}>
                  {t('traffic_pay_at')} <strong>M {lastSubmission.amount.toLocaleString()}</strong>{' '}{t('pay_at_bank')} <strong>{lastSubmission.collectionBranch}</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              {needsInfo.map((a) => (<RequestedInfoBanner key={a.id} application={a} onEdit={() => handleStartEdit(a)} />))}
              <div className="module-card">
                <div className="module-section-title">{t('traffic_my_apps')}</div>
                <Table
                  headers={[t('reference'), t('service'), t('status'), t('submitted'), t('action')]}
                  rows={applications.map((a) => [
                    a.application_reference, a.service_type,
                    <Badge color={statusColor(a.status)}>{a.status}</Badge>,
                    a.submitted_at?.toDate?.().toLocaleDateString() || '—',
                    a.status === 'processing' && (a.notes || a.rejection_reason) ? (
                      <button onClick={() => handleStartEdit(a)} style={{ background: 'linear-gradient(135deg, #ffcc00 0%, #ff9900 100%)', color: '#003366', border: 'none', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>{t('edit_and_resubmit')}</button>
                    ) : a.status === 'approved' || a.status === 'completed' ? (
                      <Link to={`/certificate/${a.application_reference}`} style={{ color: '#003366', fontWeight: 'bold', textDecoration: 'underline', fontSize: 13 }}>{t('view_certificate')}</Link>
                    ) : (<span style={{ color: '#999', fontSize: 12 }}>—</span>),
                  ])}
                  emptyMessage={t('no_applications_yet')}
                />
              </div>
            </>
          )}

          {activeTab === 'fines' && <TrafficFinesTab profile={profile} />}
          {activeTab === 'learner' && <LearnerLicenseForm profile={profile} submitting={loading} existingApplication={editingApplication?.service_type === 'Learner License' ? editingApplication : null} onSubmit={submit} onCancelEdit={handleCancelEdit} onResubmitted={handleResubmitted} />}
          {activeTab === 'driver' && <DriverLicenseForm profile={profile} submitting={loading} existingApplication={editingApplication?.service_type === 'Driver License' ? editingApplication : null} onSubmit={submit} onCancelEdit={handleCancelEdit} onResubmitted={handleResubmitted} />}
          {activeTab === 'roadworthy' && <RoadworthyForm profile={profile} submitting={loading} existingApplication={editingApplication?.service_type === 'Roadworthy Certificate' ? editingApplication : null} onSubmit={submit} onCancelEdit={handleCancelEdit} onResubmitted={handleResubmitted} />}
          {activeTab === 'registration' && <VehicleRegistrationForm profile={profile} submitting={loading} existingApplication={editingApplication?.service_type === 'Vehicle Registration' ? editingApplication : null} onSubmit={submit} onCancelEdit={handleCancelEdit} onResubmitted={handleResubmitted} />}
          {activeTab === 'accident' && <AccidentInfoPanel />}
        </div>
      </Layout>
    </VerifiedGuard>
  );
};

// ============================================================
// TRAFFIC FINES TAB
// ============================================================
const TrafficFinesTab = ({ profile }) => {
  const { t } = useLanguage();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingFine, setPayingFine] = useState(null);
  const [bankName, setBankName] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [paying, setPaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const loadFines = async () => {
    try {
      const data = await getMyTrafficFines(profile.uid);
      setFines(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadFines(); }, [profile]);

  const handlePayClick = (fine) => {
    setPayingFine(fine);
    setPaymentRef(generatePaymentReference('PAY-FINE'));
    setReceiptUrl(null);
    setCurrentStep(0);
  };

  const handleProcessPayment = async () => {
    if (!bankName) return alert(t('traffic_select_bank_alert'));
    if (!receiptUrl) return alert(t('traffic_upload_receipt_alert'));

    setPaying(true);
    try {
      await payTrafficFine(payingFine.id, {
        reference: paymentRef, bank_name: bankName, amount: payingFine.amount, proof_of_payment_url: receiptUrl,
      });
      alert(t('traffic_payment_submitted'));
      setPayingFine(null);
      setBankName('');
      setReceiptUrl(null);
      loadFines();
    } catch (err) {
      alert(t('traffic_payment_failed') + err.message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="module-card">{t('loading')}</div>;

  if (payingFine) {
    const steps = [
      {
        title: 'Payment',
        pageTitle: t('traffic_pay_fine_for'),
        pageDesc: payingFine.fine_number,
        content: (
          <div>
            <Alert type="warning">
              {t('traffic_paying_for')} <strong>{payingFine.offence}</strong>.{' '}
              {t('traffic_amount_due')}: <strong>M {payingFine.amount.toFixed(2)}</strong>.
            </Alert>
            <div className="module-section-title">{t('step1_payment')}</div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{t('step1_desc')}</p>
            <PaymentBlock reference={paymentRef} bankName={bankName} onBankChange={setBankName} rows={[{ label: payingFine.offence, amount: payingFine.amount }]} total={payingFine.amount} />
          </div>
        )
      },
      {
        title: 'Proof',
        pageTitle: t('step2_upload'),
        pageDesc: 'Upload your receipt.',
        content: (
          <div>
            <div className="module-section-title">{t('step2_upload')}</div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{t('step2_desc')}</p>
            <CloudinaryUpload label={`${t('upload_receipt')} *`} onUpload={(url) => setReceiptUrl(url)} />
          </div>
        )
      }
    ];

    return (
      <div>
        <FormWizard steps={steps} currentStep={currentStep} setCurrentStep={setCurrentStep} onComplete={handleProcessPayment} submitting={paying} />
        <div style={{ textAlign: 'center', marginTop: -20, marginBottom: 20 }}>
          <button onClick={() => setPayingFine(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}>
            {t('cancel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="module-card">
      <div className="module-section-title">{t('traffic_my_fines')}</div>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>{t('fines_desc')}</p>

      {fines.length === 0 ? (
        <Alert type="success">✓ {t('no_fines')}</Alert>
      ) : (
        <Table
          headers={[t('fine_no'), t('offence'), t('traffic_date_issued'), t('amount'), t('status'), t('action')]}
          rows={fines.map((fine) => [
            fine.fine_number, fine.offence,
            fine.issued_at?.toDate?.().toLocaleDateString() || '—',
            `M ${fine.amount.toFixed(2)}`,
            <Badge color={fine.status === 'paid' ? 'green' : fine.status === 'processing' ? 'yellow' : 'red'}>
              {fine.status === 'paid' ? t('paid').toUpperCase() : fine.status === 'processing' ? t('verifying').toUpperCase() : t('unpaid').toUpperCase()}
            </Badge>,
            fine.status === 'unpaid' ? (
              <button onClick={() => handlePayClick(fine)} style={{ background: '#cc0000', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>{t('pay_now')}</button>
            ) : fine.status === 'processing' ? (
              <span style={{ color: '#856404', fontSize: 12, fontWeight: 'bold' }}>{t('verifying')}</span>
            ) : (
              <span style={{ color: '#666', fontSize: 13 }}>{t('paid')}</span>
            ),
          ])}
        />
      )}
    </div>
  );
};

// ============================================================
// LEARNER LICENSE FORM
// ============================================================
const LearnerLicenseForm = ({ profile, submitting, existingApplication = null, onSubmit, onCancelEdit, onResubmitted }) => {
  const { t } = useLanguage();
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};
  const age = calculateAge(profile?.date_of_birth);
  const [currentStep, setCurrentStep] = useState(0);

  const [form, setForm] = useState({ vehicle_type: existingData.vehicle_type || 'Standard Car', bank_name: existingData.payment?.bank_name || '', collection_branch: existingData.collection_branch || 'Maseru' });
  const [uploads, setUploads] = useState({ eye_test: existingData.documents_uploaded?.eye_test || null, photos: existingData.documents_uploaded?.photos || null });
  const [paymentRef] = useState(() => existingData.payment?.reference || generatePaymentReference());
  const [resubmitting, setResubmitting] = useState(false);

  useAutoFill(profile, form, setForm);
  const update = (k, v) => setForm({ ...form, [k]: v });
  const setUpload = (k, v) => setUploads({ ...uploads, [k]: v });

  const vehicleMeta = VEHICLE_TYPES.find((v) => v.value === form.vehicle_type);
  const eligible = age !== null && vehicleMeta && age >= vehicleMeta.minAge;

  const handleSubmit = async () => {
    if (!form.vehicle_type || !form.bank_name || !uploads.eye_test || !uploads.photos || !eligible) return alert('Please complete all fields and ensure you are eligible.');

    const payload = {
      vehicle_type: form.vehicle_type, collection_branch: form.collection_branch,
      documents_uploaded: { eye_test: uploads.eye_test, photos: uploads.photos },
      payment: { reference: paymentRef, bank: form.bank_name, status: existingData.payment?.status || 'awaiting_payment' },
      fees: { base: LEARNER_FEE, total: LEARNER_FEE },
    };

    if (isEditing) {
      setResubmitting(true);
      try { await resubmitApplication(existingApplication.id, payload); if (onResubmitted) onResubmitted(); } 
      catch (err) { alert(t('traffic_resubmit_failed') + err.message); } 
      finally { setResubmitting(false); }
    } else {
      await onSubmit('Learner License', payload);
    }
  };

  const steps = [
    {
      title: 'Vehicle',
      pageTitle: t('traffic_learner_app'),
      pageDesc: 'Select your vehicle type.',
      content: (
        <div>
          {!isEditing && <Alert type="info">{t('traffic_learner_info').replace('{fee}', LEARNER_FEE)}</Alert>}
          <div className="module-section-title">{t('traffic_step2_vehicle')}</div>
          <FormField label={`${t('vehicle_type')} *`} as="select" value={form.vehicle_type} onChange={(v) => update('vehicle_type', v)} options={VEHICLE_TYPES.map((v) => ({ value: v.value, label: t(v.labelKey) }))} required />
          {eligible ? (<div style={eligibleStyle}>✓ {t('traffic_eligible').replace('{age}', age)}</div>) : (<div style={notEligibleStyle}>{t('traffic_not_eligible').replace('{min}', vehicleMeta?.minAge).replace('{age}', age)}</div>)}
        </div>
      )
    },
    {
      title: 'Documents',
      pageTitle: 'Upload Documents',
      pageDesc: 'Upload eye test and photos.',
      content: (
        <div>
          <div className="module-section-title">{t('traffic_step3_upload')}</div>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{t('ha_upload_help')}</p>
          <CloudinaryUpload label={`${t('upload_eye_test')} *`} onUpload={(url) => setUpload('eye_test', url)} />
          <CloudinaryUpload label={`${t('upload_photos')} *`} onUpload={(url) => setUpload('photos', url)} />
        </div>
      )
    },
    {
      title: 'Payment',
      pageTitle: 'Collection & Payment',
      pageDesc: 'Choose branch and pay.',
      content: (
        <div>
          <div className="module-section-title">{t('traffic_step4_branch')}</div>
          <FormField label={t('traffic_learner_branch_question')} as="select" value={form.collection_branch} onChange={(v) => update('collection_branch', v)} options={DISTRICTS.map((d) => ({ value: d, label: d }))} required />
          <div style={{ marginTop: 24 }}>
            <div className="module-section-title">{t('traffic_step5_payment')}</div>
            <PaymentBlock reference={paymentRef} bankName={form.bank_name} onBankChange={(v) => update('bank_name', v)} rows={[{ label: t('traffic_learner_fee'), amount: LEARNER_FEE }]} total={LEARNER_FEE} />
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
// DRIVER LICENSE FORM
// ============================================================
const DriverLicenseForm = ({ profile, submitting, existingApplication = null, onSubmit, onCancelEdit, onResubmitted }) => {
  const { t } = useLanguage();
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};
  const [currentStep, setCurrentStep] = useState(0);

  const [form, setForm] = useState({ application_type: existingData.application_type || 'New', licence_code: existingData.licence_code || '', transmission: existingData.transmission || 'Manual', bank_name: existingData.payment?.bank_name || '', collection_branch: existingData.collection_branch || 'Maseru' });
  const [uploads, setUploads] = useState({ learner_license: existingData.documents_uploaded?.learner_license || null, certificate_of_competence: existingData.documents_uploaded?.certificate_of_competence || null });
  const [paymentRef] = useState(() => existingData.payment?.reference || generatePaymentReference());
  const [resubmitting, setResubmitting] = useState(false);

  useAutoFill(profile, form, setForm);
  const update = (k, v) => setForm({ ...form, [k]: v });
  const setUpload = (k, v) => setUploads({ ...uploads, [k]: v });

  const fee = form.application_type === 'New' ? DRIVER_NEW_FEE : DRIVER_RENEWAL_FEE;

  const handleSubmit = async () => {
    if (!form.licence_code || !form.bank_name || !uploads.learner_license || !uploads.certificate_of_competence) return alert('Please fill all required fields.');

    const payload = {
      application_type: form.application_type, licence_code: form.licence_code, transmission: form.transmission, collection_branch: form.collection_branch,
      documents_uploaded: { learner_license: uploads.learner_license, certificate_of_competence: uploads.certificate_of_competence },
      payment: { reference: paymentRef, bank: form.bank_name, status: existingData.payment?.status || 'awaiting_payment' },
      fees: { base: fee, total: fee },
    };

    if (isEditing) {
      setResubmitting(true);
      try { await resubmitApplication(existingApplication.id, payload); if (onResubmitted) onResubmitted(); } 
      catch (err) { alert(t('traffic_resubmit_failed') + err.message); } 
      finally { setResubmitting(false); }
    } else {
      await onSubmit('Driver License', payload);
    }
  };

  const steps = [
    {
      title: 'License Type',
      pageTitle: t('traffic_driver_app'),
      pageDesc: 'Select application type and code.',
      content: (
        <div>
          {!isEditing && <Alert type="info">{t('traffic_driver_info').replace('{newFee}', DRIVER_NEW_FEE).replace('{renewalFee}', DRIVER_RENEWAL_FEE)}</Alert>}
          <div className="module-section-title">{t('traffic_step2_app_type')}</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
            <Radio checked={form.application_type === 'New'} onChange={() => update('application_type', 'New')} label={`${t('traffic_new_license')} (M ${DRIVER_NEW_FEE})`} />
            <Radio checked={form.application_type === 'Renewal'} onChange={() => update('application_type', 'Renewal')} label={`${t('renewal_tab')} (M ${DRIVER_RENEWAL_FEE})`} />
          </div>
          <div className="module-section-title">{t('traffic_step3_license')}</div>
          <FormField label={`${t('license_code')} *`} as="select" value={form.licence_code} onChange={(v) => update('licence_code', v)} options={LICENCE_CODES.map((c) => ({ value: c.value, label: t(c.labelKey) }))} required />
          <FormField label={t('transmission')} as="select" value={form.transmission} onChange={(v) => update('transmission', v)} options={TRANSMISSION.map((c) => ({ value: c.value, label: t(c.labelKey) }))} />
        </div>
      )
    },
    {
      title: 'Documents',
      pageTitle: 'Upload Documents',
      pageDesc: 'Upload learner license and competence.',
      content: (
        <div>
          <div className="module-section-title">{t('traffic_step4_upload')}</div>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{t('ha_upload_help')}</p>
          <CloudinaryUpload label={`${t('upload_learner')} *`} onUpload={(url) => setUpload('learner_license', url)} />
          <CloudinaryUpload label={`${t('upload_competence')} *`} onUpload={(url) => setUpload('certificate_of_competence', url)} />
        </div>
      )
    },
    {
      title: 'Payment',
      pageTitle: 'Collection & Payment',
      pageDesc: 'Choose branch and pay.',
      content: (
        <div>
          <div className="module-section-title">{t('traffic_step5_branch')}</div>
          <FormField label={t('traffic_driver_branch_question')} as="select" value={form.collection_branch} onChange={(v) => update('collection_branch', v)} options={DISTRICTS.map((d) => ({ value: d, label: d }))} required />
          <div style={{ marginTop: 24 }}>
            <div className="module-section-title">{t('traffic_step6_payment')}</div>
            <PaymentBlock reference={paymentRef} bankName={form.bank_name} onBankChange={(v) => update('bank_name', v)} rows={[{ label: `${form.application_type === 'New' ? t('traffic_new_license') : t('renewal_tab')}`, amount: fee }]} total={fee} />
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
// ROADWORTHY FORM
// ============================================================
const RoadworthyForm = ({ profile, submitting, existingApplication = null, onSubmit, onCancelEdit, onResubmitted }) => {
  const { t } = useLanguage();
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};
  const existingVehicle = existingData.vehicle || {};
  const [currentStep, setCurrentStep] = useState(0);

  const [form, setForm] = useState({ plate_number: existingVehicle.plate_number || '', make: existingVehicle.make || '', model: existingVehicle.model || '', year: existingVehicle.year || '', vin: existingVehicle.vin || '', inspection_branch: existingData.inspection_branch || 'Maseru', bank_name: existingData.payment?.bank_name || '' });
  const [paymentRef] = useState(() => existingData.payment?.reference || generatePaymentReference());
  const [resubmitting, setResubmitting] = useState(false);

  useAutoFill(profile, form, setForm);
  const update = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async () => {
    if (!form.plate_number.trim() || !form.make.trim() || !form.model.trim() || !form.year || !form.bank_name) return alert('Please fill all required fields.');

    const payload = {
      vehicle: { plate_number: form.plate_number.toUpperCase(), make: form.make, model: form.model, year: form.year, vin: form.vin.toUpperCase() },
      inspection_branch: form.inspection_branch, collection_branch: form.inspection_branch,
      payment: { reference: paymentRef, bank: form.bank_name, status: existingData.payment?.status || 'awaiting_payment' },
      fees: { base: ROADWORTHY_FEE, total: ROADWORTHY_FEE },
    };

    if (isEditing) {
      setResubmitting(true);
      try { await resubmitApplication(existingApplication.id, payload); if (onResubmitted) onResubmitted(); } 
      catch (err) { alert(t('traffic_resubmit_failed') + err.message); } 
      finally { setResubmitting(false); }
    } else {
      await onSubmit('Roadworthy Certificate', payload);
    }
  };

  const steps = [
    {
      title: 'Vehicle',
      pageTitle: t('traffic_roadworthy_app'),
      pageDesc: 'Provide vehicle details.',
      content: (
        <div>
          {!isEditing && <Alert type="info">{t('traffic_roadworthy_info').replace('{fee}', ROADWORTHY_FEE)}</Alert>}
          {!isEditing && (
            <div style={{ marginBottom: 20 }}>
              <VoiceFillButton fields={[{ key: 'plate_number', icon: '🚗', type: 'text', prompt: t('traffic_voice_plate'), example: 'A1234' }, { key: 'make', icon: '🏭', type: 'text', prompt: t('traffic_voice_make'), example: 'Toyota' }, { key: 'model', icon: '🚙', type: 'text', prompt: t('traffic_voice_model'), example: 'Hilux' }]} onComplete={(values) => setForm(prev => ({ ...prev, ...values }))} />
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#666', fontStyle: 'italic' }}>{t('voice_fill_tip_short')}</p>
            </div>
          )}
          <div className="module-section-title">{t('traffic_step2_vehicle_details')}</div>
          <FormField label={`${t('plate_number')} *`} value={form.plate_number} onChange={(v) => update('plate_number', v.toUpperCase())} placeholder={t('traffic_placeholder_plate')} required />
          <FormField label={`${t('make')} *`} value={form.make} onChange={(v) => update('make', v)} placeholder={t('traffic_placeholder_make')} required />
          <FormField label={`${t('model')} *`} value={form.model} onChange={(v) => update('model', v)} placeholder={t('traffic_placeholder_model')} required />
          <FormField label={`${t('year')} *`} type="number" value={form.year} onChange={(v) => update('year', v)} placeholder="2018" required />
          <FormField label={t('chassis_number')} value={form.vin} onChange={(v) => update('vin', v.toUpperCase())} />
        </div>
      )
    },
    {
      title: 'Payment',
      pageTitle: 'Inspection & Payment',
      pageDesc: 'Choose branch and pay.',
      content: (
        <div>
          <div className="module-section-title">{t('traffic_step3_inspection')}</div>
          <FormField label={t('traffic_inspection_question')} as="select" value={form.inspection_branch} onChange={(v) => update('inspection_branch', v)} options={DISTRICTS.map((d) => ({ value: d, label: d }))} required />
          <div style={{ marginTop: 24 }}>
            <div className="module-section-title">{t('traffic_step4_payment')}</div>
            <PaymentBlock reference={paymentRef} bankName={form.bank_name} onBankChange={(v) => update('bank_name', v)} rows={[{ label: t('traffic_roadworthy_fee'), amount: ROADWORTHY_FEE }]} total={ROADWORTHY_FEE} />
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
// VEHICLE REGISTRATION FORM
// ============================================================
const VehicleRegistrationForm = ({ profile, submitting, existingApplication = null, onSubmit, onCancelEdit, onResubmitted }) => {
  const { t } = useLanguage();
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};
  const existingVehicle = existingData.vehicle || {};
  const existingUploads = existingData.documents_uploaded || {};
  const [currentStep, setCurrentStep] = useState(0);

  const [form, setForm] = useState({
    registration_type: existingData.registration_type || 'First Registration', plate_number: existingVehicle.plate_number || '', year: existingVehicle.year || '', make: existingVehicle.make || '', model: existingVehicle.model || '', vehicle_class: existingVehicle.vehicle_class || '', colour: existingVehicle.colour || '', chassis_number: existingVehicle.chassis_number || '', engine_number: existingVehicle.engine_number || '', bank_name: existingData.payment?.bank_name || '', collection_branch: existingData.collection_branch || 'Maseru',
  });
  const [uploads, setUploads] = useState({ customs_clearance: existingUploads.customs_clearance || null, vat_clearance: existingUploads.vat_clearance || null, proof_of_purchase: existingUploads.proof_of_purchase || null });
  const [paymentRef] = useState(() => existingData.payment?.reference || generatePaymentReference());
  const [resubmitting, setResubmitting] = useState(false);

  useAutoFill(profile, form, setForm);
  const update = (k, v) => setForm({ ...form, [k]: v });
  const setUpload = (k, v) => setUploads({ ...uploads, [k]: v });

  const regMeta = REGISTRATION_TYPES.find((r) => r.value === form.registration_type);
  const fee = regMeta?.fee || REGISTRATION_NEW_FEE;

  const handleSubmit = async () => {
    if (!form.plate_number.trim() || !form.year || !form.make.trim() || !form.model.trim() || !form.chassis_number.trim() || !form.bank_name || !uploads.proof_of_purchase) return alert('Please fill all required fields.');

    const payload = {
      registration_type: form.registration_type,
      vehicle: { plate_number: form.plate_number.toUpperCase(), year: form.year, make: form.make, model: form.model, vehicle_class: form.vehicle_class, colour: form.colour, chassis_number: form.chassis_number.toUpperCase(), engine_number: form.engine_number },
      collection_branch: form.collection_branch,
      documents_uploaded: { customs_clearance: uploads.customs_clearance, vat_clearance: uploads.vat_clearance, proof_of_purchase: uploads.proof_of_purchase },
      payment: { reference: paymentRef, bank: form.bank_name, status: existingData.payment?.status || 'awaiting_payment' },
      fees: { base: fee, total: fee },
    };

    if (isEditing) {
      setResubmitting(true);
      try { await resubmitApplication(existingApplication.id, payload); if (onResubmitted) onResubmitted(); } 
      catch (err) { alert(t('traffic_resubmit_failed') + err.message); } 
      finally { setResubmitting(false); }
    } else {
      await onSubmit('Vehicle Registration', payload);
    }
  };

  const steps = [
    {
      title: 'Vehicle Details',
      pageTitle: t('vehicle_registration_tab'),
      pageDesc: 'Provide vehicle info.',
      content: (
        <div>
          {!isEditing && <Alert type="info">{t('traffic_reg_info').replace('{newFee}', REGISTRATION_NEW_FEE).replace('{transferFee}', REGISTRATION_TRANSFER_FEE).replace('{reregFee}', REGISTRATION_REREG_FEE)}</Alert>}
          {!isEditing && (
            <div style={{ marginBottom: 20 }}>
              <VoiceFillButton fields={[{ key: 'plate_number', icon: '🚗', type: 'text', prompt: t('traffic_voice_plate'), example: 'A1234' }, { key: 'make', icon: '🏭', type: 'text', prompt: t('traffic_voice_make_full'), example: 'Toyota' }, { key: 'model', icon: '🚙', type: 'text', prompt: t('traffic_voice_model'), example: 'Corolla' }, { key: 'colour', icon: '🎨', type: 'text', prompt: t('traffic_voice_colour'), example: 'White' }]} onComplete={(values) => setForm(prev => ({ ...prev, ...values }))} />
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#666', fontStyle: 'italic' }}>{t('voice_fill_tip_short')}</p>
            </div>
          )}
          <div className="module-section-title">{t('traffic_step2_reg_type')}</div>
          <FormField label={`${t('registration_type')} *`} as="select" value={form.registration_type} onChange={(v) => update('registration_type', v)} options={REGISTRATION_TYPES.map((r) => ({ value: r.value, label: `${t(r.labelKey)} (M ${r.fee})` }))} required />
          
          <div className="module-section-title" style={{ marginTop: 24 }}>{t('traffic_step3_vehicle_details')}</div>
          <FormField label={`${t('plate_number')} *`} value={form.plate_number} onChange={(v) => update('plate_number', v.toUpperCase())} placeholder={t('traffic_placeholder_plate')} required />
          <FormField label={`${t('year')} *`} type="number" value={form.year} onChange={(v) => update('year', v)} placeholder="2022" required />
          <FormField label={`${t('make')} *`} value={form.make} onChange={(v) => update('make', v)} placeholder={t('traffic_placeholder_make')} required />
          <FormField label={`${t('model')} *`} value={form.model} onChange={(v) => update('model', v)} placeholder={t('traffic_placeholder_model_corolla')} required />
          <FormField label={t('vehicle_class')} as="select" value={form.vehicle_class} onChange={(v) => update('vehicle_class', v)} options={VEHICLE_CLASSES.map((c) => ({ value: c.value, label: t(c.labelKey) }))} />
          <FormField label={t('colour')} value={form.colour} onChange={(v) => update('colour', v)} placeholder={t('traffic_placeholder_colour')} />
          <FormField label={`${t('chassis_number')} *`} value={form.chassis_number} onChange={(v) => update('chassis_number', v.toUpperCase())} placeholder="VIN" required />
          <FormField label={t('engine_number')} value={form.engine_number} onChange={(v) => update('engine_number', v)} />
        </div>
      )
    },
    {
      title: 'Documents',
      pageTitle: 'Upload Documents',
      pageDesc: 'Proof of purchase and clearances.',
      content: (
        <div>
          <div className="module-section-title">{t('traffic_step4_upload')}</div>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{t('ha_upload_help')}</p>
          <CloudinaryUpload label={t('upload_customs')} onUpload={(url) => setUpload('customs_clearance', url)} />
          <CloudinaryUpload label={t('upload_vat')} onUpload={(url) => setUpload('vat_clearance', url)} />
          <CloudinaryUpload label={`${t('upload_purchase')} *`} onUpload={(url) => setUpload('proof_of_purchase', url)} />
        </div>
      )
    },
    {
      title: 'Payment',
      pageTitle: 'Collection & Payment',
      pageDesc: 'Choose branch and pay.',
      content: (
        <div>
          <div className="module-section-title">{t('traffic_step5_branch')}</div>
          <FormField label={t('traffic_reg_branch_question')} as="select" value={form.collection_branch} onChange={(v) => update('collection_branch', v)} options={DISTRICTS.map((d) => ({ value: d, label: d }))} required />
          <div style={{ marginTop: 24 }}>
            <div className="module-section-title">{t('traffic_step6_payment')}</div>
            <PaymentBlock reference={paymentRef} bankName={form.bank_name} onBankChange={(v) => update('bank_name', v)} rows={[{ label: t(regMeta?.labelKey || 'traffic_first_registration'), amount: fee }]} total={fee} />
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
// ACCIDENT INFO PANEL
// ============================================================
const AccidentInfoPanel = () => {
  const { t } = useLanguage();
  return (
    <div className="module-card">
      <div className="module-section-title">{t('traffic_accident_title')}</div>
      <div style={{ background: '#fffbeb', border: '1px solid #fef08a', borderRadius: 8, padding: 20, fontSize: 14, color: '#854d0e', marginBottom: 20 }}>
        <strong>⚠ {t('traffic_important')}</strong> {t('traffic_accident_warning')}
      </div>
      <div style={{ fontSize: 14, color: '#334155', marginBottom: 20, lineHeight: 1.7 }}>
        <p style={{ marginTop: 0 }}>{t('traffic_accident_lmps')}</p>
        <ul><li>{t('traffic_accident_li1')}</li><li>{t('traffic_accident_li2')}</li><li>{t('traffic_accident_li3')}</li><li>{t('traffic_accident_li4')}</li></ul>
        <p>{t('traffic_accident_emergency')} <strong>112</strong>.</p>
      </div>
      <Link to="/police" style={{ display: 'inline-block', background: '#991b1b', color: 'white', padding: '12px 26px', borderRadius: 8, textDecoration: 'none', fontSize: 15, fontWeight: 'bold' }}>
        🚨 {t('traffic_go_to_police')} →
      </Link>
    </div>
  );
};

// ============================================================
// SHARED PIECES
// ============================================================
const EditBanner = ({ application, onCancel }) => {
  const { t } = useLanguage();
  return (
    <div style={{ background: '#fff8e0', border: '1px solid #fef08a', borderRadius: 12, padding: 20, marginBottom: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 'bold', color: '#854d0e', marginBottom: 8 }}>✎ {t('edit_banner')} — {application.application_reference}</div>
      <div style={{ fontSize: 14, color: '#a16207', lineHeight: 1.5, marginBottom: 12 }}><strong>{t('traffic_what_needs')}</strong> {application.notes || application.rejection_reason}</div>
      <button type="button" onClick={onCancel} style={{ background: 'white', border: '1px solid #ca8a04', color: '#854d0e', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>{t('cancel_editing')}</button>
    </div>
  );
};

const Radio = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#334155', cursor: 'pointer', background: checked ? '#eff6ff' : '#f8fafc', padding: '10px 16px', borderRadius: 8, border: checked ? '1px solid #bfdbfe' : '1px solid #e2e8f0' }}>
    <input type="radio" checked={checked} onChange={onChange} style={{ accentColor: '#003366' }} /> {label}
  </label>
);

const eligibleStyle = { marginTop: 8, padding: 12, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, fontWeight: 'bold' };
const notEligibleStyle = { marginTop: 8, padding: 12, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, fontWeight: 'bold' };

export default TrafficModule;