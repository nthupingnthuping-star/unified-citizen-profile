import { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/db';

const SeedPage = () => {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyExistingAccounts = async () => {
    setLoading(true);
    setMsg('');
    try {
      const snap = await getDocs(collection(db, 'citizens'));
      let count = 0;
      for (const docItem of snap.docs) {
        const data = docItem.data();
        if (data.type === 'staff') continue;
        // We cannot set emailVerified from the client.
        // Instead we set a custom field and rely on the login check.
        // The actual emailVerified flag must be flipped via Firebase Console
        // or via a Cloud Function. This button just logs what it found.
        console.log('Citizen:', data.email, 'UID:', docItem.id);
        count++;
      }
      setMsg(`Found ${count} citizen accounts. To verify their emails, use the Firebase Console → Authentication → Users → click each user → Verify email.`);
    } catch (err) {
      console.error(err);
      setMsg('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 720, margin: '0 auto' }}>
      <h1>Seed / Admin</h1>
      <p style={{ color: '#666' }}>
        Use this page for one-time setup tasks during the demo.
      </p>

      <div style={{ background: '#fff8e0', border: '1px solid #ffe08a', borderRadius: 6, padding: 16, marginBottom: 20, fontSize: 13, color: '#7a5a00' }}>
        <strong>Note about verified emails:</strong> Firebase Auth requires each user to click a link
        in their email to become verified. The client app cannot skip this. For the demo, use the
        <strong> Firebase Console</strong> → <strong>Authentication → Users</strong>, then click
        a user and mark them as verified manually. Or send them a real email and click the link
        yourself.
      </div>

      <button
        onClick={verifyExistingAccounts}
        disabled={loading}
        style={{
          background: loading ? '#999' : 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: 999,
          fontSize: 15,
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Working...' : 'List all citizen accounts'}
      </button>

      {msg && (
        <div style={{ marginTop: 20, padding: 16, background: '#f0f6ff', border: '1px solid #cce0ff', borderRadius: 6, fontSize: 13, color: '#003366' }}>
          {msg}
        </div>
      )}
    </div>
  );
};

export default SeedPage;