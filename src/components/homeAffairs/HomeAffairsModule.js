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
  saveCitizenPhoto,
  updateCitizenContact,
} from '../../firebase/db';
import useAutoFill from '../../hooks/useAutoFill';
import Layout from '../common/Layout';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';
import FormField from '../common/FormField';
import CloudinaryUpload from '../common/CloudinaryUpload';
import PaymentBlock from '../common/PaymentBlock';
import CitizenLookupField from '../common/CitizenLookupField';
import RequestedInfoBanner from '../common/RequestedInfoBanner';
import VerifiedGuard from '../citizen/VerifiedGuard';
import '../../styles/module.css';

// ============================================================
// CONSTANTS
// ============================================================
const DOCUMENT_TYPES = [
  { value: 'ID Renewal', label: 'National ID — Renewal', fee: 0, processing: '10 working days' },
  { value: 'ID Replacement', label: 'National ID — Replacement (lost / damaged)', fee: 0, processing: '10 working days' },
  { value: 'Birth Certificate', label: 'Birth Certificate', fee: 0, processing: '5 working days' },
  { value: 'Marriage Certificate', label: 'Marriage Certificate', fee: 50, processing: '5 working days' },
  { value: 'Death Certificate', label: 'Death Certificate (report a death)', fee: 0, processing: '5 working days' },
  { value: 'Citizenship Certificate', label: 'Citizenship Certificate', fee: 0, processing: '30 working days' },
  { value: 'Change of Name', label: 'Change of Name', fee: 150, processing: '15 working days' },
  { value: 'Proof of Identity', label: 'Proof of Identity Letter', fee: 0, processing: '1 working day' },
];

const LOSS_REASONS = [
  { value: '', label: '— Select —' },
  { value: 'Lost', label: 'Lost' },
  { value: 'Stolen', label: 'Stolen' },
  { value: 'Damaged', label: 'Damaged' },
  { value: 'Destroyed', label: 'Destroyed' },
];

// ============================================================
// HELPERS
// ============================================================
const generatePaymentReference = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `PAY-HA-${year}-${random}`;
};

