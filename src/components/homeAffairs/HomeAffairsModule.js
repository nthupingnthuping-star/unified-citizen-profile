import { useState, useEffect, useRef } from 'react';
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
  unblockCitizenId,
  updateCitizenPersonalDetails,
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
import FormWizard from '../common/FormWizard';
import RequestedInfoBanner from '../common/RequestedInfoBanner';
import VerifiedGuard from '../citizen/VerifiedGuard';
import '../../styles/module.css';

const DOCUMENT_TYPES = [
  { value: 'ID Renewal', label: 'National ID — Renewal', fee: 0, processing: '10 working days' },
  { value: 'ID Replacement', label: 'National ID — Replacement', fee: 0, processing: '10 working days' },
  { value: 'Birth Certificate', label: 'Birth Certificate', fee: 0, processing: '5 working days' },
  { value: 'Marriage Certificate', label: 'Marriage Certificate', fee: 50, processing: '5 working days' },
  { value: 'Death Certificate', label: 'Death Certificate', fee: 0, processing: '5 working days' },
  { value: 'Change of Name', label: 'Change of Name', fee: 150, processing: '15 working days' },
];

const REQUIRED_DOCS_BY_TYPE = {
  'ID Renewal': ['national_id'],
  'ID Replacement': ['national_id', 'police_report'],
  'Birth Certificate': ['national_id'],
  'Marriage Certificate': ['national_id', 'supporting'],
  'Death Certificate': ['national_id', 'death_evidence'],
  'Change of Name': ['national_id', 'gazette', 'birth_cert'],
  'Report Lost ID': ['national_id', 'police_report'],
};

const ALL_UPLOAD_KEYS = [
  'national_id',
  'police_report',
  'supporting',
  'death_evidence',
  'gazette',
  'birth_cert',
];

const LOSS_REASONS = [
  { value: '', label: '— Select —' },
  { value: 'Lost', label: 'Lost' },
  { value: 'Stolen', label: 'Stolen' },
  { value: 'Damaged', label: 'Damaged' },
];

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
  return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
};

const getCitizenshipDisplay = (raw) => {
  const value = (raw || '').toLowerCase();
  if (value.includes('mosotho') || value.includes('citizen')) return 'Mosotho';
  if (value.includes('resident')) return 'Permanent resident';
  return 'Mosotho';
};

const normalizeName = (s) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Sanity-check an application payload before sending it to Firebase.
 * Runs on both the initial submit and the resubmit path so that a malformed
 * record (missing name-change fields, missing required uploads, unpaid fee)
 * can never be created.
 *
 * Returns an array of human-readable error strings (empty array === OK).
 */
