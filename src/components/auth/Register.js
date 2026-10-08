import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCitizen } from '../../firebase/auth';
import { useLanguage } from '../../i18n/LanguageContext';
import Alert from '../common/Alert';

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
          maxWidth: 520,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 51, 102, 0.12)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            margin: '0 auto 24px',
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
            borderRadius: 6,
            padding: 14,
            marginBottom: 24,
            fontFamily: 'monospace',
            fontSize: 15,
            fontWeight: 'bold',
            color: '#003366',
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
            borderRadius: 6,
            padding: 14,
            fontSize: 13,
            color: '#7a5a00',
            marginBottom: 24,
            textAlign: 'left',
          }}>
            <strong>Don't see it?</strong> Check your spam or junk folder.
            It may take up to 2 minutes to arrive.
          </div>

          <Link
            to="/login"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
              color: 'white',
              padding: '12px 32px',
              borderRadius: 999,
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 'bold',
              boxShadow: '0 4px 14px rgba(0, 51, 102, 0.25)',
            }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ============ REGISTRATION FORM ============
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eef4fb 0%, #ffffff 100%)',
      padding: 30,
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 40,
        maxWidth: 640,
        width: '100%',
        boxShadow: '0 8px 32px rgba(0, 51, 102, 0.12)',
        alignSelf: 'flex-start',
      }}>
        <h1 style={{ color: '#003366', marginTop: 0 }}>Create your citizen profile</h1>
        <p style={{ color: '#666', fontSize: 14, marginTop: 0 }}>
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
            <select value={form.gender} onChange={(e) => update('gender', e.target.value)} style={inputStyle}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <Field label="Residential Address" value={form.residential_address} onChange={(v) => update('residential_address', v)} />
          <Field label="Phone Number" value={form.phone_number} onChange={(v) => update('phone_number', v)} />

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
              marginTop: 12,
              boxShadow: loading ? 'none' : '0 4px 14px rgba(0, 51, 102, 0.25)',
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
          Already have an account? <Link to="/login" style={{ color: '#0055aa', fontWeight: 'bold' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'text', required }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={labelStyle}>{label}{required ? ' *' : ''}</label>
    <input
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
  padding: 10,
  border: '1px solid #ccc',
  borderRadius: 6,
  fontSize: 14,
  boxSizing: 'border-box',
};

export default Register;