const getInitials = (fullName) => {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
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
const HomeAffairsModule = () => {
  const { profile, refreshProfile } = useAuth();
  const { t } = useLanguage();

  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('identity');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastSubmission, setLastSubmission] = useState(null);
  const [editingApplication, setEditingApplication] = useState(null);

  const fetchApplications = async () => {
    if (!profile) return;
    try {
      const apps = await getMyApplications(profile.uid);
      setApplications(apps.filter((a) => a.department_id === DEPARTMENTS.HOME_AFFAIRS));
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
        department_id: DEPARTMENTS.HOME_AFFAIRS,
        service_type: serviceType,
        application_data: data,
      });
      setMessage(`✓ Submitted: ${r.reference}`);
      setLastSubmission({
        reference: r.reference,
        serviceType,
        paymentReference: data.payment?.reference,
        amount: data.fees?.total || 0,
        collectionBranch: data.collection_branch,
        processingTime: data.processing_time,
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
    setActiveTab('documents');
    setMessage('');
    setLastSubmission(null);
  };

  const handleCancelEdit = () => {
    setEditingApplication(null);
  };

  const handleResubmitted = () => {
    setEditingApplication(null);
    setActiveTab('applications');
    setMessage('✓ Your updated application has been resubmitted for review.');
    fetchApplications();
  };

  const statusColor = (s) => {
    if (s === 'approved' || s === 'completed') return 'green';
    if (s === 'rejected' || s === 'cancelled') return 'red';
    if (s === 'processing') return 'yellow';
    return 'gray';
  };

  const TABS = [
    { key: 'identity', label: 'My Identity' },
    { key: 'documents', label: 'Request a Document' },
    { key: 'lost', label: 'Report Lost ID' },
    { key: 'applications', label: 'My Applications' },
  ];

  // Applications where staff asked for more info
  const needsInfo = applications.filter(
    (a) => a.status === 'processing' && (a.notes || a.rejection_reason)
  );

  return (
    <VerifiedGuard serviceName="Ministry of Home Affairs">
      <Layout title="Ministry of Home Affairs">
        <div className="module-root">
          <div className="module-header">
            <h1>Ministry of Home Affairs</h1>
            <p>Identity, citizenship, and civil registration services</p>
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
                  ✓ Request received
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

                {lastSubmission.paymentReference ? (
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
                    ✓ This is a free government service — no payment required.
                  </p>
                )}

                {lastSubmission.collectionBranch && (
                  <p style={{ color: '#666', fontSize: 13, margin: '12px 0 0 0' }}>
                    Collect at <strong>{lastSubmission.collectionBranch}</strong>
                    {lastSubmission.processingTime ? ` · ${lastSubmission.processingTime}` : ''}.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
            <MyIdentityTab profile={profile} onPhotoUpdated={refreshProfile} />
          )}

          {activeTab === 'documents' && (
            <DocumentRequestForm
              profile={profile}
              submitting={loading}
              onSubmit={submit}
              existingApplication={editingApplication}
              onCancelEdit={handleCancelEdit}
              onResubmitted={handleResubmitted}
            />
          )}

          {activeTab === 'lost' && (
            <ReportLostIDForm profile={profile} submitting={loading} onSubmit={submit} />
          )}

          {activeTab === 'applications' && (
            <>
              {/* Show banner for any application awaiting citizen action */}
              {needsInfo.map((a) => (
                <RequestedInfoBanner
                  key={a.id}
                  application={a}
                  onEdit={() => handleStartEdit(a)}
                />
              ))}

              <div className="module-card">
                <div className="module-section-title">My Home Affairs Applications</div>
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
        </div>
      </Layout>
    </VerifiedGuard>
  );
};

// ============================================================
// TAB 1 — MY IDENTITY (photo locked after first upload)
// ============================================================
const MyIdentityTab = ({ profile, onPhotoUpdated }) => {
  const initials = getInitials(profile?.full_name);
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url || '');
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [contactForm, setContactForm] = useState({
    phone_number: profile?.phone_number || '',
    email: profile?.email || '',
    residential_address: profile?.residential_address || '',
  });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  useEffect(() => {
    if (profile?.photo_url) setPhotoUrl(profile.photo_url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.photo_url]);

  const handlePhotoChange = async (newUrl) => {
    if (!newUrl || photoUrl) return; // locked after first upload
    setUploading(true);
    setPhotoError('');
    try {
      await saveCitizenPhoto(profile.uid, newUrl);
      setPhotoUrl(newUrl);
      if (onPhotoUpdated) onPhotoUpdated();
    } catch (err) {
      setPhotoError(err.message || 'Failed to update photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleContactSave = async () => {
    setContactSaving(true);
    setContactMessage('');
    try {
      await updateCitizenContact(profile.uid, contactForm);
      setContactMessage('✓ Contact details updated.');
    } catch (err) {
      setContactMessage(`✗ ${err.message || 'Failed to save.'}`);
    } finally {
      setContactSaving(false);
    }
  };

  const hasPhoto = !!photoUrl;

  return (
    <div className="module-card">
      <div style={{
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        paddingBottom: 24,
        borderBottom: '1px solid #eee',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 110,
            height: 110,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            fontWeight: 'bold',
            letterSpacing: 2,
            boxShadow: '0 6px 22px rgba(0, 51, 102, 0.25)',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {hasPhoto ? (
              <img
                src={photoUrl}
                alt={profile?.full_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials
            )}
            {uploading && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.55)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 'bold',
              }}>
                Uploading…
              </div>
            )}
          </div>

          {!hasPhoto && (
            <div style={{ width: '100%', maxWidth: 240 }}>
              <CloudinaryUpload
                label="Add photo (permanent, can't be changed)"
                onUpload={handlePhotoChange}
              />
              {photoError && (
                <div style={{ color: '#cc0000', fontSize: 12, marginTop: 6, textAlign: 'center' }}>
                  {photoError}
                </div>
              )}
            </div>
          )}

          {hasPhoto && (
            <div style={{
              fontSize: 11,
              color: '#888',
              textAlign: 'center',
              maxWidth: 240,
              lineHeight: 1.5,
            }}>
              🔒 Photo is locked. Contact Home Affairs if you need it changed.
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 style={{ margin: 0, color: '#003366', fontSize: 24 }}>
            {profile?.full_name}
          </h2>
          <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>
            National ID: <strong>{profile?.national_id}</strong>
          </div>
          <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
            Citizenship: <strong>{getCitizenshipDisplay(profile?.citizenship_status)}</strong>
          </div>
          <div style={{ marginTop: 14 }}>
            {profile?.verified_by_home_affairs ? (
              <span style={{
                background: '#d4edda',
                color: '#006600',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 'bold',
              }}>
                ✓ Verified by Home Affairs
              </span>
            ) : (
              <span style={{
                background: '#fff3cd',
                color: '#856404',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 'bold',
              }}>
                Not yet verified — visit any Home Affairs office
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="module-section">
        <div className="module-section-title">Personal details</div>
        <Row label="Full Name" value={profile?.full_name} />
        <Row label="National ID" value={profile?.national_id} />
        <Row label="Date of Birth" value={profile?.date_of_birth} />
        <Row label="Gender" value={profile?.gender} />
        <Row label="Citizenship" value={getCitizenshipDisplay(profile?.citizenship_status)} />
      </div>

      <div className="module-section">
        <div className="module-section-title">Contact details</div>
        <FormField
          label="Phone Number"
          value={contactForm.phone_number}
          onChange={(v) => setContactForm({ ...contactForm, phone_number: v })}
        />
        <FormField
          label="Email"
          type="email"
          value={contactForm.email}
          onChange={(v) => setContactForm({ ...contactForm, email: v })}
        />
        <FormField
          label="Residential Address"
          value={contactForm.residential_address}
          onChange={(v) => setContactForm({ ...contactForm, residential_address: v })}
        />
        {contactMessage && (
          <div style={{
            fontSize: 13,
            marginTop: 8,
            marginBottom: 10,
            color: contactMessage.startsWith('✓') ? '#006600' : '#cc0000',
            fontWeight: 'bold',
          }}>
            {contactMessage}
          </div>
        )}
        <button
          type="button"
          onClick={handleContactSave}
          disabled={contactSaving}
          style={{
            background: contactSaving ? '#999' : '#003366',
            color: 'white',
            border: 'none',
            padding: '10px 22px',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 'bold',
            cursor: contactSaving ? 'not-allowed' : 'pointer',
          }}
        >
          {contactSaving ? 'Saving…' : 'Save Contact Details'}
        </button>
      </div>

      <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <div className="module-section-title">ID status</div>
        <Row
          label="ID Status"
          value={profile?.deceased ? 'Deceased' : profile?.id_status === 'lost' ? '⚠ Reported lost' : 'Active'}
        />
        {profile?.id_blocked && !profile?.deceased && (
          <div style={{
            marginTop: 12,
            background: '#fff0f0',
            border: '1px solid #ffcccc',
            borderRadius: 6,
            padding: 12,
            fontSize: 13,
            color: '#cc0000',
          }}>
            ⚠ Your ID is currently blocked because it was reported lost. Visit any Home
            Affairs office with a police report to be re-issued a new ID.
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// TAB 2 — REQUEST A DOCUMENT (create or edit)
// ============================================================
const DocumentRequestForm = ({
  profile,
  submitting,
  onSubmit,
  existingApplication = null,
  onCancelEdit,
  onResubmitted,
}) => {
  const isEditing = !!existingApplication;
  const existingData = existingApplication?.application_data || {};

  const [form, setForm] = useState({
    document_type: existingData.document_type || '',
    reason: existingData.reason || '',
    bank_name: existingData.payment?.bank_name || '',
    collection_branch: existingData.collection_branch || 'Maseru',
    // Death Certificate specific
    deceased_full_name: existingData.deceased?.full_name || '',
    deceased_national_id: existingData.deceased?.national_id || '',
    deceased_date_of_death: existingData.deceased?.date_of_death || '',
    deceased_place_of_death: existingData.deceased?.place_of_death || '',
    relationship_to_deceased: existingData.deceased?.relationship || '',
    truth_declaration: existingData.declarations?.truth || false,
  });

  const [uploaded, setUploaded] = useState({
    national_id: existingData.documents_uploaded?.national_id || null,
    police_report: existingData.documents_uploaded?.police_report || null,
    supporting: existingData.documents_uploaded?.supporting || null,
    death_evidence: existingData.documents_uploaded?.death_evidence || null,
  });

  const [paymentRef] = useState(
    () => existingData.payment?.reference || generatePaymentReference()
  );
  const [resubmitting, setResubmitting] = useState(false);

  // Auto-fill only for new applications
  useAutoFill(profile, form, setForm);

  const update = (k, v) => setForm({ ...form, [k]: v });
  const setUpload = (k, v) => setUploaded({ ...uploaded, [k]: v });

  const docMeta = DOCUMENT_TYPES.find((d) => d.value === form.document_type);
  const fee = docMeta?.fee || 0;
  const needsPayment = fee > 0;
  const isDeathCertificate = form.document_type === 'Death Certificate';

  const handleDeceasedFound = (citizen) => {
    setForm((prev) => ({
      ...prev,
      deceased_full_name: citizen.full_name || prev.deceased_full_name,
      deceased_national_id: citizen.national_id || prev.deceased_national_id,
      deceased_place_of_death:
        citizen.residential_address || prev.deceased_place_of_death,
    }));
  };

  const canSubmit =
    form.document_type &&
    (!needsPayment || form.bank_name) &&
    uploaded.national_id &&
    form.truth_declaration &&
    (!isDeathCertificate ||
      (form.deceased_full_name.trim() &&
        form.deceased_date_of_death &&
        form.relationship_to_deceased.trim()));

  const buildPayload = () => {
    const extra = isDeathCertificate
      ? {
          deceased: {
            full_name: form.deceased_full_name,
            national_id: form.deceased_national_id,
            date_of_death: form.deceased_date_of_death,
            place_of_death: form.deceased_place_of_death,
            relationship: form.relationship_to_deceased,
          },
        }
      : {};

    return {
      document_type: form.document_type,
      reason: form.reason,
      collection_branch: form.collection_branch,
      documents_uploaded: {
        national_id: uploaded.national_id,
        police_report: uploaded.police_report,
        supporting: uploaded.supporting,
        death_evidence: uploaded.death_evidence,
      },
      ...extra,
      payment: needsPayment
        ? {
            reference: paymentRef,
            bank: form.bank_name,
            status: existingData.payment?.status || 'awaiting_payment',
          }
        : null,
      fees: { base: fee, total: fee },
      processing_time: docMeta?.processing || '10 working days',
      declarations: {
        truth: form.truth_declaration,
        declared_at: new Date().toISOString(),
      },
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = buildPayload();

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
      await onSubmit(form.document_type, payload);
    }
  };

  return (
    <div className="module-card">
      {/* Edit-mode banner */}
      {isEditing && (
        <div style={{
          background: '#fff8e0',
          border: '2px solid #ffcc00',
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{
            fontSize: 15,
            fontWeight: 'bold',
            color: '#7a5a00',
            marginBottom: 6,
          }}>
            ✎ Editing — {existingApplication.application_reference}
          </div>
          <div style={{
            fontSize: 13,
            color: '#7a5a00',
            lineHeight: 1.6,
            marginBottom: 10,
          }}>
            <strong>What Home Affairs needs:</strong>{' '}
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
        {isEditing ? 'Update Your Application' : 'Request a Document'}
      </div>

      {!isEditing && (
        <Alert type="info">
          Most Home Affairs documents are issued <strong>free of charge</strong>.
          Upload clear photographs or scans of the required documents.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* 1 · APPLICANT */}
        <div className="module-section">
          <div className="module-section-title">1 · Applicant</div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#003366' }}>
            {profile?.full_name}
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
            National ID: {profile?.national_id} · Citizenship:{' '}
            <strong>{getCitizenshipDisplay(profile?.citizenship_status)}</strong>
          </div>
        </div>

        {/* 2 · DOCUMENT REQUESTED */}
        <div className="module-section">
          <div className="module-section-title">2 · Document requested</div>
          <FormField
            label="Document Type *"
            as="select"
            value={form.document_type}
            onChange={(v) => update('document_type', v)}
            options={[
              { value: '', label: '— Select document —' },
              ...DOCUMENT_TYPES.map((d) => ({
                value: d.value,
                label: d.fee === 0 ? `${d.label} · Free` : `${d.label} · M ${d.fee}`,
              })),
            ]}
            required
          />

          {docMeta && (
            <div style={{
              marginTop: 12,
              background: fee === 0 ? '#e6f4ea' : '#f0f6ff',
              border: `1px solid ${fee === 0 ? '#a8d5b8' : '#cce0ff'}`,
              borderRadius: 6,
              padding: 12,
              fontSize: 13,
              color: fee === 0 ? '#006600' : '#003366',
            }}>
              <strong>{fee === 0 ? '✓ Free service' : `Fee: M ${fee}`}</strong>
              {' · '}
              Processing time: <strong>{docMeta.processing}</strong>
            </div>
          )}

          <FormField
            label="Reason (optional)"
            as="textarea"
            value={form.reason}
            onChange={(v) => update('reason', v)}
            placeholder="e.g. My ID is expiring, or I need a certified copy for employment"
            rows={3}
          />
        </div>

        {/* 3 · DECEASED DETAILS */}
        {isDeathCertificate && (
          <div className="module-section">
            <div className="module-section-title">3 · Deceased details</div>

            <Alert type="warning">
              When this Death Certificate is approved, the deceased's citizen record
              will be marked as deceased. All government services for that person will
              be closed immediately.
            </Alert>

            <CitizenLookupField
              label="Find the deceased (National ID or full name)"
              placeholder="e.g. 035159126628 or Nthuping Nthuping"
              onFound={handleDeceasedFound}
            />

            <FormField
              label="Deceased Full Name *"
              value={form.deceased_full_name}
              onChange={(v) => update('deceased_full_name', v)}
              required
            />
            <FormField
              label="Deceased National ID"
              value={form.deceased_national_id}
              onChange={(v) => update('deceased_national_id', v)}
              placeholder="If known"
            />
            <FormField
              label="Date of Death *"
              type="date"
              value={form.deceased_date_of_death}
              onChange={(v) => update('deceased_date_of_death', v)}
              required
            />
            <FormField
              label="Place of Death"
              value={form.deceased_place_of_death}
              onChange={(v) => update('deceased_place_of_death', v)}
              placeholder="e.g. Maseru, Queen Mamohato Hospital"
            />
            <FormField
              label="Your Relationship to the Deceased *"
              value={form.relationship_to_deceased}
              onChange={(v) => update('relationship_to_deceased', v)}
              placeholder="e.g. Son, Daughter, Spouse"
              required
            />
          </div>
        )}

        {/* 4 · UPLOADS */}
        <div className="module-section">
          <div className="module-section-title">
            {isDeathCertificate ? '4 · Upload documents' : '3 · Upload your documents'}
          </div>
          <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 16 }}>
            Take clear photos of each document and upload them below. JPG, PNG, or PDF.
          </p>

          <CloudinaryUpload
            label={
              isDeathCertificate
                ? 'Your ID (applicant) *'
                : 'Current National ID or Police Report *'
            }
            onUpload={(url) => setUpload('national_id', url)}
          />

          <CloudinaryUpload
            label="Police Report (if reporting lost or stolen)"
            onUpload={(url) => setUpload('police_report', url)}
          />

          {isDeathCertificate && (
            <CloudinaryUpload
              label="Medical Certificate of Cause of Death *"
              onUpload={(url) => setUpload('death_evidence', url)}
            />
          )}

          <CloudinaryUpload
            label="Supporting Document (birth certificate, marriage certificate, etc.)"
            onUpload={(url) => setUpload('supporting', url)}
          />
        </div>

        {/* 5 · COLLECTION BRANCH */}
        <div className="module-section">
          <div className="module-section-title">
            {isDeathCertificate ? '5 · Collection branch' : '4 · Collection branch'}
          </div>
          <FormField
            label="Where would you like to collect your document?"
            as="select"
            value={form.collection_branch}
            onChange={(v) => update('collection_branch', v)}
            options={DISTRICTS.map((d) => ({ value: d, label: d }))}
            required
          />
        </div>

        {/* 6 · PAYMENT */}
        {needsPayment ? (
          <div className="module-section">
            <div className="module-section-title">Payment</div>
            <PaymentBlock
              reference={paymentRef}
              bankName={form.bank_name}
              onBankChange={(v) => update('bank_name', v)}
              rows={[{ label: docMeta?.label || 'Document fee', amount: fee }]}
              total={fee}
            />
          </div>
        ) : (
          docMeta && (
            <div className="module-section">
              <div className="module-section-title">Submission</div>
              <div style={{
                background: '#e6f4ea',
                border: '1px solid #a8d5b8',
                borderRadius: 6,
                padding: 16,
                fontSize: 13,
                color: '#006600',
              }}>
                <strong>✓ No payment required.</strong> This is a free government service.
              </div>
            </div>
          )
        )}

        {/* 7 · DECLARATION */}
        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">Declaration</div>
          <Checkbox
            checked={form.truth_declaration}
            onChange={(v) => update('truth_declaration', v)}
            label="I declare that the information provided is true and correct. I understand that making a false declaration is an offence."
          />
        </div>

        <SubmitButton
          canSubmit={canSubmit && !resubmitting}
          submitting={submitting || resubmitting}
          label={isEditing ? 'Resubmit Application' : 'Submit Request'}
        />
      </form>
    </div>
  );
};

// ============================================================
// TAB 3 — REPORT LOST ID
// ============================================================
const ReportLostIDForm = ({ profile, submitting, onSubmit }) => {
  const [form, setForm] = useState({
    reason: '',
    loss_date: '',
    loss_location: '',
    police_case_number: '',
    confirm_cancel: false,
  });

  const [policeReportUrl, setPoliceReportUrl] = useState(null);

  const update = (k, v) => setForm({ ...form, [k]: v });

  const canSubmit =
    form.reason &&
    form.loss_date &&
    form.loss_location.trim() &&
    form.confirm_cancel;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit('Report Lost ID', {
      reason: form.reason,
      loss_date: form.loss_date,
      loss_location: form.loss_location,
      police_case_number: form.police_case_number,
      police_report_url: policeReportUrl,
      id_blocked: true,
      declarations: {
        confirm_cancel: form.confirm_cancel,
        declared_at: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="module-card">
      <div className="module-section-title">Report a Lost or Stolen ID</div>

      <div style={{
        background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)',
        color: 'white',
        padding: 20,
        borderRadius: 8,
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>⚠</div>
        <h3 style={{ margin: 0, fontSize: 18 }}>Report your lost ID immediately</h3>
        <p style={{ margin: '8px 0 0 0', opacity: 0.95, fontSize: 14 }}>
          If someone finds your ID, they could use it to impersonate you. Reporting it now
          blocks the ID from being used anywhere in the system.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="module-section">
          <div className="module-section-title">1 · Applicant</div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#003366' }}>
            {profile?.full_name}
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
            National ID being reported: <strong>{profile?.national_id}</strong>
          </div>
        </div>

        <div className="module-section">
          <div className="module-section-title">2 · Loss details</div>
          <FormField
            label="Reason *"
            as="select"
            value={form.reason}
            onChange={(v) => update('reason', v)}
            options={LOSS_REASONS}
            required
          />
          <FormField
            label="Date of Loss *"
            type="date"
            value={form.loss_date}
            onChange={(v) => update('loss_date', v)}
            required
          />
          <FormField
            label="Where did it happen? *"
            value={form.loss_location}
            onChange={(v) => update('loss_location', v)}
            placeholder="e.g. Maseru, taxi rank"
            required
          />
          <FormField
            label="Police Case Number (if you filed a report)"
            value={form.police_case_number}
            onChange={(v) => update('police_case_number', v)}
            placeholder="e.g. LMPS-2026-MAS-1234"
          />
        </div>

        <div className="module-section">
          <div className="module-section-title">3 · Upload police report</div>
          <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 12 }}>
            Upload a scan or photo of your police report if you have one.
          </p>
          <CloudinaryUpload
            label="Police Report (JPG, PNG, or PDF)"
            onUpload={(url) => setPoliceReportUrl(url)}
          />
        </div>

        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">4 · Confirm cancellation</div>
          <div style={{
            background: '#fff0f0',
            border: '1px solid #ffcccc',
            borderRadius: 6,
            padding: 16,
            fontSize: 13,
            color: '#cc0000',
            marginBottom: 16,
          }}>
            <strong>Important:</strong> Reporting your ID lost will{' '}
            <strong>immediately block</strong> it in the Home Affairs system. It cannot
            be used to verify your identity at any government office until a new ID is issued.
          </div>
          <Checkbox
            checked={form.confirm_cancel}
            onChange={(v) => update('confirm_cancel', v)}
            label="I understand and want to block my old ID now."
          />
        </div>

        <SubmitButton
          canSubmit={canSubmit}
          submitting={submitting}
          label="Block My Lost ID"
          variant="danger"
        />
      </form>
    </div>
  );
};

// ============================================================
// REUSABLE PIECES
// ============================================================
const Row = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
    <span style={{ color: '#666' }}>{label}:</span>
    <span style={{ fontWeight: 'bold', color: '#003366', textAlign: 'right' }}>{value || '—'}</span>
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

const SubmitButton = ({ canSubmit, submitting, label = 'Submit', variant }) => {
  const baseGradient = variant === 'danger'
    ? 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)'
    : 'linear-gradient(135deg, #003366 0%, #0055aa 100%)';

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
      <button
        type="submit"
        disabled={!canSubmit || submitting}
        style={{
          background: canSubmit && !submitting ? baseGradient : '#999',
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
      <Link to="/home-affairs" style={{
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
};

export default HomeAffairsModule;