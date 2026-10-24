import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
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
import '../../styles/module.css';

// ============================================================
// CONSTANTS
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
  { value: 'Cybercrime', label: 'Cybercrime (online fraud, harassment)' },
  { value: 'Stock Theft', label: 'Stock theft' },
  { value: 'Traffic Accident', label: 'Traffic accident' },
  { value: 'Corruption', label: 'Corruption (bribery by an official)' },
  { value: 'Missing Person', label: 'Missing person' },
  { value: 'Other', label: 'Other' },
];

const CYBERCRIME_TYPES = [
  { value: '', label: '— Select type —' },
  { value: 'Online Fraud', label: 'Online fraud / scam' },
  { value: 'Identity Theft', label: 'Identity theft' },
  { value: 'Harassment', label: 'Online harassment / bullying' },
  { value: 'Hacking', label: 'Account hacking' },
  { value: 'Fake Profile', label: 'Fake profile / impersonation' },
  { value: 'Financial Scam', label: 'Mobile money / banking scam' },
  { value: 'Other', label: 'Other' },
];

const CLEARANCE_FEE = 250;

// ============================================================
// HELPERS
// ============================================================
const generatePaymentReference = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `PAY-POL-${year}-${random}`;
};

const getCitizenshipDisplay = (raw) => {
  const value = (raw || '').toLowerCase();
  if (value.includes('mosotho') || value.includes('citizen')) return 'Mosotho';
  if (value.includes('resident')) return 'Permanent resident';
  return 'Mosotho';
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const PoliceModule = () => {
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
        reference: r.reference,
        serviceType,
        paymentReference: data.payment?.reference,
        amount: data.fees?.total || 0,
        priority: r.priority || 'normal',
        caseNumber: r.case_number || r.reference,
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
  };

  const handleCancelEdit = () => {
    setEditingApplication(null);
  };

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

  const TABS = [
    { key: 'dashboard', label: 'My Applications' },
    { key: 'clearance', label: 'Police Clearance' },
    { key: 'crime', label: 'Report a Crime' },
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
            <>
              {lastSubmission.priority === 'critical' ? (
                <div style={{
                  background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)',
                  color: 'white',
                  borderRadius: 12,
                  padding: 24,
                  marginBottom: 20,
                  boxShadow: '0 8px 24px rgba(204, 0, 0, 0.25)',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🚨</div>
                  <h2 style={{ margin: '0 0 10px 0', fontSize: 22, color: 'white' }}>
                    Emergency report received
                  </h2>
                  <p style={{ margin: '0 0 16px 0', fontSize: 15, opacity: 0.95 }}>
                    A response unit has been notified. Please stay calm and stay safe.
                    If the situation is still dangerous, call <strong>112</strong> immediately.
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 14,
                  }}>
                    <div style={{ background: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 6 }}>
                      <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: 1, textTransform: 'uppercase' }}>
                        Case Number
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace', marginTop: 4 }}>
                        {lastSubmission.caseNumber}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 6 }}>
                      <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: 1, textTransform: 'uppercase' }}>
                        Estimated Response
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>
                        15–30 minutes
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: '16px 0 0 0', fontSize: 13, opacity: 0.9 }}>
                    Track this case from the <strong>My Applications</strong> tab.
                  </p>
                </div>
              ) : lastSubmission.paymentReference ? (
                <div className="module-card" style={{ marginBottom: 20 }}>
                  <div style={{ padding: 10, textAlign: 'center' }}>
                    <h3 style={{ color: '#006600', marginTop: 0, marginBottom: 8 }}>
                      ✓ Application received
                    </h3>
                    <div style={{
                      display: 'inline-block',
                      background: '#f0f6ff',
                      padding: '12px 24px',
                      borderRadius: 6,
                      marginBottom: 12,
                    }}>
                      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Payment Reference
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 'bold', color: '#003366', fontFamily: 'monospace' }}>
                        {lastSubmission.paymentReference}
                      </div>
                    </div>
                    <p style={{ color: '#666', fontSize: 13, margin: 0 }}>
                      Pay <strong>M {lastSubmission.amount.toLocaleString()}</strong> at any of the listed banks.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="module-card" style={{ marginBottom: 20 }}>
                  <div style={{ padding: 10, textAlign: 'center' }}>
                    <h3 style={{ color: '#006600', marginTop: 0, marginBottom: 8 }}>
                      ✓ Report received
                    </h3>
                    <p style={{ color: '#666', fontSize: 13, margin: 0 }}>
                      Case number: <strong style={{ fontFamily: 'monospace' }}>{lastSubmission.caseNumber}</strong>
                    </p>
                  </div>
                </div>
              )}
            </>
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
                <div className="module-section-title">My Police Applications</div>
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
                    ) : isReportService(a.service_type) ? (
                      <Link
                        to={`/police/case/${a.application_reference}`}
                        style={{ color: '#cc0000', fontWeight: 'bold', textDecoration: 'underline', fontSize: 13 }}
                      >
                        Track Case
                      </Link>
                    ) : a.status === 'approved' || a.status === 'completed' ? (
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
            </>
          )}

          {activeTab === 'clearance' && (
            <PoliceClearanceForm
              profile={profile}
              submitting={loading}
              existingApplication={editingApplication?.service_type === 'Police Clearance' ? editingApplication : null}
              onSubmit={submit}
              onCancelEdit={handleCancelEdit}
              onResubmitted={handleResubmitted}
            />
          )}

          {activeTab === 'crime' && (
            <CrimeReportForm
              profile={profile}
              submitting={loading}
              existingApplication={editingApplication?.service_type === 'Crime Report' ? editingApplication : null}
              onSubmit={submit}
              onCancelEdit={handleCancelEdit}
              onResubmitted={handleResubmitted}
            />
          )}

          {activeTab === 'accident' && (
            <AccidentReportForm
              profile={profile}
              submitting={loading}
              existingApplication={editingApplication?.service_type === 'Traffic Accident Report' ? editingApplication : null}
              onSubmit={submit}
              onCancelEdit={handleCancelEdit}
              onResubmitted={handleResubmitted}
            />
          )}

          {activeTab === 'cyber' && (
            <CybercrimeReportForm
              profile={profile}
              submitting={loading}
              existingApplication={editingApplication?.service_type === 'Cybercrime Report' ? editingApplication : null}
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
// POLICE CLEARANCE FORM
// ============================================================
const PoliceClearanceForm = ({
  profile,
  submitting,
  existingApplication = null,
  onSubmit,
  onCancelEdit,
  onResubmitted,
}) => {
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};
  const existingUploads = existingData.documents_uploaded || {};

  const [form, setForm] = useState({
    purpose: existingData.purpose || '',
    destination_country: existingData.destination_country || '',
    period_of_stay: existingData.period_of_stay || '',
    bank_name: existingData.payment?.bank_name || '',
    collection_branch: existingData.collection_branch || 'Maseru',
  });
  const [uploads, setUploads] = useState({
    national_id: existingUploads.national_id || null,
    fingerprints: existingUploads.fingerprints || null,
  });
  const [paymentRef] = useState(
    () => existingData.payment?.reference || generatePaymentReference()
  );
  const [resubmitting, setResubmitting] = useState(false);

  useAutoFill(profile, form, setForm);

  const update = (k, v) => setForm({ ...form, [k]: v });
  const setUpload = (k, v) => setUploads({ ...uploads, [k]: v });

  const canSubmit = form.purpose && form.bank_name && uploads.national_id && uploads.fingerprints;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      purpose: form.purpose,
      destination_country: form.destination_country,
      period_of_stay: form.period_of_stay,
      collection_branch: form.collection_branch,
      documents_uploaded: {
        national_id: uploads.national_id,
        fingerprints: uploads.fingerprints,
      },
      payment: {
        reference: paymentRef,
        bank: form.bank_name,
        status: existingData.payment?.status || 'awaiting_payment',
      },
      fees: { total: CLEARANCE_FEE },
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
      await onSubmit('Police Clearance', payload, () => {
        setForm({
          purpose: '',
          destination_country: '',
          period_of_stay: '',
          bank_name: '',
          collection_branch: 'Maseru',
        });
        setUploads({ national_id: null, fingerprints: null });
      });
    }
  };

  return (
    <div className="module-card">
      {isEditing && <EditBanner application={existingApplication} onCancel={onCancelEdit} />}

      <div className="module-section-title">
        {isEditing ? 'Update Police Clearance Application' : 'Police Clearance Certificate'}
      </div>

      {!isEditing && (
        <Alert type="info">
          Processing time: ~3 weeks. Required for employment abroad, immigration, and visa applications.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="module-section">
          <div className="module-section-title">1 · Applicant</div>
          <ApplicantCard profile={profile} />
        </div>

        <div className="module-section">
          <div className="module-section-title">2 · Purpose</div>
          <FormField label="Purpose of Clearance *" as="select" value={form.purpose} onChange={(v) => update('purpose', v)} options={CLEARANCE_PURPOSES} required />
          <FormField label="Destination Country (if applicable)" value={form.destination_country} onChange={(v) => update('destination_country', v)} placeholder="e.g. South Africa, United Kingdom" />
          <FormField label="Period of Stay in Lesotho" value={form.period_of_stay} onChange={(v) => update('period_of_stay', v)} placeholder="e.g. 2010 to present" />
        </div>

        <div className="module-section">
          <div className="module-section-title">3 · Upload your documents</div>
          <CloudinaryUpload label="Original National ID *" onUpload={(url) => setUpload('national_id', url)} />
          <CloudinaryUpload label="Fingerprint Record (from police station) *" onUpload={(url) => setUpload('fingerprints', url)} />
        </div>

        <div className="module-section">
          <div className="module-section-title">4 · Collection branch</div>
          <FormField label="Where will you collect your certificate?" as="select" value={form.collection_branch} onChange={(v) => update('collection_branch', v)} options={DISTRICTS.map((d) => ({ value: d, label: d }))} required />
        </div>

        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">5 · Payment</div>
          <PaymentBlock
            reference={paymentRef}
            bankName={form.bank_name}
            onBankChange={(v) => update('bank_name', v)}
            rows={[{ label: 'Police Clearance Fee', amount: CLEARANCE_FEE }]}
            total={CLEARANCE_FEE}
          />
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
// CRIME REPORT FORM
// ============================================================
const CrimeReportForm = ({
  profile,
  submitting,
  existingApplication = null,
  onSubmit,
  onCancelEdit,
  onResubmitted,
}) => {
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};

  const [form, setForm] = useState({
    crime_type: existingData.crime_type || '',
    location: existingData.location || '',
    incident_date: existingData.incident_date || '',
    description: existingData.description || '',
    witnesses: existingData.witnesses || '',
  });
  const [evidenceUrl, setEvidenceUrl] = useState(existingData.evidence_url || null);
  const [resubmitting, setResubmitting] = useState(false);

  useAutoFill(profile, form, setForm);

  const update = (k, v) => setForm({ ...form, [k]: v });

  const canSubmit =
    form.crime_type && form.location.trim() && form.incident_date && form.description.trim().length >= 20;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      crime_type: form.crime_type,
      location: form.location,
      incident_date: form.incident_date,
      description: form.description,
      witnesses: form.witnesses,
      evidence_url: evidenceUrl,
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
      await onSubmit('Crime Report', payload, () => {
        setForm({ crime_type: '', location: '', incident_date: '', description: '', witnesses: '' });
        setEvidenceUrl(null);
      });
    }
  };

  // ---------- Voice fill: only for text-heavy fields ----------
  const handleVoiceComplete = (values) => {
    setForm((prev) => ({
      ...prev,
      // Only overwrite what the voice wizard returned
      ...(values.location !== undefined ? { location: values.location } : {}),
      ...(values.description !== undefined ? { description: values.description } : {}),
      ...(values.witnesses !== undefined ? { witnesses: values.witnesses } : {}),
    }));
  };

  return (
    <div className="module-card">
      {isEditing && <EditBanner application={existingApplication} onCancel={onCancelEdit} />}

      <div className="module-section-title">
        {isEditing ? 'Update Crime Report' : 'Report a Crime'}
      </div>

      {!isEditing && (
        <Alert type="warning">
          ⚠ For emergencies, call <strong>112</strong> or visit your nearest police station immediately.
        </Alert>
      )}

      {/* Voice Fill button */}
      {!isEditing && (
        <div style={{ marginBottom: 20 }}>
          <VoiceFillButton
            fields={[
              {
                key: 'location',
                icon: '📍',
                type: 'text',
                prompt: 'Where did the incident happen?',
                example: 'Ha Thetsane, Maseru',
              },
              {
                key: 'description',
                icon: '📝',
                type: 'text',
                prompt: 'Describe what happened. Take your time.',
                example: 'Someone broke into my house at night and stole a TV.',
              },
              {
                key: 'witnesses',
                icon: '👥',
                type: 'text',
                prompt: 'Were there any witnesses? Say their names, or tap Skip.',
                example: 'My neighbour Thabo, phone 5800 1234',
              },
            ]}
            onComplete={handleVoiceComplete}
          />
          <p style={{
            margin: '0 0 8px',
            fontSize: 12,
            color: '#666',
            fontStyle: 'italic',
          }}>
            Tip: Voice fill works best in Chrome, Edge, and Safari with English speech. You can always edit or type instead.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="module-section">
          <div className="module-section-title">1 · Reporter</div>
          <ApplicantCard profile={profile} />
        </div>

        <div className="module-section">
          <div className="module-section-title">2 · Incident details</div>
          <FormField label="Crime Type *" as="select" value={form.crime_type} onChange={(v) => update('crime_type', v)} options={CRIME_TYPES} required />
          <FormField label="Location of Incident *" value={form.location} onChange={(v) => update('location', v)} placeholder="e.g. Ha Thetsane, Maseru" required />
          <FormField label="Date of Incident *" type="date" value={form.incident_date} onChange={(v) => update('incident_date', v)} required />
          <FormField label="Description *" as="textarea" value={form.description} onChange={(v) => update('description', v)} placeholder="Describe what happened, who was involved, and any other relevant details..." rows={5} required />
          <FormField label="Witnesses (optional)" value={form.witnesses} onChange={(v) => update('witnesses', v)} placeholder="Names and contact numbers of anyone who witnessed the incident" />
        </div>

        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">3 · Upload your evidence</div>
          <CloudinaryUpload label="Evidence (photos, videos, documents)" onUpload={(url) => setEvidenceUrl(url)} />
        </div>

        <SubmitButton
          canSubmit={canSubmit && !resubmitting}
          submitting={submitting || resubmitting}
          label={isEditing ? 'Resubmit Report' : 'Submit Crime Report'}
        />
      </form>
    </div>
  );
};

// ============================================================
// ACCIDENT REPORT FORM
// ============================================================
const AccidentReportForm = ({
  profile,
  submitting,
  existingApplication = null,
  onSubmit,
  onCancelEdit,
  onResubmitted,
}) => {
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};

  const [form, setForm] = useState({
    location: existingData.location || '',
    accident_date: existingData.accident_date || '',
    vehicles_involved: existingData.vehicles_involved || '',
    injuries: existingData.injuries || '',
    description: existingData.description || '',
    police_station: existingData.police_station || '',
  });
  const [evidenceUrl, setEvidenceUrl] = useState(existingData.evidence_url || null);
  const [resubmitting, setResubmitting] = useState(false);

  useAutoFill(profile, form, setForm);

  const update = (k, v) => setForm({ ...form, [k]: v });

  const canSubmit =
    form.location.trim() && form.accident_date && form.description.trim().length >= 20;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      location: form.location,
      accident_date: form.accident_date,
      vehicles_involved: form.vehicles_involved,
      injuries: form.injuries,
      description: form.description,
      police_station: form.police_station,
      evidence_url: evidenceUrl,
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
      await onSubmit('Traffic Accident Report', payload, () => {
        setForm({
          location: '',
          accident_date: '',
          vehicles_involved: '',
          injuries: '',
          description: '',
          police_station: '',
        });
        setEvidenceUrl(null);
      });
    }
  };

  return (
    <div className="module-card">
      {isEditing && <EditBanner application={existingApplication} onCancel={onCancelEdit} />}

      <div className="module-section-title">
        {isEditing ? 'Update Traffic Accident Report' : 'Traffic Accident Report'}
      </div>

      {!isEditing && (
        <Alert type="info">
          For accidents with injuries, call 112 or go to the nearest police station.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="module-section">
          <div className="module-section-title">1 · Reporter</div>
          <ApplicantCard profile={profile} />
        </div>

        <div className="module-section">
          <div className="module-section-title">2 · Accident details</div>
          <FormField label="Location *" value={form.location} onChange={(v) => update('location', v)} placeholder="e.g. Main South 1, near Roma turn-off" required />
          <FormField label="Date and Time *" type="datetime-local" value={form.accident_date} onChange={(v) => update('accident_date', v)} required />
          <FormField label="Vehicles Involved" value={form.vehicles_involved} onChange={(v) => update('vehicles_involved', v)} placeholder="e.g. Toyota Hilux A1234, BMW B5678" />
          <FormField label="Injuries" value={form.injuries} onChange={(v) => update('injuries', v)} placeholder="Any injuries sustained?" />
          <FormField label="Description *" as="textarea" value={form.description} onChange={(v) => update('description', v)} placeholder="Describe how the accident happened..." rows={4} required />
          <FormField label="Police Station (if reported)" value={form.police_station} onChange={(v) => update('police_station', v)} placeholder="e.g. Maseru Central" />
        </div>

        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">3 · Upload your evidence</div>
          <CloudinaryUpload label="Evidence (photos, documents)" onUpload={(url) => setEvidenceUrl(url)} />
        </div>

        <SubmitButton
          canSubmit={canSubmit && !resubmitting}
          submitting={submitting || resubmitting}
          label={isEditing ? 'Resubmit Report' : 'Submit Accident Report'}
        />
      </form>
    </div>
  );
};

// ============================================================
// CYBERCRIME REPORT FORM
// ============================================================
const CybercrimeReportForm = ({
  profile,
  submitting,
  existingApplication = null,
  onSubmit,
  onCancelEdit,
  onResubmitted,
}) => {
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};

  const [form, setForm] = useState({
    cyber_type: existingData.cybercrime_type || '',
    platform: existingData.platform || '',
    description: existingData.description || '',
    financial_loss: existingData.financial_loss || '',
  });
  const [evidenceUrl, setEvidenceUrl] = useState(existingData.evidence_url || null);
  const [resubmitting, setResubmitting] = useState(false);

  useAutoFill(profile, form, setForm);

  const update = (k, v) => setForm({ ...form, [k]: v });

  const canSubmit =
    form.cyber_type && form.platform.trim() && form.description.trim().length >= 20;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      cybercrime_type: form.cyber_type,
      platform: form.platform,
      description: form.description,
      financial_loss: form.financial_loss,
      evidence_url: evidenceUrl,
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
      await onSubmit('Cybercrime Report', payload, () => {
        setForm({ cyber_type: '', platform: '', description: '', financial_loss: '' });
        setEvidenceUrl(null);
      });
    }
  };

  return (
    <div className="module-card">
      {isEditing && <EditBanner application={existingApplication} onCancel={onCancelEdit} />}

      <div className="module-section-title">
        {isEditing ? 'Update Cybercrime Report' : 'Report a Cybercrime'}
      </div>

      {!isEditing && (
        <Alert type="info">
          The LMPS Cybercrime Unit handles online fraud, harassment, identity theft, and hacking.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="module-section">
          <div className="module-section-title">1 · Reporter</div>
          <ApplicantCard profile={profile} />
        </div>

        <div className="module-section">
          <div className="module-section-title">2 · Cybercrime details</div>
          <FormField label="Type of Cybercrime *" as="select" value={form.cyber_type} onChange={(v) => update('cyber_type', v)} options={CYBERCRIME_TYPES} required />
          <FormField label="Platform / Service *" value={form.platform} onChange={(v) => update('platform', v)} placeholder="e.g. Facebook, WhatsApp, M-Pesa" required />
          <FormField label="Financial Loss (if any)" value={form.financial_loss} onChange={(v) => update('financial_loss', v)} placeholder="e.g. M 2,500" />
          <FormField label="Description *" as="textarea" value={form.description} onChange={(v) => update('description', v)} placeholder="Describe what happened in detail..." rows={5} required />
        </div>

        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">3 · Upload your evidence</div>
          <CloudinaryUpload label="Evidence (screenshots, records, documents)" onUpload={(url) => setEvidenceUrl(url)} />
        </div>

        <SubmitButton
          canSubmit={canSubmit && !resubmitting}
          submitting={submitting || resubmitting}
          label={isEditing ? 'Resubmit Report' : 'Submit Cybercrime Report'}
        />
      </form>
    </div>
  );
};

// ============================================================
// SHARED PIECES
// ============================================================
const EditBanner = ({ application, onCancel }) => (
  <div style={{
    background: '#fff8e0',
    border: '2px solid #ffcc00',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  }}>
    <div style={{ fontSize: 15, fontWeight: 'bold', color: '#7a5a00', marginBottom: 6 }}>
      ✎ Editing — {application.application_reference}
    </div>
    <div style={{ fontSize: 13, color: '#7a5a00', lineHeight: 1.6, marginBottom: 10 }}>
      <strong>What Police needs:</strong>{' '}
      {application.notes || application.rejection_reason}
    </div>
    <button
      type="button"
      onClick={onCancel}
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
);

const ApplicantCard = ({ profile }) => (
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
        Citizenship: <strong>{getCitizenshipDisplay(profile?.citizenship_status)}</strong>
      </div>
    </div>
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
    <Link to="/police" style={{
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

export default PoliceModule;