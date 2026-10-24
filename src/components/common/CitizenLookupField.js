import { useState } from 'react';
import {
  getCitizenByNationalId,
  searchCitizens,
} from '../../firebase/db';

// ============================================================
// CITIZEN LOOKUP FIELD
// Type an ID or name, press Enter → auto-fills the parent form.
// Shows a 🔔 alert if the matched citizen is marked deceased.
//
// Usage:
//   <CitizenLookupField
//     label="National ID or Full Name"
//     onFound={(citizen) => {
//       // do whatever with the citizen record
//     }}
//   />
// ============================================================

const CitizenLookupField = ({
  label = 'National ID or Full Name',
  placeholder = 'e.g. 035159126628 or Nthuping Nthuping',
  onFound,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }
  const [matches, setMatches] = useState([]);

  const clearMessages = () => {
    setMessage(null);
    setMatches([]);
  };

  const lookup = async () => {
    const q = query.trim();
    if (q.length < 3) {
      setMessage({ type: 'warn', text: 'Enter at least 3 characters.' });
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      let citizen = null;

      // 1. Try exact National ID first (fast + specific)
      citizen = await getCitizenByNationalId(q);

      // 2. Fallback: fuzzy search by name / phone / TIN / passport
      if (!citizen) {
        const results = await searchCitizens(q);
        if (results.length === 1) {
          citizen = results[0];
        } else if (results.length > 1) {
          setMatches(results);
          setMessage({
            type: 'info',
            text: `${results.length} matches. Pick one below.`,
          });
          setLoading(false);
          return;
        }
      }

      if (!citizen) {
        setMessage({ type: 'error', text: 'No citizen found with that ID or name.' });
        setLoading(false);
        return;
      }

      handleCitizenFound(citizen);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Lookup failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCitizenFound = (citizen) => {
    // Deceased alert takes priority
    if (citizen.deceased) {
      setMessage({
        type: 'deceased',
        text:
          `This person is already marked as DECEASED in the system.` +
          (citizen.deceased_certificate_reference
            ? ` (Certificate: ${citizen.deceased_certificate_reference})`
            : ''),
      });
    } else {
      setMessage({
        type: 'success',
        text: `Found: ${citizen.full_name}`,
      });
    }

    if (onFound) onFound(citizen);
    setMatches([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      lookup();
    }
  };

  const messageStyles = {
    success: { bg: '#e6f4ea', border: '#a8d5b8', color: '#006600' },
    warn: { bg: '#fff8e0', border: '#ffe08a', color: '#7a5a00' },
    info: { bg: '#f0f6ff', border: '#cce0ff', color: '#003366' },
    error: { bg: '#fff0f0', border: '#ffcccc', color: '#cc0000' },
    deceased: { bg: '#fff0f0', border: '#cc0000', color: '#8b0000' },
  };

  const currentStyle = message ? messageStyles[message.type] : null;

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block',
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#333',
      }}>
        {label}
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (message) clearMessages();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          style={{
            flex: 1,
            padding: 12,
            border: '1px solid #ccc',
            borderRadius: 8,
            fontSize: 14,
            boxSizing: 'border-box',
            background: 'white',
          }}
        />
        <button
          type="button"
          onClick={lookup}
          disabled={disabled || loading}
          style={{
            background: loading ? '#999' : 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 22px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 'bold',
            cursor: disabled || loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Searching…' : 'Look up'}
        </button>
      </div>

      {/* Message (deceased / success / error) */}
      {message && (
        <div style={{
          marginTop: 10,
          background: currentStyle.bg,
          border: `1px solid ${currentStyle.border}`,
          color: currentStyle.color,
          padding: 12,
          borderRadius: 8,
          fontSize: 13,
          lineHeight: 1.6,
          fontWeight: message.type === 'deceased' ? 'bold' : 'normal',
        }}>
          {message.type === 'deceased' && (
            <div style={{ fontSize: 20, marginBottom: 6 }}>🔔</div>
          )}
          {message.text}

          {message.type === 'deceased' && (
            <div style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid #ffcccc',
              fontSize: 12,
              fontWeight: 'normal',
              color: '#7a0000',
            }}>
              If you are <strong>reporting a new death</strong>, continue below.
              If you are trying to <strong>verify or use</strong> this person's
              ID, please stop — the account is closed.
            </div>
          )}
        </div>
      )}

      {/* Multiple matches — clickable list */}
      {matches.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {matches.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCitizenFound(c)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'white',
                border: '1px solid #cce0ff',
                borderRadius: 6,
                padding: 10,
                marginBottom: 6,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#003366' }}>
                {c.full_name}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                ID: {c.national_id}
                {c.date_of_birth && ` · DOB: ${c.date_of_birth}`}
              </div>
              {c.deceased && (
                <div style={{
                  display: 'inline-block',
                  marginTop: 4,
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
            </button>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: '#888', marginTop: 6, marginBottom: 0 }}>
        Press <strong>Enter</strong> to search.
      </p>
    </div>
  );
};

export default CitizenLookupField;