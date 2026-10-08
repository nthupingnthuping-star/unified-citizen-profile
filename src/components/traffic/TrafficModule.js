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
import { calculateAge } from '../../firebase/eligibility';
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
const LEARNER_FEE = 100;
const DRIVER_NEW_FEE = 200;
const DRIVER_RENEWAL_FEE = 150;
const ROADWORTHY_FEE = 250;
const REGISTRATION_NEW_FEE = 500;
const REGISTRATION_TRANSFER_FEE = 250;
const REGISTRATION_REREG_FEE = 300;

const VEHICLE_TYPES = [
  { value: 'Motorcycle', label: 'Motorcycle (age 16+)', minAge: 16 },
  { value: 'Standard Car', label: 'Standard car (age 18+)', minAge: 18 },
  { value: 'Heavy Vehicle', label: 'Heavy vehicle / truck (age 21+)', minAge: 21 },
];

const LICENCE_CODES = [
  { value: '', label: '— Select code —' },
  { value: 'A', label: 'A — Motorcycle' },
  { value: 'B', label: 'B — Light motor vehicle' },
  { value: 'C1', label: 'C1 — Light truck (≤ 3500 kg)' },
  { value: 'C', label: 'C — Heavy truck' },
  { value: 'EB', label: 'EB — Light vehicle with trailer' },
  { value: 'EC', label: 'EC — Heavy vehicle with trailer' },
  { value: 'D', label: 'D — Passenger bus' },
];

const TRANSMISSION = [
  { value: 'Manual', label: 'Manual' },
  { value: 'Automatic', label: 'Automatic' },
];

const REGISTRATION_TYPES = [
  { value: 'First Registration', label: `First registration (M ${REGISTRATION_NEW_FEE})`, fee: REGISTRATION_NEW_FEE },
  { value: 'Change of Ownership', label: `Change of ownership (M ${REGISTRATION_TRANSFER_FEE})`, fee: REGISTRATION_TRANSFER_FEE },
  { value: 'Re-registration', label: `Re-registration (M ${REGISTRATION_REREG_FEE})`, fee: REGISTRATION_REREG_FEE },
];

const VEHICLE_CLASSES = [
  { value: '', label: '— Select class —' },
  { value: 'Sedan', label: 'Sedan / Saloon' },
  { value: 'SUV', label: 'SUV / 4x4' },
  { value: 'Pickup', label: 'Pickup / Bakkie' },
  { value: 'Minibus', label: 'Minibus / Taxi' },
  { value: 'Bus', label: 'Bus' },
  { value: 'Truck', label: 'Truck' },
  { value: 'Motorcycle', label: 'Motorcycle' },
  { value: 'Other', label: 'Other' },
];

