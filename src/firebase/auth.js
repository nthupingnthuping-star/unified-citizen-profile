import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

// ============================================================
// CITIZEN REGISTRATION
// ============================================================
export async function registerCitizen({
  email,
  password,
  national_id,
  full_name,
  date_of_birth,
  gender,
  residential_address,
  phone_number,
}) {
  console.log('📝 Registering citizen:', email);

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: full_name });

  await setDoc(doc(db, 'citizens', user.uid), {
    uid: user.uid,
    email,
    national_id,
    full_name,
    date_of_birth,
    gender,
    residential_address: residential_address || '',
    phone_number: phone_number || '',
    citizenship_status: 'Citizen',
    verified_by_home_affairs: false,
    verification_date: null,
    verified_by: null,
    type: 'citizen',
    department_id: null,
    role: null,
    is_active: true,
    created_at: serverTimestamp(),
  });

  // Send verification email
  try {
    await sendEmailVerification(user);
    console.log('✉️ Verification email sent to', email);
  } catch (err) {
    console.error('Failed to send verification email:', err);
  }

  console.log('✅ Citizen registered:', user.uid);
  return user;
}

// ============================================================
// CITIZEN LOGIN — requires verified email
// ============================================================
export async function loginCitizen(email, password) {
  console.log('🔐 Citizen login:', email);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // STRICT: block unverified citizen accounts
  if (!user.emailVerified) {
    await signOut(auth);
    const err = new Error(
      'Please verify your email address before logging in. Check your inbox for the verification link.'
    );
    err.code = 'auth/email-not-verified';
    throw err;
  }

  console.log('✅ Citizen logged in:', user.uid);
  return user;
}

// ============================================================
// RESEND VERIFICATION EMAIL
// ============================================================
export async function resendVerificationEmail(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (user.emailVerified) {
    await signOut(auth);
    throw new Error('This email is already verified. You can log in normally.');
  }

  await sendEmailVerification(user);
  await signOut(auth);
  return true;
}

// ============================================================
// STAFF LOGIN — no email verification required
// ============================================================
export async function loginStaff(email, password) {
  console.log('🔐 Staff login:', email);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const staffDoc = await getDoc(doc(db, 'citizens', user.uid));

  if (!staffDoc.exists()) {
    await signOut(auth);
    throw new Error('Staff account not found');
  }

  const data = staffDoc.data();
  if (data.type !== 'staff') {
    await signOut(auth);
    throw new Error('This account is not a staff account');
  }

  // Staff accounts are created by administrators, so they do not require
  // email verification. Only self-registered citizens do.

  console.log('✅ Staff logged in:', user.uid, '| Dept:', data.department_id);
  return { user, staffData: data };
}

// ============================================================
// LOGOUT
// ============================================================
export async function logout() {
  console.log('🚪 Logging out');
  await signOut(auth);
}

// ============================================================
// GET USER PROFILE
// ============================================================
export async function getUserProfile(uid) {
  const docRef = doc(db, 'citizens', uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.warn('⚠️ No profile found for:', uid);
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() };
}

// ============================================================
// AUTH STATE LISTENER
// ============================================================
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}