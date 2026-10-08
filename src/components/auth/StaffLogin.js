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
      backgroundImage: `url(${assetPath('/assets/images/government-building.jpg')})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,26,51,0.9)',
      }} />

      {/* Language toggle top-right */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 20 }}>
        <LanguageToggleLight />
      </div>

      <div style={{
        position: 'relative', maxWidth: 420, width: '100%',
        background: 'white', borderRadius: 12, padding: 35,
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img
            src={assetPath('/assets/logos/lesotho-coat-of-arms.png')}
            alt="Lesotho"
            style={{ height: 80, marginBottom: 10 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 style={{ color: '#003366', margin: 0, fontSize: 22 }}>{t('staff_login')}</h1>
          <p style={{ color: '#666', fontSize: 13, margin: '5px 0 0 0' }}>
            {t('staff_portal')}
          </p>
        </div>

        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ fontSize: 13, color: '#333' }}>{t('email')}</label>
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
            <label style={{ fontSize: 13, color: '#333' }}>{t('password')}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <Button type="submit" disabled={loading} fullWidth size="large">
            {loading ? t('logging_in') : t('login')}
          </Button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13 }}>
          <Link to="/login" style={{ color: '#003366' }}>{t('citizen_login')}</Link>
          {' | '}
          <Link to="/" style={{ color: '#003366' }}>{t('back_to_home')}</Link>
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