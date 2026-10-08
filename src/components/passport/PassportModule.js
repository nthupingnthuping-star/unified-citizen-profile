import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  submitApplication,
  getMyApplications,
  DEPARTMENTS,
  DISTRICTS,
} from '../../firebase/db';
import Layout from '../common/Layout';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';
import FormField from '../common/FormField';
import PaymentBlock from '../common/PaymentBlock';
import VerifiedGuard from '../citizen/VerifiedGuard';
import '../../styles/module.css';

// ============================================================
// FEE TABLES & OPTIONS
// ============================================================
const PASSPORT_TYPES = [
  { value: 'Ordinary', label: 'Ordinary passport (green cover)' },
  { value: 'Service', label: 'Service passport (blue cover)' },
  { value: 'Diplomatic', label: 'Diplomatic passport (red cover)' },
  { value: 'Official', label: 'Official passport' },
];

const BOOK_FORMATS = [
  { value: '32-page', label: '32 pages (standard)', baseSurcharge: 0 },
  { value: '48-page', label: '48 pages (frequent traveller)', baseSurcharge: 200 },
];

const PROCESSING_SPEEDS = [
  { value: 'Standard', label: 'Standard — 10 working days', days: 10, surcharge: 0 },
  { value: 'Express', label: 'Express — 3 working days', days: 3, surcharge: 300 },
  { value: 'Urgent', label: 'Urgent — 24 hours', days: 1, surcharge: 600 },
];

const TRAVEL_PURPOSES = [
  { value: '', label: '— Select purpose —' },
  { value: 'Tourism', label: 'Tourism / holiday' },
  { value: 'Business', label: 'Business' },
  { value: 'Study', label: 'Study abroad' },
  { value: 'Medical', label: 'Medical treatment' },
  { value: 'Work', label: 'Employment abroad' },
  { value: 'Family', label: 'Family visit' },
  { value: 'Other', label: 'Other' },
];

const BASE_FEES = {
  Ordinary: { '32-page': 600, '48-page': 800 },
  Service: { '32-page': 400, '48-page': 500 },
  Diplomatic: { '32-page': 0, '48-page': 0 },
  Official: { '32-page': 0, '48-page': 0 },
};

// ============================================================
// HELPERS
// ============================================================
const generatePaymentReference = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `PAY-PAS-${year}-${random}`;
};

const computeFees = (passportType, bookFormat, speed) => {
  const base = BASE_FEES[passportType]?.[bookFormat] ?? 0;
  const formatSurcharge =
    BOOK_FORMATS.find((f) => f.value === bookFormat)?.baseSurcharge ?? 0;
  const speedSurcharge =
    PROCESSING_SPEEDS.find((s) => s.value === speed)?.surcharge ?? 0;
  const total = base + formatSurcharge + speedSurcharge;
  return { base, formatSurcharge, speedSurcharge, total };
};

