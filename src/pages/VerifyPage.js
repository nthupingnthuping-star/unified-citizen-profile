import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getApplicationByReference,
  isCertificateValid,
  getCertificateExpiry,
  DEPARTMENT_NAMES,
} from '../firebase/db';
import Card from '../components/common/Card';

const VerifyPage = () => {
  const { reference } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const app = await getApplicationByReference(reference);
        if (!app) {
          setNotFound(true);
        } else {
          setApplication(app);
        }
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reference]);

  const valid = application && isCertificateValid(application);
  const expiry = application ? getCertificateExpiry(application) : null;
  const expired = expiry && expiry < new Date();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(/assets/images/government-building.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(0,51,102,0.92) 0%, rgba(0,85,170,0.85) 100%)',
      }} />

      <div style={{
        position: 'relative', maxWidth: 600, width: '100%',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/assets/logos/lesotho-coat-of-arms.png" alt="Lesotho"
            style={{ height: 80, marginBottom: 10 }}
            onError={(e) => { e.target.style.display = 'none'; }} />
          <h1 style={{ color: 'white', margin: 0, fontSize: 24 }}>Certificate Verification</h1>
          <p style={{ color: '#b3d4ff', fontSize: 14, margin: '5px 0 0 0' }}>
            Government of Lesotho
          </p>
        </div>

        {loading ? (
          <Card>
            <p style={{ textAlign: 'center', padding: 30 }}>Verifying certificate...</p>
          </Card>
        ) : notFound ? (
          <Card>
            <div style={{ textAlign: 'center', padding: 30 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: '#ffe6e6', color: '#cc0000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: 30, fontWeight: 'bold',
              }}>X</div>
              <h2 style={{ color: '#cc0000', margin: '0 0 10px 0' }}>Certificate Not Found</h2>
              <p style={{ color: '#666' }}>
                No certificate exists with reference <strong>{reference}</strong>.
                This certificate may be invalid, or the reference number may be incorrect.
              </p>
            </div>
          </Card>
        ) : !valid ? (
          <Card>
            <div style={{ textAlign: 'center', padding: 30 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: '#fff3cd', color: '#856404',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: 30, fontWeight: 'bold',
              }}>!</div>
              <h2 style={{ color: '#856404', margin: '0 0 10px 0' }}>Certificate Not Valid</h2>
              <p style={{ color: '#666' }}>
                This certificate exists but is not currently approved or has been revoked.
              </p>
              <p style={{ color: '#666', marginTop: 10 }}>
                Status: <strong>{application.status}</strong>
              </p>
            </div>
          </Card>
        ) : expired ? (
          <Card>
            <div style={{ textAlign: 'center', padding: 30 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: '#ffe6e6', color: '#cc0000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: 30, fontWeight: 'bold',
              }}>X</div>
              <h2 style={{ color: '#cc0000', margin: '0 0 10px 0' }}>Certificate Expired</h2>
              <p style={{ color: '#666' }}>
                This certificate expired on <strong>{expiry.toLocaleDateString()}</strong>.
              </p>
            </div>
          </Card>
        ) : (
          <Card>
            <div style={{ textAlign: 'center', padding: 30 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: '#d4edda', color: '#006600',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: 36, fontWeight: 'bold',
              }}>✓</div>
              <h2 style={{ color: '#006600', margin: '0 0 20px 0' }}>Certificate is Authentic</h2>

              <div style={{
                textAlign: 'left',
                background: '#f9f9f9',
                padding: 20,
                borderRadius: 6,
                marginTop: 20,
              }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Issued To</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#003366' }}>
                    {application.citizen_name}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>National ID</div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
                    {application.citizen_national_id}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Certificate Type</div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
                    {application.service_type}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Issued By</div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
                    {DEPARTMENT_NAMES[application.department_id]}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Reference</div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
                    {application.application_reference}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Issue Date</div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
                    {application.completed_at?.toDate?.().toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    }) || '—'}
                  </div>
                </div>
                {expiry && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Valid Until</div>
                    <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
                      {expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" style={{ color: 'white', fontSize: 14 }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;