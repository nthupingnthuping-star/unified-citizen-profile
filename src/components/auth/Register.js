import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCitizen } from '../../firebase/auth';
import { useLanguage } from '../../i18n/LanguageContext';
import Alert from '../common/Alert';
import { assetPath } from '../../utils/assetPath';
import LanguageToggleLight from '../common/LanguageToggleLight';

const Register = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    national_id: '',
    date_of_birth: '',
    gender: 'Male',
    residential_address: '',
    phone_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');

  const update = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await registerCitizen({
        email: form.email,
        password: form.password,
        national_id: form.national_id,
        full_name: form.full_name,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        residential_address: form.residential_address,
        phone_number: form.phone_number,
      });
      setRegisteredEmail(form.email);
    } catch (err) {
      console.error(err);
      let msg = err.message || 'Registration failed.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already registered. Try logging in instead.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Use at least 6 characters.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ============ SUCCESS SCREEN ============
  if (registeredEmail) {
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
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(0,51,102,0.92) 0%, rgba(0,85,170,0.85) 50%, rgba(0,51,102,0.92) 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 12s ease infinite',
        }} />
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

        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 20 }}>
          <LanguageToggleLight />
        </div>

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
        `}</style>

        <div style={{
          position: 'relative',
          background: 'white',
          borderRadius: 16,
          padding: 40,
          maxWidth: 520,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          textAlign: 'center',
          animation: 'cardEnter 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both',
          zIndex: 2,
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 38,
            margin: '0 auto 24px',
            boxShadow: '0 8px 24px rgba(0, 51, 102, 0.3)',
          }}>
            ✉️
          </div>

          <h1 style={{ color: '#003366', marginTop: 0, fontSize: 26 }}>
            Check your email
          </h1>

          <p style={{ color: '#555', fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
            We sent a verification link to:
          </p>

          <div style={{
            background: '#f0f6ff',
            border: '1px solid #cce0ff',
            borderRadius: 8,
            padding: 14,
            marginBottom: 24,
            fontFamily: 'monospace',
            fontSize: 15,
            fontWeight: 'bold',
            color: '#003366',
            wordBreak: 'break-all',
          }}>
            {registeredEmail}
          </div>

          <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Open that email and click the verification link. Then come back here and log in.
            The link expires in 1 hour.
          </p>

          <div style={{
            background: '#fff8e0',
            border: '1px solid #ffe08a',
            borderRadius: 8,
            padding: 14,
            fontSize: 13,
            color: '#7a5a00',
            marginBottom: 24,
            textAlign: 'left',
          }}>
            <strong>Don't see it?</strong> Check your spam or junk folder.
            It may take up to 2 minutes to arrive.
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
                color: 'white',
                padding: '12px 28px',
                borderRadius: 999,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 'bold',
                boxShadow: '0 4px 14px rgba(0, 51, 102, 0.25)',
              }}
            >
              Go to Login
            </Link>
            <Link
              to="/"
              style={{
                display: 'inline-block',
                background: 'white',
                color: '#003366',
                border: '1px solid #003366',
                padding: '11px 24px',
                borderRadius: 999,
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============ REGISTRATION FORM ============
  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      backgroundImage: `url(${assetPath('/assets/images/government-building.jpg')})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      padding: 30,
      display: 'flex',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(0,51,102,0.92) 0%, rgba(0,85,170,0.85) 50%, rgba(0,51,102,0.92) 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradientShift 12s ease infinite',
      }} />
      <div style={{
        position: 'absolute', top: '8%', right: '6%',
        width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,204,0,0.2) 0%, transparent 70%)',
        animation: 'floatY 8s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '6%', left: '6%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(179,212,255,0.18) 0%, transparent 70%)',
        animation: 'floatY 10s ease-in-out infinite reverse',
        pointerEvents: 'none',
      }} />

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

      <div style={{
        position: 'relative',
        background: 'white',
        borderRadius: 16,
        padding: 40,
        maxWidth: 640,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
        alignSelf: 'flex-start',
        marginTop: 20,
        marginBottom: 20,
        animation: 'cardEnter 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        zIndex: 2,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img
            src={assetPath('/assets/logos/lesotho-coat-of-arms.png')}
            alt="Lesotho"
            style={{ height: 60, marginBottom: 8 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        <h1 style={{ color: '#003366', marginTop: 0, textAlign: 'center', fontSize: 26 }}>
          Create your citizen profile
        </h1>
        <p style={{ color: '#666', fontSize: 14, marginTop: 0, textAlign: 'center' }}>
          You will receive a verification email. Click the link inside to activate your account.
        </p>

        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Field label="Full Name" value={form.full_name} onChange={(v) => update('full_name', v)} required />
          <Field label="Email Address" type="email" value={form.email} onChange={(v) => update('email', v)} required />
          <Field label="Password" type="password" value={form.password} onChange={(v) => update('password', v)} required />
          <Field label="Confirm Password" type="password" value={form.confirm_password} onChange={(v) => update('confirm_password', v)} required />
          <Field label="National ID" value={form.national_id} onChange={(v) => update('national_id', v)} required />
          <Field label="Date of Birth" type="date" value={form.date_of_birth} onChange={(v) => update('date_of_birth', v)} required />

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Gender *</label>
            <select
              className="auth-input"
              value={form.gender}
              onChange={(e) => update('gender', e.target.value)}
              style={inputStyle}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <Field label="Residential Address" value={form.residential_address} onChange={(v) => update('residential_address', v)} />
          <Field label="Phone Number" value={form.phone_number} onChange={(v) => update('phone_number', v)} />

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
              marginTop: 12,
              boxShadow: loading ? 'none' : '0 4px 14px rgba(0, 51, 102, 0.25)',
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0055aa', fontWeight: 'bold' }}>Log in</Link>
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

const Field = ({ label, value, onChange, type = 'text', required }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={labelStyle}>{label}{required ? ' *' : ''}</label>
    <input
      className="auth-input"
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      style={inputStyle}
    />
  </div>
);

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

export default Register;