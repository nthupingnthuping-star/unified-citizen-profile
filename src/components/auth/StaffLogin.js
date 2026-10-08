import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginStaff } from '../../firebase/auth';
import { useLanguage } from '../../i18n/LanguageContext';
import { assetPath } from '../../utils/assetPath';
import LanguageToggleLight from '../common/LanguageToggleLight';
import Alert from '../common/Alert';
import Button from '../common/Button';

const StaffLogin = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginStaff(formData.email, formData.password);
      navigate('/staff-dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
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
        background: 'linear-gradient(135deg, rgba(0,26,51,0.94) 0%, rgba(0,51,102,0.9) 50%, rgba(0,26,51,0.94) 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradientShift 12s ease infinite',
      }} />

      {/* Floating orbs */}
      <div style={{
        position: 'absolute', top: '12%', left: '10%',
        width: 240, height: 240, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,204,0,0.2) 0%, transparent 70%)',
        animation: 'floatY 7s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '8%', right: '8%',
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(179,212,255,0.18) 0%, transparent 70%)',
        animation: 'floatY 9s ease-in-out infinite reverse',
        pointerEvents: 'none',
      }} />

      {/* Language toggle + Back to Home */}
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

      {/* Keyframes */}
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
        .auth-input {
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .auth-input:focus {
          outline: none;
          border-color: #0055aa;
          box-shadow: 0 0 0 4px rgba(0, 85, 170, 0.12);
          background: #fbfdff;
        }
      `}</style>

      {/* CARD */}
      <div style={{
        position: 'relative',
        maxWidth: 440,
        width: '100%',
        background: 'white',
        borderRadius: 16,
        padding: 40,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        animation: 'cardEnter 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        zIndex: 2,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <img
            src={assetPath('/assets/logos/lesotho-coat-of-arms.png')}
            alt="Lesotho"
            style={{
              height: 80,
              marginBottom: 10,
              filter: 'drop-shadow(0 4px 12px rgba(0, 51, 102, 0.18))',
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 style={{ color: '#003366', margin: 0, fontSize: 24, letterSpacing: '-0.02em' }}>
            {t('staff_login') || 'Staff Login'}
          </h1>
          <p style={{ color: '#666', fontSize: 13, margin: '5px 0 0 0' }}>
            {t('staff_portal') || 'Staff Portal'}
          </p>
        </div>

        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label style={labelStyle}>{t('email') || 'Email'}</label>
            <input
              className="auth-input"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="officer@ucps.gov.ls"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{t('password') || 'Password'}</label>
            <input
              className="auth-input"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <Button type="submit" disabled={loading} fullWidth size="large">
            {loading ? (t('logging_in') || 'Logging in...') : (t('login') || 'Login')}
          </Button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13 }}>
          <Link to="/login" style={{ color: '#003366', textDecoration: 'none' }}>
            {t('citizen_login') || 'Citizen Login'}
          </Link>
          {' | '}
          <Link to="/" style={{ color: '#003366', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 'bold',
  color: '#333',
  marginBottom: 6,
};
const inputStyle = {
  width: '100%',
  padding: 12,
  border: '1px solid #ccc',
  borderRadius: 8,
  fontSize: 14,
  boxSizing: 'border-box',
  background: 'white',
};

export default StaffLogin;