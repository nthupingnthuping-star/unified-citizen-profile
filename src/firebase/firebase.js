import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBBXJZtvr7veXokmZbXmGAMR31hwEUe4PY",
  authDomain: "unified-citizen-profile.firebaseapp.com",
  projectId: "unified-citizen-profile",
  storageBucket: "unified-citizen-profile.firebasestorage.app",
  messagingSenderId: "104502389316",
  appId: "1:104502389316:web:a576270588a8924ebf6a11",
  measurementId: "G-X39R2ZSWW2"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('🔥 Firebase initialized:', firebaseConfig.projectId);

export default app;