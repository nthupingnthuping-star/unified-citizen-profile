import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginCitizen, resendVerificationEmail } from '../../firebase/auth';
import { useLanguage } from '../../i18n/LanguageContext';
import Alert from '../common/Alert';
import { assetPath } from '../../utils/assetPath';
import LanguageToggleLight from '../common/LanguageToggleLight';

const CitizenLogin = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setResent(false);
    setLoading(true);

    try {
      await loginCitizen(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-not-verified') {
        setNeedsVerification(true);
        setError(err.message);
      } else if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    try {
      await resendVerificationEmail(email, password);
      setResent(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      backgroundImage: `url(${assetPath('/assets/images/government-building.jpg')})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      overflow: 'hidden',
    }}>
      {/* Animated gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(0,51,102,0.92) 0%, rgba(0,85,170,0.85) 50%, rgba(0,51,102,0.92) 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradientShift 12s ease infinite',
      }} />

      {/* Floating orbs */}
      <div style={{
        position: 'absolute', top: '12%', left: '8%',
        width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,204,0,0.22) 0%, transparent 70%)',
        animation: 'floatY 7s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '10%',
        width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(179,212,255,0.2) 0%, transparent 70%)',
        animation: 'floatY 9s ease-in-out infinite reverse',
        pointerEvents: 'none',
      }} />

      {/* Top bar: Language + Back to Home */}
      <div style={{
        position: 'absolute', top: 20, right: 20, zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <LanguageToggleLight />
        <Link to="/" style={{
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.35)',
          color: 'white',
          padding: '7px 16px',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 'bold',
          textDecoration: 'none',
          backdropFilter: 'blur(8px)',
          transition: 'transform 0.2s ease, background 0.2s ease',
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.22)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ← {t('back_to_home') || 'Back to Home'}
        </Link>
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-14px); }
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0%   { left: -100%; }
          60%  { left: 100%; }
          100% { left: 100%; }
        }
        .auth-card {
          animation: cardEnter 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .auth-input {
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .auth-input:focus {
          outline: none;
          border-color: #0055aa;
          box-shadow: 0 0 0 4px rgba(0, 85, 170, 0.12);
          background: #fbfdff;
        }
        .auth-submit {
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .auth-submit:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0, 51, 102, 0.32) !important;
        }
        .auth-submit:not(:disabled)::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>

      {/* CARD */}
      <div className="auth-card" style={{
        position: 'relative',
        background: 'white',
        borderRadius: 16,
        padding: 40,
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
        zIndex: 2,
      }}>
        {/* Coat of arms */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img
            src={assetPath('/assets/logos/lesotho-coat-of-arms.png')}
            alt="Lesotho"
            style={{
              height: 70,
              marginBottom: 10,
              filter: 'drop-shadow(0 4px 12px rgba(0, 51, 102, 0.18))',
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        <h1 style={{
          color: '#003366',
          marginTop: 0,
          textAlign: 'center',
          fontSize: 28,
          letterSpacing: '-0.02em',
        }}>
          {t('welcome_back') || 'Welcome back'}
        </h1>
        <p style={{ color: '#666', fontSize: 14, textAlign: 'center', marginTop: 0 }}>
          Log in to your citizen profile
        </p>

        {error && !needsVerification && (
          <Alert type="error" onClose={() => setError('')}>{error}</Alert>
        )}

        {needsVerification && (
          <div style={{
            background: '#fff8e0',
            border: '1px solid #ffe08a',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            fontSize: 13,
            color: '#7a5a00',
          }}>
            <strong>Email not verified</strong>
            <p style={{ margin: '8px 0 12px 0' }}>{error}</p>
            {resent ? (
              <div style={{ color: '#006600', fontWeight: 'bold' }}>
                ✓ Verification email sent again. Check your inbox.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: resending ? '#999' : '#003366',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 'bold',
                  cursor: resending ? 'not-allowed' : 'pointer',
                }}
              >
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Email</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Password</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit"
            style={{
              width: '100%',
              background: loading ? '#999' : 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 24px',
              borderRadius: 999,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(0, 51, 102, 0.25)',
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#0055aa', fontWeight: 'bold' }}>
            Register
          </Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13 }}>
          <Link to="/" style={{ color: '#003366', fontWeight: 'bold', textDecoration: 'none' }}>
            ← {t('back_to_home') || 'Back to Home'}
          </Link>
        </p>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 6 };
const inputStyle = {
  width: '100%',
  padding: 12,
  border: '1px solid #ccc',
  borderRadius: 8,
  fontSize: 14,
  boxSizing: 'border-box',
  background: 'white',
};

export default CitizenLogin;