const computeReadyDate = (speed) => {
  const days = PROCESSING_SPEEDS.find((s) => s.value === speed)?.days ?? 10;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const PassportModule = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastSubmission, setLastSubmission] = useState(null);

  const fetchApplications = async () => {
    if (!profile) return;
    try {
      const apps = await getMyApplications(profile.uid);
      setApplications(apps.filter((a) => a.department_id === DEPARTMENTS.PASSPORT));
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
        department_id: DEPARTMENTS.PASSPORT,
        service_type: serviceType,
        application_data: data,
      });
      setMessage(`✓ Application submitted: ${r.reference}`);
      setLastSubmission({
        reference: r.reference,
        serviceType,
        paymentReference: data.payment.reference,
        amount: data.fees.total,
        readyDate: new Date(data.estimated_ready_date),
        collectionBranch: data.collection_branch,
      });
      fetchApplications();
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

  const TABS = [
    { key: 'dashboard', label: 'My Applications' },
    { key: 'new', label: 'New Passport' },
    { key: 'renewal', label: 'Renewal' },
  ];

  return (
    <VerifiedGuard serviceName="Passport and Citizenship Office">
      <Layout title="Passport and Citizenship Office">
        <div className="module-root">
          <div className="module-header">
            <h1>Passport and Citizenship Office</h1>
            <p>New passports, renewals, and citizenship documents</p>
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
              <div style={{ padding: 10 }}>
                <h3 style={{ color: '#006600', marginTop: 0, marginBottom: 16, textAlign: 'center' }}>
                  ✓ Application received
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 14,
                }}>
                  <InfoBlock label="Application reference" value={lastSubmission.reference} mono />
                  <InfoBlock label="Payment reference" value={lastSubmission.paymentReference} mono />
                  <InfoBlock
                    label="Amount to pay"
                    value={`M ${lastSubmission.amount.toLocaleString()}`}
                    big
                  />
                  <InfoBlock label="Collection branch" value={lastSubmission.collectionBranch} />
                  <InfoBlock
                    label="Estimated ready date"
                    value={lastSubmission.readyDate.toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  />
                </div>

                <div style={{
                  marginTop: 20,
                  padding: 16,
                  background: '#fff8e0',
                  border: '1px solid #ffe08a',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#7a5a00',
                }}>
                  <strong>How to pay:</strong> Take the payment reference above to any of the
                  banks listed in the form. You can also pay via M-Pesa or EcoCash. Your application
                  will only be processed once payment is confirmed.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="module-card">
              <div className="module-section-title">My Passport Applications</div>
              <Table
                headers={['Reference', 'Service', 'Status', 'Submitted', 'Action']}
                rows={applications.map((a) => [
                  a.application_reference,
                  a.service_type,
                  <Badge color={statusColor(a.status)}>{t(a.status)}</Badge>,
                  a.submitted_at?.toDate?.().toLocaleDateString() || '—',
                  a.status === 'approved' || a.status === 'completed' ? (
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
                emptyMessage={t('no_applications_yet')}
              />
            </div>
          )}

          {activeTab === 'new' && (
            <PassportForm mode="new" profile={profile} submitting={loading} onSubmit={submit} />
          )}

          {activeTab === 'renewal' && (
            <PassportForm mode="renewal" profile={profile} submitting={loading} onSubmit={submit} />
          )}
        </div>
      </Layout>
    </VerifiedGuard>
  );
};

// ============================================================
// PASSPORT FORM
// ============================================================
const PassportForm = ({ mode, profile, submitting, onSubmit }) => {
  const isRenewal = mode === 'renewal';

  const [form, setForm] = useState({
    passport_type: 'Ordinary',
    book_format: '32-page',
    processing_speed: 'Standard',
    travel_purpose: '',
    departure_date: '',
    doc_birth_certificate: false,
    doc_photos: false,
    doc_chief_letter: false,
    old_passport_number: '',
    old_passport_issued: '',
    old_passport_expiry: '',
    doc_old_passport: false,
    guarantor_name: '',
    guarantor_id: '',
    guarantor_phone: '',
    collection_branch: 'Maseru',
    payment_bank: '',
    truth_declaration: false,
    data_consent: false,
  });

  const [paymentRef] = useState(generatePaymentReference());

  const update = (key, value) => setForm({ ...form, [key]: value });

  const fees = computeFees(form.passport_type, form.book_format, form.processing_speed);
  const readyDate = computeReadyDate(form.processing_speed);

  const requiredDocsOK = isRenewal
    ? form.doc_old_passport && form.doc_photos
    : form.doc_birth_certificate && form.doc_photos;

  const guarantorOK =
    isRenewal ||
    (form.guarantor_name.trim() && form.guarantor_id.trim() && form.guarantor_phone.trim());

  const renewalFieldsOK =
    !isRenewal ||
    (form.old_passport_number.trim() && form.old_passport_issued && form.old_passport_expiry);

  const canSubmit =
    form.passport_type &&
    form.book_format &&
    form.processing_speed &&
    form.travel_purpose &&
    form.departure_date &&
    form.collection_branch &&
    form.payment_bank &&
    requiredDocsOK &&
    guarantorOK &&
    renewalFieldsOK &&
    form.truth_declaration &&
    form.data_consent;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      passport_type: form.passport_type,
      book_format: form.book_format,
      processing_speed: form.processing_speed,
      travel_purpose: form.travel_purpose,
      departure_date: form.departure_date,
      documents_declared: isRenewal
        ? { old_passport: form.doc_old_passport, photos: form.doc_photos }
        : {
            birth_certificate: form.doc_birth_certificate,
            photos: form.doc_photos,
            chief_letter: form.doc_chief_letter,
          },
      previous_passport: isRenewal
        ? {
            number: form.old_passport_number,
            issued_date: form.old_passport_issued,
            expiry_date: form.old_passport_expiry,
          }
        : null,
      guarantor: isRenewal
        ? null
        : {
            full_name: form.guarantor_name,
            national_id: form.guarantor_id,
            phone: form.guarantor_phone,
          },
      collection_branch: form.collection_branch,
      payment: {
        reference: paymentRef,
        bank: form.payment_bank,
        status: 'awaiting_payment',
      },
      fees,
      estimated_ready_date: readyDate.toISOString(),
      declarations: {
        truth: form.truth_declaration,
        data_consent: form.data_consent,
        declared_at: new Date().toISOString(),
      },
    };

    await onSubmit(isRenewal ? 'Passport Renewal' : 'New Passport', payload);
  };

  // Build fee rows for the shared PaymentBlock
  const feeRows = [
    { label: `${form.passport_type} passport · ${form.book_format}`, amount: fees.base },
  ];
  if (fees.formatSurcharge > 0) {
    feeRows.push({ label: '48-page format surcharge', amount: fees.formatSurcharge });
  }
  if (fees.speedSurcharge > 0) {
    feeRows.push({
      label: `${form.processing_speed} processing surcharge`,
      amount: fees.speedSurcharge,
    });
  }

  return (
    <div className="module-card">
      <div className="module-section-title">
        {isRenewal ? 'Renew Passport' : 'Apply for a New Passport'}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="module-section">
          <div className="module-section-title">1 · Applicant</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 'bold', flexShrink: 0,
            }}>
              {(profile?.full_name || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#003366' }}>
                {profile?.full_name}
              </div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                National ID: {profile?.national_id}
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>
                Date of Birth: {profile?.date_of_birth} · Citizenship:{' '}
                {profile?.citizenship_status || 'Citizen'}
              </div>
            </div>
          </div>
        </div>

        <div className="module-section">
          <div className="module-section-title">2 · Passport type and format</div>
          <FormField
            label="Passport Type"
            as="select"
            value={form.passport_type}
            onChange={(v) => update('passport_type', v)}
            options={PASSPORT_TYPES}
            required
          />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>
              Book Format *
            </label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {BOOK_FORMATS.map((f) => (
                <Radio
                  key={f.value}
                  checked={form.book_format === f.value}
                  onChange={() => update('book_format', f.value)}
                  label={`${f.label}${f.baseSurcharge > 0 ? ` (+ M ${f.baseSurcharge})` : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="module-section">
          <div className="module-section-title">3 · Processing speed</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {PROCESSING_SPEEDS.map((s) => (
              <Radio
                key={s.value}
                checked={form.processing_speed === s.value}
                onChange={() => update('processing_speed', s.value)}
                label={`${s.label}${s.surcharge > 0 ? ` (+ M ${s.surcharge})` : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="module-section">
          <div className="module-section-title">4 · Travel details</div>
          <FormField
            label="Purpose of Travel"
            as="select"
            value={form.travel_purpose}
            onChange={(v) => update('travel_purpose', v)}
            options={TRAVEL_PURPOSES}
            required
          />
          <FormField
            label="Planned Departure Date"
            type="date"
            value={form.departure_date}
            onChange={(v) => update('departure_date', v)}
            required
          />
        </div>

        {isRenewal && (
          <div className="module-section">
            <div className="module-section-title">5 · Previous passport</div>
            <FormField
              label="Old Passport Number"
              value={form.old_passport_number}
              onChange={(v) => update('old_passport_number', v.toUpperCase())}
              placeholder="e.g. LS1234567"
              required
            />
            <FormField
              label="Date Issued"
              type="date"
              value={form.old_passport_issued}
              onChange={(v) => update('old_passport_issued', v)}
              required
            />
            <FormField
              label="Date of Expiry"
              type="date"
              value={form.old_passport_expiry}
              onChange={(v) => update('old_passport_expiry', v)}
              required
            />
          </div>
        )}

        <div className="module-section">
          <div className="module-section-title">
            {isRenewal ? '6 · Documents you will bring' : '5 · Documents you will bring'}
          </div>
          {isRenewal ? (
            <>
              <Checkbox
                checked={form.doc_old_passport}
                onChange={(v) => update('doc_old_passport', v)}
                label="I have my old passport (original)"
              />
              <Checkbox
                checked={form.doc_photos}
                onChange={(v) => update('doc_photos', v)}
                label="I have 2 passport-size photos (taken within 6 months)"
              />
            </>
          ) : (
            <>
              <Checkbox
                checked={form.doc_birth_certificate}
                onChange={(v) => update('doc_birth_certificate', v)}
                label="I have my birth certificate (original)"
              />
              <Checkbox
                checked={form.doc_photos}
                onChange={(v) => update('doc_photos', v)}
                label="I have 2 passport-size photos (taken within 6 months)"
              />
              <Checkbox
                checked={form.doc_chief_letter}
                onChange={(v) => update('doc_chief_letter', v)}
                label="I have a letter from my Chief confirming my identity (optional for urban residents)"
              />
            </>
          )}
        </div>

        {!isRenewal && (
          <div className="module-section">
            <div className="module-section-title">6 · Guarantor</div>
            <p style={{ fontSize: 13, color: '#666', marginTop: 0 }}>
              A guarantor is a person who can confirm your identity. It must be someone who has known you
              for at least 2 years and is not a family member.
            </p>
            <FormField
              label="Guarantor Full Name"
              value={form.guarantor_name}
              onChange={(v) => update('guarantor_name', v)}
              required
            />
            <FormField
              label="Guarantor National ID"
              value={form.guarantor_id}
              onChange={(v) => update('guarantor_id', v)}
              required
            />
            <FormField
              label="Guarantor Phone Number"
              value={form.guarantor_phone}
              onChange={(v) => update('guarantor_phone', v)}
              placeholder="e.g. +266 5800 0000"
              required
            />
          </div>
        )}

        <div className="module-section">
          <div className="module-section-title">7 · Collection branch</div>
          <FormField
            label="Where would you like to collect your passport?"
            as="select"
            value={form.collection_branch}
            onChange={(v) => update('collection_branch', v)}
            options={DISTRICTS.map((d) => ({ value: d, label: d }))}
            required
          />
          <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            You can collect at any of the 10 district offices. Your passport will be sent there after
            printing in Maseru.
          </p>
        </div>

        <div className="module-section">
          <div className="module-section-title">9 · Payment</div>
          <PaymentBlock
            reference={paymentRef}
            bankName={form.payment_bank}
            onBankChange={(v) => update('payment_bank', v)}
            rows={feeRows}
            total={fees.total}
          />
        </div>

        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">10 · Declarations</div>
          <Checkbox
            checked={form.truth_declaration}
            onChange={(v) => update('truth_declaration', v)}
            label="I declare that the information provided is true and correct. I understand that providing false information is an offence under the Passports Act."
          />
          <Checkbox
            checked={form.data_consent}
            onChange={(v) => update('data_consent', v)}
            label="I consent to a data verification against Home Affairs, the Lesotho Mounted Police Service, and the Department of Traffic."
          />
        </div>

        <div style={{
          background: '#fff8e0',
          border: '1px solid #ffe08a',
          borderRadius: 6,
          padding: 14,
          fontSize: 13,
          color: '#7a5a00',
          marginBottom: 20,
        }}>
          Based on <strong>{form.processing_speed}</strong> processing, your passport should be
          ready for collection around{' '}
          <strong>
            {readyDate.toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </strong>{' '}
          at <strong>{form.collection_branch}</strong>.
        </div>

        <SubmitButton
          canSubmit={canSubmit}
          submitting={submitting}
          label={isRenewal ? 'Submit Renewal' : 'Submit Application'}
        />
      </form>
    </div>
  );
};

// ============================================================
// REUSABLE PIECES
// ============================================================
const Radio = ({ checked, onChange, label }) => (
  <label style={{
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#333',
    cursor: 'pointer',
  }}>
    <input type="radio" checked={checked} onChange={onChange} />
    {label}
  </label>
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

const InfoBlock = ({ label, value, mono, big }) => (
  <div style={{
    background: '#f9f9f9',
    border: '1px solid #e0e0e0',
    borderRadius: 6,
    padding: 12,
  }}>
    <div style={{
      fontSize: 10,
      color: '#888',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: 'bold',
      marginBottom: 4,
    }}>
      {label}
    </div>
    <div style={{
      fontSize: big ? 20 : 14,
      fontWeight: 'bold',
      color: '#003366',
      fontFamily: mono ? 'monospace' : 'inherit',
      letterSpacing: mono ? 1 : 0,
    }}>
      {value}
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
    <Link to="/passport" style={{
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

export default PassportModule;