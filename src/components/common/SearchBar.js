import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchServices } from '../../utils/searchIndex';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    const matches = searchServices(val);
    setResults(matches);
    setIsOpen(val.length >= 2);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      setIsOpen(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleResultClick = (path) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1, maxWidth: 500 }}>
      {/* Search Input */}
      <div style={{ 
        display: 'flex', alignItems: 'center', background: 'white', 
        borderRadius: 999, padding: '0 16px', height: 44,
        border: isOpen ? '2px solid #ffcc00' : '2px solid transparent',
        transition: 'border-color 0.2s ease',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.length >= 2) setIsOpen(true); }}
          placeholder="Search for services, permits, tax portals..." 
          style={{ 
            border: 'none', background: 'transparent', width: '100%', 
            padding: '0 12px', fontSize: 13, color: '#333', outline: 'none' 
          }}
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: 52, left: 0, right: 0,
          background: 'white', borderRadius: 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: '1px solid #e0e0e0',
          overflow: 'hidden', zIndex: 1000,
        }}>
          {results.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#666', fontSize: 13 }}>
              No results for "{query}". Press Enter to search everything.
            </div>
          ) : (
            <>
              {results.slice(0, 4).map((r) => (
                <button
                  key={r.name}
                  onClick={() => handleResultClick(r.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '12px 16px',
                    background: 'transparent', border: 'none',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fbff'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 20 }}>{r.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 'bold', color: '#003366' }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{r.dept}</div>
                  </div>
                </button>
              ))}
              
              {results.length > 4 && (
                <div style={{ 
                  padding: '12px 16px', fontSize: 12, color: '#0055aa', 
                  textAlign: 'center', fontWeight: 'bold', background: '#f8fbff',
                  cursor: 'pointer' 
                }}
                onClick={() => handleKeyDown({ key: 'Enter' })}
                >
                  View all {results.length} results →
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;