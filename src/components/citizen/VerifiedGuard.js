import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../common/Layout';
import Card from '../common/Card';

const VerifiedGuard = ({ children, serviceName }) => {
  const { profile } = useAuth();

  if (!profile?.verified_by_home_affairs) {
    return (
      <Layout title={serviceName}>
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 64 }}>⚠️</div>
            <h2 style={{ color: '#856404' }}>Verification Required</h2>
            <p style={{ color: '#666', maxWidth: 500, margin: '15px auto' }}>
              You must verify your identity with <strong>Home Affairs</strong> before accessing{' '}
              <strong>{serviceName}</strong>.
            </p>
            <p style={{ color: '#666', maxWidth: 500, margin: '15px auto' }}>
              This prevents fraud and ensures your data is trusted across government departments.
            </p>
            <Link to="/home-affairs" style={{
              display: 'inline-block', marginTop: 20, padding: '12px 30px',
              background: '#003366', color: 'white', textDecoration: 'none',
              borderRadius: 4, fontWeight: 'bold',
            }}>
              Go to Home Affairs →
            </Link>
          </div>
        </Card>
      </Layout>
    );
  }

  return children;
};

export default VerifiedGuard;