const validateApplicationPayload = (serviceType, payload) => {
  const errors = [];

  if (!serviceType) {
    errors.push('Missing service type.');
    return errors;
  }
  if (!payload || typeof payload !== 'object') {
    errors.push('Missing application data.');
    return errors;
  }
  if (payload.document_type && payload.document_type !== serviceType) {
    errors.push(
      `Document type "${payload.document_type}" does not match service type "${serviceType}".`
    );
  }

  const requiredKeys = REQUIRED_DOCS_BY_TYPE[serviceType] || [];
  const uploaded = payload.documents_uploaded || {};
  const missing = requiredKeys.filter((k) => !uploaded[k]);
  if (missing.length) {
    errors.push(`Missing required documents: ${missing.join(', ')}.`);
  }

  if (serviceType === 'Change of Name') {
    if (!payload.new_name || !String(payload.new_name).trim()) {
      errors.push('Change of Name requires a new name.');
    }
    if (!payload.current_name || !String(payload.current_name).trim()) {
      errors.push('Change of Name requires the current name.');
    }
    if (
      payload.new_name &&
      payload.current_name &&
      normalizeName(payload.new_name) === normalizeName(payload.current_name)
    ) {
      errors.push('New name must be different from the current name.');
    }
  }

  if (serviceType === 'Marriage Certificate') {
    if (!payload.spouse_full_name || !String(payload.spouse_full_name).trim()) {
      errors.push('Marriage Certificate requires the spouse’s full name.');
    }
    if (!payload.marriage_date) {
      errors.push('Marriage Certificate requires the marriage date.');
    }
  }

  if (serviceType === 'Death Certificate') {
    if (!payload.deceased || !payload.deceased.full_name) {
      errors.push('Death Certificate requires the deceased’s full name.');
    }
    if (!payload.deceased || !payload.deceased.date_of_death) {
      errors.push('Death Certificate requires the date of death.');
    }
  }

  if (!payload.reason || !String(payload.reason).trim()) {
    errors.push('A reason for the application is required.');
  }

  const fee = payload.fees && typeof payload.fees.total === 'number' ? payload.fees.total : 0;
  if (fee > 0) {
    if (!payload.payment) {
      errors.push('Payment details are required for this paid service.');
    } else {
      if (!payload.payment.reference) {
        errors.push('Payment reference is missing.');
      }
      if (!payload.payment.bank) {
        errors.push('Payment bank / channel is missing.');
      }
    }
  }

  if (!payload.declarations || payload.declarations.truth !== true) {
    errors.push('The truth declaration must be accepted.');
  }

  return errors;
};

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

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const submit = async (serviceType, data) => {
    setLoading(true);
    setMessage('');
    setLastSubmission(null);

    const errors = validateApplicationPayload(serviceType, data);
    if (errors.length) {
      setMessage(`✗ ${errors[0]}`);
      setLoading(false);
      return;
    }

    console.log('=========================================');
    console.log('🚀 SUBMITTING TO FIREBASE DATABASE');
    console.log('Service Type:', serviceType);
    console.log('Application Data Payload:', JSON.stringify(data, null, 2));
    console.log('=========================================');

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
                <div style={{ display: 'inline-block', background: '#f0f6ff', padding: '12px 24px', borderRadius: 6, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Reference</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#003366', fontFamily: 'monospace' }}>{lastSubmission.reference}</div>
                </div>
                {lastSubmission.paymentReference ? (
                  <>
                    <div style={{ display: 'inline-block', background: '#f0f6ff', padding: '12px 24px', borderRadius: 6, marginBottom: 12, marginLeft: 8 }}>
                      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Payment Reference</div>
                      <div style={{ fontSize: 20, fontWeight: 'bold', color: '#003366', fontFamily: 'monospace' }}>{lastSubmission.paymentReference}</div>
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
// TAB 1 — MY IDENTITY
// ============================================================
const MyIdentityTab = ({ profile, onPhotoUpdated }) => {
  const initials = getInitials(profile?.full_name);
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url || '');
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [personalForm, setPersonalForm] = useState({
    full_name: profile?.full_name || '',
    national_id: profile?.national_id || '',
    date_of_birth: profile?.date_of_birth || '',
    gender: profile?.gender || '',
  });
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalMessage, setPersonalMessage] = useState('');
  const [contactForm, setContactForm] = useState({
    phone_number: profile?.phone_number || '',
    email: profile?.email || '',
    residential_address: profile?.residential_address || '',
  });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [unblocking, setUnblocking] = useState(false);

  useEffect(() => {
    if (profile?.photo_url) setPhotoUrl(profile.photo_url);
    if (profile) {
      setPersonalForm({
        full_name: profile.full_name || '',
        national_id: profile.national_id || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || '',
      });
      setContactForm({
        phone_number: profile.phone_number || '',
        email: profile.email || '',
        residential_address: profile.residential_address || '',
      });
    }
  }, [profile]);

  const handlePhotoChange = async (newUrl) => {
    if (!newUrl) return;
    setUploading(true);
    setPhotoError('');
    try {
      await saveCitizenPhoto(profile.uid, newUrl);
      setPhotoUrl(newUrl);
      if (onPhotoUpdated) await onPhotoUpdated();
    } catch (err) {
      setPhotoError(err.message || 'Failed to update photo.');
    } finally {
      setUploading(false);
    }
  };

  const handlePersonalSave = async () => {
    setPersonalSaving(true);
    setPersonalMessage('');
    try {
      await updateCitizenPersonalDetails(profile.uid, personalForm);
      setPersonalMessage('✓ Personal details updated successfully.');
      if (onPhotoUpdated) await onPhotoUpdated();
    } catch (err) {
      setPersonalMessage(`✗ ${err.message || 'Failed to save.'}`);
    } finally {
      setPersonalSaving(false);
    }
  };

  const handleContactSave = async () => {
    setContactSaving(true);
    setContactMessage('');
    try {
      await updateCitizenContact(profile.uid, contactForm);
      setContactMessage('✓ Contact details updated.');
      if (onPhotoUpdated) await onPhotoUpdated();
    } catch (err) {
      setContactMessage(`✗ ${err.message || 'Failed to save.'}`);
    } finally {
      setContactSaving(false);
    }
  };

  const handleUnblock = async () => {
    if (!window.confirm('Are you sure you found your ID? This will unblock it immediately.'))
      return;
    setUnblocking(true);
    try {
      await unblockCitizenId(profile.uid);
      if (onPhotoUpdated) await onPhotoUpdated();
    } catch (err) {
      alert('Failed to unblock ID: ' + err.message);
    } finally {
      setUnblocking(false);
    }
  };

  const hasPhoto = !!photoUrl;
  const isBlocked = profile?.id_blocked === true || profile?.id_status === 'lost';

  return (
    <div className="module-card">
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', paddingBottom: 24, borderBottom: '1px solid #eee', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 'bold', boxShadow: '0 6px 22px rgba(0, 51, 102, 0.25)', overflow: 'hidden', position: 'relative' }}>
            {hasPhoto ? (<img src={photoUrl} alt={profile?.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : (initials)}
            {uploading && (<div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' }}>Uploading…</div>)}
          </div>
          {!hasPhoto ? (
            <div style={{ width: '100%', maxWidth: 240 }}>
              <CloudinaryUpload label="Add photo (permanent)" onUpload={handlePhotoChange} />
              {photoError && <div style={{ color: '#cc0000', fontSize: 12, marginTop: 6, textAlign: 'center' }}>{photoError}</div>}
            </div>
          ) : (<div style={{ fontSize: 11, color: '#888', textAlign: 'center', maxWidth: 240, lineHeight: 1.5 }}>🔒 Photo is locked.</div>)}
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 style={{ margin: 0, color: '#003366', fontSize: 24 }}>{profile?.full_name}</h2>
          <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>National ID: <strong>{profile?.national_id}</strong></div>
          <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Citizenship: <strong>{getCitizenshipDisplay(profile?.citizenship_status)}</strong></div>
          <div style={{ marginTop: 14 }}>
            {profile?.verified_by_home_affairs ? (<span style={{ background: '#d4edda', color: '#006600', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' }}>✓ Verified by Home Affairs</span>) : (<span style={{ background: '#fff3cd', color: '#856404', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' }}>Not yet verified</span>)}
          </div>
        </div>
      </div>

      <div className="module-section">
        <div className="module-section-title">Personal details</div>
        <FormField label="Full Name *" value={personalForm.full_name} onChange={(v) => setPersonalForm({ ...personalForm, full_name: v })} required />
        <FormField label="National ID *" value={personalForm.national_id} onChange={(v) => setPersonalForm({ ...personalForm, national_id: v })} required />
        <FormField label="Date of Birth *" type="date" value={personalForm.date_of_birth} onChange={(v) => setPersonalForm({ ...personalForm, date_of_birth: v })} required />
        <FormField label="Gender *" as="select" value={personalForm.gender} onChange={(v) => setPersonalForm({ ...personalForm, gender: v })} options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]} required />
        {personalMessage && (<div style={{ fontSize: 13, marginTop: 8, marginBottom: 10, color: personalMessage.startsWith('✓') ? '#006600' : '#cc0000', fontWeight: 'bold' }}>{personalMessage}</div>)}
        <button onClick={handlePersonalSave} disabled={personalSaving} style={{ background: personalSaving ? '#999' : '#003366', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: personalSaving ? 'not-allowed' : 'pointer' }}>{personalSaving ? 'Saving…' : 'Save Personal Details'}</button>
      </div>

      <div className="module-section">
        <div className="module-section-title">Contact details</div>
        <FormField label="Phone Number" value={contactForm.phone_number} onChange={(v) => setContactForm({ ...contactForm, phone_number: v })} />
        <FormField label="Email" type="email" value={contactForm.email} onChange={(v) => setContactForm({ ...contactForm, email: v })} />
        <FormField label="Residential Address" value={contactForm.residential_address} onChange={(v) => setContactForm({ ...contactForm, residential_address: v })} />
        {contactMessage && (<div style={{ fontSize: 13, marginTop: 8, marginBottom: 10, color: contactMessage.startsWith('✓') ? '#006600' : '#cc0000', fontWeight: 'bold' }}>{contactMessage}</div>)}
        <button onClick={handleContactSave} disabled={contactSaving} style={{ background: contactSaving ? '#999' : '#003366', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: contactSaving ? 'not-allowed' : 'pointer' }}>{contactSaving ? 'Saving…' : 'Save Contact Details'}</button>
      </div>

      <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <div className="module-section-title">ID status</div>
        <Row label="ID Status" value={profile?.deceased ? 'Deceased' : isBlocked ? '⚠ Blocked' : 'Active'} />
        {isBlocked && !profile?.deceased && (
          <div style={{ marginTop: 12, background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 6, padding: 16, color: '#cc0000' }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>⚠ Your ID is currently BLOCKED</div>
            <p style={{ fontSize: 13, margin: '0 0 12px 0', lineHeight: 1.5 }}>You reported this ID as lost or stolen. If you found it, unblock it below.</p>
            <button onClick={handleUnblock} disabled={unblocking} style={{ background: unblocking ? '#999' : '#006600', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 'bold', cursor: unblocking ? 'not-allowed' : 'pointer' }}>{unblocking ? 'Unblocking...' : '✓ I Found My ID (Unblock It)'}</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// TAB 2 — REQUEST A DOCUMENT (WIZARD)
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
    current_name: existingData.current_name || profile?.full_name || '',
    new_name: existingData.new_name || '',
    spouse_full_name: existingData.spouse_full_name || '',
    spouse_national_id: existingData.spouse_national_id || '',
    marriage_date: existingData.marriage_date || '',
    reason: existingData.reason || '',
    bank_name: existingData.payment?.bank_name || existingData.payment?.bank || '',
    collection_branch: existingData.collection_branch || 'Maseru',
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
    gazette: existingData.documents_uploaded?.gazette || null,
    birth_cert: existingData.documents_uploaded?.birth_cert || null,
  });

  const [paymentRef] = useState(
    () => existingData.payment?.reference || generatePaymentReference()
  );
  const [resubmitting, setResubmitting] = useState(false);
  const [stepError, setStepError] = useState('');

  useAutoFill(profile, form, setForm);

  // Only wipe type-specific uploads when the user ACTUALLY changes the
  // document type — not on first mount. Prevents losing files when a step
  // remounts or when editing an existing application.
  const prevTypeRef = useRef(form.document_type);
  useEffect(() => {
    const prev = prevTypeRef.current;
    const curr = form.document_type;
    prevTypeRef.current = curr;

    if (!prev || prev === curr) return;

    const allowed = REQUIRED_DOCS_BY_TYPE[curr] || [];
    setUploaded((prevUploads) => {
      let changed = false;
      const next = { ...prevUploads };
      ALL_UPLOAD_KEYS.forEach((key) => {
        if (!allowed.includes(key) && next[key]) {
          next[key] = null;
          changed = true;
        }
      });
      return changed ? next : prevUploads;
    });
  }, [form.document_type]);

  const update = (k, v) => {
    setForm({ ...form, [k]: v });
  };

  const setUpload = (k, v) => {
    setUploaded((prev) => ({ ...prev, [k]: v }));
  };

  const docMeta = DOCUMENT_TYPES.find((d) => d.value === form.document_type);
  const fee = docMeta?.fee || 0;
  const needsPayment = fee > 0;
  const isDeathCertificate = form.document_type === 'Death Certificate';
  const isChangeOfName = form.document_type === 'Change of Name';
  const isMarriage = form.document_type === 'Marriage Certificate';

  const handleDeceasedFound = (citizen) => {
    setForm((prev) => ({
      ...prev,
      deceased_full_name: citizen.full_name || prev.deceased_full_name,
      deceased_national_id: citizen.national_id || prev.deceased_national_id,
      deceased_place_of_death:
        citizen.residential_address || prev.deceased_place_of_death,
    }));
  };

  const namesDiffer =
    !form.new_name.trim() ||
    normalizeName(form.new_name) !== normalizeName(form.current_name);

  const changeOfNameValid =
    !isChangeOfName ||
    (form.new_name.trim().length > 0 &&
      namesDiffer &&
      !!uploaded.gazette &&
      !!uploaded.birth_cert);

  const canSubmit =
    !!form.document_type &&
    form.reason.trim().length > 0 &&
    (!needsPayment || !!form.bank_name) &&
    form.truth_declaration &&
    changeOfNameValid &&
    (isMarriage ? !!form.spouse_full_name.trim() && !!form.marriage_date : true) &&
    (isDeathCertificate
      ? !!form.deceased_full_name.trim() && !!form.deceased_date_of_death
      : true);

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
      : isMarriage
      ? {
          spouse_full_name: form.spouse_full_name,
          spouse_national_id: form.spouse_national_id,
          marriage_date: form.marriage_date,
        }
      : {};

    const allowed = REQUIRED_DOCS_BY_TYPE[form.document_type] || [];
    const docs = {};
    ALL_UPLOAD_KEYS.forEach((key) => {
      if (allowed.includes(key) && uploaded[key]) {
        docs[key] = uploaded[key];
      }
    });

    return {
      document_type: form.document_type,
      current_name: isChangeOfName ? form.current_name : null,
      new_name: isChangeOfName ? form.new_name.trim() : null,
      ...extra,
      reason: form.reason.trim(),
      collection_branch: form.collection_branch,
      documents_uploaded: docs,
      payment: needsPayment
        ? {
            reference: paymentRef,
            bank: form.bank_name,
            bank_name: form.bank_name,
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
    if (e && e.preventDefault) e.preventDefault();

    if (!canSubmit) {
      setStepError('Please complete all required fields before submitting.');
      return;
    }

    const payload = buildPayload();

    const errors = validateApplicationPayload(form.document_type, payload);
    if (errors.length) {
      setStepError(errors.join(' '));
      return;
    }
    setStepError('');

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

  const validateStep1 = () => !!form.document_type;

  const validateStep2 = () => {
    if (isChangeOfName) return form.new_name.trim().length > 0 && namesDiffer;
    if (isMarriage) return !!form.spouse_full_name.trim() && !!form.marriage_date;
    if (isDeathCertificate)
      return !!form.deceased_full_name.trim() && !!form.deceased_date_of_death;
    return true;
  };

  const validateStep3 = () => {
    const required = REQUIRED_DOCS_BY_TYPE[form.document_type] || [];
    return required.every((k) => !!uploaded[k]);
  };

  const validateStep4 = () =>
    form.reason.trim().length > 0 &&
    (!needsPayment || !!form.bank_name) &&
    form.truth_declaration;

  const steps = [
    {
      title: 'Applicant & Type',
      validate: validateStep1,
      content: (
        <div>
          <div className="module-section">
            <div className="module-section-title">1 · Applicant</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#003366' }}>
              {profile?.full_name}
            </div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
              National ID: {profile?.national_id}
            </div>
          </div>
          <div className="module-section">
            <div className="module-section-title">2 · Document Type</div>
            <FormField
              label="What are you applying for? *"
              as="select"
              value={form.document_type}
              onChange={(v) => update('document_type', v)}
              options={[
                { value: '', label: '— Select —' },
                ...DOCUMENT_TYPES.map((d) => ({ value: d.value, label: d.label })),
              ]}
              required
            />
            {docMeta && (
              <div
                style={{
                  marginTop: 12,
                  background: fee === 0 ? '#e6f4ea' : '#f0f6ff',
                  border: `1px solid ${fee === 0 ? '#a8d5b8' : '#cce0ff'}`,
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 13,
                  color: fee === 0 ? '#006600' : '#003366',
                }}
              >
                <strong>{fee === 0 ? '✓ Free service' : `Fee: M ${fee}`}</strong> · Processing:{' '}
                {docMeta.processing}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Required Details',
      validate: validateStep2,
      content: (
        <div>
          {isChangeOfName && (
            <div className="module-section">
              <div className="module-section-title">Change of Name Details</div>
              <Alert type="info">
                You must have published your name change in the Government Gazette first.
              </Alert>
              <FormField
                label="Current Full Name (locked)"
                value={form.current_name}
                onChange={(v) => update('current_name', v)}
                disabled
              />
              <FormField
                label="New Full Name *"
                value={form.new_name}
                onChange={(v) => update('new_name', v)}
                placeholder="Enter your new full name"
                required
              />
              {!namesDiffer && (
                <div style={{ color: '#cc0000', fontSize: 12, marginTop: -6, marginBottom: 8 }}>
                  New name must be different from your current name.
                </div>
              )}
            </div>
          )}
          {isMarriage && (
            <div className="module-section">
              <div className="module-section-title">Marriage Details</div>
              <FormField
                label="Spouse's Full Name *"
                value={form.spouse_full_name}
                onChange={(v) => update('spouse_full_name', v)}
                required
              />
              <FormField
                label="Spouse's National ID"
                value={form.spouse_national_id}
                onChange={(v) => update('spouse_national_id', v)}
              />
              <FormField
                label="Date of Marriage *"
                type="date"
                value={form.marriage_date}
                onChange={(v) => update('marriage_date', v)}
                required
              />
            </div>
          )}
          {isDeathCertificate && (
            <div className="module-section">
              <div className="module-section-title">Deceased Details</div>
              <CitizenLookupField label="Find the deceased" onFound={handleDeceasedFound} />
              <FormField
                label="Deceased Full Name *"
                value={form.deceased_full_name}
                onChange={(v) => update('deceased_full_name', v)}
                required
              />
              <FormField
                label="Date of Death *"
                type="date"
                value={form.deceased_date_of_death}
                onChange={(v) => update('deceased_date_of_death', v)}
                required
              />
            </div>
          )}
          {!isChangeOfName && !isMarriage && !isDeathCertificate && (
            <div className="module-section">
              <Alert type="info">No extra details required for this document type.</Alert>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Upload Documents',
      validate: validateStep3,
      content: (
        <div>
          <div className="module-section">
            <div className="module-section-title">Required Documents</div>
            <CloudinaryUpload
              label="Current National ID *"
              currentUrl={uploaded.national_id}
              onUpload={(url) => setUpload('national_id', url)}
            />
            {isChangeOfName && (
              <>
                <CloudinaryUpload
                  label="Government Gazette Copy *"
                  currentUrl={uploaded.gazette}
                  onUpload={(url) => setUpload('gazette', url)}
                />
                <CloudinaryUpload
                  label="Birth Certificate *"
                  currentUrl={uploaded.birth_cert}
                  onUpload={(url) => setUpload('birth_cert', url)}
                />
              </>
            )}
            {isMarriage && (
              <CloudinaryUpload
                label="M15 Revenue Stamp / Chief's Letter *"
                currentUrl={uploaded.supporting}
                onUpload={(url) => setUpload('supporting', url)}
              />
            )}
            {isDeathCertificate && (
              <CloudinaryUpload
                label="Medical Certificate of Cause of Death *"
                currentUrl={uploaded.death_evidence}
                onUpload={(url) => setUpload('death_evidence', url)}
              />
            )}
            {form.document_type === 'ID Replacement' && (
              <CloudinaryUpload
                label="Police Report (lost ID) *"
                currentUrl={uploaded.police_report}
                onUpload={(url) => setUpload('police_report', url)}
              />
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Payment & Branch',
      validate: validateStep4,
      content: (
        <div>
          <div className="module-section">
            <div className="module-section-title">Collection Branch</div>
            <FormField
              label="Where will you collect?"
              as="select"
              value={form.collection_branch}
              onChange={(v) => update('collection_branch', v)}
              options={DISTRICTS.map((d) => ({ value: d, label: d }))}
              required
            />
          </div>
          <div className="module-section">
            <div className="module-section-title">Reason for Application</div>
            <FormField
              label="Please state your reason *"
              value={form.reason}
              onChange={(v) => update('reason', v)}
              placeholder="e.g. Lost my ID, need a replacement for bank verification"
              required
            />
          </div>
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
            <Alert type="success">No payment required for this service.</Alert>
          )}
          <div
            className="module-section"
            style={{ borderBottom: 'none', paddingBottom: 0 }}
          >
            <div className="module-section-title">Declaration</div>
            <Checkbox
              checked={form.truth_declaration}
              onChange={(v) => update('truth_declaration', v)}
              label="I declare that the information provided is true and correct."
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      {isEditing && (
        <div
          style={{
            background: '#fff8e0',
            border: '2px solid #ffcc00',
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 'bold', color: '#7a5a00', marginBottom: 6 }}>
            ✎ Editing — {existingApplication.application_reference}
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

      {stepError && (
        <Alert type="error" onClose={() => setStepError('')}>
          {stepError}
        </Alert>
      )}

      <FormWizard
        steps={steps}
        onComplete={handleSubmit}
        submitting={submitting || resubmitting}
      />
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
  const [nationalIdUrl, setNationalIdUrl] = useState(null);
  const [fetchingCase, setFetchingCase] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPoliceCase = async () => {
      if (!profile?.uid) return;
      setFetchingCase(true);
      try {
        const apps = await getMyApplications(profile.uid);
        const policeReport = apps.find(
          (a) =>
            a.department_id === DEPARTMENTS.POLICE &&
            a.service_type === 'Report Lost ID'
        );
        if (policeReport && policeReport.assigned_case_number) {
          setForm((prev) => ({
            ...prev,
            reason: policeReport.application_data?.reason || '',
            loss_date: policeReport.application_data?.loss_date || '',
            loss_location: policeReport.application_data?.loss_location || '',
            police_case_number: policeReport.assigned_case_number,
          }));
          if (policeReport.application_data?.documents_uploaded?.police_report) {
            setPoliceReportUrl(
              policeReport.application_data.documents_uploaded.police_report
            );
          }
          if (policeReport.application_data?.documents_uploaded?.national_id) {
            setNationalIdUrl(
              policeReport.application_data.documents_uploaded.national_id
            );
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingCase(false);
      }
    };
    fetchPoliceCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const update = (k, v) => setForm({ ...form, [k]: v });

  const canSubmit =
    !!form.reason &&
    !!form.loss_date &&
    form.loss_location.trim().length > 0 &&
    form.police_case_number.trim().length > 0 &&
    !!policeReportUrl &&
    !!nationalIdUrl &&
    form.confirm_cancel;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      setError('Please complete all required fields and upload both documents.');
      return;
    }
    setError('');

    const payload = {
      document_type: 'Report Lost ID',
      reason: form.reason,
      loss_date: form.loss_date,
      loss_location: form.loss_location.trim(),
      police_case_number: form.police_case_number.trim(),
      documents_uploaded: {
        national_id: nationalIdUrl,
        police_report: policeReportUrl,
      },
      fees: { base: 0, total: 0 },
      payment: null,
      collection_branch: 'Maseru',
      processing_time: '1 working day',
      id_blocked: true,
      declarations: {
        truth: true,
        confirm_cancel: form.confirm_cancel,
        declared_at: new Date().toISOString(),
      },
    };

    const errors = validateApplicationPayload('Report Lost ID', payload);
    if (errors.length) {
      setError(errors.join(' '));
      return;
    }

    await onSubmit('Report Lost ID', payload);
  };

  return (
    <div className="module-card">
      <div className="module-section-title">Report a Lost or Stolen ID</div>
      <div
        style={{
          background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)',
          color: 'white',
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 6 }}>⚠</div>
        <h3 style={{ margin: 0, fontSize: 18 }}>Report your lost ID immediately</h3>
        <p style={{ margin: '8px 0 0 0', opacity: 0.95, fontSize: 14 }}>
          If someone finds your ID, they could use it to impersonate you.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="module-section">
          <div className="module-section-title">1 · Applicant</div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#003366' }}>
            {profile?.full_name}
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
            National ID: <strong>{profile?.national_id}</strong>
          </div>
        </div>
        <div className="module-section">
          <div className="module-section-title">2 · Loss details</div>
          {fetchingCase && (
            <p style={{ fontSize: 13, color: '#0055aa', marginBottom: 12 }}>
              Looking for your recent police report...
            </p>
          )}
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
            required
          />
          <FormField
            label="Police Case Number *"
            value={form.police_case_number}
            onChange={(v) => update('police_case_number', v)}
            required
            disabled={fetchingCase}
          />
        </div>
        <div className="module-section">
          <div className="module-section-title">3 · Upload documents</div>
          <CloudinaryUpload
            label="Current National ID *"
            currentUrl={nationalIdUrl}
            onUpload={(url) => setNationalIdUrl(url)}
          />
          <CloudinaryUpload
            label="Police Report (JPG, PNG, or PDF) *"
            currentUrl={policeReportUrl}
            onUpload={(url) => setPoliceReportUrl(url)}
          />
        </div>
        <div
          className="module-section"
          style={{ borderBottom: 'none', paddingBottom: 0 }}
        >
          <div className="module-section-title">4 · Confirm cancellation</div>
          <div
            style={{
              background: '#fff0f0',
              border: '1px solid #ffcccc',
              borderRadius: 6,
              padding: 16,
              fontSize: 13,
              color: '#cc0000',
              marginBottom: 16,
            }}
          >
            <strong>Important:</strong> Reporting your ID lost will{' '}
            <strong>immediately block</strong> it.
          </div>
          <Checkbox
            checked={form.confirm_cancel}
            onChange={(v) => update('confirm_cancel', v)}
            label="I understand and want to block my old ID now."
          />
        </div>
        {error && (
          <div style={{ color: '#cc0000', fontSize: 13, fontWeight: 'bold', marginTop: 8 }}>
            {error}
          </div>
        )}
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
  <div
    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}
  >
    <span style={{ color: '#666' }}>{label}:</span>
    <span style={{ fontWeight: 'bold', color: '#003366', textAlign: 'right' }}>
      {value || '—'}
    </span>
  </div>
);

const Checkbox = ({ checked, onChange, label }) => (
  <div style={{ marginBottom: 12 }}>
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        fontSize: 14,
        color: '#333',
        cursor: 'pointer',
        lineHeight: 1.4,
      }}
    >
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
  const baseGradient =
    variant === 'danger'
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
          boxShadow:
            canSubmit && !submitting ? '0 4px 14px rgba(0, 51, 102, 0.25)' : 'none',
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
          e.currentTarget.style.boxShadow =
            canSubmit && !submitting ? '0 4px 14px rgba(0, 51, 102, 0.25)' : 'none';
        }}
      >
        {submitting ? 'Submitting...' : label}
      </button>
      <Link
        to="/home-affairs"
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
        Cancel
      </Link>
    </div>
  );
};

export default HomeAffairsModule;