import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';

import { db } from './firebase';
import { calculateAge, ELIGIBILITY_RULES } from './eligibility';

export {
  updateDoc,
  doc,
  serverTimestamp,
};

export { db };

// ============================================================
// DEPARTMENT IDs
// ============================================================
export const DEPARTMENTS = {
  HOME_AFFAIRS: 1,
  TRAFFIC: 2,
  FINANCE: 3,
  PENSIONS: 4,
  POLICE: 5,
  PASSPORT: 6,
};

export const DEPARTMENT_NAMES = {
  1: 'Ministry of Home Affairs',
  2: 'Department of Traffic and Transport',
  3: 'Ministry of Finance / RSL',
  4: 'Pensions Department',
  5: 'Lesotho Mounted Police Service',
  6: 'Passport and Citizenship Office',
};

// ============================================================
// APPOINTMENT SERVICES BY DEPARTMENT
// ============================================================
export const APPOINTMENT_SERVICES = {
  1: [
    { label: 'Biometric Verification (Fingerprints + Photo)', value: 'biometric-verification' },
    { label: 'ID Collection', value: 'id-collection' },
    { label: 'Birth Certificate Collection', value: 'birth-certificate' },
  ],
  2: [
    { label: 'Roadworthy Test', value: 'roadworthy-test' },
    { label: 'Practical Driving Exam', value: 'practical-driving-exam' },
    { label: "Driver's License Collection", value: 'license-collection' },
  ],
  3: [
    { label: 'Tax Consultation', value: 'tax-consultation' },
  ],
  5: [
    { label: 'Fingerprint Capture (for Clearance)', value: 'fingerprint-capture' },
    { label: 'Police Clearance Collection', value: 'clearance-collection' },
  ],
  6: [
    { label: 'Biometric Capture (New Passport)', value: 'biometric-capture-passport' },
    { label: 'Passport Collection', value: 'passport-collection' },
  ],
};

// ============================================================
// PENSION CONSTANTS
// ============================================================
export const RETIREMENT_AGES = {
  'Disciplined Service': 55,
  'Local Government': 60,
  'Public Service': 60,
  'Teaching Service': 60,
};

export const PENSION_RULES = {
  MAX_LUMP_SUM_PERCENT: 50,
  MIN_LUMP_SUM_PERCENT: 0,
  EARLY_RETIREMENT_YEARS: 10,
  ILL_HEALTH_REPORT_DAYS: 180,
  WITHDRAWAL_PROCESSING_DAYS: 14,
  RETIREMENT_PROCESSING_DAYS: 28,
};

export const CLAIM_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  AUDIT: 'audit',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
};

export const CLAIM_TYPES = {
  RETIREMENT: 'retirement',
  WITHDRAWAL: 'withdrawal',
  DEATH: 'death',
  ILL_HEALTH: 'ill_health',
};

// ============================================================
// POLICE PRIORITY
// ============================================================
export const POLICE_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
};

export const POLICE_SLA_MINUTES = {
  critical: 30,
  high: 120,
  normal: 1440,
  low: 7200,
};

export const CRITICAL_CRIME_TYPES = [
  'Robbery',
  'Assault',
  'Domestic Violence',
  'Gender-Based Violence',
  'Missing Person',
  'Stock Theft',
];

export const REPORT_SERVICES = [
  'Traffic Accident Report',
  'Crime Report',
  'Cybercrime Report',
];

export function isReportService(service_type) {
  return REPORT_SERVICES.includes(service_type);
}

