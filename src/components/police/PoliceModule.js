import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  submitApplication,
  getMyApplications,
  resubmitApplication,
  DEPARTMENTS,
  DISTRICTS,
  isReportService,
} from '../../firebase/db';
import VoiceFillButton from '../common/VoiceFillButton';
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
const CLEARANCE_PURPOSES = [
  { value: '', label: '— Select purpose —' },
  { value: 'Employment', label: 'Employment (local)' },
  { value: 'Employment Abroad', label: 'Employment abroad / work permit' },
  { value: 'Study Abroad', label: 'Study abroad' },
  { value: 'Immigration', label: 'Immigration / residence permit' },
  { value: 'Visa Application', label: 'Visa application' },
  { value: 'Adoption', label: 'Adoption' },
  { value: 'Other', label: 'Other' },
];

const CRIME_TYPES = [
  { value: '', label: '— Select crime type —' },
  { value: 'Theft', label: 'Theft / burglary' },
  { value: 'Robbery', label: 'Robbery' },
  { value: 'Assault', label: 'Assault' },
  { value: 'Domestic Violence', label: 'Domestic violence' },
  { value: 'Gender-Based Violence', label: 'Gender-based violence' },
  { value: 'Fraud', label: 'Fraud / scam' },
  { value: 'Cybercrime', label: 'Cybercrime' },
  { value: 'Stock Theft', label: 'Stock theft' },
  { value: 'Traffic Accident', label: 'Traffic accident' },
  { value: 'Corruption', label: 'Corruption' },
  { value: 'Missing Person', label: 'Missing person' },
  { value: 'Other', label: 'Other' },
];

const CYBERCRIME_TYPES = [
  { value: '', label: '— Select type —' },
  { value: 'Online Fraud', label: 'Online fraud / scam' },
  { value: 'Identity Theft', label: 'Identity theft' },
  { value: 'Harassment', label: 'Online harassment' },
  { value: 'Hacking', label: 'Account hacking' },
  { value: 'Fake Profile', label: 'Fake profile' },
  { value: 'Financial Scam', label: 'Financial scam' },
  { value: 'Other', label: 'Other' },
];

const CLEARANCE_FEE = 250;

const generatePaymentReference = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `PAY-POL-${year}-${random}`;
};

