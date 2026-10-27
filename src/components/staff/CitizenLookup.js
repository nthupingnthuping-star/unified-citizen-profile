import { useState, useEffect, useRef } from 'react';
import { searchCitizens, getCitizenFullProfile } from '../../firebase/db';
import '../../styles/CitizenLookup.css'; // Ensure this path matches where you saved the CSS

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
    <div className="citizen-lookup" style={{ marginBottom: 20 }}>
      <div className="citizen-searchbar" style={{ display: 'flex', gap: 8, alignItems: 'stretch', marginBottom: 16 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || 'Search by National ID, Full Name, TIN, Phone, or Passport...'}
          autoFocus={autoFocus}
          style={{ flex: 1, padding: '12px 16px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
        />
        {query && (
          <button onClick={handleClear} className="citizen-clear-btn" style={{ background: 'white', color: '#333', border: '1px solid #ccc', borderRadius: 6, padding: '0 16px', cursor: 'pointer', fontSize: 14 }}>
            Clear
          </button>
        )}
      </div>

      {searching && <div className="citizen-search-state" style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Searching…</div>}

      {results.length > 0 && !selected && (
        <div className="citizen-results" style={{ marginTop: 8, background: 'white', border: '1px solid #ddd', borderRadius: 6, maxHeight: 260, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          {results.map((c) => (
            <div key={c.id} className="citizen-result" onClick={() => handlePick(c)} style={{ padding: '10px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }} onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#003366', fontSize: 14 }}>{c.full_name}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>ID: {c.national_id || '—'}{c.tin ? ` · TIN: ${c.tin}` : ''}{c.phone_number ? ` · ${c.phone_number}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="citizen-error" style={{ marginTop: 8, padding: 10, background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 6, color: '#cc0000', fontSize: 13 }}>{error}</div>}
      {loadingProfile && <div className="citizen-loading-card" style={{ marginTop: 16, padding: 20, textAlign: 'center', color: '#666' }}>Loading profile…</div>}

      {profile && !loadingProfile && <CitizenProfilePanel profile={profile} />}
    </div>
  );
};

const CitizenProfilePanel = ({ profile }) => {
  const { citizen } = profile;
  if (!citizen) return null;
  const initial = (citizen.full_name || '?').charAt(0).toUpperCase();
  const isDeceased = citizen.deceased === true;

  return (
    <div className="citizen-profile" style={{ marginTop: 16, background: 'white', border: '1px solid #ddd', borderRadius: 8, padding: 20 }}>
      
      {/* Header */}
      <div className="citizen-profile__header" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
        <div className="citizen-avatar citizen-avatar--large" style={{ width: 64, height: 64, borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold', flexShrink: 0 }}>
          {citizen.photo_url ? <img src={citizen.photo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initial}
        </div>
        <div className="citizen-profile__identity" style={{ flex: 1 }}>
          <div className="citizen-profile__name-row" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: 20 }}>{citizen.full_name}</h2>
            {citizen.verified_by_home_affairs && <span className="citizen-status citizen-status--verified" style={{ background: '#006600', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 'bold' }}>VERIFIED BY HOME AFFAIRS</span>}
            {isDeceased && <span className="citizen-status citizen-status--deceased" style={{ background: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 'bold' }}>DECEASED</span>}
          </div>
          <div className="citizen-identity-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12, fontSize: 12 }}>
            <div><div style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold' }}>NATIONAL ID</div><div style={{ fontWeight: 'bold', color: '#0f172a' }}>{citizen.national_id || '—'}</div></div>
            <div><div style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold' }}>DATE OF BIRTH</div><div style={{ fontWeight: 'bold', color: '#0f172a' }}>{citizen.date_of_birth || '—'}</div></div>
            <div><div style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold' }}>GENDER</div><div style={{ fontWeight: 'bold', color: '#0f172a' }}>{citizen.gender || '—'}</div></div>
            <div><div style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold' }}>ADDRESS</div><div style={{ fontWeight: 'bold', color: '#0f172a' }}>{citizen.residential_address || '—'}</div></div>
            <div><div style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold' }}>TIN</div><div style={{ fontWeight: 'bold', color: '#0f172a' }}>{citizen.tin || '—'}</div></div>
            <div><div style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold' }}>PHONE</div><div style={{ fontWeight: 'bold', color: '#0f172a' }}>{citizen.phone_number || '—'}</div></div>
          </div>
        </div>
      </div>

      {/* Side-by-side Details */}
      <div className="citizen-profile__sections" style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div className="citizen-detail-card" style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
          <div className="citizen-detail-card__heading" style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>👤 CITIZEN DETAILS</div>
          <div className="citizen-detail-list">
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Full Name:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>{citizen.full_name}</span></div>
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>National ID:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>{citizen.national_id}</span></div>
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Phone:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>{citizen.phone_number || '—'}</span></div>
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Email:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>{citizen.email || '—'}</span></div>
          </div>
        </div>
        <div className="citizen-detail-card" style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
          <div className="citizen-detail-card__heading" style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>📄 REQUEST DETAILS</div>
          <div className="citizen-detail-list">
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Type:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>Application</span></div>
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Service:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>Disability Grant</span></div>
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Status:</span><span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 'bold' }}>Processing</span></div>
            <div style={{ fontSize: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Submitted:</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>29/09/2026</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenLookup;