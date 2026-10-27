import { useLocation, Link } from 'react-router-dom';
import { searchServices } from '../utils/searchIndex';
import Layout from '../components/common/Layout';
import { useLanguage } from '../i18n/LanguageContext';

const SearchPage = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const query = new URLSearchParams(location.search).get('q') || '';
  
  const results = searchServices(query);

  return (
    <Layout title={t('search') || 'Search'}>
      <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 20 }}>
        
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: '#666', margin: 0 }}>
            {query 
              ? `Showing results for "${query}"`
              : 'Type in the search bar above to find a service.'
            }
          </p>
        </div>

        {/* IF NO QUERY: Show a prompt to search */}
        {!query && (
          <div style={{
            background: 'white', borderRadius: 12, padding: 60,
            textAlign: 'center', color: '#666', border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
            <h2 style={{ margin: '0 0 8px 0', color: '#003366' }}>Search for a service</h2>
            <p>Use the search bar at the top to find services like Passports, IDs, or Tax.</p>
          </div>
        )}

        {/* IF QUERY AND NO RESULTS: Show the No Results screen */}
        {query && results.length === 0 && (
          <div style={{
            background: 'white', borderRadius: 12, padding: 60,
            textAlign: 'center', color: '#666', border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
            <h2 style={{ margin: '0 0 8px 0', color: '#003366' }}>No results found</h2>
            <p>We couldn't find any services matching "{query}".</p>
            <p style={{ fontSize: 13 }}>Try searching for "Passport", "Police", "Tax", or "Pension".</p>
            <Link to="/" style={{ display: 'inline-block', marginTop: 20, color: '#0055aa', fontWeight: 'bold' }}>
              ← Back to Home
            </Link>
          </div>
        )}

        {/* IF QUERY AND RESULTS: Show the results */}
        {query && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map((service) => (
              <Link key={service.name} to={service.path} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white', borderRadius: 12, padding: 20,
                  display: 'flex', alignItems: 'center', gap: 20,
                  border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 51, 102, 0.1)';
                    e.currentTarget.style.borderColor = '#0055aa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                    e.currentTarget.style.borderColor = '#e0e0e0';
                  }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: '#f0f6ff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 28,
                    flexShrink: 0,
                  }}>
                    {service.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 'bold', color: '#003366' }}>
                      {service.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                      {service.dept} Department
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#0055aa', fontSize: 20, fontWeight: 'bold' }}>
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;