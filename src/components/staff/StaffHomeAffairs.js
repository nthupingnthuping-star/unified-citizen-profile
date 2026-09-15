import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPendingVerifications, verifyCitizen } from '../../firebase/db';
import StaffLayout from '../common/StaffLayout';
import Card from '../common/Card';
import Button from '../common/Button';
import Alert from '../common/Alert';
import Table from '../common/Table';

const StaffHomeAffairs = () => {
  const { profile } = useAuth();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [nationalId, setNationalId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchMsg, setSearchMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const rows = await getPendingVerifications();
        setPending(rows);
      } catch (err) {
        console.error(err);
        setPending([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  const handleVerify = async (citizenId) => {
    if (!window.confirm('Verify this citizen?')) return;
    try {
      await verifyCitizen(citizenId, profile.uid);
      setMessage('✓ Citizen verified');
      setSearchResult(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setMessage(`✗ ${err.message}`);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchMsg('');
    setSearchResult(null);

    // Simple client-side search across pending list
    // (for real search by national ID, add an index)
    const found = pending.find((c) => c.national_id === nationalId);
    if (found) {
      setSearchResult(found);
    } else {
      setSearchMsg('Citizen not found in pending queue');
    }
  };

  return (
    <StaffLayout title="🏛️ Home Affairs — Verification Queue">
      <Alert type="info">
        Only <strong>Home Affairs</strong> can verify citizen identity.
        Once verified, all other ministries can serve the citizen.
      </Alert>

      {message && (
        <Alert
          type={message.startsWith('✓') ? 'success' : 'error'}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      <Card title="Search Pending Citizen by National ID" style={{ marginBottom: 20 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13 }}>National ID</label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              required
              placeholder="13-digit National ID"
              style={{
                width: '100%', padding: 10, border: '1px solid #ccc',
                borderRadius: 4, marginTop: 5, fontSize: 14,
              }}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {searchMsg && (
          <p style={{ color: '#cc0000', marginTop: 10 }}>{searchMsg}</p>
        )}

        {searchResult && (
          <div style={{ marginTop: 20, padding: 15, background: '#f9f9f9', borderRadius: 6 }}>
            <p><strong>Name:</strong> {searchResult.full_name}</p>
            <p><strong>National ID:</strong> {searchResult.national_id}</p>
            <p><strong>Date of Birth:</strong> {searchResult.date_of_birth}</p>
            <Button
              variant="success"
              onClick={() => handleVerify(searchResult.uid)}
              style={{ marginTop: 10 }}
            >
              Approve Verification
            </Button>
          </div>
        )}
      </Card>

      <Card title="Pending Verification Requests">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <Table
            headers={['National ID', 'Name', 'Date of Birth', 'Actions']}
            rows={pending.map((c) => [
              c.national_id,
              c.full_name,
              c.date_of_birth,
              <Button
                size="small"
                variant="success"
                onClick={() => handleVerify(c.uid)}
              >
                Verify
              </Button>,
            ])}
            emptyMessage="No pending verification requests."
          />
        )}
      </Card>
    </StaffLayout>
  );
};

export default StaffHomeAffairs;