import { useState, useEffect, useRef } from 'react';
import {
  searchCitizens,
  getCitizenFullProfile,
} from '../../firebase/db';

const CitizenLookup = ({ onSelect, autoFocus = false, placeholder }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await searchCitizens(query);
        setResults(found);
      } catch (err) {
        console.error(err);
        setError('Search failed.');
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handlePick = async (citizen) => {
    setSelected(citizen);
    setResults([]);
    setQuery(citizen.full_name || citizen.national_id || '');
    setLoadingProfile(true);
    setError('');
    try {
      const full = await getCitizenFullProfile(citizen.id);
      setProfile(full);
      if (onSelect) onSelect(full);
    } catch (err) {
      console.error(err);
      setError('Failed to load profile.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSelected(null);
    setProfile(null);
    setError('');
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || 'Search by National ID, Full Name, TIN, Phone, or Passport...'}
          autoFocus={autoFocus}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #ccc',
            borderRadius: 6,
            fontSize: 14,
            boxSizing: 'border-box',
          }}
        />
        {query && (
          <button
            onClick={handleClear}
            style={{
              background: 'white',
              color: '#333',
              border: '1px solid #ccc',
              borderRadius: 6,
              padding: '0 16px',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {searching && (
        <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Searching…</div>
      )}

      {results.length > 0 && !selected && (
        <div style={{
          marginTop: 8,
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: 6,
          maxHeight: 260,
          overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          {results.map((c) => (
            <div
              key={c.id}
              onClick={() => handlePick(c)}
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <div>
                <div style={{ fontWeight: 'bold', color: '#003366', fontSize: 14 }}>
                  {c.full_name}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                  ID: {c.national_id || '—'}
                  {c.tin ? ` · TIN: ${c.tin}` : ''}
                  {c.phone_number ? ` · ${c.phone_number}` : ''}
                </div>
              </div>
              {c.verified_by_home_affairs ? (
                <span style={{
                  background: '#006600', color: 'white',
                  padding: '3px 10px', borderRadius: 12,
                  fontSize: 11, fontWeight: 'bold',
                }}>
                  VERIFIED
                </span>
              ) : (
                <span style={{
                  background: '#ffcc00', color: '#000',
                  padding: '3px 10px', borderRadius: 12,
                  fontSize: 11, fontWeight: 'bold',
                }}>
                  UNVERIFIED
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {!searching && query.trim().length >= 2 && results.length === 0 && !selected && (
        <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
          No matching citizen found.
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 8, padding: 10,
          background: '#fff0f0', border: '1px solid #ffcccc',
          borderRadius: 6, color: '#cc0000', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {loadingProfile && (
        <div style={{ marginTop: 16, padding: 20, textAlign: 'center', color: '#666' }}>
          Loading profile…
        </div>
      )}

      {profile && !loadingProfile && <CitizenProfilePanel profile={profile} />}
    </div>
  );
};

const CitizenProfilePanel = ({ profile }) => {
  const { citizen, fundRecord, claims, applications, tins } = profile;
  if (!citizen) return null;

  const initial = (citizen.full_name || '?').charAt(0).toUpperCase();

  return (
    <div style={{
      marginTop: 16,
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: 8,
      padding: 20,
    }}>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#003366', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, fontWeight: 'bold', flexShrink: 0,
        }}>
          {citizen.photo_url
            ? <img src={citizen.photo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : initial}
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, color: '#003366', fontSize: 20 }}>
              {citizen.full_name}
            </h3>
            {citizen.verified_by_home_affairs ? (
              <span style={{
                background: '#006600', color: 'white',
                padding: '3px 10px', borderRadius: 12,
                fontSize: 11, fontWeight: 'bold',
              }}>
                VERIFIED BY HOME AFFAIRS
              </span>
            ) : (
              <span style={{
                background: '#ffcc00', color: '#000',
                padding: '3px 10px', borderRadius: 12,
                fontSize: 11, fontWeight: 'bold',
              }}>
                NOT YET VERIFIED
              </span>
            )}
          </div>

          <div style={{
            marginTop: 10,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
            fontSize: 13,
          }}>
            <InfoLine label="National ID" value={citizen.national_id} />
            <InfoLine label="Date of Birth" value={citizen.date_of_birth} />
            <InfoLine label="Gender" value={citizen.gender} />
            <InfoLine label="Phone" value={citizen.phone_number} />
            <InfoLine label="Email" value={citizen.email} />
            <InfoLine label="Address" value={citizen.residential_address} />
            <InfoLine label="TIN" value={citizen.tin || (tins[0]?.assigned_tin) || '—'} />
            <InfoLine label="TIN Status" value={citizen.tin_status || (tins[0]?.status) || '—'} />
            <InfoLine label="Passport No." value={citizen.passport_number} />
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 20,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14,
      }}>
        <SummaryCard
          title="Pension Fund"
          status={fundRecord ? (fundRecord.verification_status || 'pending') : 'none'}
          detail={fundRecord
            ? `M ${(fundRecord.total_fund_credit || 0).toLocaleString()} · ${fundRecord.months_of_service || 0} months`
            : 'No fund record'}
        />
        <SummaryCard
          title="Pension Claims"
          status={claims.length > 0 ? `${claims.length} total` : 'none'}
          detail={claims.slice(0, 2).map((c) => `${c.claim_type} — ${c.status}`).join(' · ') || 'No claims'}
        />
        <SummaryCard
          title="Applications"
          status={applications.length > 0 ? `${applications.length} total` : 'none'}
          detail={applications.slice(0, 2).map((a) => `${a.service_type} — ${a.status}`).join(' · ') || 'No applications'}
        />
        <SummaryCard
          title="TIN Registration"
          status={tins.length > 0 ? tins[0].status : (citizen.tin_status || 'none')}
          detail={tins[0] ? `Ref: ${tins[0].registration_reference}` : (citizen.tin ? `TIN: ${citizen.tin}` : 'No TIN')}
        />
      </div>
    </div>
  );
};

const InfoLine = ({ label, value }) => (
  <div>
    <div style={{
      fontSize: 10,
      color: '#888',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: 'bold',
    }}>
      {label}
    </div>
    <div style={{ color: '#003366', fontWeight: 'bold', marginTop: 2 }}>
      {value || '—'}
    </div>
  </div>
);

const SummaryCard = ({ title, status, detail }) => {
  const color =
    status === 'verified' || status === 'approved' ? '#006600' :
    status === 'rejected' ? '#cc0000' :
    status === 'none' ? '#999' :
    '#ffcc00';

  return (
    <div style={{
      background: '#f9f9f9',
      border: `1px solid #e0e0e0`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 6,
      padding: 14,
    }}>
      <div style={{
        fontSize: 11,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 'bold',
        marginBottom: 6,
      }}>
        {title}
      </div>
      <div style={{ fontWeight: 'bold', color: '#003366', fontSize: 13 }}>
        {typeof status === 'string' ? status.replace(/_/g, ' ') : status}
      </div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
        {detail}
      </div>
    </div>
  );
};

export default CitizenLookup;