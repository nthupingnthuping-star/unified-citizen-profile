import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginCitizen, signInWithGoogle } from '../../firebase/auth'; 
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginCitizen(email, password);
      navigate('/dashboard');
    } catch (err) {
      let msg = err.message || 'Login failed.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Incorrect email or password.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      // This function creates the profile if they don't have one, or logs them in
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google login failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', position: 'relative',
      backgroundImage: `url(${assetPath('/assets/images/government-building.jpg')})`,
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'hidden',
    }}>
      
      {/* Background Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(0,51,102,0.92) 0%, rgba(0,85,170,0.85) 50%, rgba(0,51,102,0.92) 100%)',
        backgroundSize: '200% 200%', animation: 'gradientShift 12s ease infinite',
      }} />
      
      <style>{`
        @keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes cardEnter { from { opacity: 0; transform: translateY(18px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .auth-input { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .auth-input:focus { outline: none; border-color: #0055aa; box-shadow: 0 0 0 4px rgba(0, 85, 170, 0.12); }
      `}</style>

      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 20 }}>
        <LanguageToggleLight />
      </div>

      <div style={{
        position: 'relative', background: 'white', borderRadius: 16, padding: 40,
        maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
        animation: 'cardEnter 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both', zIndex: 2,
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={assetPath('/assets/logos/lesotho-coat-of-arms.png')} alt="Lesotho" style={{ height: 60, marginBottom: 12 }} onError={(e) => { e.target.style.display = 'none'; }} />
          <h1 style={{ color: '#003366', margin: 0, fontSize: 24 }}>Welcome Back</h1>
          <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>Log in to access your government services</p>
        </div>

        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

        {/* GOOGLE LOGIN BUTTON */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: 'white', color: '#3c4043', border: '1px solid #dadce0', padding: '12px 24px',
            borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: googleLoading ? 'not-allowed' : 'pointer',
            marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {googleLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        {/* DIVIDER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ fontSize: 13, color: '#94a3b8' }}>OR USE EMAIL</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Email Address</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="you@example.com"
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
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: loading ? '#999' : 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
              color: 'white', border: 'none', padding: '14px 24px', borderRadius: 999,
              fontSize: 16, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
          Don't have an account? <Link to="/register" style={{ color: '#0055aa', fontWeight: 'bold' }}>Register</Link>
        </p>
        
        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13 }}>
          <Link to="/" style={{ color: '#003366', fontWeight: 'bold', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </p>

      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 6 };
const inputStyle = { width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', background: 'white' };

export default CitizenLogin;