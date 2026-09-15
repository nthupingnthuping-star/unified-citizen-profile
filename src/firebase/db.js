import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { calculateAge, ELIGIBILITY_RULES } from './eligibility';

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
// CITIZEN — GET BY NATIONAL ID
// ============================================================
export async function getCitizenByNationalId(nationalId) {
  const q = query(
    collection(db, 'citizens'),
    where('national_id', '==', nationalId)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docData = snapshot.docs[0];
  return { id: docData.id, ...docData.data() };
}

// ============================================================
// CITIZEN — GET BY UID
// ============================================================
export async function getCitizenById(uid) {
  const docSnap = await getDoc(doc(db, 'citizens', uid));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

// ============================================================
// CITIZEN — VERIFY (Home Affairs only)
// ============================================================
export async function verifyCitizen(citizenId, staffId) {
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

// ============================================================
// CITIZEN — UPDATE CONTACT
// ============================================================
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

  const docRef = await addDoc(collection(db, 'applications'), {
    application_reference: reference,
    citizen_id,
    citizen_name,
    citizen_national_id,
    department_id,
    service_type,
    status: 'pending',
    application_data,
    submitted_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    completed_at: null,
    processed_by: null,
    notes: '',
    rejection_reason: '',
  });

  await createNotification(citizen_id, {
    title: 'Application submitted',
    message: `Your ${service_type} application has been received. Reference: ${reference}`,
    type: 'info',
  });

  return { id: docRef.id, reference };
}

// ============================================================
// APPLICATIONS — GET MY APPLICATIONS
// ============================================================
export async function getMyApplications(citizenId) {
  const q = query(
    collection(db, 'applications'),
    where('citizen_id', '==', citizenId)
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

// ============================================================
// APPLICATIONS — GET FOR DEPARTMENT
// ============================================================
export async function getDepartmentApplications(departmentId, status = 'pending') {
  const constraints = [where('department_id', '==', departmentId)];
  if (status !== 'all') {
    constraints.push(where('status', '==', status));
  }

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
  const q = query(
    collection(db, 'access_logs'),
    where('citizen_id', '==', citizenId)
  );
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
  const q = query(
    collection(db, 'notifications'),
    where('citizen_id', '==', citizenId)
  );
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
  await updateDoc(doc(db, 'notifications', notificationId), {
    is_read: true,
  });
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
  const q = query(
    collection(db, 'notifications'),
    where('citizen_id', '==', citizenId)
  );

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
// HOME AFFAIRS — PENDING VERIFICATIONS
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

export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00',
  '13:00', '14:00', '15:00', '16:00',
];

// ⚠️ TEMPORARY: PER_SLOT is 1 for testing.
export const APPOINTMENT_CAPACITY = {
  PER_SLOT: 1,
  PER_DAY: 50,
};

export function getAvailableDates() {
  const dates = [];
  const today = new Date();
  let offset = 1;
  while (dates.length < 14) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(d.toISOString().split('T')[0]);
    }
    offset++;
  }
  return dates;
}

export async function bookAppointment({
  citizen_id,
  citizen_name,
  citizen_national_id,
  application_id,
  application_reference,
  service_type,
  department_id,
  branch,
  date,
  time_slot,
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
    throw new Error(
      `The ${time_slot} slot is full (${APPOINTMENT_CAPACITY.PER_SLOT} max). Please choose another time.`
    );
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
    throw new Error(
      `${branch} is fully booked on ${date} (${APPOINTMENT_CAPACITY.PER_DAY} max per day). Please choose another date.`
    );
  }

  const docRef = await addDoc(collection(db, 'appointments'), {
    citizen_id,
    citizen_name,
    citizen_national_id,
    application_id: application_id || null,
    application_reference: application_reference || null,
    service_type,
    department_id,
    branch,
    date,
    time_slot,
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
  const q = query(
    collection(db, 'appointments'),
    where('citizen_id', '==', citizenId)
  );
  const snapshot = await getDocs(q);

  const appts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  appts.sort((a, b) => {
    const aTime = new Date(`${a.date}T${a.time_slot}`).getTime();
    const bTime = new Date(`${b.date}T${b.time_slot}`).getTime();
    return aTime - bTime;
  });
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
  appts.sort((a, b) => {
    const aTime = new Date(`${a.date}T${a.time_slot}`).getTime();
    const bTime = new Date(`${b.date}T${b.time_slot}`).getTime();
    return aTime - bTime;
  });
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
  TIME_SLOTS.forEach((slot) => {
    counts[slot] = 0;
  });

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
  await updateDoc(doc(db, 'appointments', appointmentId), {
    status: 'cancelled',
  });
}

// ============================================================
// ANALYTICS
// ============================================================
export async function getDepartmentAnalytics(departmentId) {
  const q = query(
    collection(db, 'applications'),
    where('department_id', '==', departmentId)
  );
  const snapshot = await getDocs(q);

  const apps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  const statusCounts = {
    pending: 0,
    processing: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
  };

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
    if (statusCounts[app.status] !== undefined) {
      statusCounts[app.status] += 1;
    }

    const submittedMs = app.submitted_at?.toMillis?.();
    if (submittedMs) {
      const key = new Date(submittedMs).toISOString().split('T')[0];
      if (byDay[key] !== undefined) byDay[key] += 1;
    }

    const svc = app.service_type || 'Other';
    byService[svc] = (byService[svc] || 0) + 1;

    const completedMs = app.completed_at?.toMillis?.();
    if (submittedMs && completedMs) {
      const hours = (completedMs - submittedMs) / (1000 * 60 * 60);
      processingTimes.push(hours);
    }
  });

  const total = apps.length;
  const processedCount =
    statusCounts.approved + statusCounts.rejected + statusCounts.completed;

  const avgProcessingHours =
    processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

  const approvalRate =
    statusCounts.approved + statusCounts.rejected > 0
      ? (statusCounts.approved /
          (statusCounts.approved + statusCounts.rejected)) *
        100
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

  return {
    total,
    statusCounts,
    processedCount,
    avgProcessingHours,
    approvalRate,
    dailyData,
    statusData,
    topServices,
  };
}

// ============================================================
// CERTIFICATES — PUBLIC VERIFICATION
// ============================================================
export async function getApplicationByReference(reference) {
  const q = query(
    collection(db, 'applications'),
    where('application_reference', '==', reference)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docData = snapshot.docs[0];
  return { id: docData.id, ...docData.data() };
}

// ============================================================
// CERTIFICATE VERIFY URL
// ============================================================
// Uses the network IP from .env when running on localhost,
// so phones on the same hotspot can reach the dev server.
// On production (Firebase Hosting), it uses the actual domain.
// ============================================================
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

  const url = `${baseUrl}/verify/${reference}`;
  console.log('📱 QR will encode:', url);
  return url;
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

  return null;
}