// ============================================================
// HELPERS
// ============================================================
const generatePaymentReference = (prefix = 'PAY-TRF') => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}-${year}-${random}`;
};

// ============================================================
// MAIN
// ============================================================
const TrafficModule = () => {
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
      setMessage(`✓ Submitted: ${r.reference}`);
      setLastSubmission({
        reference: r.reference,
        serviceType,
        paymentReference: data.payment?.reference,
        amount: data.fees?.total || 0,
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
    { key: 'learner', label: 'Learner License' },
    { key: 'driver', label: "Driver's License" },
    { key: 'roadworthy', label: 'Roadworthy' },
    { key: 'registration', label: 'Vehicle Registration' },
    { key: 'accident', label: 'Accident Report' },
  ];

  return (
    <VerifiedGuard serviceName="Department of Traffic and Transport">
      <Layout title="Department of Traffic and Transport">
        <div className="module-root">
          <div className="module-header">
            <h1>Department of Traffic and Transport</h1>
            <p>Licenses, roadworthy, vehicle registration, and safety services</p>
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

          {lastSubmission && lastSubmission.paymentReference && (
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
                  Collect at <strong>{lastSubmission.collectionBranch}</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="module-card">
              <div className="module-section-title">My Traffic Applications</div>
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

          {activeTab === 'learner' && (
            <LearnerLicenseForm profile={profile} submitting={loading} onSubmit={submit} />
          )}

          {activeTab === 'driver' && (
            <DriverLicenseForm profile={profile} submitting={loading} onSubmit={submit} />
          )}

          {activeTab === 'roadworthy' && (
            <RoadworthyForm profile={profile} submitting={loading} onSubmit={submit} />
          )}

          {activeTab === 'registration' && (
            <VehicleRegistrationForm profile={profile} submitting={loading} onSubmit={submit} />
          )}

          {activeTab === 'accident' && <AccidentInfoPanel />}
        </div>
      </Layout>
    </VerifiedGuard>
  );
};

// ============================================================
// LEARNER LICENSE FORM
// ============================================================
const LearnerLicenseForm = ({ profile, submitting, onSubmit }) => {
  const age = calculateAge(profile?.date_of_birth);

  const [form, setForm] = useState({
    vehicle_type: 'Standard Car',
    bank_name: '',
    collection_branch: 'Maseru',
  });
  const [uploads, setUploads] = useState({
    eye_test: null,
    photos: null,
  });
  const [paymentRef] = useState(() => generatePaymentReference());

  const update = (k, v) => setForm({ ...form, [k]: v });
  const setUpload = (k, v) => setUploads({ ...uploads, [k]: v });

  const vehicleMeta = VEHICLE_TYPES.find((v) => v.value === form.vehicle_type);
  const eligible = age !== null && vehicleMeta && age >= vehicleMeta.minAge;

  const canSubmit =
    form.vehicle_type &&
    form.bank_name &&
    uploads.eye_test &&
    uploads.photos &&
    eligible;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit('Learner License', {
      vehicle_type: form.vehicle_type,
      collection_branch: form.collection_branch,
      documents_uploaded: {
        eye_test: uploads.eye_test,
        photos: uploads.photos,
      },
      payment: { reference: paymentRef, bank: form.bank_name, status: 'awaiting_payment' },
      fees: { base: LEARNER_FEE, total: LEARNER_FEE },
    });
  };

  return (
    <div className="module-card">
      <div className="module-section-title">Learner License Application</div>

      <Alert type="info">
        Motorcycle: 16+ · Standard car: 18+ · Heavy vehicle: 21+. Fee: M {LEARNER_FEE}.
      </Alert>

      <form onSubmit={handleSubmit}>
        <div className="module-section">
          <div className="module-section-title">1 · Applicant</div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#003366' }}>
            {profile?.full_name}
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
            National ID: {profile?.national_id} · Age: <strong>{age}</strong>
          </div>
        </div>

        <div className="module-section">
          <div className="module-section-title">2 · Vehicle type</div>
          <FormField
            label="Vehicle Type *"
            as="select"
            value={form.vehicle_type}
            onChange={(v) => update('vehicle_type', v)}
            options={VEHICLE_TYPES.map((v) => ({ value: v.value, label: v.label }))}
            required
          />
          {eligible ? (
            <div style={{
              marginTop: 8, padding: 12,
              background: '#e6f4ea', color: '#006600',
              border: '1px solid #a8d5b8', borderRadius: 6,
              fontSize: 13, fontWeight: 'bold',
            }}>
              ✓ You are eligible (age {age})
            </div>
          ) : (
            <div style={{
              marginTop: 8, padding: 12,
              background: '#fff3cd', color: '#856404',
              border: '1px solid #ffe08a', borderRadius: 6,
              fontSize: 13, fontWeight: 'bold',
            }}>
              You must be {vehicleMeta?.minAge}+ for this vehicle type. You are {age}.
            </div>
          )}
        </div>

        <div className="module-section">
          <div className="module-section-title">3 · Upload your documents</div>
          <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 12 }}>
            Take clear photos of each document and upload them below. JPG, PNG, or PDF.
          </p>
          <CloudinaryUpload
            label="Medical Eye Test Certificate *"
            onUpload={(url) => setUpload('eye_test', url)}
          />
          <CloudinaryUpload
            label="2 Passport-size Photos *"
            onUpload={(url) => setUpload('photos', url)}
          />
        </div>

        <div className="module-section">
          <div className="module-section-title">4 · Collection branch</div>
          <FormField
            label="Where will you collect your learner's permit?"
            as="select"
            value={form.collection_branch}
            onChange={(v) => update('collection_branch', v)}
            options={DISTRICTS.map((d) => ({ value: d, label: d }))}
            required
          />
        </div>

        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">5 · Payment</div>
          <PaymentBlock
            reference={paymentRef}
            bankName={form.bank_name}
            onBankChange={(v) => update('bank_name', v)}
            rows={[{ label: 'Learner License Fee', amount: LEARNER_FEE }]}
            total={LEARNER_FEE}
          />
        </div>

        <SubmitButton canSubmit={canSubmit} submitting={submitting} label="Apply for Learner License" />
      </form>
    </div>
  );
};

// ============================================================
// DRIVER LICENSE FORM
// ============================================================
const DriverLicenseForm = ({ profile, submitting, onSubmit }) => {
  const [form, setForm] = useState({
    application_type: 'New',
    licence_code: '',
    transmission: 'Manual',
    bank_name: '',
    collection_branch: 'Maseru',
  });
  const [uploads, setUploads] = useState({
    learner_license: null,
    certificate_of_competence: null,
  });
  const [paymentRef] = useState(() => generatePaymentReference());

  const update = (k, v) => setForm({ ...form, [k]: v });
  const setUpload = (k, v) => setUploads({ ...uploads, [k]: v });

  const fee = form.application_type === 'New' ? DRIVER_NEW_FEE : DRIVER_RENEWAL_FEE;

  const canSubmit =
    form.licence_code &&
    form.bank_name &&
    uploads.learner_license &&
    uploads.certificate_of_competence;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit('Driver License', {
      application_type: form.application_type,
      licence_code: form.licence_code,
      transmission: form.transmission,
      collection_branch: form.collection_branch,
      documents_uploaded: {
        learner_license: uploads.learner_license,
        certificate_of_competence: uploads.certificate_of_competence,
      },
      payment: { reference: paymentRef, bank: form.bank_name, status: 'awaiting_payment' },
      fees: { base: fee, total: fee },
    });
  };

  return (
    <div className="module-card">
      <div className="module-section-title">Driver's License Application</div>

      <Alert type="info">
        New licence: M {DRIVER_NEW_FEE} · Renewal: M {DRIVER_RENEWAL_FEE}. You must hold a valid Learner License and pass the Certificate of Competence test.
      </Alert>

      <form onSubmit={handleSubmit}>
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
          <div className="module-section-title">2 · Application type</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Radio
              checked={form.application_type === 'New'}
              onChange={() => update('application_type', 'New')}
              label={`New licence (M ${DRIVER_NEW_FEE})`}
            />
            <Radio
              checked={form.application_type === 'Renewal'}
              onChange={() => update('application_type', 'Renewal')}
              label={`Renewal (M ${DRIVER_RENEWAL_FEE})`}
            />
          </div>
        </div>

        <div className="module-section">
          <div className="module-section-title">3 · License details</div>
          <FormField
            label="License Code *"
            as="select"
            value={form.licence_code}
            onChange={(v) => update('licence_code', v)}
            options={LICENCE_CODES}
            required
          />
          <FormField
            label="Transmission"
            as="select"
            value={form.transmission}
            onChange={(v) => update('transmission', v)}
            options={TRANSMISSION}
          />
        </div>

        <div className="module-section">
          <div className="module-section-title">4 · Upload your documents</div>
          <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 12 }}>
            Take clear photos of each document and upload them below. JPG, PNG, or PDF.
          </p>
          <CloudinaryUpload
            label="Valid Learner License *"
            onUpload={(url) => setUpload('learner_license', url)}
          />
          <CloudinaryUpload
            label="Certificate of Competence *"
            onUpload={(url) => setUpload('certificate_of_competence', url)}
          />
        </div>

        <div className="module-section">
          <div className="module-section-title">5 · Collection branch</div>
          <FormField
            label="Where will you collect your driver's license?"
            as="select"
            value={form.collection_branch}
            onChange={(v) => update('collection_branch', v)}
            options={DISTRICTS.map((d) => ({ value: d, label: d }))}
            required
          />
        </div>

        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">6 · Payment</div>
          <PaymentBlock
            reference={paymentRef}
            bankName={form.bank_name}
            onBankChange={(v) => update('bank_name', v)}
            rows={[{ label: `${form.application_type} license`, amount: fee }]}
            total={fee}
          />
        </div>

        <SubmitButton canSubmit={canSubmit} submitting={submitting} label="Apply for Driver License" />
      </form>
    </div>
  );
};

// ============================================================
// ROADWORTHY FORM
// ============================================================
const RoadworthyForm = ({ profile, submitting, onSubmit }) => {
  const [form, setForm] = useState({
    plate_number: '',
    make: '',
    model: '',
    year: '',
    vin: '',
    inspection_branch: 'Maseru',
    bank_name: '',
  });
  const [paymentRef] = useState(() => generatePaymentReference());

  const update = (k, v) => setForm({ ...form, [k]: v });

  const canSubmit =
    form.plate_number.trim() &&
    form.make.trim() &&
    form.model.trim() &&
    form.year &&
    form.bank_name;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit('Roadworthy Certificate', {
      vehicle: {
        plate_number: form.plate_number.toUpperCase(),
        make: form.make,
        model: form.model,
        year: form.year,
        vin: form.vin.toUpperCase(),
      },
      inspection_branch: form.inspection_branch,
      collection_branch: form.inspection_branch,
      payment: { reference: paymentRef, bank: form.bank_name, status: 'awaiting_payment' },
      fees: { base: ROADWORTHY_FEE, total: ROADWORTHY_FEE },
    });
  };

  return (
    <div className="module-card">
      <div className="module-section-title">Roadworthy Certificate Application</div>

      <Alert type="info">
        Fee: M {ROADWORTHY_FEE}. The certificate is valid for 6 months. You will need to bring the vehicle for physical inspection.
      </Alert>

      <form onSubmit={handleSubmit}>
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
          <div className="module-section-title">2 · Vehicle details</div>
          <FormField
            label="Plate Number *"
            value={form.plate_number}
            onChange={(v) => update('plate_number', v.toUpperCase())}
            placeholder="e.g. A1234"
            required
          />
          <FormField
            label="Make *"
            value={form.make}
            onChange={(v) => update('make', v)}
            placeholder="e.g. Toyota"
            required
          />
          <FormField
            label="Model *"
            value={form.model}
            onChange={(v) => update('model', v)}
            placeholder="e.g. Hilux"
            required
          />
          <FormField
            label="Year *"
            type="number"
            value={form.year}
            onChange={(v) => update('year', v)}
            placeholder="e.g. 2018"
            required
          />
          <FormField
            label="Chassis / VIN"
            value={form.vin}
            onChange={(v) => update('vin', v.toUpperCase())}
            placeholder="e.g. AHTFR22G30..."
          />
        </div>

        <div className="module-section">
          <div className="module-section-title">3 · Inspection branch</div>
          <FormField
            label="Where will you bring the vehicle for inspection?"
            as="select"
            value={form.inspection_branch}
            onChange={(v) => update('inspection_branch', v)}
            options={DISTRICTS.map((d) => ({ value: d, label: d }))}
            required
          />
        </div>

        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">4 · Payment</div>
          <PaymentBlock
            reference={paymentRef}
            bankName={form.bank_name}
            onBankChange={(v) => update('bank_name', v)}
            rows={[{ label: 'Roadworthy Inspection Fee', amount: ROADWORTHY_FEE }]}
            total={ROADWORTHY_FEE}
          />
        </div>

        <SubmitButton canSubmit={canSubmit} submitting={submitting} label="Apply for Roadworthy" />
      </form>
    </div>
  );
};

// ============================================================
// VEHICLE REGISTRATION FORM
// ============================================================
const VehicleRegistrationForm = ({ profile, submitting, onSubmit }) => {
  const [form, setForm] = useState({
    registration_type: 'First Registration',
    plate_number: '',
    year: '',
    make: '',
    model: '',
    vehicle_class: '',
    colour: '',
    chassis_number: '',
    engine_number: '',
    bank_name: '',
    collection_branch: 'Maseru',
  });
  const [uploads, setUploads] = useState({
    customs_clearance: null,
    vat_clearance: null,
    proof_of_purchase: null,
  });
  const [paymentRef] = useState(() => generatePaymentReference());

  const update = (k, v) => setForm({ ...form, [k]: v });
  const setUpload = (k, v) => setUploads({ ...uploads, [k]: v });

  const regMeta = REGISTRATION_TYPES.find((r) => r.value === form.registration_type);
  const fee = regMeta?.fee || REGISTRATION_NEW_FEE;

  const canSubmit =
    form.plate_number.trim() &&
    form.year &&
    form.make.trim() &&
    form.model.trim() &&
    form.chassis_number.trim() &&
    form.bank_name &&
    uploads.proof_of_purchase;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit('Vehicle Registration', {
      registration_type: form.registration_type,
      vehicle: {
        plate_number: form.plate_number.toUpperCase(),
        year: form.year,
        make: form.make,
        model: form.model,
        vehicle_class: form.vehicle_class,
        colour: form.colour,
        chassis_number: form.chassis_number.toUpperCase(),
        engine_number: form.engine_number,
      },
      collection_branch: form.collection_branch,
      documents_uploaded: {
        customs_clearance: uploads.customs_clearance,
        vat_clearance: uploads.vat_clearance,
        proof_of_purchase: uploads.proof_of_purchase,
      },
      payment: { reference: paymentRef, bank: form.bank_name, status: 'awaiting_payment' },
      fees: { base: fee, total: fee },
    });
  };

  return (
    <div className="module-card">
      <div className="module-section-title">Vehicle Registration</div>

      <Alert type="info">
        First registration: M {REGISTRATION_NEW_FEE} · Change of ownership: M {REGISTRATION_TRANSFER_FEE} · Re-registration: M {REGISTRATION_REREG_FEE}.
      </Alert>

      <form onSubmit={handleSubmit}>
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
          <div className="module-section-title">2 · Registration type</div>
          <FormField
            label="Type of Registration *"
            as="select"
            value={form.registration_type}
            onChange={(v) => update('registration_type', v)}
            options={REGISTRATION_TYPES.map((r) => ({ value: r.value, label: r.label }))}
            required
          />
        </div>

        <div className="module-section">
          <div className="module-section-title">3 · Vehicle details</div>
          <FormField
            label="Plate Number *"
            value={form.plate_number}
            onChange={(v) => update('plate_number', v.toUpperCase())}
            placeholder="e.g. A1234"
            required
          />
          <FormField
            label="Year *"
            type="number"
            value={form.year}
            onChange={(v) => update('year', v)}
            placeholder="e.g. 2022"
            required
          />
          <FormField
            label="Make *"
            value={form.make}
            onChange={(v) => update('make', v)}
            placeholder="e.g. Toyota"
            required
          />
          <FormField
            label="Model *"
            value={form.model}
            onChange={(v) => update('model', v)}
            placeholder="e.g. Corolla"
            required
          />
          <FormField
            label="Vehicle Class"
            as="select"
            value={form.vehicle_class}
            onChange={(v) => update('vehicle_class', v)}
            options={VEHICLE_CLASSES}
          />
          <FormField
            label="Colour"
            value={form.colour}
            onChange={(v) => update('colour', v)}
            placeholder="e.g. White"
          />
          <FormField
            label="Chassis Number *"
            value={form.chassis_number}
            onChange={(v) => update('chassis_number', v.toUpperCase())}
            placeholder="VIN"
            required
          />
          <FormField
            label="Engine Number"
            value={form.engine_number}
            onChange={(v) => update('engine_number', v)}
          />
        </div>

        <div className="module-section">
          <div className="module-section-title">4 · Upload your documents</div>
          <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 12 }}>
            Take clear photos of each document and upload them below. JPG, PNG, or PDF.
          </p>
          <CloudinaryUpload
            label="Customs Clearance (for imported vehicles)"
            onUpload={(url) => setUpload('customs_clearance', url)}
          />
          <CloudinaryUpload
            label="VAT Clearance from RSL"
            onUpload={(url) => setUpload('vat_clearance', url)}
          />
          <CloudinaryUpload
            label="Proof of Purchase / Invoice *"
            onUpload={(url) => setUpload('proof_of_purchase', url)}
          />
        </div>

        <div className="module-section">
          <div className="module-section-title">5 · Collection branch</div>
          <FormField
            label="Where will you collect your registration certificate?"
            as="select"
            value={form.collection_branch}
            onChange={(v) => update('collection_branch', v)}
            options={DISTRICTS.map((d) => ({ value: d, label: d }))}
            required
          />
        </div>

        <div className="module-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="module-section-title">6 · Payment</div>
          <PaymentBlock
            reference={paymentRef}
            bankName={form.bank_name}
            onBankChange={(v) => update('bank_name', v)}
            rows={[{ label: form.registration_type, amount: fee }]}
            total={fee}
          />
        </div>

        <SubmitButton canSubmit={canSubmit} submitting={submitting} label="Register Vehicle" />
      </form>
    </div>
  );
};

// ============================================================
// ACCIDENT INFO PANEL
// ============================================================
const AccidentInfoPanel = () => (
  <div className="module-card">
    <div className="module-section-title">Traffic Accident Report</div>

    <div style={{
      background: '#fff8e0',
      border: '1px solid #ffe08a',
      borderRadius: 6,
      padding: 20,
      fontSize: 14,
      color: '#7a5a00',
      marginBottom: 20,
    }}>
      <strong>⚠ Important:</strong> Traffic accidents are handled by the
      Lesotho Mounted Police Service (LMPS), not by the Department of Traffic.
      If you have been in an accident, please file your report with the Police.
    </div>

    <div style={{ fontSize: 14, color: '#333', marginBottom: 20, lineHeight: 1.7 }}>
      <p style={{ marginTop: 0 }}>The LMPS Traffic Division handles:</p>
      <ul>
        <li>Accident scene investigation</li>
        <li>Casualty and injury documentation</li>
        <li>Case numbers for insurance claims</li>
        <li>Traffic accident reports (for insurance and legal purposes)</li>
      </ul>
      <p>In an emergency, call <strong>112</strong> immediately.</p>
    </div>

    <Link
      to="/police"
      style={{
        display: 'inline-block',
        background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)',
        color: 'white',
        padding: '12px 26px',
        borderRadius: 999,
        textDecoration: 'none',
        fontSize: 15,
        fontWeight: 'bold',
        boxShadow: '0 4px 14px rgba(204, 0, 0, 0.25)',
      }}
    >
      🚨 Go to Police Accident Report →
    </Link>
  </div>
);

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
    <Link to="/traffic" style={{
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

export default TrafficModule;