// ============================================================
// CITIZEN
// ============================================================
export async function getCitizenByNationalId(nationalId) {
  const q = query(collection(db, 'citizens'), where('national_id', '==', nationalId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docData = snapshot.docs[0];
  return { id: docData.id, ...docData.data() };
}

export async function getCitizenById(uid) {
  const docSnap = await getDoc(doc(db, 'citizens', uid));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

export async function verifyCitizen(citizenId, staffId) {
  const snap = await getDoc(doc(db, 'citizens', citizenId));
  if (!snap.exists()) throw new Error('Citizen not found');

  const data = snap.data();
  if (data.id_blocked === true) {
    throw new Error(
      'This citizen has reported their ID as lost or stolen. Verification is blocked until Home Affairs issues a new ID.'
    );
  }

  await updateDoc(doc(db, 'citizens', citizenId), {
    verified_by_home_affairs: true,
    verification_date: Timestamp.now(),
    verified_by: staffId,
  });

  await logAccess({
    citizen_id: citizenId,
    staff_id: staffId,
    department_id: DEPARTMENTS.HOME_AFFAIRS,
    action_type: 'verify',
    purpose: 'Identity verification by Home Affairs',
  });
}

export async function updateCitizenContact(uid, { residential_address, phone_number, email }) {
  await updateDoc(doc(db, 'citizens', uid), {
    residential_address,
    phone_number,
    email,
  });
}

// ============================================================
// APPLICATIONS — SUBMIT
// ============================================================
export async function submitApplication({
  citizen_id,
  citizen_name,
  citizen_national_id,
  department_id,
  service_type,
  application_data,
}) {
  if (service_type === 'Old Age Pension') {
    const citizenSnap = await getDoc(doc(db, 'citizens', citizen_id));
    if (citizenSnap.exists()) {
      const citizenAge = calculateAge(citizenSnap.data().date_of_birth);
      const minAge = ELIGIBILITY_RULES.OLD_AGE_PENSION.minAge;
      if (citizenAge === null || citizenAge < minAge) {
        throw new Error(
          `You must be ${minAge} years or older to apply for Old Age Pension. You are ${citizenAge}.`
        );
      }
    }
  }

  if (service_type === 'Learner License') {
    const citizenSnap = await getDoc(doc(db, 'citizens', citizen_id));
    if (citizenSnap.exists()) {
      const citizenAge = calculateAge(citizenSnap.data().date_of_birth);
      const vehicleType = application_data?.vehicle_type || 'standard';
      const minAge = vehicleType === 'motorcycle'
        ? ELIGIBILITY_RULES.LEARNER_LICENSE_MOTORCYCLE.minAge
        : ELIGIBILITY_RULES.LEARNER_LICENSE_STANDARD.minAge;
      if (citizenAge === null || citizenAge < minAge) {
        throw new Error(
          `You must be ${minAge} years or older for a ${vehicleType} Learner License. You are ${citizenAge}.`
        );
      }
    }
  }

  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const prefix = {
    1: 'HA',
    2: 'TRF',
    3: 'TCC',
    4: 'PEN',
    5: 'POL',
    6: 'PAS',
  }[department_id] || 'APP';

  const reference = `${prefix}-${year}-${random}`;

  const SLIP_SERVICES = [
    'New Passport',
    'Passport Renewal',
    'Learner License',
    "Driver's License",
  ];

  let collection_window = null;
  if (SLIP_SERVICES.includes(service_type)) {
    const readyStr = application_data?.estimated_ready_date;
    const readyDate = readyStr
      ? new Date(readyStr)
      : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const validUntil = new Date(readyDate);
    validUntil.setDate(validUntil.getDate() + 14);
    collection_window = {
      ready_date: readyDate.toISOString(),
      valid_until: validUntil.toISOString(),
    };
  }

  let priority = null;
  let sla_minutes = null;
  let life_threatening = false;
  let assigned_case_number = null;

  if (department_id === DEPARTMENTS.POLICE) {
    if (service_type === 'Traffic Accident Report') {
      priority = POLICE_PRIORITY.CRITICAL;
    } else if (service_type === 'Crime Report') {
      const ct = application_data?.crime_type || '';
      priority = CRITICAL_CRIME_TYPES.includes(ct)
        ? POLICE_PRIORITY.CRITICAL
        : POLICE_PRIORITY.NORMAL;
    } else if (service_type === 'Cybercrime Report') {
      const raw = String(application_data?.financial_loss || '').replace(/[^\d]/g, '');
      const loss = parseInt(raw, 10) || 0;
      priority = loss >= 5000 ? POLICE_PRIORITY.HIGH : POLICE_PRIORITY.NORMAL;
    } else {
      priority = POLICE_PRIORITY.NORMAL;
    }

    sla_minutes = POLICE_SLA_MINUTES[priority] || null;
    life_threatening = priority === POLICE_PRIORITY.CRITICAL;

    if (service_type !== 'Police Clearance') {
      const districtCodeMap = {
        Maseru: 'MAS',
        Leribe: 'LER',
        Berea: 'BER',
        'Butha-Buthe': 'BBT',
        Mafeteng: 'MAF',
        "Mohale's Hoek": 'MHO',
        Mokhotlong: 'MOK',
        "Qacha's Nek": 'QNK',
        Quthing: 'QUT',
        'Thaba-Tseka': 'TTK',
      };
      const district = application_data?.collection_branch || 'Maseru';
      const code = districtCodeMap[district] || 'MAS';
      const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      assigned_case_number = `LMPS-${year}-${code}-${rand}`;
    }
  }

  const docRef = await addDoc(collection(db, 'applications'), {
    application_reference: reference,
    citizen_id,
    citizen_name,
    citizen_national_id,
    department_id,
    service_type,
    status: 'pending',
    application_data,
    collection_window,
    priority,
    sla_minutes,
    life_threatening,
    assigned_case_number,
    dispatched_at: null,
    dispatched_by: null,
    responded_at: null,
    closed_at: null,
    closure_notes: '',
    submitted_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    completed_at: null,
    processed_by: null,
    notes: '',
    rejection_reason: '',
  });

  if (
    department_id === DEPARTMENTS.HOME_AFFAIRS &&
    service_type === 'Report Lost ID'
  ) {
    await updateDoc(doc(db, 'citizens', citizen_id), {
      id_status: 'lost',
      id_blocked: true,
      id_reported_lost_at: serverTimestamp(),
    });
  }

  const isEmergency = life_threatening;
  await createNotification(citizen_id, {
    title: isEmergency ? '🚨 Report received — unit notified' : 'Application submitted',
    message: isEmergency
      ? `Your ${service_type} has been received. A unit has been notified. Case number: ${assigned_case_number}. If danger is ongoing, call 112.`
      : `Your ${service_type} application has been received. Reference: ${reference}`,
    type: isEmergency ? 'error' : 'info',
  });

  return { id: docRef.id, reference, case_number: assigned_case_number, priority };
}

// ============================================================
// POLICE — QUEUE LOADERS
// ============================================================
export async function getAllPoliceApplications() {
  const q = query(
    collection(db, 'applications'),
    where('department_id', '==', DEPARTMENTS.POLICE)
  );
  const snapshot = await getDocs(q);
  const apps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  apps.sort((a, b) => {
    const aTime = a.submitted_at?.toMillis?.() || 0;
    const bTime = b.submitted_at?.toMillis?.() || 0;
    return bTime - aTime;
  });
  return apps;
}

export function inferPolicePriority(app) {
  if (!app) return POLICE_PRIORITY.NORMAL;
  if (app.priority) return app.priority;

  const type = app.service_type || '';
  const data = app.application_data || {};

  if (type === 'Traffic Accident Report') return POLICE_PRIORITY.CRITICAL;

  if (type === 'Crime Report') {
    const ct = data.crime_type || '';
    if (CRITICAL_CRIME_TYPES.includes(ct)) return POLICE_PRIORITY.CRITICAL;
    return POLICE_PRIORITY.NORMAL;
  }

  if (type === 'Cybercrime Report') {
    const raw = String(data.financial_loss || '').replace(/[^\d]/g, '');
    const loss = parseInt(raw, 10) || 0;
    return loss >= 5000 ? POLICE_PRIORITY.HIGH : POLICE_PRIORITY.NORMAL;
  }

  return POLICE_PRIORITY.NORMAL;
}

export async function getPoliceEmergencyReports() {
  const all = await getAllPoliceApplications();

  return all
    .filter((a) => a.service_type !== 'Police Clearance')
    .map((a) => ({ ...a, priority: inferPolicePriority(a) }))
    .filter((a) => {
      const active = !['completed', 'cancelled', 'approved'].includes(a.status);
      const urgent =
        a.priority === POLICE_PRIORITY.CRITICAL ||
        a.priority === POLICE_PRIORITY.HIGH;
      return active && urgent;
    });
}

export async function getPoliceDocumentApplications(status = 'pending') {
  const all = await getAllPoliceApplications();
  return all.filter((a) => {
    if (a.service_type !== 'Police Clearance') return false;
    if (status === 'all') return true;
    return a.status === status;
  });
}

export async function dispatchPoliceUnit(applicationId, staffId, notes = '') {
  const ref = doc(db, 'applications', applicationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Application not found');

  const app = snap.data();

  if (
    app.status === 'dispatched' ||
    app.status === 'on-scene' ||
    app.status === 'completed' ||
    app.status === 'cancelled'
  ) {
    return;
  }

  await updateDoc(ref, {
    status: 'dispatched',
    dispatched_at: serverTimestamp(),
    dispatched_by: staffId,
    notes: notes || app.notes || '',
    updated_at: serverTimestamp(),
  });

  await createNotification(app.citizen_id, {
    title: '🚨 A unit has been dispatched',
    message: `A response unit has been assigned to your ${app.service_type} report (case ${app.assigned_case_number || app.application_reference}). Stay safe. Call 112 if the situation escalates.`,
    type: 'error',
  });

  await logAccess({
    citizen_id: app.citizen_id,
    staff_id: staffId,
    department_id: DEPARTMENTS.POLICE,
    action_type: 'dispatch',
    purpose: `Dispatch unit for ${app.service_type}`,
  });
}

export async function markPoliceOnScene(applicationId, staffId, notes = '') {
  const ref = doc(db, 'applications', applicationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Application not found');

  const app = snap.data();

  if (
    app.status === 'on-scene' ||
    app.status === 'completed' ||
    app.status === 'cancelled'
  ) {
    return;
  }

  await updateDoc(ref, {
    status: 'on-scene',
    responded_at: serverTimestamp(),
    dispatched_by: staffId,
    notes: notes || app.notes || '',
    updated_at: serverTimestamp(),
  });

  await createNotification(app.citizen_id, {
    title: '🚔 Officers are on scene',
    message: `Officers have arrived at the location you reported. Case ${app.assigned_case_number || app.application_reference}.`,
    type: 'info',
  });
}

export async function closePoliceCase(applicationId, staffId, resolutionNotes) {
  const ref = doc(db, 'applications', applicationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Application not found');

  const app = snap.data();

  if (app.status === 'completed' || app.status === 'cancelled') {
    return;
  }

  await updateDoc(ref, {
    status: 'completed',
    closed_at: serverTimestamp(),
    closure_notes: resolutionNotes || '',
    processed_by: staffId,
    completed_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  await createNotification(app.citizen_id, {
    title: '✓ Case closed',
    message: `Your ${app.service_type} (case ${app.assigned_case_number || app.application_reference}) has been closed. ${resolutionNotes || ''}`,
    type: 'success',
  });
}

export async function cancelPoliceReport(applicationId, citizenId, reason) {
  const ref = doc(db, 'applications', applicationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Application not found');

  const app = snap.data();
  if (app.citizen_id !== citizenId) throw new Error('Not your report');

  if (app.status === 'completed' || app.status === 'cancelled') {
    return;
  }

  await updateDoc(ref, {
    status: 'cancelled',
    closure_notes: reason || 'Cancelled by reporter',
    closed_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  await createNotification(app.citizen_id, {
    title: 'Report cancelled',
    message: `Your ${app.service_type} report has been cancelled. ${reason || ''}`,
    type: 'info',
  });
}

// ============================================================
// APPLICATIONS — READ
// ============================================================
export async function getMyApplications(citizenId) {
  const q = query(collection(db, 'applications'), where('citizen_id', '==', citizenId));
  const snapshot = await getDocs(q);
  const apps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  apps.sort((a, b) => {
    const aTime = a.submitted_at?.toMillis?.() || 0;
    const bTime = b.submitted_at?.toMillis?.() || 0;
    return bTime - aTime;
  });
  return apps;
}

export async function getDepartmentApplications(departmentId, status = 'pending') {
  const constraints = [where('department_id', '==', departmentId)];
  if (status !== 'all') constraints.push(where('status', '==', status));
  const q = query(collection(db, 'applications'), ...constraints);
  const snapshot = await getDocs(q);
  const apps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  apps.sort((a, b) => {
    const aTime = a.submitted_at?.toMillis?.() || 0;
    const bTime = b.submitted_at?.toMillis?.() || 0;
    return bTime - aTime;
  });
  return apps;
}

// ============================================================
// APPLICATIONS — UPDATE STATUS
// ============================================================
export async function updateApplicationStatus(applicationId, action, staffId, reason = '') {
  const statusMap = {
    approve: 'approved',
    reject: 'rejected',
    'request-info': 'processing',
  };

  const newStatus = statusMap[action];
  if (!newStatus) throw new Error('Invalid action: ' + action);

  const updateData = {
    status: newStatus,
    processed_by: staffId,
    updated_at: serverTimestamp(),
  };

  if (action === 'reject') updateData.rejection_reason = reason;
  else if (action === 'request-info') updateData.notes = reason;
  else updateData.notes = reason || '';

  if (newStatus === 'approved' || newStatus === 'rejected') {
    updateData.completed_at = serverTimestamp();
  }

  await updateDoc(doc(db, 'applications', applicationId), updateData);

  const appSnap = await getDoc(doc(db, 'applications', applicationId));
  if (appSnap.exists()) {
    const app = appSnap.data();
    await createNotification(app.citizen_id, {
      title: `Application ${newStatus}`,
      message: `Your ${app.service_type} application has been ${newStatus}. ${reason || ''}`,
      type: newStatus === 'approved' ? 'success' : newStatus === 'rejected' ? 'error' : 'info',
    });
    await logAccess({
      citizen_id: app.citizen_id,
      staff_id: staffId,
      department_id: app.department_id,
      action_type: action,
      purpose: `${action} for ${app.service_type || 'application'}`,
      fields_accessed: 'full_name, national_id, application_data',
    });
  }
}

// ============================================================
// ACCESS LOGS
// ============================================================
export async function logAccess({
  citizen_id,
  staff_id,
  department_id,
  action_type,
  purpose,
  fields_accessed = '',
}) {
  await addDoc(collection(db, 'access_logs'), {
    citizen_id,
    staff_id,
    department_id,
    action_type,
    purpose,
    fields_accessed,
    accessed_at: serverTimestamp(),
  });
}

export async function getMyAccessLogs(citizenId) {
  const q = query(collection(db, 'access_logs'), where('citizen_id', '==', citizenId));
  const snapshot = await getDocs(q);
  const logs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  logs.sort((a, b) => {
    const aTime = a.accessed_at?.toMillis?.() || 0;
    const bTime = b.accessed_at?.toMillis?.() || 0;
    return bTime - aTime;
  });
  return logs;
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export async function createNotification(citizenId, { title, message, type = 'info' }) {
  await addDoc(collection(db, 'notifications'), {
    citizen_id: citizenId,
    title,
    message,
    type,
    is_read: false,
    created_at: serverTimestamp(),
  });
}

export async function getMyNotifications(citizenId) {
  const q = query(collection(db, 'notifications'), where('citizen_id', '==', citizenId));
  const snapshot = await getDocs(q);
  const notifs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  notifs.sort((a, b) => {
    const aTime = a.created_at?.toMillis?.() || 0;
    const bTime = b.created_at?.toMillis?.() || 0;
    return bTime - aTime;
  });
  return notifs;
}

export async function markNotificationRead(notificationId) {
  await updateDoc(doc(db, 'notifications', notificationId), { is_read: true });
}

export async function markAllNotificationsRead(citizenId) {
  const q = query(
    collection(db, 'notifications'),
    where('citizen_id', '==', citizenId),
    where('is_read', '==', false)
  );
  const snapshot = await getDocs(q);
  const updates = snapshot.docs.map((d) =>
    updateDoc(doc(db, 'notifications', d.id), { is_read: true })
  );
  await Promise.all(updates);
}

export function subscribeToNotifications(citizenId, callback) {
  const q = query(collection(db, 'notifications'), where('citizen_id', '==', citizenId));
  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    notifs.sort((a, b) => {
      const aTime = a.created_at?.toMillis?.() || 0;
      const bTime = b.created_at?.toMillis?.() || 0;
      return bTime - aTime;
    });
    callback(notifs);
  });
}

// ============================================================
// HOME AFFAIRS
// ============================================================
export async function getPendingVerifications() {
  const q = query(
    collection(db, 'citizens'),
    where('verified_by_home_affairs', '==', false),
    where('type', '==', 'citizen')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ============================================================
// APPOINTMENTS
// ============================================================
export const BRANCHES = [
  'Maseru',
  'Leribe',
  'Mafeteng',
  'Berea',
  "Mohale's Hoek",
];

export const DISTRICTS = [
  'Berea',
  'Butha-Buthe',
  'Leribe',
  'Mafeteng',
  'Maseru',
  "Mohale's Hoek",
  'Mokhotlong',
  "Qacha's Nek",
  'Quthing',
  'Thaba-Tseka',
];

export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00',
  '13:00', '14:00', '15:00', '16:00',
];

export const APPOINTMENT_CAPACITY = { PER_SLOT: 1, PER_DAY: 50 };

export function getAvailableDates() {
  const dates = [];
  const today = new Date();
  let offset = 1;
  while (dates.length < 14) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const day = d.getDay();
    if (day !== 0 && day !== 6) dates.push(d.toISOString().split('T')[0]);
    offset++;
  }
  return dates;
}

export async function bookAppointment({
  citizen_id, citizen_name, citizen_national_id,
  application_id, application_reference,
  service_type, department_id, branch, date, time_slot,
}) {
  const slotQuery = query(
    collection(db, 'appointments'),
    where('department_id', '==', department_id),
    where('branch', '==', branch),
    where('date', '==', date),
    where('time_slot', '==', time_slot),
    where('status', '==', 'booked')
  );
  const slotSnap = await getDocs(slotQuery);
  if (slotSnap.size >= APPOINTMENT_CAPACITY.PER_SLOT) {
    throw new Error(`The ${time_slot} slot is full. Please choose another time.`);
  }

  const dayQuery = query(
    collection(db, 'appointments'),
    where('department_id', '==', department_id),
    where('branch', '==', branch),
    where('date', '==', date),
    where('status', '==', 'booked')
  );
  const daySnap = await getDocs(dayQuery);
  if (daySnap.size >= APPOINTMENT_CAPACITY.PER_DAY) {
    throw new Error(`${branch} is fully booked on ${date}. Please choose another date.`);
  }

  const docRef = await addDoc(collection(db, 'appointments'), {
    citizen_id, citizen_name, citizen_national_id,
    application_id: application_id || null,
    application_reference: application_reference || null,
    service_type, department_id, branch, date, time_slot,
    status: 'booked',
    created_at: serverTimestamp(),
  });

  await createNotification(citizen_id, {
    title: 'Appointment confirmed',
    message: `Your appointment for ${service_type} at ${branch} on ${date} at ${time_slot} is confirmed.`,
    type: 'success',
  });

  return { id: docRef.id };
}

export async function getMyAppointments(citizenId) {
  const q = query(collection(db, 'appointments'), where('citizen_id', '==', citizenId));
  const snapshot = await getDocs(q);
  const appts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  appts.sort((a, b) => new Date(`${a.date}T${a.time_slot}`).getTime() - new Date(`${b.date}T${b.time_slot}`).getTime());
  return appts;
}

export async function getDepartmentAppointments(departmentId) {
  const q = query(
    collection(db, 'appointments'),
    where('department_id', '==', departmentId),
    where('status', '==', 'booked')
  );
  const snapshot = await getDocs(q);
  const appts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  appts.sort((a, b) => new Date(`${a.date}T${a.time_slot}`).getTime() - new Date(`${b.date}T${b.time_slot}`).getTime());
  return appts;
}

export async function getBookedSlots(departmentId, branch, date) {
  const q = query(
    collection(db, 'appointments'),
    where('department_id', '==', departmentId),
    where('branch', '==', branch),
    where('date', '==', date),
    where('status', '==', 'booked')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data().time_slot);
}

export async function getSlotAvailability(departmentId, branch, date) {
  const q = query(
    collection(db, 'appointments'),
    where('department_id', '==', departmentId),
    where('branch', '==', branch),
    where('date', '==', date),
    where('status', '==', 'booked')
  );
  const snapshot = await getDocs(q);
  const counts = {};
  TIME_SLOTS.forEach((slot) => { counts[slot] = 0; });
  snapshot.docs.forEach((d) => {
    const slot = d.data().time_slot;
    if (counts[slot] !== undefined) counts[slot] += 1;
  });
  const availability = {};
  TIME_SLOTS.forEach((slot) => {
    const booked = counts[slot];
    availability[slot] = {
      booked,
      remaining: Math.max(0, APPOINTMENT_CAPACITY.PER_SLOT - booked),
      isFull: booked >= APPOINTMENT_CAPACITY.PER_SLOT,
    };
  });
  return {
    totalBooked: snapshot.size,
    isDayFull: snapshot.size >= APPOINTMENT_CAPACITY.PER_DAY,
    availability,
  };
}

export async function isDateFull(departmentId, branch, date) {
  const q = query(
    collection(db, 'appointments'),
    where('department_id', '==', departmentId),
    where('branch', '==', branch),
    where('date', '==', date),
    where('status', '==', 'booked')
  );
  const snapshot = await getDocs(q);
  return snapshot.size >= APPOINTMENT_CAPACITY.PER_DAY;
}

export async function cancelAppointment(appointmentId) {
  await updateDoc(doc(db, 'appointments', appointmentId), { status: 'cancelled' });
}

// ============================================================
// ANALYTICS
// ============================================================
export async function getDepartmentAnalytics(departmentId) {
  const q = query(collection(db, 'applications'), where('department_id', '==', departmentId));
  const snapshot = await getDocs(q);
  const apps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  const statusCounts = { pending: 0, processing: 0, approved: 0, rejected: 0, completed: 0 };
  const byDay = {};
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push(key);
    byDay[key] = 0;
  }

  const byService = {};
  const processingTimes = [];

  apps.forEach((app) => {
    if (statusCounts[app.status] !== undefined) statusCounts[app.status] += 1;

    const submittedMs = app.submitted_at?.toMillis?.();
    if (submittedMs) {
      const key = new Date(submittedMs).toISOString().split('T')[0];
      if (byDay[key] !== undefined) byDay[key] += 1;
    }

    const svc = app.service_type || 'Other';
    byService[svc] = (byService[svc] || 0) + 1;

    const completedMs = app.completed_at?.toMillis?.();
    if (submittedMs && completedMs) processingTimes.push((completedMs - submittedMs) / (1000 * 60 * 60));
  });

  const total = apps.length;
  const processedCount = statusCounts.approved + statusCounts.rejected + statusCounts.completed;
  const avgProcessingHours =
    processingTimes.length > 0 ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length : 0;
  const approvalRate =
    statusCounts.approved + statusCounts.rejected > 0
      ? (statusCounts.approved / (statusCounts.approved + statusCounts.rejected)) * 100
      : 0;

  const dailyData = days.map((day) => ({
    date: day,
    label: new Date(day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    count: byDay[day] || 0,
  }));

  const statusData = [
    { name: 'Pending', value: statusCounts.pending, fill: '#ffcc00' },
    { name: 'Processing', value: statusCounts.processing, fill: '#0066cc' },
    { name: 'Approved', value: statusCounts.approved, fill: '#006600' },
    { name: 'Rejected', value: statusCounts.rejected, fill: '#cc0000' },
    { name: 'Completed', value: statusCounts.completed, fill: '#666666' },
  ].filter((s) => s.value > 0);

  const topServices = Object.entries(byService)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { total, statusCounts, processedCount, avgProcessingHours, approvalRate, dailyData, statusData, topServices };
}

// ============================================================
// CERTIFICATES
// ============================================================
export async function getApplicationByReference(reference) {
  const q = query(collection(db, 'applications'), where('application_reference', '==', reference));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docData = snapshot.docs[0];
  return { id: docData.id, ...docData.data() };
}

export function getCertificateVerifyUrl(reference) {
  let baseUrl;
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const networkIp = process.env.REACT_APP_NETWORK_IP;
    const port = window.location.port || '3000';
    if (networkIp && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      baseUrl = `http://${networkIp}:${port}`;
    } else {
      baseUrl = origin;
    }
  } else {
    baseUrl = 'https://unified-citizen-profile.web.app';
  }
  return `${baseUrl}/verify/${reference}`;
}

export function isCertificateValid(application) {
  if (!application) return false;
  if (application.status !== 'approved' && application.status !== 'completed') return false;
  return true;
}

export function getCertificateExpiry(application) {
  if (!application?.completed_at?.toDate) return null;
  const serviceType = application.service_type || '';
  if (serviceType.includes('Tax Clearance')) {
    const expiry = application.completed_at.toDate();
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry;
  }
  if (serviceType.includes('Police Clearance')) {
    const expiry = application.completed_at.toDate();
    expiry.setMonth(expiry.getMonth() + 6);
    return expiry;
  }
  if (serviceType.includes('Roadworthy')) {
    const expiry = application.completed_at.toDate();
    expiry.setMonth(expiry.getMonth() + 6);
    return expiry;
  }
  return null;
}

// ============================================================
// TIN REGISTRATION
// ============================================================
export async function getMyTinRegistration(citizenId) {
  const q = query(collection(db, 'tin_registrations'), where('citizen_id', '==', citizenId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function submitTinRegistration({
  citizen_id,
  citizen_name,
  national_id,
  taxpayer_type,
  business_name,
  business_type,
  traders_license_number,
  has_employment_contract,
  has_traders_license,
  employment_contract_url,
  traders_licence_url,
  business_registration_url,
  phone_number,
  email,
}) {
  const existing = await getMyTinRegistration(citizen_id);
  if (existing) throw new Error('You have already submitted a TIN registration');

  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const reference = `TIN-REQ-${year}-${random}`;

  const docRef = await addDoc(collection(db, 'tin_registrations'), {
    registration_reference: reference,
    citizen_id,
    citizen_name,
    national_id,
    taxpayer_type,
    business_name: business_name || '',
    business_type: business_type || '',
    traders_license_number: traders_license_number || '',
    has_employment_contract: has_employment_contract || false,
    has_traders_license: has_traders_license || false,
    employment_contract_url: employment_contract_url || null,
    traders_licence_url: traders_licence_url || null,
    business_registration_url: business_registration_url || null,
    phone_number: phone_number || '',
    email: email || '',
    status: 'pending',
    assigned_tin: null,
    submitted_at: serverTimestamp(),
    approved_at: null,
    approved_by: null,
    rejection_reason: '',
    notes: '',
  });

  await createNotification(citizen_id, {
    title: 'TIN Registration Submitted',
    message: `Your TIN registration (${reference}) has been received. RSL will review it within 3 business days.`,
    type: 'info',
  });

  return { id: docRef.id, reference };
}
export async function getTinRegistrations(status = 'all') {
  const constraints = [];
  if (status !== 'all') constraints.push(where('status', '==', status));
  const q = query(collection(db, 'tin_registrations'), ...constraints);
  const snapshot = await getDocs(q);
  const registrations = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  registrations.sort((a, b) => {
    const aTime = a.submitted_at?.toMillis?.() || 0;
    const bTime = b.submitted_at?.toMillis?.() || 0;
    return bTime - aTime;
  });
  return registrations;
}

export async function approveTinRegistration(registrationId, staffId) {
  const regSnap = await getDoc(doc(db, 'tin_registrations', registrationId));
  if (!regSnap.exists()) throw new Error('Registration not found');
  const reg = regSnap.data();

  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  const assignedTin = `TIN-${year}-${random}`;

  await updateDoc(doc(db, 'tin_registrations', registrationId), {
    status: 'approved', assigned_tin: assignedTin,
    approved_at: serverTimestamp(), approved_by: staffId,
  });

  await updateDoc(doc(db, 'citizens', reg.citizen_id), {
    tin: assignedTin, tin_status: 'approved',
    tin_type: reg.taxpayer_type, tin_approved_date: serverTimestamp(),
  });

  await createNotification(reg.citizen_id, {
    title: 'TIN Registration Approved',
    message: `Your Tax Identification Number is: ${assignedTin}.`,
    type: 'success',
  });

  return { assignedTin };
}

export async function rejectTinRegistration(registrationId, staffId, reason) {
  const regSnap = await getDoc(doc(db, 'tin_registrations', registrationId));
  if (!regSnap.exists()) throw new Error('Registration not found');
  const reg = regSnap.data();
  await updateDoc(doc(db, 'tin_registrations', registrationId), {
    status: 'rejected', rejection_reason: reason,
    approved_by: staffId, approved_at: serverTimestamp(),
  });
  await createNotification(reg.citizen_id, {
    title: 'TIN Registration Rejected',
    message: `Your TIN registration was rejected. Reason: ${reason}`,
    type: 'error',
  });
}

export async function requestTinInfo(registrationId, staffId, note) {
  const regSnap = await getDoc(doc(db, 'tin_registrations', registrationId));
  if (!regSnap.exists()) throw new Error('Registration not found');
  const reg = regSnap.data();
  await updateDoc(doc(db, 'tin_registrations', registrationId), {
    status: 'processing', notes: note, approved_by: staffId,
  });
  await createNotification(reg.citizen_id, {
    title: 'TIN Registration - More Info Needed',
    message: `RSL needs more information: ${note}`,
    type: 'warning',
  });
}

// ============================================================
// PENSION FUND
// ============================================================
export async function getMyFundRecord(citizenId) {
  const docSnap = await getDoc(doc(db, 'pension_fund_records', citizenId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

export async function createFundRecord(citizenId, data) {
  const totalMember = data.total_member_contributions || 0;
  const totalEmployer = data.total_employer_contributions || 0;
  const investmentReturns = data.investment_returns || 0;
  const totalFundCredit = totalMember + totalEmployer + investmentReturns;

  await setDoc(doc(db, 'pension_fund_records', citizenId), {
    citizen_id: citizenId,
    member_number: data.member_number || `PF-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
    total_member_contributions: totalMember,
    total_employer_contributions: totalEmployer,
    investment_returns: investmentReturns,
    total_fund_credit: totalFundCredit,
    months_of_service: data.months_of_service || 0,
    monthly_contribution: data.monthly_contribution || 0,
    employer_name: data.employer_name || '',
    last_contribution_date: data.last_contribution_date || serverTimestamp(),
    employment_branch: data.employment_branch || 'Public Service',
    retirement_age: RETIREMENT_AGES[data.employment_branch] || 60,
    verification_status: 'pending',
    submitted_for_verification_at: serverTimestamp(),
    verified_by: null, verified_at: null, verification_notes: '',
    updated_at: serverTimestamp(),
  });
}

export async function getPendingFundRecords() {
  const q = query(collection(db, 'pension_fund_records'), where('verification_status', '==', 'pending'));
  const snapshot = await getDocs(q);
  const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  records.sort((a, b) => {
    const aTime = a.submitted_for_verification_at?.toMillis?.() || 0;
    const bTime = b.submitted_for_verification_at?.toMillis?.() || 0;
    return bTime - aTime;
  });
  return records;
}

export async function updateFundRecordVerification(recordId, action, staffId, reason = '') {
  const statusMap = { approve: 'verified', reject: 'rejected', 'request-info': 'needs_info' };
  const newStatus = statusMap[action];
  if (!newStatus) throw new Error('Invalid action: ' + action);

  await updateDoc(doc(db, 'pension_fund_records', recordId), {
    verification_status: newStatus,
    verified_by: staffId,
    verified_at: serverTimestamp(),
    verification_notes: reason || '',
  });

  const recSnap = await getDoc(doc(db, 'pension_fund_records', recordId));
  if (recSnap.exists()) {
    const rec = recSnap.data();
    await createNotification(rec.citizen_id, {
      title: `Pension Fund Record ${newStatus}`,
      message:
        newStatus === 'verified'
          ? 'Your pension fund record has been verified.'
          : newStatus === 'rejected'
          ? `Your pension fund record was rejected. Reason: ${reason}`
          : `Pensions Department requests more information: ${reason}`,
      type: newStatus === 'verified' ? 'success' : newStatus === 'rejected' ? 'error' : 'warning',
    });
  }
}

export async function submitPensionClaim({
  citizen_id, citizen_name, national_id, claim_type,
  documents, additional_details, employer_name,
}) {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const prefix = {
    retirement: 'PEN-RET', withdrawal: 'PEN-WD',
    death: 'PEN-DTH', ill_health: 'PEN-ILL',
  }[claim_type] || 'PEN';
  const reference = `${prefix}-${year}-${random}`;

  const processingDays = claim_type === CLAIM_TYPES.RETIREMENT
    ? PENSION_RULES.RETIREMENT_PROCESSING_DAYS
    : PENSION_RULES.WITHDRAWAL_PROCESSING_DAYS;

  const expectedCompletion = new Date();
  expectedCompletion.setDate(expectedCompletion.getDate() + processingDays);

  const docRef = await addDoc(collection(db, 'pension_claims'), {
    claim_reference: reference, citizen_id, citizen_name, national_id, claim_type,
    status: CLAIM_STATUS.PENDING, step: 1, documents,
    additional_details: additional_details || {},
    employer_name: employer_name || '',
    submitted_at: serverTimestamp(),
    expected_completion: Timestamp.fromDate(expectedCompletion),
    approved_at: null, approved_by: null,
    rejection_reason: '', notes: '',
  });

  await createNotification(citizen_id, {
    title: 'Pension Claim Submitted',
    message: `Your ${claim_type} claim (${reference}) has been received. Processing: ${processingDays} days.`,
    type: 'info',
  });

  return { id: docRef.id, reference };
}

export async function getMyPensionClaims(citizenId) {
  const q = query(collection(db, 'pension_claims'), where('citizen_id', '==', citizenId));
  const snapshot = await getDocs(q);
  const claims = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  claims.sort((a, b) => {
    const aTime = a.submitted_at?.toMillis?.() || 0;
    const bTime = b.submitted_at?.toMillis?.() || 0;
    return bTime - aTime;
  });
  return claims;
}

export async function getPensionClaimByReference(reference) {
  const q = query(collection(db, 'pension_claims'), where('claim_reference', '==', reference));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function getPensionClaims(status = 'all') {
  const constraints = [];
  if (status !== 'all') constraints.push(where('status', '==', status));
  const q = query(collection(db, 'pension_claims'), ...constraints);
  const snapshot = await getDocs(q);
  const claims = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  claims.sort((a, b) => {
    const aTime = a.submitted_at?.toMillis?.() || 0;
    const bTime = b.submitted_at?.toMillis?.() || 0;
    return bTime - aTime;
  });
  return claims;
}

export async function updatePensionClaimStatus(claimId, action, staffId, reason = '') {
  const statusMap = {
    approve: CLAIM_STATUS.APPROVED,
    reject: CLAIM_STATUS.REJECTED,
    'request-info': CLAIM_STATUS.PROCESSING,
    'mark-audit': CLAIM_STATUS.AUDIT,
    'mark-complete': CLAIM_STATUS.COMPLETED,
  };

  const newStatus = statusMap[action];
  if (!newStatus) throw new Error('Invalid action: ' + action);

  const updateData = {
    status: newStatus,
    approved_by: staffId,
    updated_at: serverTimestamp(),
  };

  if (action === 'reject') updateData.rejection_reason = reason;
  else if (action === 'request-info') updateData.notes = reason;
  else updateData.notes = reason || '';

  if (newStatus === CLAIM_STATUS.APPROVED || newStatus === CLAIM_STATUS.REJECTED) {
    updateData.approved_at = serverTimestamp();
  }
  if (newStatus === CLAIM_STATUS.COMPLETED) {
    updateData.completed_at = serverTimestamp();
  }

  await updateDoc(doc(db, 'pension_claims', claimId), updateData);

  const claimSnap = await getDoc(doc(db, 'pension_claims', claimId));
  if (claimSnap.exists()) {
    const claim = claimSnap.data();
    await createNotification(claim.citizen_id, {
      title: `Pension Claim ${newStatus}`,
      message: `Your ${claim.claim_type} claim (${claim.claim_reference}) is now ${newStatus}. ${reason || ''}`,
      type: newStatus === 'approved' ? 'success' : newStatus === 'rejected' ? 'error' : 'info',
    });
  }
}

export async function getMyBeneficiaries(citizenId) {
  const q = query(collection(db, 'pension_beneficiaries', citizenId, 'list'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addBeneficiary(citizenId, beneficiary) {
  const docRef = await addDoc(collection(db, 'pension_beneficiaries', citizenId, 'list'), {
    full_name: beneficiary.full_name,
    relationship: beneficiary.relationship,
    national_id: beneficiary.national_id || '',
    allocation_percentage: beneficiary.allocation_percentage || 0,
    date_of_birth: beneficiary.date_of_birth || null,
    added_at: serverTimestamp(),
  });
  return { id: docRef.id };
}

export async function updateBeneficiary(citizenId, beneficiaryId, updates) {
  await updateDoc(doc(db, 'pension_beneficiaries', citizenId, 'list', beneficiaryId), updates);
}

export async function deleteBeneficiary(citizenId, beneficiaryId) {
  await deleteDoc(doc(db, 'pension_beneficiaries', citizenId, 'list', beneficiaryId));
}

export async function saveProjection(citizenId, projection) {
  const docRef = await addDoc(collection(db, 'pension_projections'), {
    citizen_id: citizenId, ...projection, created_at: serverTimestamp(),
  });
  return { id: docRef.id };
}

export function calculateProjection({
  currentFundCredit, currentAge, retirementAge,
  monthlyContribution, annualReturnRate, annualSalaryGrowth,
}) {
  const yearsToRetirement = retirementAge - currentAge;
  if (yearsToRetirement <= 0) return null;

  const fvCurrent = currentFundCredit * Math.pow(1 + annualReturnRate / 100, yearsToRetirement);

  let fvContributions = 0;
  let contribution = monthlyContribution;
  for (let year = 0; year < yearsToRetirement; year++) {
    for (let month = 0; month < 12; month++) {
      const remainingYears = yearsToRetirement - year - (month / 12);
      fvContributions += contribution * Math.pow(1 + annualReturnRate / 100, remainingYears);
    }
    contribution *= (1 + annualSalaryGrowth / 100);
  }

  const projectedFundCredit = fvCurrent + fvContributions;
  const maxLumpSum = projectedFundCredit * (PENSION_RULES.MAX_LUMP_SUM_PERCENT / 100);
  const annuityBalance = projectedFundCredit - maxLumpSum;
  const estimatedMonthlyAnnuity = (annuityBalance * 0.05) / 12;

  return {
    yearsToRetirement,
    projectedFundCredit: Math.round(projectedFundCredit),
    maxLumpSum: Math.round(maxLumpSum),
    annuityBalance: Math.round(annuityBalance),
    estimatedMonthlyAnnuity: Math.round(estimatedMonthlyAnnuity),
  };
}

// ============================================================
// CITIZEN MASTER DATA
// ============================================================
const MASTER_FIELD_WHITELIST = [
  'bank_account', 'employer_name', 'business_name', 'business_type',
  'traders_license_number', 'employment_branch', 'months_of_service',
  'monthly_contribution', 'phone_number', 'email', 'residential_address',
];

export async function saveCitizenMasterData(uid, fields = {}) {
  if (!uid) return;
  const update = {};
  MASTER_FIELD_WHITELIST.forEach((key) => {
    if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
      update[key] = fields[key];
    }
  });
  if (Object.keys(update).length === 0) return;
  update.master_data_updated_at = serverTimestamp();
  await updateDoc(doc(db, 'citizens', uid), update);
}

export async function getCitizenMasterData(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'citizens', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ============================================================
// CITIZEN SEARCH
// ============================================================
export async function searchCitizens(rawQuery) {
  const q = (rawQuery || '').trim();
  if (!q || q.length < 2) return [];
  const results = new Map();
  const upper = q.toUpperCase();
  const namePrefix = q.charAt(0).toUpperCase() + q.slice(1);
  const tasks = [];

  tasks.push(getDocs(query(collection(db, 'citizens'), where('national_id', '==', q)))
    .then((snap) => snap.docs.forEach((d) => results.set(d.id, { id: d.id, ...d.data() }))).catch(() => {}));
  tasks.push(getDocs(query(collection(db, 'citizens'), where('tin', '==', upper)))
    .then((snap) => snap.docs.forEach((d) => results.set(d.id, { id: d.id, ...d.data() }))).catch(() => {}));
  tasks.push(getDocs(query(collection(db, 'citizens'), where('passport_number', '==', upper)))
    .then((snap) => snap.docs.forEach((d) => results.set(d.id, { id: d.id, ...d.data() }))).catch(() => {}));
  tasks.push(getDocs(query(collection(db, 'citizens'), where('phone_number', '==', q)))
    .then((snap) => snap.docs.forEach((d) => results.set(d.id, { id: d.id, ...d.data() }))).catch(() => {}));
  tasks.push(getDocs(query(collection(db, 'citizens'),
    where('full_name', '>=', namePrefix),
    where('full_name', '<=', namePrefix + '\uf8ff')))
    .then((snap) => snap.docs.forEach((d) => results.set(d.id, { id: d.id, ...d.data() }))).catch(() => {}));
  tasks.push(getDocs(query(collection(db, 'tin_registrations'), where('registration_reference', '==', upper)))
    .then(async (snap) => {
      for (const d of snap.docs) {
        const reg = d.data();
        if (reg.citizen_id && !results.has(reg.citizen_id)) {
          const cSnap = await getDoc(doc(db, 'citizens', reg.citizen_id));
          if (cSnap.exists()) results.set(cSnap.id, { id: cSnap.id, ...cSnap.data() });
        }
      }
    }).catch(() => {}));
  tasks.push(getDocs(query(collection(db, 'tin_registrations'), where('assigned_tin', '==', upper)))
    .then(async (snap) => {
      for (const d of snap.docs) {
        const reg = d.data();
        if (reg.citizen_id && !results.has(reg.citizen_id)) {
          const cSnap = await getDoc(doc(db, 'citizens', reg.citizen_id));
          if (cSnap.exists()) results.set(cSnap.id, { id: cSnap.id, ...cSnap.data() });
        }
      }
    }).catch(() => {}));

  await Promise.all(tasks);
  return Array.from(results.values());
}

export async function getCitizenFullProfile(uid) {
  if (!uid) return null;
  const [citizenSnap, fundSnap, claimsSnap, appsSnap, tinsSnap] = await Promise.all([
    getDoc(doc(db, 'citizens', uid)),
    getDoc(doc(db, 'pension_fund_records', uid)),
    getDocs(query(collection(db, 'pension_claims'), where('citizen_id', '==', uid))),
    getDocs(query(collection(db, 'applications'), where('citizen_id', '==', uid))),
    getDocs(query(collection(db, 'tin_registrations'), where('citizen_id', '==', uid))),
  ]);
  const citizen = citizenSnap.exists() ? { id: citizenSnap.id, ...citizenSnap.data() } : null;
  const fundRecord = fundSnap.exists() ? { id: fundSnap.id, ...fundSnap.data() } : null;
  const claims = claimsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const applications = appsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const tins = tinsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { citizen, fundRecord, claims, applications, tins };
}

// ============================================================
// APPLICATION REFERENCE GENERATOR
// ============================================================
export function generateApplicationReference(prefix) {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// ============================================================
// PENSIONS — unified work queue
// Merges pension_claims and applications (dept 4) into a
// single list of work items for the Pensions staff queue.
// ============================================================
export async function getAllPensionWork() {
  const [claimsSnap, appsSnap] = await Promise.all([
    getDocs(collection(db, 'pension_claims')),
    getDocs(
      query(
        collection(db, 'applications'),
        where('department_id', '==', DEPARTMENTS.PENSIONS)
      )
    ),
  ]);

  const claims = claimsSnap.docs.map((d) => ({
    id: d.id,
    _type: 'claim',
    _ref: d.data().claim_reference,
    _submitted: d.data().submitted_at,
    ...d.data(),
  }));

  const applications = appsSnap.docs.map((d) => ({
    id: d.id,
    _type: 'application',
    _ref: d.data().application_reference,
    _submitted: d.data().submitted_at,
    ...d.data(),
  }));

  const merged = [...claims, ...applications];
  merged.sort((a, b) => {
    const aTime = a._submitted?.toMillis?.() || 0;
    const bTime = b._submitted?.toMillis?.() || 0;
    return bTime - aTime;
  });

  return merged;
}
// ============================================================
// CITIZEN PHOTO — Cloudinary upload URLs
// ============================================================


// ============================================================
// CITIZEN PHOTO + SUPPORTING DOCUMENT
// Uploaded to Cloudinary at registration or on the dashboard.
// ============================================================
export async function saveCitizenPhoto(uid, photo_url) {
  if (!uid || !photo_url) return;
  await updateDoc(doc(db, 'citizens', uid), {
    photo_url,
    photo_updated_at: serverTimestamp(),
  });
}

export async function saveCitizenDocument(uid, { document_url, document_type }) {
  if (!uid || !document_url) return;
  await updateDoc(doc(db, 'citizens', uid), {
    id_document_url: document_url,
    id_document_type: document_type || 'Other',
    id_document_updated_at: serverTimestamp(),
  });
}