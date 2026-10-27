import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCitizen, signInWithGoogle } from '../../firebase/auth'; 
import { useLanguage } from '../../i18n/LanguageContext';
import Alert from '../common/Alert';
import { assetPath } from '../../utils/assetPath';
import LanguageToggleLight from '../common/LanguageToggleLight';

const Register = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '', national_id: '', date_of_birth: '', gender: 'Male', residential_address: '', phone_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false); 
  const [error, setError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');

  const update = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (!form.national_id || !form.date_of_birth) return setError('National ID and Date of Birth are required.');

    setLoading(true);
    try {
      await registerCitizen({
        email: form.email, password: form.password, national_id: form.national_id, full_name: form.full_name, date_of_birth: form.date_of_birth, gender: form.gender, residential_address: form.residential_address, phone_number: form.phone_number,
      });
      setRegisteredEmail(form.email);
    } catch (err) {
      console.error(err);
      let msg = err.message || 'Registration failed.';
      if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
      if (err.code === 'auth/invalid-email') msg = 'Please enter a valid email.';
      if (err.code === 'auth/weak-password') msg = 'Password is too weak.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    
    // REQUIRE ID AND DOB BEFORE GOOGLE SIGN UP
    if (!form.national_id || !form.date_of_birth) {
      return setError('Please enter your National ID and Date of Birth before continuing with Google.');
    }

    setGoogleLoading(true);
    try {
      await signInWithGoogle({
        national_id: form.national_id,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        residential_address: form.residential_address,
        phone_number: form.phone_number,
      });
      navigate('/dashboard'); 
    } catch (err) {
      setError(err.message || 'Google sign-up failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // ============ SUCCESS SCREEN ============
  if (registeredEmail) {
    return (
      <div style={{ minHeight: '100vh', position: 'relative', backgroundImage: `url(${assetPath('/assets/images/government-building.jpg')})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,51,102,0.92) 0%, rgba(0,85,170,0.85) 50%, rgba(0,51,102,0.92) 100%)', backgroundSize: '200% 200%', animation: 'gradientShift 12s ease infinite' }} />
        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 20 }}><LanguageToggleLight /></div>
        <style>{`@keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }`}</style>
        <div style={{ position: 'relative', background: 'white', borderRadius: 16, padding: 40, maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)', textAlign: 'center', zIndex: 2 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, margin: '0 auto 24px' }}>✉️</div>
          <h1 style={{ color: '#003366', marginTop: 0, fontSize: 26 }}>Check your email</h1>
          <p style={{ color: '#555', fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>We sent a verification link to:</p>
          <div style={{ background: '#f0f6ff', border: '1px solid #cce0ff', borderRadius: 8, padding: 14, marginBottom: 24, fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold', color: '#003366' }}>{registeredEmail}</div>
          <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>Open that email and click the verification link. Then come back and log in.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link to="/login" style={{ background: '#003366', color: 'white', padding: '12px 28px', borderRadius: 999, textDecoration: 'none', fontWeight: 'bold' }}>Go to Login</Link>
            <Link to="/" style={{ background: 'white', color: '#003366', border: '1px solid #003366', padding: '11px 24px', borderRadius: 999, textDecoration: 'none' }}>← Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // ============ REGISTRATION FORM ============
  return (
    <div style={{ minHeight: '100vh', position: 'relative', backgroundImage: `url(${assetPath('/assets/images/government-building.jpg')})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', padding: 30, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,51,102,0.92) 0%, rgba(0,85,170,0.85) 50%, rgba(0,51,102,0.92) 100%)', backgroundSize: '200% 200%', animation: 'gradientShift 12s ease infinite' }} />
      
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <LanguageToggleLight />
        <Link to="/" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.35)', color: 'white', padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 'bold', textDecoration: 'none' }}>
          ← {t('back_to_home') || 'Back to Home'}
        </Link>
      </div>

      <style>{`
        @keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .auth-input { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .auth-input:focus { outline: none; border-color: #0055aa; box-shadow: 0 0 0 4px rgba(0, 85, 170, 0.12); }
      `}</style>

      <div style={{ position: 'relative', background: 'white', borderRadius: 16, padding: 40, maxWidth: 640, width: '100%', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)', alignSelf: 'flex-start', marginTop: 20, marginBottom: 20, zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src={assetPath('/assets/logos/lesotho-coat-of-arms.png')} alt="Lesotho" style={{ height: 60, marginBottom: 8 }} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>

        <h1 style={{ color: '#003366', marginTop: 0, textAlign: 'center', fontSize: 26 }}>Create your citizen profile</h1>

        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          {/* REQUIRED FIELDS FIRST */}
          <Field label="Full Name" value={form.full_name} onChange={(v) => update('full_name', v)} required />
          <Field label="National ID" value={form.national_id} onChange={(v) => update('national_id', v)} required />
          <Field label="Date of Birth" type="date" value={form.date_of_birth} onChange={(v) => update('date_of_birth', v)} required />
          
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Gender *</label>
            <select className="auth-input" value={form.gender} onChange={(e) => update('gender', e.target.value)} style={inputStyle}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <Field label="Residential Address" value={form.residential_address} onChange={(v) => update('residential_address', v)} />
          <Field label="Phone Number" value={form.phone_number} onChange={(v) => update('phone_number', v)} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, marginTop: 24 }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: 13, color: '#94a3b8' }}>CHOOSE A LOGIN METHOD</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* GOOGLE BUTTON */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: 'white',
              color: '#3c4043',
              border: '1px solid #dadce0',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 500,
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              marginBottom: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'background 0.2s ease',
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
            {googleLoading ? 'Connecting...' : 'Sign up with Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: 13, color: '#94a3b8' }}>OR USE EMAIL</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          <Field label="Email Address" type="email" value={form.email} onChange={(v) => update('email', v)} required />
          <Field label="Password" type="password" value={form.password} onChange={(v) => update('password', v)} required />
          <Field label="Confirm Password" type="password" value={form.confirm_password} onChange={(v) => update('confirm_password', v)} required />

          <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#999' : 'linear-gradient(135deg, #003366 0%, #0055aa 100%)', color: 'white', border: 'none', padding: '14px 24px', borderRadius: 999, fontSize: 16, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 12 }}>
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
    <input className="auth-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} style={inputStyle} />
  </div>
);

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 6 };
const inputStyle = { width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', background: 'white' };

export default Register;