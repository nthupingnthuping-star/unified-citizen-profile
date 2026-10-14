import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../common/Layout';
import Card from '../common/Card';

const VerifiedGuard = ({ children, serviceName }) => {
  const { profile } = useAuth();

  // ============================================================
  // 1 — DECEASED BLOCK (highest priority)
  // ============================================================
  if (profile?.deceased) {
    return (
      <Layout title={serviceName}>
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>🕯️</div>
            <h2 style={{ color: '#8b0000', marginTop: 0 }}>
              Account marked as deceased
            </h2>
            <p style={{ color: '#555', maxWidth: 520, margin: '15px auto', lineHeight: 1.7 }}>
              This citizen record has been marked as <strong>deceased</strong> by the
              Ministry of Home Affairs. All government services are closed for this account.
            </p>

            {profile?.deceased_certificate_reference && (
              <div style={{
                display: 'inline-block',
                background: '#f0f6ff',
                border: '1px solid #cce0ff',
                borderRadius: 6,
                padding: '10px 20px',
                margin: '10px 0',
                fontFamily: 'monospace',
                fontSize: 13,
                color: '#003366',
              }}>
                Certificate: {profile.deceased_certificate_reference}
              </div>
            )}

            <p style={{ color: '#666', maxWidth: 520, margin: '20px auto 0', fontSize: 14 }}>
              If this is an error, please visit your nearest Home Affairs office
              with proof of life. Once corrected, your account will be reactivated.
            </p>

            <Link to="/" style={{
              display: 'inline-block',
              marginTop: 24,
              padding: '12px 30px',
              background: '#003366',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 999,
              fontWeight: 'bold',
              boxShadow: '0 4px 14px rgba(0, 51, 102, 0.25)',
            }}>
              Return to Home
            </Link>
          </div>
        </Card>
      </Layout>
    );
  }

  // ============================================================
  // 2 — VERIFICATION BLOCK
  // ============================================================
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
              display: 'inline-block',
              marginTop: 20,
              padding: '12px 30px',
              background: '#003366',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 4,
              fontWeight: 'bold',
            }}>
              Go to Home Affairs →
            </Link>
          </div>
        </Card>
      </Layout>
    );
  }

  // ============================================================
  // 3 — ALL CHECKS PASSED
  // ============================================================
  return children;
};

export default VerifiedGuard;