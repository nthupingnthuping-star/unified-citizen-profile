import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerCitizen } from '../../firebase/auth';
import Alert from '../common/Alert';
import Button from '../common/Button';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    national_id: '',
    full_name: '',
    date_of_birth: '',
    gender: 'Male',
    residential_address: '',
    phone_number: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await registerCitizen(formData);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Register error:', err);
      const msg = err.code === 'auth/email-already-in-use'
        ? 'This email is already registered'
        : err.code === 'auth/weak-password'
        ? 'Password is too weak (min 6 characters)'
        : err.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(/assets/images/government-building.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(0,51,102,0.92) 0%, rgba(0,85,170,0.85) 100%)',
      }} />

      <div style={{
        position: 'relative', maxWidth: 620, width: '100%',
        background: 'white', borderRadius: 12, padding: 35,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/assets/logos/lesotho-coat-of-arms.png" alt="Lesotho"
            style={{ height: 80 }}
            onError={(e) => { e.target.style.display = 'none'; }} />
        </div>

        <h1 style={{
          color: '#003366', marginTop: 0, marginBottom: 5,
          textAlign: 'center', fontSize: 24,
        }}>
          Register Citizen Profile
        </h1>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: 25, fontSize: 14 }}>
          Create your unified profile once. Use it everywhere.
        </p>

        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label style={labelStyle}>Email *</label>
            <input type="email" name="email" value={formData.email}
              onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label style={labelStyle}>Password *</label>
            <input type="password" name="password" value={formData.password}
              onChange={handleChange} required minLength="6"
              placeholder="At least 6 characters" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label style={labelStyle}>National ID *</label>
            <input type="text" name="national_id" value={formData.national_id}
              onChange={handleChange} required placeholder="13 digits" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label style={labelStyle}>Full Name *</label>
            <input type="text" name="full_name" value={formData.full_name}
              onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <label style={labelStyle}>Date of Birth *</label>
              <input type="date" name="date_of_birth" value={formData.date_of_birth}
                onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Gender *</label>
              <select name="gender" value={formData.gender}
                onChange={handleChange} style={inputStyle}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label style={labelStyle}>Residential Address</label>
            <input type="text" name="residential_address" value={formData.residential_address}
              onChange={handleChange} placeholder="e.g. Maseru West, Ha Hoohlo" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Phone Number</label>
            <input type="text" name="phone_number" value={formData.phone_number}
              onChange={handleChange} placeholder="+266 ..." style={inputStyle} />
          </div>

          <Button type="submit" disabled={loading} fullWidth size="large">
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#666' }}>
          Already registered? <Link to="/login" style={{ color: '#003366', fontWeight: 'bold' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

const labelStyle = { fontSize: 13, color: '#333' };
const inputStyle = {
  width: '100%', padding: 10, border: '1px solid #ccc',
  borderRadius: 4, marginTop: 5, fontSize: 14,
};

export default Register;