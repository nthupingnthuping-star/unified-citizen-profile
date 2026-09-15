import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Alert from '../components/common/Alert';

const SEED_PASSWORD = 'password123';

const CITIZENS = [
  {
    email: 'thabo@email.com',
    national_id: '1234567890123',
    full_name: 'Thabo Mokoena',
    date_of_birth: '1985-06-15',
    gender: 'Male',
    residential_address: 'Maseru West, Ha Hoohlo',
    phone_number: '+266 5888 1234',
    verified_by_home_affairs: true,
  },
  {
    email: 'mamphe@email.com',
    national_id: '9876543210987',
    full_name: 'Mamphe Ramoholi',
    date_of_birth: '1958-03-22',
    gender: 'Female',
    residential_address: 'Maseru East, Lithabaneng',
    phone_number: '+266 5777 5678',
    verified_by_home_affairs: true,
  },
  {
    email: 'nthabiseng@email.com',
    national_id: '5556667778889',
    full_name: 'Nthabiseng Letsie',
    date_of_birth: '1992-11-08',
    gender: 'Female',
    residential_address: 'Berea, Teyateyaneng',
    phone_number: '+266 5999 9012',
    verified_by_home_affairs: true,
  },
];

const STAFF = [
  { email: 'home_affairs_officer@ucps.gov.ls', full_name: 'Mpho Molapo', department_id: 1, role: 'supervisor' },
  { email: 'traffic_officer@ucps.gov.ls', full_name: 'Teboho Mofokeng', department_id: 2, role: 'staff' },
  { email: 'finance_officer@ucps.gov.ls', full_name: 'Palesa Thakane', department_id: 3, role: 'staff' },
  { email: 'pension_officer@ucps.gov.ls', full_name: 'Mpho Ramoholi', department_id: 4, role: 'staff' },
  { email: 'police_officer@ucps.gov.ls', full_name: 'Sello Mabote', department_id: 5, role: 'staff' },
  { email: 'passport_officer@ucps.gov.ls', full_name: 'Refiloe Letsie', department_id: 6, role: 'staff' },
];

const SeedPage = () => {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);

  const addLog = (msg) => setLog((prev) => [...prev, msg]);

  const seedAll = async () => {
    setRunning(true);
    setLog([]);

    addLog('🌱 Starting seed...');

    for (const c of CITIZENS) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, c.email, SEED_PASSWORD);
        await setDoc(doc(db, 'citizens', cred.user.uid), {
          uid: cred.user.uid,
          email: c.email,
          national_id: c.national_id,
          full_name: c.full_name,
          date_of_birth: c.date_of_birth,
          gender: c.gender,
          residential_address: c.residential_address,
          phone_number: c.phone_number,
          citizenship_status: 'Citizen',
          verified_by_home_affairs: c.verified_by_home_affairs,
          verification_date: c.verified_by_home_affairs ? serverTimestamp() : null,
          verified_by: null,
          type: 'citizen',
          department_id: null,
          role: null,
          is_active: true,
          created_at: serverTimestamp(),
        });
        addLog(`✅ Citizen: ${c.email}`);
      } catch (err) {
        addLog(`⚠️ Citizen ${c.email}: ${err.code || err.message}`);
      }
    }

    for (const s of STAFF) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, s.email, SEED_PASSWORD);
        await setDoc(doc(db, 'citizens', cred.user.uid), {
          uid: cred.user.uid,
          email: s.email,
          national_id: null,
          full_name: s.full_name,
          date_of_birth: null,
          gender: null,
          residential_address: '',
          phone_number: '',
          citizenship_status: 'Staff',
          verified_by_home_affairs: true,
          verification_date: serverTimestamp(),
          verified_by: null,
          type: 'staff',
          department_id: s.department_id,
          role: s.role,
          is_active: true,
          created_at: serverTimestamp(),
        });
        addLog(`✅ Staff: ${s.email} (dept ${s.department_id})`);
      } catch (err) {
        addLog(`⚠️ Staff ${s.email}: ${err.code || err.message}`);
      }
    }

    addLog('🎉 Done!');
    setRunning(false);
  };

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <Card title="🌱 Seed Sample Data">
        <Alert type="warning">
          This creates sample citizens and staff accounts. Run it <strong>once</strong>.
          If you run it again, duplicates will fail — that's fine.
        </Alert>

        <p style={{ color: '#666', marginBottom: 20 }}>It will create:</p>
        <ul style={{ color: '#333', marginBottom: 20 }}>
          <li><strong>{CITIZENS.length} citizens</strong> (all verified)</li>
          <li><strong>{STAFF.length} staff</strong> across all 6 departments</li>
          <li>Password for all accounts: <code>{SEED_PASSWORD}</code></li>
        </ul>

        <Button onClick={seedAll} disabled={running} size="large">
          {running ? 'Seeding...' : '🚀 Run Seeder'}
        </Button>

        {log.length > 0 && (
          <div style={{
            marginTop: 20, padding: 15, background: '#1a1a1a', color: '#0f0',
            fontFamily: 'monospace', fontSize: 13, borderRadius: 6,
            maxHeight: 400, overflowY: 'auto',
          }}>
            {log.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SeedPage;