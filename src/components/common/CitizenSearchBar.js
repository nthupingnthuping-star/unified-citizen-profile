import { useState } from 'react';
import { searchCitizens } from '../../firebase/db';
import Alert from '../common/Alert';

/**
 * Reusable search bar for staff forms.
 *
 * Usage:
 *   <CitizenSearchBar onSelect={(citizen) => { populateForm(citizen); }} />
 *
 * `citizen` is the full citizen document from Firestore.
 */
const CitizenSearchBar = ({ onSelect, label = 'Find a citizen' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setError('Enter at least 2 characters (National ID, name, phone, TIN, or passport).');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setSearched(false);

    try {
      const found = await searchCitizens(q);
      setResults(found);
      setSearched(true);
      if (found.length === 0) {
        setError('No citizen found with that National ID, name, phone, TIN, or passport.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (citizen) => {
    if (onSelect) onSelect(citizen);
    // Clear the search so staff can see the filled form below
    setQuery('');
    setResults([]);
    setSearched(false);
    setError('');
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0f6ff 0%, #e8f1ff 100%)',
      border: '1px solid #cce0ff',
      borderRadius: 12,
      padding: 18,
      marginBottom: 22,
    }}>
      <div style={{
        fontSize: 13,
        fontWeight: 'bold',
        color: '#003366',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        🔍 {label}
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="National ID, full name, phone, TIN, or passport number"
          style={{
            flex: 1,
            minWidth: 240,
            padding: 12,
            border: '1px solid #cce0ff',
            borderRadius: 8,
            fontSize: 14,
            background: 'white',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? '#999' : 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 12px rgba(0, 51, 102, 0.2)',
          }}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: 12 }}>
          <Alert type="warning" onClose={() => setError('')}>{error}</Alert>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{
            fontSize: 12,
            color: '#666',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: 'bold',
          }}>
            {results.length} match{results.length > 1 ? 'es' : ''} — click to load
          </div>

          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelect(c)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                textAlign: 'left',
                background: 'white',
                border: '1px solid #cce0ff',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0055aa';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 51, 102, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cce0ff';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
                  {c.full_name || '(no name)'}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                  {c.national_id && <span>ID: <strong>{c.national_id}</strong></span>}
                  {c.date_of_birth && <span> · DOB: {c.date_of_birth}</span>}
                  {c.residential_address && <span> · {c.residential_address}</span>}
                </div>
                {c.deceased && (
                  <div style={{
                    display: 'inline-block',
                    marginTop: 6,
                    background: '#fff0f0',
                    color: '#cc0000',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 'bold',
                  }}>
                    🕯️ DECEASED
                  </div>
                )}
              </div>
              <div style={{
                background: '#003366',
                color: 'white',
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}>
                Load →
              </div>
            </button>
          ))}
        </div>
      )}

      {searched && results.length === 0 && !error && (
        <div style={{ fontSize: 13, color: '#888', marginTop: 10 }}>
          No matches found.
        </div>
      )}
    </div>
  );
};

export default CitizenSearchBar;