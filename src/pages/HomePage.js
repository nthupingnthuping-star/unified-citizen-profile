import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { assetPath } from '../utils/assetPath';
import SearchBar from '../components/common/SearchBar';

// ============================================================
// ANIMATION HELPERS
// ============================================================
const useReveal = (threshold = 0.15) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
};

const Reveal = ({ children, delay = 0, y = 30 }) => {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

const Typewriter = ({ text, speed = 60 }) => {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    setDisplay('');
    let i = 0;
    const id = setInterval(() => {
      setDisplay(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <span>{display}<span style={{ opacity: 0.4 }}>|</span></span>;
};

const HomePage = () => {
  const { t, simpleMode, toggleSimpleMode, language, changeLanguage } = useLanguage();

  // Your actual 6 modules
  const departments = [
    { logo: assetPath('/assets/logos/home-affairs.png'), name: 'Home Affairs', desc: 'Identity & citizenship', link: '/home-affairs' },
    { logo: assetPath('/assets/logos/finance.png'), name: 'Finance / RSL', desc: 'Tax clearance & PAYE refunds', link: '/finance' },
    { logo: assetPath('/assets/logos/traffic.png'), name: 'Traffic', desc: 'Licenses & traffic fines', link: '/traffic' },
    { logo: assetPath('/assets/logos/police.png'), name: 'Police', desc: 'Clearances & crime reports', link: '/police' },
    { logo: assetPath('/assets/logos/passport.png'), name: 'Passport', desc: 'New passports & renewals', link: '/passport' },
    { logo: assetPath('/assets/logos/pensions.png'), name: 'Pensions', desc: 'Pension registration', link: '/pensions' },
  ];

  const heroFeatures = [
    { icon: '🛡️', title: 'Secure', desc: 'Your data is protected with advanced security.' },
    { icon: '🕒', title: 'Convenient', desc: 'Access services from anywhere.' },
    { icon: '👥', title: 'One Profile', desc: 'Use your verified identity across all departments.' },
    { icon: '⚡', title: 'Faster Service', desc: 'Less paperwork, more time for you.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f7ff', overflowX: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ============ GLOBAL ANIMATIONS ============ */}
      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        .nav-link {
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .nav-link:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }
        .dept-card {
          transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease, border-color 0.35s ease;
        }
        .dept-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 51, 102, 0.15);
          border-color: #93c5fd !important;
        }
        .dept-card:hover .dept-logo {
          transform: scale(1.1) rotate(-4deg);
        }
        .dept-logo {
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
      `}</style>

      {/* ============ HEADER ============ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#0b2545',
        padding: '16px 20px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, flexShrink: 0 }}>
            <img src={assetPath('/assets/logos/lesotho-coat-of-arms.png')} alt="Lesotho" style={{ height: 50, width: 'auto' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 18, color: 'white', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '-0.5px' }}>
                Unified Citizen Profile System
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                Government of Lesotho
              </p>
            </div>
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 500 }}>
            <SearchBar />
          </div>

          {/* Right Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
            {/* Language Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#94a3b8', fontSize: 16 }}>🌐</span>
              <select 
                value={language} 
                onChange={(e) => changeLanguage(e.target.value)}
                style={{ background: 'transparent', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, outline: 'none', cursor: 'pointer', appearance: 'none' }}
              >
                <option value="en" style={{ color: 'black' }}>EN</option>
                <option value="st" style={{ color: 'black' }}>ST</option>
              </select>
            </div>

            {/* Accessibility */}
            <button onClick={toggleSimpleMode} className="nav-link" style={{ background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              <span style={{ fontSize: 16 }}>🧍</span> Accessibility
            </button>

            <div style={{ height: 24, width: 1, background: 'rgba(255,255,255,0.2)' }}></div>

            {/* Links */}
            <Link to="/staff-login" className="nav-link" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
              🏢 Staff Portal
            </Link>
            <Link to="/login" className="nav-link" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
              👤 Login
            </Link>
            
            {/* Register */}
            <Link to="/register" className="nav-link" style={{ background: '#ffcc00', color: '#0b2545', padding: '10px 24px', borderRadius: 999, textDecoration: 'none', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>👥</span> Register
            </Link>
          </div>
        </div>
      </header>

      {/* ============ HERO SECTION ============ */}
      <section style={{ position: 'relative', background: '#0b2545', overflow: 'hidden', paddingBottom: 80 }}>
        
        {/* Background Image & Overlays */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${assetPath('/assets/images/government-building.jpg')})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #0b2545 0%, rgba(11,37,69,0.85) 50%, transparent 100%)' }} />
        
        {/* Floating Orbs (from your original design) */}
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,204,0,0.15) 0%, transparent 70%)', animation: 'floatY 7s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)', animation: 'floatY 9s ease-in-out infinite reverse', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 1400, margin: '0 auto', padding: '60px 20px 0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 40, zIndex: 2 }}>
          
          {/* Left Content */}
          <div style={{ flex: '1 1 500px', maxWidth: 650 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ width: 40, height: 2, background: '#ffcc00' }}></span>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>FAST · SECURE · ACCESSIBLE</span>
              <span style={{ width: 40, height: 1, background: 'rgba(255,255,255,0.3)' }}></span>
            </div>

            <h1 style={{ fontSize: 'clamp(40px, 5vw, 56px)', lineHeight: 1.1, color: 'white', margin: '0 0 20px', fontWeight: 700, letterSpacing: '-1px', minHeight: '1.2em' }}>
              <Typewriter text="Submit Once. Use Everywhere." speed={50} />
            </h1>

            <p style={{ fontSize: 16, lineHeight: 1.6, color: '#cbd5e1', marginBottom: 40, maxWidth: 480, fontWeight: 400 }}>
              Verify your identity once with Home Affairs, then access all government services — Finance, Traffic, Police, Passport, and Pensions — without resubmitting documents.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link to="/register" style={{ background: '#ffcc00', color: '#0b2545', padding: '14px 28px', borderRadius: 999, textDecoration: 'none', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🔍</span> Get Started
              </Link>
              <Link to="/login" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '14px 28px', borderRadius: 999, textDecoration: 'none', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(10px)' }}>
                <span style={{ fontSize: 18 }}>👤</span> Already registered?
              </Link>
            </div>
          </div>

          {/* Right Content - Floating Card */}
          <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ background: 'rgba(11, 37, 69, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '30px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, width: '100%', maxWidth: 600, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
              {heroFeatures.map((feat, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 12px' }}>
                    {feat.icon}
                  </div>
                  <h4 style={{ color: 'white', margin: '0 0 6px', fontSize: 14, fontWeight: 700 }}>{feat.title}</h4>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: 11, lineHeight: 1.4 }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ MAIN CONTENT ============ */}
      <section style={{ maxWidth: 1400, margin: '0 auto', padding: '80px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 60 }}>
          
          {/* Left Column (Problem) */}
          <div style={{ flex: '1 1 350px', maxWidth: 420 }}>
            <Reveal>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ width: 24, height: 2, background: '#3b82f6' }}></span>
                <span style={{ color: '#1e3a8a', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>THE PROBLEM</span>
              </div>
              
              <h2 style={{ fontSize: 32, color: '#0b2545', margin: '0 0 20px', fontWeight: 800, lineHeight: 1.2 }}>
                All Your Government Services in One Place
              </h2>
              
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, marginBottom: 40 }}>
                The Unified Citizen Profile System makes it easier for you to apply, pay, and manage your government services. No more repeated visits or paperwork — just a single, secure profile that connects you to all departments.
              </p>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 8, padding: '20px 16px', flex: 1 }}>
                  <div style={{ color: '#1e3a8a', fontSize: 20, marginBottom: 12 }}>👥</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0b2545' }}>5x</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 1.3 }}>Faster service access</div>
                </div>
                <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 8, padding: '20px 16px', flex: 1 }}>
                  <div style={{ color: '#1e3a8a', fontSize: 20, marginBottom: 12 }}>🕒</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0b2545' }}>4 hrs</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 1.3 }}>Average waiting time per office visit</div>
                </div>
                <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 8, padding: '20px 16px', flex: 1 }}>
                  <div style={{ color: '#1e3a8a', fontSize: 20, marginBottom: 12 }}>📅</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0b2545' }}>Months</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 1.3 }}>To process a P.E.T. tax refund</div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Column (Your 6 Departments) */}
          <div style={{ flex: '2 1 700px' }}>
            <Reveal delay={0.1}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ width: 24, height: 2, background: '#3b82f6' }}></span>
                <span style={{ color: '#1e3a8a', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>GOVERNMENT DEPARTMENTS</span>
              </div>
              
              <h2 style={{ fontSize: 28, color: '#0b2545', margin: '0 0 12px', fontWeight: 800 }}>
                Explore Our Ministries & Departments
              </h2>
              <p style={{ fontSize: 14, color: '#475569', marginBottom: 30 }}>
                Access services from all government ministries and departments. Each department provides essential services to support your needs.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {departments.map((dept, i) => (
                  <Reveal key={dept.name} delay={0.05 * i}>
                    <Link to={dept.link} style={{ textDecoration: 'none' }}>
                      <div className="dept-card" style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                      }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid #e2e8f0' }}>
                           <img src={dept.logo} alt={dept.name} className="dept-logo" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = '🏛️'; }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <h4 style={{ margin: 0, fontSize: 14, color: '#0b2545', fontWeight: 700, lineHeight: 1.3 }}>{dept.name}</h4>
                            <span style={{ color: '#3b82f6', fontSize: 14 }}>→</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{dept.desc}</p>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>

              {/* View All Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                <Link to="/search" style={{
                  background: 'transparent',
                  border: '1px solid #cbd5e1',
                  color: '#0b2545',
                  padding: '12px 28px',
                  borderRadius: 999,
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e0f2fe'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 16 }}>▦</span> View All Ministries & Departments →
                </Link>
              </div>
            </Reveal>
          </div>

        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ background: 'white', borderTop: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 20 }}>
          <img src={assetPath('/assets/logos/lesotho-coat-of-arms.png')} alt="Coat of Arms" style={{ height: 50 }} />
          <img src={assetPath('/assets/images/flag-lesotho.png')} alt="Lesotho Flag" style={{ height: 50, borderRadius: 4 }} />
        </div>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          © 2026 {t('government_of_lesotho')} — {t('unified_citizen')} {t('profile_system')}
        </p>
        <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: 12 }}>
          {t('assignment_footer')}
        </p>
      </footer>
    </div>
  );
};

export default HomePage;