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
  const { t, language, changeLanguage, toggleSimpleMode } = useLanguage();

  const departments = [
    { logo: assetPath('/assets/logos/home-affairs.png'), name: t('ministry_home_affairs'), desc: t('ministry_home_affairs_desc'), link: '/home-affairs' },
    { logo: assetPath('/assets/logos/finance.png'), name: t('ministry_finance'), desc: t('ministry_finance_desc'), link: '/finance' },
    { logo: assetPath('/assets/logos/traffic.png'), name: t('ministry_traffic'), desc: t('ministry_traffic_desc'), link: '/traffic' },
    { logo: assetPath('/assets/logos/police.png'), name: t('ministry_police'), desc: t('ministry_police_desc'), link: '/police' },
    { logo: assetPath('/assets/logos/passport.png'), name: t('ministry_passport'), desc: t('ministry_passport_desc'), link: '/passport' },
    { logo: assetPath('/assets/logos/pensions.png'), name: t('ministry_pensions'), desc: t('ministry_pensions_desc'), link: '/pensions' },
  ];

  const heroFeatures = [
    { icon: '🛡️', title: 'Secure', desc: 'Your data is protected.' },
    { icon: '🕒', title: 'Convenient', desc: 'Access services anywhere.' },
    { icon: '👥', title: 'One Profile', desc: 'Use your verified identity.' },
    { icon: '⚡', title: 'Faster Service', desc: 'Less paperwork.' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f7ff', overflowX: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <style>{`
        @keyframes floatY { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .nav-link { transition: opacity 0.2s ease, transform 0.2s ease; }
        .nav-link:hover { opacity: 0.85; transform: translateY(-1px); }
        .dept-card { transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease, border-color 0.35s ease; }
        .dept-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0, 51, 102, 0.15); border-color: #93c5fd !important; }
        .dept-card:hover .dept-logo { transform: scale(1.1) rotate(-4deg); }
        .dept-logo { transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
      `}</style>

      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#0b2545', padding: '16px 20px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, flexShrink: 0 }}>
            <img src={assetPath('/assets/logos/lesotho-coat-of-arms.png')} alt="Lesotho" style={{ height: 50, width: 'auto' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 18, color: 'white', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '-0.5px' }}>
                {t('unified_citizen')} {t('profile_system')}
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                {t('government_of_lesotho')}
              </p>
            </div>
          </div>

          <div style={{ flex: 1, maxWidth: 500 }}>
            <SearchBar />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#94a3b8', fontSize: 16 }}>🌐</span>
              <select value={language} onChange={(e) => changeLanguage(e.target.value)} style={{ background: 'transparent', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, outline: 'none', cursor: 'pointer', appearance: 'none' }}>
                <option value="en" style={{ color: 'black' }}>EN</option>
                <option value="st" style={{ color: 'black' }}>ST</option>
              </select>
            </div>

            <button onClick={toggleSimpleMode} className="nav-link" style={{ background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              <span style={{ fontSize: 16 }}>🧍</span> Accessibility
            </button>

            <div style={{ height: 24, width: 1, background: 'rgba(255,255,255,0.2)' }}></div>

            <Link to="/staff-login" className="nav-link" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
              🏢 {t('staff_portal')}
            </Link>
            <Link to="/login" className="nav-link" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
              👤 {t('login')}
            </Link>
            <Link to="/register" className="nav-link" style={{ background: '#ffcc00', color: '#0b2545', padding: '10px 24px', borderRadius: 999, textDecoration: 'none', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>👥</span> {t('register')}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{ position: 'relative', background: '#0b2545', overflow: 'hidden', paddingBottom: 80 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${assetPath('/assets/images/government-building.jpg')})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #0b2545 0%, rgba(11,37,69,0.85) 50%, transparent 100%)' }} />
        
        <div style={{ position: 'relative', maxWidth: 1400, margin: '0 auto', padding: '60px 20px 0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 40, zIndex: 2 }}>
          <div style={{ flex: '1 1 500px', maxWidth: 650 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ width: 40, height: 2, background: '#ffcc00' }}></span>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>FAST · SECURE · ACCESSIBLE</span>
              <span style={{ width: 40, height: 1, background: 'rgba(255,255,255,0.3)' }}></span>
            </div>

            <h1 style={{ fontSize: 'clamp(40px, 5vw, 56px)', lineHeight: 1.1, color: 'white', margin: '0 0 20px', fontWeight: 700, letterSpacing: '-1px', minHeight: '1.2em' }}>
              <Typewriter text={t('submit_once_use_everywhere')} speed={50} />
            </h1>

            <p style={{ fontSize: 16, lineHeight: 1.6, color: '#cbd5e1', marginBottom: 40, maxWidth: 480, fontWeight: 400 }}>
              {t('hero_description')}
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link to="/register" style={{ background: '#ffcc00', color: '#0b2545', padding: '14px 28px', borderRadius: 999, textDecoration: 'none', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🔍</span> {t('get_started')}
              </Link>
              <Link to="/login" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '14px 28px', borderRadius: 999, textDecoration: 'none', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(10px)' }}>
                <span style={{ fontSize: 18 }}>👤</span> {t('already_registered')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section style={{ flex: 1, maxWidth: 1400, margin: '0 auto', padding: '80px 20px', width: '100%' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 60 }}>
          
          <div style={{ flex: '1 1 350px', maxWidth: 420 }}>
            <Reveal>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ width: 24, height: 2, background: '#3b82f6' }}></span>
                <span style={{ color: '#1e3a8a', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>{t('the_problem').toUpperCase()}</span>
              </div>
              
              <h2 style={{ fontSize: 32, color: '#0b2545', margin: '0 0 20px', fontWeight: 800, lineHeight: 1.2 }}>
                {t('problem_description')}
              </h2>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 8, padding: '20px 16px', flex: 1 }}>
                  <div style={{ color: '#1e3a8a', fontSize: 20, marginBottom: 12 }}>👥</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0b2545' }}>5x</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 1.3 }}>{t('problem_1')}</div>
                </div>
                <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 8, padding: '20px 16px', flex: 1 }}>
                  <div style={{ color: '#1e3a8a', fontSize: 20, marginBottom: 12 }}>🕒</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0b2545' }}>4 hrs</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 1.3 }}>{t('problem_2')}</div>
                </div>
                <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 8, padding: '20px 16px', flex: 1 }}>
                  <div style={{ color: '#1e3a8a', fontSize: 20, marginBottom: 12 }}>📅</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0b2545' }}>{t('months')}</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 1.3 }}>{t('problem_3')}</div>
                </div>
              </div>
            </Reveal>
          </div>

          <div style={{ flex: '2 1 700px' }}>
            <Reveal delay={0.1}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ width: 24, height: 2, background: '#3b82f6' }}></span>
                <span style={{ color: '#1e3a8a', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>GOVERNMENT DEPARTMENTS</span>
              </div>
              
              <h2 style={{ fontSize: 28, color: '#0b2545', margin: '0 0 12px', fontWeight: 800 }}>
                {t('integrated_departments')}
              </h2>
              <p style={{ fontSize: 14, color: '#475569', marginBottom: 30 }}>
                {t('one_profile_works')}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {departments.map((dept, i) => (
                  <Reveal key={dept.name} delay={0.05 * i}>
                    <Link to={dept.link} style={{ textDecoration: 'none' }}>
                      <div className="dept-card" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', height: '100%' }}>
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
            </Reveal>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ marginTop: 'auto' }}>
        <div style={{ height: 6, background: '#ffcc00', width: '100%' }} />
        <div style={{ background: '#0b2545', padding: '50px 20px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, marginBottom: 24 }}>
            <img src={assetPath('/assets/logos/lesotho-coat-of-arms.png')} alt="Lesotho Coat of Arms" style={{ height: 70, objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <div style={{ width: 2, height: 60, background: '#ffcc00' }} />
            <img src={assetPath('/assets/images/flag-lesotho.png')} alt="Lesotho Flag" style={{ height: 60, objectFit: 'contain', borderRadius: 4 }} onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{ color: 'white', fontSize: 18, fontWeight: 'normal', margin: '0 0 12px 0', letterSpacing: 0.5 }}>
              {t('footer_copyright').replace('{year}', new Date().getFullYear())}
            </h3>
            <p style={{ color: '#93c5fd', fontSize: 14, margin: 0 }}>
              {t('footer_assignment')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;