const getCitizenshipDisplay = (raw) => {
  const value = (raw || '').toLowerCase();
  if (value.includes('resident')) return 'Permanent resident';
  return 'Mosotho';
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const PoliceModule = () => {
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
      setApplications(apps.filter((a) => a.department_id === DEPARTMENTS.POLICE));
    } catch (err) {
      console.error(err);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchApplications(); }, [profile]);

  const submit = async (serviceType, data, onSuccess) => {
    setLoading(true);
    setMessage('');
    setLastSubmission(null);
    try {
      const r = await submitApplication({
        citizen_id: profile.uid,
        citizen_name: profile.full_name,
        citizen_national_id: profile.national_id,
        department_id: DEPARTMENTS.POLICE,
        service_type: serviceType,
        application_data: data,
      });
      setMessage(`✓ Submitted: ${r.reference}`);
      setLastSubmission({
        reference: r.reference, serviceType, paymentReference: data.payment?.reference, amount: data.fees?.total || 0, priority: r.priority || 'normal', caseNumber: r.case_number || r.reference,
      });
      fetchApplications();
      if (onSuccess) onSuccess();
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
    if (app.service_type === 'Police Clearance') setActiveTab('clearance');
    else if (app.service_type === 'Crime Report') setActiveTab('crime');
    else if (app.service_type === 'Traffic Accident Report') setActiveTab('accident');
    else if (app.service_type === 'Cybercrime Report') setActiveTab('cyber');
    else if (app.service_type === 'Report Lost ID') setActiveTab('lostid');
  };

  const handleCancelEdit = () => setEditingApplication(null);

  const handleResubmitted = () => {
    setEditingApplication(null);
    setActiveTab('dashboard');
    setMessage('✓ Your updated application has been resubmitted for review.');
    fetchApplications();
  };

  const statusColor = (s) => {
    if (s === 'approved' || s === 'completed') return 'green';
    if (s === 'rejected' || s === 'cancelled') return 'red';
    if (s === 'processing' || s === 'on-scene') return 'yellow';
    if (s === 'dispatched') return 'red';
    return 'gray';
  };

  // Hardcoded Tabs
  const TABS = [
    { key: 'dashboard', label: 'My Applications' },
    { key: 'clearance', label: 'Police Clearance' },
    { key: 'crime', label: 'Report a Crime' },
    { key: 'lostid', label: 'Report Lost ID' },
    { key: 'accident', label: 'Traffic Accident' },
    { key: 'cyber', label: 'Cybercrime' },
  ];

  const needsInfo = applications.filter(
    (a) => a.status === 'processing' && (a.notes || a.rejection_reason)
  );

  return (
    <VerifiedGuard serviceName="Lesotho Mounted Police Service">
      <Layout title="Lesotho Mounted Police Service">
        <div className="module-root">
          <div className="module-header">
            <h1>Lesotho Mounted Police Service</h1>
            <p>Clearances, crime reports, accidents, and cybercrime</p>
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
            <>
              {lastSubmission.priority === 'critical' ? (
                <div style={{ background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)', color: 'white', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 8px 24px rgba(204, 0, 0, 0.25)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🚨</div>
                  <h2 style={{ margin: '0 0 10px 0', fontSize: 22, color: 'white' }}>Emergency report received</h2>
                  <p style={{ margin: '0 0 16px 0', fontSize: 15, opacity: 0.95 }}>A response unit has been notified. If the situation is still dangerous, call <strong>112</strong> immediately.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                    <div style={{ background: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 6 }}>
                      <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: 1, textTransform: 'uppercase' }}>Case Number</div>
                      <div style={{ fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace', marginTop: 4 }}>{lastSubmission.caseNumber}</div>
                    </div>
                  </div>
                </div>
              ) : lastSubmission.paymentReference ? (
                <div className="module-card" style={{ marginBottom: 20 }}>
                  <div style={{ padding: 10, textAlign: 'center' }}>
                    <h3 style={{ color: '#006600', marginTop: 0, marginBottom: 8 }}>✓ Application received</h3>
                    <div style={{ display: 'inline-block', background: '#f0f6ff', padding: '12px 24px', borderRadius: 6, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Payment Reference</div>
                      <div style={{ fontSize: 20, fontWeight: 'bold', color: '#003366', fontFamily: 'monospace' }}>{lastSubmission.paymentReference}</div>
                    </div>
                    <p style={{ color: '#666', fontSize: 13, margin: 0 }}>Pay <strong>M {lastSubmission.amount.toLocaleString()}</strong> at any listed bank.</p>
                  </div>
                </div>
              ) : (
                <div className="module-card" style={{ marginBottom: 20 }}>
                  <div style={{ padding: 10, textAlign: 'center' }}>
                    <h3 style={{ color: '#006600', marginTop: 0, marginBottom: 8 }}>✓ Report received</h3>
                    <p style={{ color: '#666', fontSize: 13, margin: 0 }}>Case number: <strong style={{ fontFamily: 'monospace' }}>{lastSubmission.caseNumber}</strong></p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'dashboard' && (
            <>
              {needsInfo.map((a) => (<RequestedInfoBanner key={a.id} application={a} onEdit={() => handleStartEdit(a)} />))}
              <div className="module-card">
                <div className="module-section-title">My Police Applications</div>
                <Table
                  headers={['Reference', 'Service', 'Status', 'Submitted', 'Action']}
                  rows={applications.map((a) => [
                    a.application_reference, a.service_type,
                    <Badge color={statusColor(a.status)}>{a.status}</Badge>,
                    a.submitted_at?.toDate?.().toLocaleDateString() || '—',
                    a.status === 'processing' && (a.notes || a.rejection_reason) ? (
                      <button onClick={() => handleStartEdit(a)} style={{ background: 'linear-gradient(135deg, #ffcc00 0%, #ff9900 100%)', color: '#003366', border: 'none', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>✎ Edit & Resubmit</button>
                    ) : isReportService(a.service_type) ? (
                      <Link to={`/police/case/${a.application_reference}`} style={{ color: '#cc0000', fontWeight: 'bold', textDecoration: 'underline', fontSize: 13 }}>Track Case</Link>
                    ) : a.status === 'approved' || a.status === 'completed' ? (
                      <Link to={`/certificate/${a.application_reference}`} style={{ color: '#003366', fontWeight: 'bold', textDecoration: 'underline', fontSize: 13 }}>View Document</Link>
                    ) : (<span style={{ color: '#999', fontSize: 12 }}>—</span>),
                  ])}
                  emptyMessage="No applications yet."
                />
              </div>
            </>
          )}

          {activeTab === 'clearance' && <PoliceClearanceForm profile={profile} submitting={loading} existingApplication={editingApplication?.service_type === 'Police Clearance' ? editingApplication : null} onSubmit={submit} onCancelEdit={handleCancelEdit} onResubmitted={handleResubmitted} />}
          {activeTab === 'crime' && <CrimeReportForm profile={profile} submitting={loading} existingApplication={editingApplication?.service_type === 'Crime Report' ? editingApplication : null} onSubmit={submit} onCancelEdit={handleCancelEdit} onResubmitted={handleResubmitted} />}
          {activeTab === 'lostid' && <LostIdReportForm profile={profile} submitting={loading} existingApplication={editingApplication?.service_type === 'Report Lost ID' ? editingApplication : null} onSubmit={submit} onCancelEdit={handleCancelEdit} onResubmitted={handleResubmitted} />}
          {activeTab === 'accident' && <AccidentReportForm profile={profile} submitting={loading} existingApplication={editingApplication?.service_type === 'Traffic Accident Report' ? editingApplication : null} onSubmit={submit} onCancelEdit={handleCancelEdit} onResubmitted={handleResubmitted} />}
          {activeTab === 'cyber' && <CybercrimeReportForm profile={profile} submitting={loading} existingApplication={editingApplication?.service_type === 'Cybercrime Report' ? editingApplication : null} onSubmit={submit} onCancelEdit={handleCancelEdit} onResubmitted={handleResubmitted} />}
        </div>
      </Layout>
    </VerifiedGuard>
  );
};

// ============================================================
// POLICE CLEARANCE FORM
// ============================================================
const PoliceClearanceForm = ({ profile, submitting, existingApplication = null, onSubmit, onCancelEdit, onResubmitted }) => {
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};
  const existingUploads = existingData.documents_uploaded || {};
  const [currentStep, setCurrentStep] = useState(0);

  const [form, setForm] = useState({ purpose: existingData.purpose || '', destination_country: existingData.destination_country || '', period_of_stay: existingData.period_of_stay || '', bank_name: existingData.payment?.bank_name || '', collection_branch: existingData.collection_branch || 'Maseru' });
  const [uploads, setUploads] = useState({ national_id: existingUploads.national_id || null, fingerprints: existingUploads.fingerprints || null });
  const [paymentRef] = useState(() => existingData.payment?.reference || generatePaymentReference());
  const [resubmitting, setResubmitting] = useState(false);

  useAutoFill(profile, form, setForm);
  const update = (k, v) => setForm({ ...form, [k]: v });
  const setUpload = (k, v) => setUploads({ ...uploads, [k]: v });

  const handleSubmit = async () => {
    if (!form.purpose || !form.bank_name || !uploads.national_id || !uploads.fingerprints) return alert('Please fill all required fields.');

    const payload = {
      purpose: form.purpose, destination_country: form.destination_country, period_of_stay: form.period_of_stay, collection_branch: form.collection_branch,
      documents_uploaded: { national_id: uploads.national_id, fingerprints: uploads.fingerprints },
      payment: { reference: paymentRef, bank: form.bank_name, status: existingData.payment?.status || 'awaiting_payment' },
      fees: { total: CLEARANCE_FEE },
    };

    if (isEditing) {
      setResubmitting(true);
      try { await resubmitApplication(existingApplication.id, payload); if (onResubmitted) onResubmitted(); } 
      catch (err) { alert('Failed to resubmit: ' + err.message); } 
      finally { setResubmitting(false); }
    } else {
      await onSubmit('Police Clearance', payload, () => { setForm({ purpose: '', destination_country: '', period_of_stay: '', bank_name: '', collection_branch: 'Maseru' }); setUploads({ national_id: null, fingerprints: null }); });
    }
  };

  const steps = [
    {
      title: 'Purpose',
      pageTitle: 'Police Clearance',
      pageDesc: 'Apply for your clearance certificate.',
      content: (
        <div>
          <div className="module-section-title">Purpose of Clearance</div>
          {!isEditing && <Alert type="info">Processing time: ~3 weeks. Required for employment abroad and visas.</Alert>}
          <FormField label="Purpose *" as="select" value={form.purpose} onChange={(v) => update('purpose', v)} options={CLEARANCE_PURPOSES} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Destination Country" value={form.destination_country} onChange={(v) => update('destination_country', v)} placeholder="e.g. South Africa" />
            <FormField label="Period of Stay" value={form.period_of_stay} onChange={(v) => update('period_of_stay', v)} placeholder="e.g. 2010 to present" />
          </div>
        </div>
      )
    },
    {
      title: 'Documents',
      pageTitle: 'Upload Documents',
      pageDesc: 'Upload your ID and fingerprints.',
      content: (
        <div>
          <div className="module-section-title">Required Documents</div>
          <CloudinaryUpload label="Original National ID *" onUpload={(url) => setUpload('national_id', url)} />
          <CloudinaryUpload label="Fingerprint Record *" onUpload={(url) => setUpload('fingerprints', url)} />
        </div>
      )
    },
    {
      title: 'Payment',
      pageTitle: 'Payment & Collection',
      pageDesc: 'Choose collection branch and pay.',
      content: (
        <div>
          <div className="module-section-title">Collection Branch</div>
          <FormField label="Where will you collect your certificate?" as="select" value={form.collection_branch} onChange={(v) => update('collection_branch', v)} options={DISTRICTS.map((d) => ({ value: d, label: d }))} required />
          <div style={{ marginTop: 24 }}>
            <div className="module-section-title">Payment</div>
            <PaymentBlock reference={paymentRef} bankName={form.bank_name} onBankChange={(v) => update('bank_name', v)} rows={[{ label: 'Police Clearance Fee', amount: CLEARANCE_FEE }]} total={CLEARANCE_FEE} />
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
// CRIME REPORT FORM
// ============================================================
const CrimeReportForm = ({ profile, submitting, existingApplication = null, onSubmit, onCancelEdit, onResubmitted }) => {
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};
  const [currentStep, setCurrentStep] = useState(0);

  const [form, setForm] = useState({ crime_type: existingData.crime_type || '', location: existingData.location || '', incident_date: existingData.incident_date || '', description: existingData.description || '', witnesses: existingData.witnesses || '' });
  const [evidenceUrl, setEvidenceUrl] = useState(existingData.evidence_url || null);
  const [resubmitting, setResubmitting] = useState(false);

  useAutoFill(profile, form, setForm);
  const update = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async () => {
    if (!form.crime_type || !form.location.trim() || !form.incident_date || form.description.trim().length < 20) return alert('Please fill all required fields (description needs 20+ characters).');

    const payload = { crime_type: form.crime_type, location: form.location, incident_date: form.incident_date, description: form.description, witnesses: form.witnesses, evidence_url: evidenceUrl };

    if (isEditing) {
      setResubmitting(true);
      try { await resubmitApplication(existingApplication.id, payload); if (onResubmitted) onResubmitted(); } 
      catch (err) { alert('Failed to resubmit: ' + err.message); } 
      finally { setResubmitting(false); }
    } else {
      await onSubmit('Crime Report', payload, () => { setForm({ crime_type: '', location: '', incident_date: '', description: '', witnesses: '' }); setEvidenceUrl(null); });
    }
  };

  const steps = [
    {
      title: 'Incident',
      pageTitle: 'Report a Crime',
      pageDesc: 'Provide details about the incident.',
      content: (
        <div>
          <div className="module-section-title">Incident Details</div>
          {!isEditing && <Alert type="warning">⚠ For emergencies, call <strong>112</strong> or visit your nearest police station.</Alert>}
          {!isEditing && (
            <div style={{ marginBottom: 20 }}>
              <VoiceFillButton fields={[{ key: 'location', icon: '📍', type: 'text', prompt: 'Where did the incident happen?', example: 'Ha Thetsane, Maseru' }, { key: 'description', icon: '📝', type: 'text', prompt: 'Describe what happened.', example: 'Someone broke into my house.' }, { key: 'witnesses', icon: '👥', type: 'text', prompt: 'Were there witnesses?', example: 'Thabo, 5800 1234' }]} onComplete={(values) => setForm(prev => ({ ...prev, ...values }))} />
            </div>
          )}
          <FormField label="Crime Type *" as="select" value={form.crime_type} onChange={(v) => update('crime_type', v)} options={CRIME_TYPES} required />
          <FormField label="Location *" value={form.location} onChange={(v) => update('location', v)} required />
          <FormField label="Date of Incident *" type="date" value={form.incident_date} onChange={(v) => update('incident_date', v)} required />
          <FormField label="Description *" as="textarea" value={form.description} onChange={(v) => update('description', v)} rows={5} required />
          <FormField label="Witnesses (optional)" value={form.witnesses} onChange={(v) => update('witnesses', v)} />
        </div>
      )
    },
    {
      title: 'Evidence',
      pageTitle: 'Upload Evidence',
      pageDesc: 'Attach any photos or documents.',
      content: (
        <div>
          <div className="module-section-title">Evidence</div>
          <CloudinaryUpload label="Evidence (photos, documents)" onUpload={(url) => setEvidenceUrl(url)} />
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
// LOST ID REPORT FORM
// ============================================================
const LostIdReportForm = ({ profile, submitting, existingApplication = null, onSubmit, onCancelEdit, onResubmitted }) => {
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};
  const [currentStep, setCurrentStep] = useState(0);

  const [form, setForm] = useState({ reason: existingData.reason || '', loss_date: existingData.loss_date || '', loss_location: existingData.loss_location || '', confirm_police: existingData.confirm_police || false });
  const [upload, setUpload] = useState({ police_report: existingData.documents_uploaded?.police_report || null });
  const [resubmitting, setResubmitting] = useState(false);

  useAutoFill(profile, form, setForm);
  const update = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async () => {
    if (!form.reason || !form.loss_date || !form.loss_location.trim() || !form.confirm_police) return alert('Please fill all required fields and confirm declaration.');

    const payload = { reason: form.reason, loss_date: form.loss_date, loss_location: form.loss_location, documents_uploaded: { police_report: upload.police_report }, declarations: { confirm_police: form.confirm_police } };

    if (isEditing) {
      setResubmitting(true);
      try { await resubmitApplication(existingApplication.id, payload); if (onResubmitted) onResubmitted(); } 
      catch (err) { alert('Failed to resubmit: ' + err.message); } 
      finally { setResubmitting(false); }
    } else {
      await onSubmit('Report Lost ID', payload, () => { setForm({ reason: '', loss_date: '', loss_location: '', confirm_police: false }); setUpload({ police_report: null }); });
    }
  };

  const steps = [
    {
      title: 'Loss Details',
      pageTitle: 'Report Lost ID',
      pageDesc: 'File a police report for your lost ID.',
      content: (
        <div>
          <div className="module-section-title">Applicant</div>
          <ApplicantCard profile={profile} />
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 12, marginBottom: 24 }}>National ID: <strong>{profile?.national_id}</strong></div>
          
          <div className="module-section-title">Loss Details</div>
          <FormField label="Reason *" as="select" value={form.reason} onChange={(v) => update('reason', v)} options={[{ value: '', label: '— Select —' }, { value: 'Lost', label: 'Lost (misplaced)' }, { value: 'Stolen', label: 'Stolen (theft)' }]} required />
          <FormField label="Date of Loss *" type="date" value={form.loss_date} onChange={(v) => update('loss_date', v)} required />
          <FormField label="Where did it happen? *" value={form.loss_location} onChange={(v) => update('loss_location', v)} required />
        </div>
      )
    },
    {
      title: 'Confirm',
      pageTitle: 'Confirm & Submit',
      pageDesc: 'Upload report and confirm cancellation.',
      content: (
        <div>
          <div className="module-section-title">Upload Police Report</div>
          {!isEditing && <Alert type="warning">To block your ID from being used fraudulently, the system will generate a Police Case Number.</Alert>}
          <CloudinaryUpload label="Upload Police Report (Optional)" onUpload={(url) => setUpload({ ...upload, police_report: url })} />

          <div className="module-section-title" style={{ marginTop: 32 }}>Declaration</div>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 16, fontSize: 13, color: '#991b1b', marginBottom: 16 }}>
            <strong>Important:</strong> Falsely reporting an ID as lost or stolen is a criminal offence.
          </div>
          <Checkbox checked={form.confirm_police} onChange={(v) => update('confirm_police', v)} label="I declare that this report is true and accurate." />
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
// ACCIDENT REPORT FORM
// ============================================================
const AccidentReportForm = ({ profile, submitting, existingApplication = null, onSubmit, onCancelEdit, onResubmitted }) => {
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};
  const [currentStep, setCurrentStep] = useState(0);

  const [form, setForm] = useState({ location: existingData.location || '', accident_date: existingData.accident_date || '', vehicles_involved: existingData.vehicles_involved || '', injuries: existingData.injuries || '', description: existingData.description || '', police_station: existingData.police_station || '' });
  const [evidenceUrl, setEvidenceUrl] = useState(existingData.evidence_url || null);
  const [resubmitting, setResubmitting] = useState(false);

  useAutoFill(profile, form, setForm);
  const update = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async () => {
    if (!form.location.trim() || !form.accident_date || form.description.trim().length < 20) return alert('Please fill all required fields.');

    const payload = { location: form.location, accident_date: form.accident_date, vehicles_involved: form.vehicles_involved, injuries: form.injuries, description: form.description, police_station: form.police_station, evidence_url: evidenceUrl };

    if (isEditing) {
      setResubmitting(true);
      try { await resubmitApplication(existingApplication.id, payload); if (onResubmitted) onResubmitted(); } 
      catch (err) { alert('Failed to resubmit: ' + err.message); } 
      finally { setResubmitting(false); }
    } else {
      await onSubmit('Traffic Accident Report', payload, () => { setForm({ location: '', accident_date: '', vehicles_involved: '', injuries: '', description: '', police_station: '' }); setEvidenceUrl(null); });
    }
  };

  const steps = [
    {
      title: 'Accident',
      pageTitle: 'Traffic Accident',
      pageDesc: 'Report the details of the accident.',
      content: (
        <div>
          <div className="module-section-title">Accident Details</div>
          {!isEditing && <Alert type="info">For accidents with injuries, call 112 or go to the nearest police station.</Alert>}
          <FormField label="Location *" value={form.location} onChange={(v) => update('location', v)} required />
          <FormField label="Date and Time *" type="datetime-local" value={form.accident_date} onChange={(v) => update('accident_date', v)} required />
          <FormField label="Vehicles Involved" value={form.vehicles_involved} onChange={(v) => update('vehicles_involved', v)} />
          <FormField label="Injuries" value={form.injuries} onChange={(v) => update('injuries', v)} />
          <FormField label="Description *" as="textarea" value={form.description} onChange={(v) => update('description', v)} rows={4} required />
          <FormField label="Police Station (if reported)" value={form.police_station} onChange={(v) => update('police_station', v)} />
        </div>
      )
    },
    {
      title: 'Evidence',
      pageTitle: 'Upload Evidence',
      pageDesc: 'Attach any photos of the scene.',
      content: (
        <div>
          <div className="module-section-title">Evidence</div>
          <CloudinaryUpload label="Evidence (photos, documents)" onUpload={(url) => setEvidenceUrl(url)} />
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
// CYBERCRIME REPORT FORM
// ============================================================
const CybercrimeReportForm = ({ profile, submitting, existingApplication = null, onSubmit, onCancelEdit, onResubmitted }) => {
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};
  const [currentStep, setCurrentStep] = useState(0);

  const [form, setForm] = useState({ cyber_type: existingData.cybercrime_type || '', platform: existingData.platform || '', description: existingData.description || '', financial_loss: existingData.financial_loss || '' });
  const [evidenceUrl, setEvidenceUrl] = useState(existingData.evidence_url || null);
  const [resubmitting, setResubmitting] = useState(false);

  useAutoFill(profile, form, setForm);
  const update = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async () => {
    if (!form.cyber_type || !form.platform.trim() || form.description.trim().length < 20) return alert('Please fill all required fields.');

    const payload = { cybercrime_type: form.cyber_type, platform: form.platform, description: form.description, financial_loss: form.financial_loss, evidence_url: evidenceUrl };

    if (isEditing) {
      setResubmitting(true);
      try { await resubmitApplication(existingApplication.id, payload); if (onResubmitted) onResubmitted(); } 
      catch (err) { alert('Failed to resubmit: ' + err.message); } 
      finally { setResubmitting(false); }
    } else {
      await onSubmit('Cybercrime Report', payload, () => { setForm({ cyber_type: '', platform: '', description: '', financial_loss: '' }); setEvidenceUrl(null); });
    }
  };

  const steps = [
    {
      title: 'Details',
      pageTitle: 'Report Cybercrime',
      pageDesc: 'Provide details about the online incident.',
      content: (
        <div>
          <div className="module-section-title">Cybercrime Details</div>
          {!isEditing && <Alert type="info">The LMPS Cybercrime Unit handles online fraud, harassment, and hacking.</Alert>}
          <FormField label="Type of Cybercrime *" as="select" value={form.cyber_type} onChange={(v) => update('cyber_type', v)} options={CYBERCRIME_TYPES} required />
          <FormField label="Platform / Service *" value={form.platform} onChange={(v) => update('platform', v)} required />
          <FormField label="Financial Loss (if any)" value={form.financial_loss} onChange={(v) => update('financial_loss', v)} />
          <FormField label="Description *" as="textarea" value={form.description} onChange={(v) => update('description', v)} rows={5} required />
        </div>
      )
    },
    {
      title: 'Evidence',
      pageTitle: 'Upload Evidence',
      pageDesc: 'Attach screenshots or records.',
      content: (
        <div>
          <div className="module-section-title">Evidence</div>
          <CloudinaryUpload label="Evidence (screenshots, records)" onUpload={(url) => setEvidenceUrl(url)} />
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
const EditBanner = ({ application, onCancel }) => {
  return (
    <div style={{ background: '#fff8e0', border: '1px solid #fef08a', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
      <div style={{ fontSize: 16, fontWeight: 'bold', color: '#854d0e', marginBottom: 8 }}>✎ Editing Application</div>
      <div style={{ fontSize: 14, color: '#a16207', lineHeight: 1.5, marginBottom: 12 }}><strong>Action required:</strong> {application.notes || application.rejection_reason}</div>
      <button type="button" onClick={onCancel} style={{ background: 'white', border: '1px solid #ca8a04', color: '#854d0e', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>Cancel editing</button>
    </div>
  );
};

const ApplicantCard = ({ profile }) => {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start', background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold', flexShrink: 0, overflow: 'hidden' }}>
        {profile?.photo_url ? (<img src={profile.photo_url} alt={profile?.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : ((profile?.full_name || '?').charAt(0).toUpperCase())}
      </div>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>{profile?.full_name}</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>National ID: {profile?.national_id}</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>Citizenship: <strong>{getCitizenshipDisplay(profile?.citizenship_status)}</strong></div>
      </div>
    </div>
  );
};

const Checkbox = ({ checked, onChange, label }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#334155', cursor: 'pointer', lineHeight: 1.5 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3, accentColor: '#003366', width: 16, height: 16 }} />
      <span>{label}</span>
    </label>
  </div>
);

export default PoliceModule;