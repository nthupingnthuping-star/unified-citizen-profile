import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  getApplicationByReference,
  getCertificateVerifyUrl,
  getCertificateExpiry,
  DEPARTMENT_NAMES,
} from '../../firebase/db';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../common/Layout';
import Card from '../common/Card';
import Button from '../common/Button';
import Alert from '../common/Alert';

const CertificateView = () => {
  const { reference } = useParams();
  const { profile } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const app = await getApplicationByReference(reference);
        if (!app) {
          setError('Certificate not found');
        } else if (app.citizen_id !== profile?.uid) {
          setError('You are not authorized to view this certificate');
        } else if (app.status !== 'approved' && app.status !== 'completed') {
          setError('This certificate has not been approved yet');
        } else {
          setApplication(app);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (profile) load();
  }, [reference, profile]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Layout title="Certificate">
        <Card><p>Loading certificate...</p></Card>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Certificate">
        <Alert type="error">{error}</Alert>
        <Link to="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </Layout>
    );
  }

  const verifyUrl = getCertificateVerifyUrl(application.application_reference);
  const expiry = getCertificateExpiry(application);
  const issueDate = application.completed_at?.toDate?.() || new Date();

  return (
    <Layout title="Certificate">
      <div style={{ marginBottom: 15, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={handlePrint}>Print / Save as PDF</Button>
        <Link to="/dashboard">
          <Button variant="secondary">Back to Dashboard</Button>
        </Link>
      </div>

      <Card style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
        <div style={{
          border: '3px double #003366',
          padding: 30,
          background: 'white',
        }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #003366', paddingBottom: 15, marginBottom: 25 }}>
            <img src="/assets/logos/lesotho-coat-of-arms.png" alt="Lesotho"
              style={{ height: 70, marginBottom: 10 }}
              onError={(e) => { e.target.style.display = 'none'; }} />
            <h1 style={{ margin: 0, color: '#003366', fontSize: 22 }}>
              Government of Lesotho
            </h1>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: 14 }}>
              {DEPARTMENT_NAMES[application.department_id]}
            </p>
            <h2 style={{
              margin: '15px 0 0 0',
              color: '#003366',
              fontSize: 18,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}>
              {application.service_type}
            </h2>
          </div>

          <div style={{ marginBottom: 30 }}>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: '#333' }}>
              This is to certify that:
            </p>
            <p style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#003366',
              textAlign: 'center',
              margin: '20px 0',
              padding: '15px 0',
              borderTop: '1px solid #ddd',
              borderBottom: '1px solid #ddd',
            }}>
              {application.citizen_name}
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: '#333' }}>
              National ID: <strong>{application.citizen_national_id}</strong>
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: '#333' }}>
              Has been granted this certificate in accordance with the laws of the Kingdom of Lesotho.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            marginBottom: 30,
            padding: 20,
            background: '#f9f9f9',
            borderRadius: 4,
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Reference Number</div>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366', marginTop: 3 }}>
                {application.application_reference}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Issue Date</div>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366', marginTop: 3 }}>
                {issueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
            {expiry && (
              <div>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Valid Until</div>
                <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366', marginTop: 3 }}>
                  {expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Status</div>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: '#006600', marginTop: 3 }}>
                VALID
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 20,
            borderTop: '1px solid #ddd',
            paddingTop: 20,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
                Scan this QR code to verify this certificate online.
              </p>
              <p style={{ fontSize: 11, color: '#888', margin: '5px 0 0 0', wordBreak: 'break-all' }}>
                {verifyUrl}
              </p>
            </div>
            <div style={{ background: 'white', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}>
              <QRCodeSVG
                value={verifyUrl}
                size={120}
                level="M"
                bgColor="#ffffff"
                fgColor="#003366"
              />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 30, fontSize: 11, color: '#888' }}>
            <p style={{ margin: 0 }}>
              This certificate is electronically generated. Any alteration renders it invalid.
            </p>
            <p style={{ margin: '5px 0 0 0' }}>
              © 2026 Government of Lesotho
            </p>
          </div>
        </div>
      </Card>
    </Layout>
  );
};

export default CertificateView;