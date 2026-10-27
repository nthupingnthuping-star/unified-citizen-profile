// src/pages/staff/StaffSearch.js
import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase'; 
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../common/Layout';

const StaffSearch = () => {
  const { isStaff } = useAuth();
  const [nationalId, setNationalId] = useState('');
  const [citizen, setCitizen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!nationalId.trim()) {
      setError('Please enter a National ID.');
      return;
    }
    setLoading(true);
    setError('');
    setCitizen(null);

    try {
      // 1. UPDATED to your actual collection name: 'citizens'
      const citizensRef = collection(db, 'citizens'); 
      const q = query(citizensRef, where('national_id', '==', nationalId.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No citizen found with that National ID.');
      } else {
        const citizenData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        setCitizen(citizenData);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred during the search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isStaff) {
    return (
      <Layout title="Access Denied">
        <div style={{ padding: 20, background: '#f8d7da', color: '#721c24', borderRadius: 8 }}>
          You do not have permission to view this page.
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Citizen Search">
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ color: '#003366' }}>Citizen Search</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Search for a citizen by their National ID to view their profile.
        </p>

        <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="Enter National ID (e.g., 0355667882346)"
              style={{
                flex: 1,
                padding: '12px 16px',
                fontSize: 16,
                border: '1px solid #ccc',
                borderRadius: 6,
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#003366',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 6,
                fontSize: 16,
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {error && (
          <div style={{ marginTop: 20, padding: 16, background: '#f8d7da', color: '#721c24', borderRadius: 8 }}>
            {error}
          </div>
        )}

        {citizen && (
          <div style={{ marginTop: 24 }}>
            
            {/* 2. UPDATED to match your database field: citizen.deceased */}
            {citizen.deceased === true && (
              <div style={{
                background: '#f8d7da',
                color: '#721c24',
                border: '1px solid #f5c6cb',
                padding: '16px 20px',
                borderRadius: 8,
                marginBottom: 20,
                fontSize: 18,
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
                ⚠️ DECEASED — This person is recorded as deceased. ⚠️
              </div>
            )}

            <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <h2 style={{ color: '#003366', marginTop: 0 }}>Citizen Profile</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                <tbody>
                  <ProfileRow label="Full Name" value={citizen.full_name} />
                  <ProfileRow label="National ID" value={citizen.national_id} />
                  <ProfileRow label="Date of Birth" value={citizen.date_of_birth} />
                  <ProfileRow label="Gender" value={citizen.gender} />
                  <ProfileRow label="District" value={citizen.district} />
                  <ProfileRow label="Verified by Home Affairs" value={citizen.verified_by_home_affairs ? 'Yes' : 'No'} />
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const ProfileRow = ({ label, value }) => (
  <tr style={{ borderBottom: '1px solid #eee' }}>
    <td style={{ padding: '12px 0', color: '#666', width: '40%' }}>{label}</td>
    <td style={{ padding: '12px 0', fontWeight: 'bold', color: '#003366' }}>{value || '—'}</td>
  </tr>
);

export default StaffSearch;