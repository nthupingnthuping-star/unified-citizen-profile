import { Link } from 'react-router-dom';

const HomePage = () => {
  const departments = [
    { logo: '/assets/logos/home-affairs.png', name: 'Home Affairs', desc: 'Identity verification & citizenship' },
    { logo: '/assets/logos/finance.png', name: 'Finance / RSL', desc: 'Tax clearance & PAYE refunds' },
    { logo: '/assets/logos/traffic.png', name: 'Traffic', desc: "Driver's licenses & traffic fines" },
    { logo: '/assets/logos/police.png', name: 'Police', desc: 'Clearances & crime reports' },
    { logo: '/assets/logos/passport.png', name: 'Passport', desc: 'New passports & renewals' },
    { logo: '/assets/logos/pensions.png', name: 'Pensions', desc: 'Pension registration & payouts' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* HEADER */}
      <header style={{ background: '#003366', color: 'white', padding: '15px 30px' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <img
              src="/assets/logos/lesotho-coat-of-arms.png"
              alt="Lesotho Coat of Arms"
              style={{ height: 55, width: 'auto' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <h1 style={{ margin: 0, fontSize: 20, color: 'white' }}>Unified Citizen Profile System</h1>
              <p style={{ margin: 0, fontSize: 12, color: '#b3d4ff' }}>Government of Lesotho</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link to="/login" style={{
              color: 'white', textDecoration: 'none',
              fontSize: 14, fontWeight: 'bold',
            }}>Login</Link>
            <Link to="/register" style={{
              background: '#ffcc00', color: '#003366', padding: '8px 16px',
              borderRadius: 4, textDecoration: 'none', fontWeight: 'bold', fontSize: 14,
            }}>Register</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={{
        position: 'relative',
        backgroundImage: 'url(/assets/images/government-building.jpg)',
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
            src="/assets/logos/lesotho-coat-of-arms.png"
            alt="Lesotho"
            style={{ height: 100, marginBottom: 20 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 style={{ fontSize: 46, margin: '0 0 20px 0', color: 'white', lineHeight: 1.2 }}>
            Submit Once. Use Everywhere.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: '#e0e8f5' }}>
            Verify your identity once with Home Affairs, then access all government services —
            Finance, Traffic, Police, Passport, and Pensions — without resubmitting documents.
          </p>
          <div style={{ marginTop: 40 }}>
            <Link to="/register" style={{
              background: '#ffcc00', color: '#003366', padding: '15px 40px',
              borderRadius: 6, textDecoration: 'none', fontWeight: 'bold', fontSize: 16,
              marginRight: 15, display: 'inline-block',
            }}>Get Started</Link>
            <Link to="/login" style={{
              background: 'transparent', color: 'white', padding: '15px 40px',
              borderRadius: 6, textDecoration: 'none', fontWeight: 'bold', fontSize: 16,
              border: '2px solid white', display: 'inline-block',
            }}>Already Registered</Link>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section style={{ padding: '60px 30px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, color: '#003366' }}>The Problem</h2>
          <p style={{
            textAlign: 'center', color: '#555', fontSize: 16,
            maxWidth: 700, margin: '20px auto',
          }}>
            Basotho citizens face repeated document submission, separate visits to multiple
            government offices, and long queues — all because departments don't share information.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 40 }}>
            <div style={{
              padding: 25, background: '#f9f9f9', borderRadius: 8,
              borderLeft: '4px solid #cc0000',
            }}>
              <h3 style={{ color: '#cc0000', marginTop: 0, fontSize: 32 }}>3–5×</h3>
              <p style={{ color: '#555', margin: 0 }}>
                You submit the same ID to different offices
              </p>
            </div>
            <div style={{
              padding: 25, background: '#f9f9f9', borderRadius: 8,
              borderLeft: '4px solid #cc0000',
            }}>
              <h3 style={{ color: '#cc0000', marginTop: 0, fontSize: 32 }}>2–4 hrs</h3>
              <p style={{ color: '#555', margin: 0 }}>
                Average waiting time per office visit
              </p>
            </div>
            <div style={{
              padding: 25, background: '#f9f9f9', borderRadius: 8,
              borderLeft: '4px solid #cc0000',
            }}>
              <h3 style={{ color: '#cc0000', marginTop: 0, fontSize: 32 }}>Months</h3>
              <p style={{ color: '#555', margin: 0 }}>
                To process a PAYE tax refund
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section style={{ padding: '60px 30px', background: '#f5f5f5' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, color: '#003366' }}>Our Solution</h2>
          <p style={{
            textAlign: 'center', color: '#555', fontSize: 16,
            maxWidth: 700, margin: '20px auto',
          }}>
            One verified citizen profile, accessible to authorized departments only.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 40 }}>
            <div style={{ padding: 25, background: 'white', borderRadius: 8, textAlign: 'center' }}>
              <img
                src="/assets/images/citizen-card.png"
                alt="Verify"
                style={{ height: 100, marginBottom: 15 }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <h3 style={{ color: '#003366' }}>Verify Once</h3>
              <p style={{ color: '#555' }}>Visit Home Affairs once to verify your identity</p>
            </div>
            <div style={{ padding: 25, background: 'white', borderRadius: 8, textAlign: 'center' }}>
              <img
                src="/assets/icons/verified-badge.svg"
                alt="Control"
                style={{ height: 100, marginBottom: 15 }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <h3 style={{ color: '#003366' }}>Control Access</h3>
              <p style={{ color: '#555' }}>See exactly which department accessed your data</p>
            </div>
            <div style={{ padding: 25, background: 'white', borderRadius: 8, textAlign: 'center' }}>
              <img
                src="/assets/images/flag-lesotho.png"
                alt="Lesotho"
                style={{ height: 100, marginBottom: 15 }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <h3 style={{ color: '#003366' }}>Access Instantly</h3>
              <p style={{ color: '#555' }}>Apply online — no queues, no photocopies</p>
            </div>
          </div>
        </div>
      </section>

      {/* DEPARTMENTS */}
      <section style={{ padding: '60px 30px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, color: '#003366' }}>
            Integrated Departments
          </h2>
          <p style={{
            textAlign: 'center', color: '#555', fontSize: 16, marginBottom: 40,
          }}>
            One profile works across all these ministries
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {departments.map((dept) => (
              <div key={dept.name} style={{
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
                    alt={dept.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = '🏛️'; }}
                  />
                </div>
                <h3 style={{ color: '#003366', margin: '10px 0' }}>{dept.name}</h3>
                <p style={{ color: '#555', margin: 0, fontSize: 14 }}>{dept.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MID-PAGE CTA WITH BACKGROUND */}
      <section style={{
        padding: '80px 30px',
        backgroundImage: 'url(/assets/images/government-building.jpg)',
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
            Built for All Basotho
          </h2>
          <p style={{ fontSize: 16, color: '#e0e8f5' }}>
            From Maseru to Mafeteng, from remote villages to city centres —
            one profile serves every citizen.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{
        padding: '60px 30px', background: '#003366',
        color: 'white', textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 32, margin: '0 0 20px 0', color: 'white' }}>
          Ready to Get Started?
        </h2>
        <p style={{ fontSize: 16, color: '#b3d4ff', marginBottom: 30 }}>
          Register today and never carry photocopies again
        </p>
        <Link to="/register" style={{
          background: '#ffcc00', color: '#003366', padding: '15px 40px',
          borderRadius: 6, textDecoration: 'none', fontWeight: 'bold', fontSize: 16,
          display: 'inline-block',
        }}>Create Your Profile</Link>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: '#001a33', color: 'white',
        padding: 30, textAlign: 'center',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'center',
          gap: 20, marginBottom: 15,
        }}>
          <img src="/assets/logos/lesotho-coat-of-arms.png" alt="Coat of Arms"
            style={{ height: 45 }}
            onError={(e) => { e.target.style.display = 'none'; }} />
          <img src="/assets/images/flag-lesotho.png" alt="Lesotho Flag"
            style={{ height: 45 }}
            onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
        <p style={{ margin: 0, color: '#b3d4ff', fontSize: 14 }}>
          © 2026 Government of Lesotho — Unified Citizen Profile System
        </p>
        <p style={{ margin: '10px 0 0 0', color: '#8899bb', fontSize: 12 }}>
          A prototype designed for the HCI assignment at Limkokwing University
        </p>
      </footer>
    </div>
  );
};

export default HomePage;