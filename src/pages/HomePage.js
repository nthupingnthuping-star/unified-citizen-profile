import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { assetPath } from '../utils/assetPath';
import LanguageToggleLight from '../components/common/LanguageToggleLight';

// ============================================================
// SCROLL REVEAL HOOK
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

// ============================================================
// ANIMATED COUNTER
// ============================================================
const CountUp = ({ end, duration = 1500, suffix = '' }) => {
  const [n, setN] = useState(0);
  const [ref, visible] = useReveal();

  useEffect(() => {
    if (!visible) return;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.floor(eased * end));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, end, duration]);

  return <span ref={ref}>{n}{suffix}</span>;
};

// ============================================================
// REVEAL WRAPPER
// ============================================================
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

// ============================================================
// TYPEWRITER
// ============================================================
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

// ============================================================
// HOME PAGE
// ============================================================
const HomePage = () => {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const departments = [
    { logo: assetPath('/assets/logos/home-affairs.png'), nameKey: 'ministry_home_affairs', descKey: 'ministry_home_affairs_desc', accent: '#003366' },
    { logo: assetPath('/assets/logos/finance.png'), nameKey: 'ministry_finance', descKey: 'ministry_finance_desc', accent: '#006600' },
    { logo: assetPath('/assets/logos/traffic.png'), nameKey: 'ministry_traffic', descKey: 'ministry_traffic_desc', accent: '#7a5a00' },
    { logo: assetPath('/assets/logos/police.png'), nameKey: 'ministry_police', descKey: 'ministry_police_desc', accent: '#8b0000' },
    { logo: assetPath('/assets/logos/passport.png'), nameKey: 'ministry_passport', descKey: 'ministry_passport_desc', accent: '#0055aa' },
    { logo: assetPath('/assets/logos/pensions.png'), nameKey: 'ministry_pensions', descKey: 'ministry_pensions_desc', accent: '#663399' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', overflowX: 'hidden' }}>
      {/* ============ GLOBAL STYLES ============ */}
      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 204, 0, 0.6); }
          50% { box-shadow: 0 0 0 18px rgba(255, 204, 0, 0); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        .hero-cta {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .hero-cta:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
        }
        .dept-card {
          transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1),
                      box-shadow 0.35s ease,
                      border-color 0.35s ease;
        }
        .dept-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 51, 102, 0.18);
        }
        .dept-card:hover .dept-logo {
          transform: scale(1.1) rotate(-4deg);
        }
        .dept-logo {
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .nav-link {
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .nav-link:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }
      `}</style>

      {/* ============ HEADER ============ */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(0, 51, 102, 0.95)' : '#003366',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        color: 'white',
        padding: scrolled ? '10px 30px' : '15px 30px',
        transition: 'all 0.3s ease',
        boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.15)' : 'none',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <img
              src={assetPath('/assets/logos/lesotho-coat-of-arms.png')}
              alt="Lesotho Coat of Arms"
              style={{ height: scrolled ? 45 : 55, width: 'auto', transition: 'height 0.3s ease' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <h1 style={{ margin: 0, fontSize: 20, color: 'white' }}>
                {t('unified_citizen')} {t('profile_system')}
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: '#b3d4ff' }}>
                {t('government_of_lesotho')}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, flexWrap: 'wrap' }}>
            <LanguageToggleLight />

            <Link to="/staff-login" className="nav-link" style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 'bold',
              padding: '8px 16px',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 4,
            }}>
              Staff Portal
            </Link>

            <Link to="/login" className="nav-link" style={{
              color: 'white', textDecoration: 'none',
              fontSize: 14, fontWeight: 'bold',
            }}>
              {t('login')}
            </Link>

            <Link to="/register" className="nav-link" style={{
              background: '#ffcc00', color: '#003366', padding: '8px 16px',
              borderRadius: 4, textDecoration: 'none', fontWeight: 'bold', fontSize: 14,
            }}>
              {t('register')}
            </Link>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section style={{
        position: 'relative',
        backgroundImage: `url(${assetPath('/assets/images/government-building.jpg')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: 'white',
        padding: '140px 30px 120px',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(0,51,102,0.92) 0%, rgba(0,85,170,0.85) 50%, rgba(0,51,102,0.92) 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 12s ease infinite',
        }} />

        <div style={{
          position: 'absolute', top: '15%', left: '8%',
          width: 180, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,204,0,0.25) 0%, transparent 70%)',
          animation: 'floatY 6s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '10%',
          width: 240, height: 240, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(179,212,255,0.2) 0%, transparent 70%)',
          animation: 'floatY 8s ease-in-out infinite reverse',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <img
            src={assetPath('/assets/logos/lesotho-coat-of-arms.png')}
            alt="Lesotho"
            style={{
              height: 100, marginBottom: 20,
              animation: 'floatIcon 4s ease-in-out infinite',
              filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))',
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />

          <div style={{
            display: 'inline-block',
            background: 'rgba(255,204,0,0.15)',
            border: '1px solid rgba(255,204,0,0.5)',
            color: '#ffcc00',
            padding: '6px 16px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 'bold',
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            🇱🇸 {t('government_of_lesotho')}
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 52px)',
            margin: '0 0 20px 0',
            color: 'white',
            lineHeight: 1.15,
            minHeight: '1.2em',
          }}>
            <Typewriter text={t('submit_once_use_everywhere')} speed={50} />
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            lineHeight: 1.7,
            color: '#e0e8f5',
            maxWidth: 700,
            margin: '0 auto',
          }}>
            {t('hero_description')}
          </p>

          <div style={{ marginTop: 40, display: 'flex', gap: 15, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="hero-cta" style={{
              background: '#ffcc00', color: '#003366', padding: '15px 40px',
              borderRadius: 6, textDecoration: 'none', fontWeight: 'bold', fontSize: 16,
              display: 'inline-block',
              animation: 'pulseGlow 2.4s ease-in-out infinite',
            }}>{t('get_started')}</Link>
            <Link to="/login" className="hero-cta" style={{
              background: 'rgba(255,255,255,0.1)', color: 'white', padding: '15px 40px',
              borderRadius: 6, textDecoration: 'none', fontWeight: 'bold', fontSize: 16,
              border: '2px solid white', display: 'inline-block',
              backdropFilter: 'blur(6px)',
            }}>{t('already_registered')}</Link>
          </div>

          <div style={{
            marginTop: 60,
            animation: 'floatY 2s ease-in-out infinite',
            opacity: 0.7,
            fontSize: 24,
          }}>↓</div>
        </div>
      </section>

      {/* ============ PROBLEM ============ */}
      <section style={{ padding: '80px 30px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Reveal>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px, 4vw, 36px)', color: '#003366', marginBottom: 12 }}>
              {t('the_problem')}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{
              textAlign: 'center', color: '#555', fontSize: 16,
              maxWidth: 700, margin: '20px auto',
            }}>
              {t('problem_description')}
            </p>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginTop: 40 }}>
            {[
              { value: <CountUp end={5} suffix="×" />, label: t('problem_1'), delay: 0.15 },
              { value: <CountUp end={4} suffix=" hrs" />, label: t('problem_2'), delay: 0.3 },
              { value: t('months'), label: t('problem_3'), delay: 0.45 },
            ].map((item, i) => (
              <Reveal key={i} delay={item.delay}>
                <div
                  style={{
                    padding: 28,
                    background: '#f9f9f9',
                    borderRadius: 12,
                    borderLeft: '5px solid #cc0000',
                    height: '100%',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 16px 32px rgba(204, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <h3 style={{ color: '#cc0000', marginTop: 0, fontSize: 40, marginBottom: 8 }}>
                    {item.value}
                  </h3>
                  <p style={{ color: '#555', margin: 0, fontSize: 15, lineHeight: 1.5 }}>{item.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SOLUTION ============ */}
      <section style={{ padding: '80px 30px', background: 'linear-gradient(180deg, #f5f5f5 0%, #eaf1fb 100%)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Reveal>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px, 4vw, 36px)', color: '#003366', marginBottom: 12 }}>
              {t('our_solution')}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{
              textAlign: 'center', color: '#555', fontSize: 16,
              maxWidth: 700, margin: '20px auto',
            }}>
              {t('solution_description')}
            </p>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginTop: 40 }}>
            {[
              { icon: '🪪', titleKey: 'verify_once', descKey: 'verify_once_desc', delay: 0.15 },
              { icon: '🔒', titleKey: 'control_access', descKey: 'control_access_desc', delay: 0.3 },
              { icon: '🇱🇸', titleKey: 'access_instantly', descKey: 'access_instantly_desc', delay: 0.45 },
            ].map((s) => (
              <Reveal key={s.titleKey} delay={s.delay}>
                <div
                  style={{
                    padding: 28,
                    background: 'white',
                    borderRadius: 12,
                    textAlign: 'center',
                    height: '100%',
                    boxShadow: '0 4px 16px rgba(0, 51, 102, 0.06)',
                    transition: 'transform 0.35s ease, box-shadow 0.35s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 51, 102, 0.14)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 51, 102, 0.06)';
                  }}
                >
                  <div style={{
                    fontSize: 72,
                    marginBottom: 15,
                    lineHeight: 1,
                    display: 'inline-block',
                    animation: 'floatIcon 3.5s ease-in-out infinite',
                  }}>{s.icon}</div>
                  <h3 style={{ color: '#003366', margin: '10px 0' }}>{t(s.titleKey)}</h3>
                  <p style={{ color: '#555', margin: 0, fontSize: 14, lineHeight: 1.6 }}>{t(s.descKey)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DEPARTMENTS ============ */}
      <section style={{ padding: '80px 30px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px, 4vw, 36px)', color: '#003366' }}>
              {t('integrated_departments')}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ textAlign: 'center', color: '#555', fontSize: 16, marginBottom: 40 }}>
              {t('one_profile_works')}
            </p>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {departments.map((dept, i) => (
              <Reveal key={dept.nameKey} delay={0.06 * i}>
                <div
                  className="dept-card"
                  style={{
                    padding: 28,
                    border: '1px solid #e0e8f0',
                    borderRadius: 14,
                    background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 90, height: 90, borderRadius: '50%',
                    background: 'white', padding: 12, marginBottom: 15,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 6px 18px ${dept.accent}22`,
                    border: `2px solid ${dept.accent}22`,
                  }}>
                    <img
                      className="dept-logo"
                      src={dept.logo}
                      alt={t(dept.nameKey)}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = '🏛️'; }}
                    />
                  </div>
                  <h3 style={{ color: '#003366', margin: '10px 0' }}>{t(dept.nameKey)}</h3>
                  <p style={{ color: '#555', margin: 0, fontSize: 14, lineHeight: 1.5 }}>{t(dept.descKey)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ MISSION BANNER ============ */}
      <section style={{
        padding: '100px 30px',
        backgroundImage: `url(${assetPath('/assets/images/government-building.jpg')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(0,51,102,0.9) 0%, rgba(0,85,170,0.85) 100%)',
        }} />
        <Reveal>
          <div style={{
            position: 'relative', maxWidth: 800, margin: '0 auto',
            color: 'white', textAlign: 'center',
          }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', marginBottom: 20, color: 'white' }}>
              {t('built_for_all_basotho')}
            </h2>
            <p style={{ fontSize: 16, color: '#e0e8f5', lineHeight: 1.7 }}>
              {t('built_for_all_basotho_desc')}
            </p>
          </div>
        </Reveal>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section style={{
        padding: '80px 30px',
        background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,204,0,0.2) 0%, transparent 70%)',
          animation: 'floatY 7s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <Reveal>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', margin: '0 0 20px 0', color: 'white', position: 'relative' }}>
            {t('ready_to_get_started')}
          </h2>
          <p style={{ fontSize: 16, color: '#b3d4ff', marginBottom: 30, position: 'relative' }}>
            {t('register_today')}
          </p>
          <Link to="/register" className="hero-cta" style={{
            background: '#ffcc00', color: '#003366', padding: '15px 40px',
            borderRadius: 6, textDecoration: 'none', fontWeight: 'bold', fontSize: 16,
            display: 'inline-block',
            position: 'relative',
            animation: 'pulseGlow 2.4s ease-in-out infinite',
          }}>{t('create_your_profile')}</Link>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{
        background: '#001a33', color: 'white',
        padding: 30, textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 15 }}>
          <img
            src={assetPath('/assets/logos/lesotho-coat-of-arms.png')}
            alt="Coat of Arms"
            style={{ height: 45 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <img
            src={assetPath('/assets/images/flag-lesotho.png')}
            alt="Lesotho Flag"
            style={{ height: 45 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        <p style={{ margin: 0, color: '#b3d4ff', fontSize: 14 }}>
          © 2026 {t('government_of_lesotho')} — {t('unified_citizen')} {t('profile_system')}
        </p>
        <p style={{ margin: '10px 0 0 0', color: '#8899bb', fontSize: 12 }}>
          {t('assignment_footer')}
        </p>
      </footer>
    </div>
  );
};

export default HomePage;