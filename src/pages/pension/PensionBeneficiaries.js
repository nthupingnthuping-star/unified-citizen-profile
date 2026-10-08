import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getMyBeneficiaries,
  addBeneficiary,
  deleteBeneficiary,
} from '../../firebase/db';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/common/Layout';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';

const PensionBeneficiaries = () => {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    relationship: '',
    national_id: '',
    allocation_percentage: '',
  });

  const load = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const data = await getMyBeneficiaries(user.uid);
      setList(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load beneficiaries.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user]);

  const totalAllocation = list.reduce(
    (sum, b) => sum + (Number(b.allocation_percentage) || 0),
    0
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const pct = Number(form.allocation_percentage);
    if (!form.full_name.trim() || !form.relationship.trim()) {
      setError('Please enter name and relationship.');
      return;
    }
    if (pct <= 0 || pct > 100) {
      setError('Allocation must be between 1 and 100.');
      return;
    }
    if (totalAllocation + pct > 100) {
      setError(`Total allocation would be ${totalAllocation + pct}%. Must not exceed 100%.`);
      return;
    }

    try {
      await addBeneficiary(user.uid, {
        full_name: form.full_name.trim(),
        relationship: form.relationship.trim(),
        national_id: form.national_id.trim(),
        allocation_percentage: pct,
      });
      setMessage('✓ Beneficiary added.');
      setForm({ full_name: '', relationship: '', national_id: '', allocation_percentage: '' });
      setShowForm(false);
      load();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to add beneficiary.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this beneficiary?')) return;
    try {
      await deleteBeneficiary(user.uid, id);
      setMessage('✓ Beneficiary removed.');
      load();
    } catch (err) {
      console.error(err);
      setError('Failed to remove beneficiary.');
    }
  };

  return (
    <Layout title="Pension Beneficiaries">
      <Card>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#003366' }}>Nominated Beneficiaries</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#666' }}>
              Total allocation: <strong>{totalAllocation}%</strong> of 100%
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              disabled={totalAllocation >= 100}
              style={{
                background: totalAllocation >= 100 ? '#999' : '#003366',
                color: 'white',
                border: 'none',
                padding: '10px 18px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 'bold',
                cursor: totalAllocation >= 100 ? 'not-allowed' : 'pointer',
              }}
            >
              + Add Beneficiary
            </button>
          )}
        </div>

        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
        {message && <Alert type="success" onClose={() => setMessage('')}>{message}</Alert>}

        {showForm && (
          <form
            onSubmit={handleAdd}
            style={{
              background: '#f0f6ff',
              border: '1px solid #cce0ff',
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Relationship *</label>
                <input
                  type="text"
                  value={form.relationship}
                  onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                  placeholder="e.g. Spouse, Child"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>National ID (optional)</label>
                <input
                  type="text"
                  value={form.national_id}
                  onChange={(e) => setForm({ ...form, national_id: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Allocation % *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.allocation_percentage}
                  onChange={(e) => setForm({ ...form, allocation_percentage: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button type="submit" style={btnPrimary}>Save</button>
              <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
        ) : list.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>
            No beneficiaries nominated yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#003366', color: 'white' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Relationship</th>
                <th style={thStyle}>National ID</th>
                <th style={thStyle}>Allocation</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{b.full_name}</td>
                  <td style={tdStyle}>{b.relationship}</td>
                  <td style={tdStyle}>{b.national_id || '—'}</td>
                  <td style={tdStyle}>{b.allocation_percentage}%</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleDelete(b.id)}
                      style={{
                        background: 'white',
                        color: '#cc0000',
                        border: '1px solid #cc0000',
                        borderRadius: 4,
                        padding: '4px 10px',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div style={{ marginTop: 20 }}>
        <Link to="/pensions" style={{ color: '#0066cc', fontSize: 14 }}>
          ← Back to Pensions
        </Link>
      </div>
    </Layout>
  );
};

const labelStyle = { display: 'block', fontSize: 12, color: '#333', marginBottom: 4 };
const inputStyle = {
  width: '100%',
  padding: 10,
  border: '1px solid #ccc',
  borderRadius: 6,
  fontSize: 14,
  boxSizing: 'border-box',
};
const thStyle = { textAlign: 'left', padding: '10px 12px', fontWeight: 'bold', fontSize: 13 };
const tdStyle = { padding: '10px 12px' };
const btnPrimary = {
  background: '#003366', color: 'white', border: 'none',
  padding: '10px 18px', borderRadius: 6, fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
};
const btnSecondary = {
  background: 'white', color: '#003366', border: '1px solid #003366',
  padding: '10px 18px', borderRadius: 6, fontSize: 14, cursor: 'pointer',
};

export default PensionBeneficiaries;