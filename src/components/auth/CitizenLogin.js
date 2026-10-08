import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginCitizen, resendVerificationEmail } from '../../firebase/auth';
import { useLanguage } from '../../i18n/LanguageContext';
import Alert from '../common/Alert';

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
      background: 'linear-gradient(135deg, #eef4fb 0%, #ffffff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 40,
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 8px 32px rgba(0, 51, 102, 0.12)',
      }}>
        <h1 style={{ color: '#003366', marginTop: 0, textAlign: 'center' }}>Welcome back</h1>
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
            borderRadius: 6,
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
                  borderRadius: 4,
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

        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#999' }}>
          Government staff?{' '}
          <Link to="/staff-login" style={{ color: '#003366', fontWeight: 'bold' }}>
            Staff Login →
          </Link>
        </p>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 6 };
const inputStyle = {
  width: '100%',
  padding: 10,
  border: '1px solid #ccc',
  borderRadius: 6,
  fontSize: 14,
  boxSizing: 'border-box',
};

export default CitizenLogin;