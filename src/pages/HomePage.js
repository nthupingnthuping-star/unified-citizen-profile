import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { assetPath } from '../utils/assetPath';
import LanguageToggleLight from '../components/common/LanguageToggleLight';

const HomePage = () => {
  const { t } = useLanguage();

  const departments = [
    { logo: assetPath('/assets/logos/home-affairs.png'), nameKey: 'ministry_home_affairs', descKey: 'ministry_home_affairs_desc' },
    { logo: assetPath('/assets/logos/finance.png'), nameKey: 'ministry_finance', descKey: 'ministry_finance_desc' },
    { logo: assetPath('/assets/logos/traffic.png'), nameKey: 'ministry_traffic', descKey: 'ministry_traffic_desc' },
    { logo: assetPath('/assets/logos/police.png'), nameKey: 'ministry_police', descKey: 'ministry_police_desc' },
    { logo: assetPath('/assets/logos/passport.png'), nameKey: 'ministry_passport', descKey: 'ministry_passport_desc' },
    { logo: assetPath('/assets/logos/pensions.png'), nameKey: 'ministry_pensions', descKey: 'ministry_pensions_desc' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <header style={{ background: '#003366', color: 'white', padding: '15px 30px' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <img
              src={assetPath('/assets/logos/lesotho-coat-of-arms.png')}
              alt="Lesotho Coat of Arms"
              style={{ height: 55, width: 'auto' }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <LanguageToggleLight />

            <Link to="/staff-login" style={{
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

            <Link to="/login" style={{
              color: 'white', textDecoration: 'none',
              fontSize: 14, fontWeight: 'bold',
            }}>
              {t('login')}
            </Link>

            <Link to="/register" style={{
              background: '#ffcc00', color: '#003366', padding: '8px 16px',
              borderRadius: 4, textDecoration: 'none', fontWeight: 'bold', fontSize: 14,
            }}>
              {t('register')}
            </Link>
          </div>
        </div>
      </header>

      <section style={{
        position: 'relative',
        backgroundImage: `url(${assetPath('/assets/images/government-building.jpg')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        padding: '120px 30px',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(135deg, rgba(0,51,102,0.92) 0%, rgba(0,85,170,0.85) 100%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <img
            src={assetPath('/assets/logos/lesotho-coat-of-arms.png')}
            alt="Lesotho"
            style={{ height: 100, marginBottom: 20 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 style={{ fontSize: 46, margin: '0 0 20px 0', color: 'white', lineHeight: 1.2 }}>
            {t('submit_once_use_everywhere')}
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: '#e0e8f5' }}>
            {t('hero_description')}
          </p>
          <div style={{ marginTop: 40 }}>
            <Link to="/register" style={{
              background: '#ffcc00', color: '#003366', padding: '15px 40px',
              borderRadius: 6, textDecoration: 'none', fontWeight: 'bold', fontSize: 16,
              marginRight: 15, display: 'inline-block',
            }}>{t('get_started')}</Link>
            <Link to="/login" style={{
              background: 'transparent', color: 'white', padding: '15px 40px',
              borderRadius: 6, textDecoration: 'none', fontWeight: 'bold', fontSize: 16,
              border: '2px solid white', display: 'inline-block',
            }}>{t('already_registered')}</Link>
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 30px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, color: '#003366' }}>
            {t('the_problem')}
          </h2>
          <p style={{
            textAlign: 'center', color: '#555', fontSize: 16,
            maxWidth: 700, margin: '20px auto',
          }}>
            {t('problem_description')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 40 }}>
            <div style={{ padding: 25, background: '#f9f9f9', borderRadius: 8, borderLeft: '4px solid #cc0000' }}>
              <h3 style={{ color: '#cc0000', marginTop: 0, fontSize: 32 }}>3–5×</h3>
              <p style={{ color: '#555', margin: 0 }}>{t('problem_1')}</p>
            </div>
            <div style={{ padding: 25, background: '#f9f9f9', borderRadius: 8, borderLeft: '4px solid #cc0000' }}>
              <h3 style={{ color: '#cc0000', marginTop: 0, fontSize: 32 }}>2–4 hrs</h3>
              <p style={{ color: '#555', margin: 0 }}>{t('problem_2')}</p>
            </div>
            <div style={{ padding: 25, background: '#f9f9f9', borderRadius: 8, borderLeft: '4px solid #cc0000' }}>
              <h3 style={{ color: '#cc0000', marginTop: 0, fontSize: 32 }}>{t('months')}</h3>
              <p style={{ color: '#555', margin: 0 }}>{t('problem_3')}</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 30px', background: '#f5f5f5' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, color: '#003366' }}>
            {t('our_solution')}
          </h2>
          <p style={{
            textAlign: 'center', color: '#555', fontSize: 16,
            maxWidth: 700, margin: '20px auto',
          }}>
            {t('solution_description')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 40 }}>
            <div style={{ padding: 25, background: 'white', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 72, marginBottom: 15, lineHeight: 1 }}>🪪</div>
              <h3 style={{ color: '#003366' }}>{t('verify_once')}</h3>
              <p style={{ color: '#555' }}>{t('verify_once_desc')}</p>
            </div>
            <div style={{ padding: 25, background: 'white', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 72, marginBottom: 15, lineHeight: 1 }}>🔒</div>
              <h3 style={{ color: '#003366' }}>{t('control_access')}</h3>
              <p style={{ color: '#555' }}>{t('control_access_desc')}</p>
            </div>
            <div style={{ padding: 25, background: 'white', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 72, marginBottom: 15, lineHeight: 1 }}>🇱🇸</div>
              <h3 style={{ color: '#003366' }}>{t('access_instantly')}</h3>
              <p style={{ color: '#555' }}>{t('access_instantly_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 30px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, color: '#003366' }}>
            {t('integrated_departments')}
          </h2>
          <p style={{ textAlign: 'center', color: '#555', fontSize: 16, marginBottom: 40 }}>
            {t('one_profile_works')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {departments.map((dept) => (
              <div key={dept.nameKey} style={{
                padding: 25, border: '1px solid #ddd', borderRadius: 8,
                background: '#fafafa', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <div style={{
                  width: 90, height: 90, borderRadius: '50%',
                  background: 'white', padding: 10, marginBottom: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}>
                  <img
                    src={dept.logo}
                    alt={t(dept.nameKey)}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = '🏛️'; }}
                  />
                </div>
                <h3 style={{ color: '#003366', margin: '10px 0' }}>{t(dept.nameKey)}</h3>
                <p style={{ color: '#555', margin: 0, fontSize: 14 }}>{t(dept.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{
        padding: '80px 30px',
        backgroundImage: `url(${assetPath('/assets/images/government-building.jpg')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,51,102,0.85)',
        }} />
        <div style={{
          position: 'relative', maxWidth: 800, margin: '0 auto',
          color: 'white', textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 32, marginBottom: 20, color: 'white' }}>
            {t('built_for_all_basotho')}
          </h2>
          <p style={{ fontSize: 16, color: '#e0e8f5' }}>
            {t('built_for_all_basotho_desc')}
          </p>
        </div>
      </section>

      <section style={{ padding: '60px 30px', background: '#003366', color: 'white', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, margin: '0 0 20px 0', color: 'white' }}>
          {t('ready_to_get_started')}
        </h2>
        <p style={{ fontSize: 16, color: '#b3d4ff', marginBottom: 30 }}>
          {t('register_today')}
        </p>
        <Link to="/register" style={{
          background: '#ffcc00', color: '#003366', padding: '15px 40px',
          borderRadius: 6, textDecoration: 'none', fontWeight: 'bold', fontSize: 16,
          display: 'inline-block',
        }}>{t('create_your_profile')}</Link>
      </section>

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