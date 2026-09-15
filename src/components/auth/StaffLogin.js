import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginStaff } from '../../firebase/auth';
import Alert from '../common/Alert';
import Button from '../common/Button';

const StaffLogin = () => {
  const navigate = useNavigate();
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
      console.log('✅ Staff logged in, navigating to /staff-dashboard');
      navigate('/staff-dashboard');
    } catch (err) {
      console.error('Staff login error:', err);
      const msg = err.message || 'Login failed';
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
      padding: 20, position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,26,51,0.9)',
      }} />

      <div style={{
        position: 'relative', maxWidth: 420, width: '100%',
        background: 'white', borderRadius: 12, padding: 35,
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/assets/logos/lesotho-coat-of-arms.png" alt="Lesotho"
            style={{ height: 80, marginBottom: 10 }}
            onError={(e) => { e.target.style.display = 'none'; }} />
          <h1 style={{ color: '#003366', margin: 0, fontSize: 22 }}>Staff Login</h1>
          <p style={{ color: '#666', fontSize: 13, margin: '5px 0 0 0' }}>
            Government Employee Portal
          </p>
        </div>

        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ fontSize: 13, color: '#333' }}>Email</label>
            <input
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
            <label style={{ fontSize: 13, color: '#333' }}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              style={inputStyle}
            />
          </div>

          <Button type="submit" disabled={loading} fullWidth size="large">
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div style={{
          marginTop: 20, padding: 12,
          background: '#f0f8ff', borderRadius: 4, fontSize: 12,
          color: '#333',
        }}>
          <strong>Test staff accounts:</strong><br />
          <code>finance_officer@ucps.gov.ls</code> / <code>password123</code><br />
          <code>police_officer@ucps.gov.ls</code> / <code>password123</code><br />
          <code>home_affairs_officer@ucps.gov.ls</code> / <code>password123</code>
        </div>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13 }}>
          <Link to="/login" style={{ color: '#003366' }}>Citizen Login</Link>
          {' | '}
          <Link to="/" style={{ color: '#003366' }}>Home</Link>
        </p>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: 12,
  border: '1px solid #ccc',
  borderRadius: 4,
  marginTop: 5,
  fontSize: 14,
};

export default StaffLogin;