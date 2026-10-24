import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link
import { useAuth } from '../../contexts/AuthContext';
import { assetPath } from '../../utils/assetPath';
import { saveCitizenPhoto } from '../../firebase/db';
import Layout from '../common/Layout';
import PhotoUpload from '../common/PhotoUpload';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url || '');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPhotoUrl(profile?.photo_url || '');
  }, [profile]);

  const departments = [
    { name: 'Pensions', desc: 'Pension registration, statements and benefits.', path: '/pensions', logo: assetPath('/assets/logos/pensions.png'), bg: '#e0e7ff' },
    { name: 'Home Affairs', desc: 'Identity & citizenship services.', path: '/home-affairs', logo: assetPath('/assets/logos/home-affairs.png'), bg: '#d1fae5' },
    { name: 'Finance / RSL', desc: 'Tax clearance & PAYE refunds.', path: '/finance', logo: assetPath('/assets/logos/finance.png'), bg: '#ede9fe' },
    { name: 'Traffic', desc: 'Licences & traffic fines.', path: '/traffic', logo: assetPath('/assets/logos/traffic.png'), bg: '#ffedd5' },
    { name: 'Police', desc: 'Clearances & crime reports.', path: '/police', logo: assetPath('/assets/logos/police.png'), bg: '#fee2e2' },
    { name: 'Passport', desc: 'New passports & renewals.', path: '/passport', logo: assetPath('/assets/logos/passport.png'), bg: '#ccfbf1' },
  ];

  const citizenshipKey = (profile?.citizenship_status || '').toLowerCase();
  const citizenshipLabel =
    citizenshipKey.includes('mosotho') || citizenshipKey.includes('citizen')
      ? 'Mosotho'
      : citizenshipKey.includes('resident')
      ? 'Permanent resident'
      : 'Mosotho';

  return (
    <Layout title="Dashboard">
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        
        {/* =========================================
            LEFT COLUMN (Main Content)
        ========================================= */}
        <div style={{ flex: '2 1 700px', minWidth: 0 }}>
          
          {/* Hero Profile Card */}
          <div style={{
            position: 'relative',
            background: 'white',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 32,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            minHeight: 240, 
          }}>
            
            {/* Background Image */}
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              backgroundImage: `url(${assetPath('/assets/images/better-lesotho.png')})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center', 
            }} />

            {/* White Gradient Overlay */}
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              background: 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 45%, rgba(255,255,255,0) 100%)' 
            }} />

            {/* Content */}
            <div style={{ position: 'relative', padding: 32, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
              
              <PhotoUpload
                currentUrl={photoUrl}
                size={100}
                onUpload={async (url) => {
                  setPhotoUrl(url);
                  try {
                    await saveCitizenPhoto(profile.uid, url);
                  } catch (err) { console.error(err); }
                }}
              />

              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'inline-block', background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
                  ✓ Verified Citizen
                </div>
                <h2 style={{ margin: 0, fontSize: 28, color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {profile?.full_name}
                  <img src={assetPath('/assets/images/flag-lesotho.png')} alt="Lesotho" style={{ height: 22, borderRadius: 2 }} />
                </h2>
                <div style={{ color: '#334155', fontSize: 14, marginTop: 6, fontWeight: 600 }}>
                  National ID: {profile?.national_id}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginTop: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Gender</div>
                    <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, marginTop: 2 }}>{profile?.gender}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Date of Birth</div>
                    <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, marginTop: 2 }}>{profile?.date_of_birth}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Phone Number</div>
                    <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, marginTop: 2 }}>{profile?.phone_number || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Email</div>
                    <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, marginTop: 2, wordBreak: 'break-all' }}>{profile?.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Citizenship</div>
                    <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, marginTop: 2 }}>{citizenshipLabel}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Available Services */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20, color: '#3b82f6' }}>▦</span>
              <h3 style={{ margin: 0, fontSize: 20, color: '#0f172a', fontWeight: 800 }}>Available Services</h3>
            </div>
            <button onClick={() => navigate('/search')} style={{ background: 'transparent', border: '1px solid #cbd5e1', color: '#3b82f6', padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              View All Services →
            </button>
          </div>
          
          <p style={{ margin: '0 0 24px 0', fontSize: 14, color: '#64748b' }}>
            Access government services quickly and easily. Select a service below to get started.
          </p>

          {/* Department Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            
            {departments.map((dept, i) => (
              <button
                key={dept.name}
                onClick={() => navigate(dept.path)}
                style={{
                  background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
                  display: 'flex', alignItems: 'flex-start', gap: 16, cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: dept.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={dept.logo} alt={dept.name} style={{ width: 24, height: 24, objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = '🏛️'; }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <h4 style={{ margin: 0, fontSize: 15, color: '#0f172a', fontWeight: 700 }}>{dept.name}</h4>
                    <span style={{ color: '#3b82f6', fontSize: 16 }}>→</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{dept.desc}</p>
                </div>
              </button>
            ))}

            {/* Access History */}
            <button
              onClick={() => navigate('/access-history')}
              style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🕒</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <h4 style={{ margin: 0, fontSize: 15, color: '#0f172a', fontWeight: 700 }}>Access History</h4>
                  <span style={{ color: '#3b82f6', fontSize: 16 }}>→</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>View your service history and past applications.</p>
              </div>
            </button>

            {/* More Services */}
            <button
              onClick={() => navigate('/search')}
              style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>▦</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <h4 style={{ margin: 0, fontSize: 15, color: '#0f172a', fontWeight: 700 }}>More Services</h4>
                  <span style={{ color: '#3b82f6', fontSize: 16 }}>→</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Explore all government services and ministries.</p>
              </div>
            </button>

          </div>
        </div>

        {/* =========================================
            RIGHT COLUMN (Sidebar)
        ========================================= */}
        <div style={{ flex: '1 1 300px', maxWidth: 360 }}>
          
          {/* Latest Announcements */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#3b82f6' }}>📢</span> Latest Announcements
              </h3>
              <Link to="/announcements" style={{ color: '#3b82f6', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link to="/announcements" style={{ textDecoration: 'none', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', marginTop: 6 }}></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Tax Filing Deadline Extended</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>The deadline for individual tax returns has been...</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>12 Oct 2025</div>
                </div>
              </Link>
              <Link to="/announcements" style={{ textDecoration: 'none', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', marginTop: 6 }}></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>New Passport Application Process</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Updated requirements for passport applications...</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>10 Oct 2025</div>
                </div>
              </Link>
              <Link to="/announcements" style={{ textDecoration: 'none', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', marginTop: 6 }}></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Public Holiday Notice</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Government offices will be closed on 25 Oct 2025.</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>08 Oct 2025</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Need Help */}
          <div style={{ background: '#f0f9ff', borderRadius: 16, border: '1px solid #e0f2fe', padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💬</div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: 15, color: '#0f172a', fontWeight: 700 }}>Need Help?</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: 12, color: '#475569', lineHeight: 1.4 }}>Visit our help center for FAQs, guides and support contacts.</p>
                <Link to="/help" style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
                  Go to Help Center →
                </Link>
              </div>
            </div>
          </div>

          {/* Promo Banner */}
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 180 }}>
             <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${assetPath('/assets/images/government-building.jpg')})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
             <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(45deg, rgba(11,37,69,0.9) 0%, transparent 100%)' }} />
             <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
               <div style={{ color: 'white', fontSize: 18, fontWeight: 700, fontStyle: 'italic', lineHeight: 1.2 }}>A Digital Lesotho<br/>for a Brighter Future</div>
             </div>
          </div>

        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;