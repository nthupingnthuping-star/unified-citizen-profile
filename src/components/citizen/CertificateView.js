import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  getApplicationByReference,
  isCertificateValid,
  getCertificateExpiry,
  getCertificateVerifyUrl,
  isReportService,
  DEPARTMENT_NAMES,
} from '../../firebase/db';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageToggleLight from '../common/LanguageToggleLight';

  const SLIP_SERVICES = [
    'New Passport',
    'Passport Renewal',
    'Learner License',
    "Driver's License",
  ];

const CertificateView = () => {
  const { reference } = useParams();
  const { t } = useLanguage();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const app = await getApplicationByReference(reference);
        if (!app) setNotFound(true);
        else setApplication(app);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reference]);

  if (loading) {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      </PageShell>
    );
  }

  if (notFound) {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <h2 style={{ color: '#cc0000' }}>Application not found</h2>
          <p style={{ color: '#666' }}>Reference: {reference}</p>
          <Link to="/dashboard" style={{ color: '#003366' }}>← Back to Dashboard</Link>
        </div>
      </PageShell>
    );
  }

  if (application && isReportService(application.service_type)) {
    return <Navigate to={`/police/case/${application.application_reference}`} replace />;
  }

  const valid = isCertificateValid(application);
  const expiry = getCertificateExpiry(application);
  const isSlip = SLIP_SERVICES.includes(application.service_type);

  return (
    <PageShell>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {valid && (
          <button
            onClick={() => window.print()}
            style={{
              background: '#006600',
              color: 'white',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            📥 Download / Print {isSlip ? 'Collection Slip' : 'Certificate'}
          </button>
        )}
        <Link
          to="/dashboard"
          style={{
            background: 'white',
            color: '#003366',
            border: '1px solid #003366',
            padding: '10px 18px',
            borderRadius: 6,
            fontSize: 14,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>

      {!valid ? (
        <div style={{
          background: 'white',
          borderRadius: 8,
          padding: 40,
          textAlign: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: '#fff3cd', color: '#856404',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 30, fontWeight: 'bold',
          }}>!</div>
          <h2 style={{ color: '#856404' }}>Not yet available</h2>
          <p style={{ color: '#666' }}>
            This {isSlip ? 'slip' : 'certificate'} will become available once the application is approved.
          </p>
          <p style={{ color: '#666' }}>Status: <strong>{application.status}</strong></p>
        </div>
      ) : isSlip ? (
        <CollectionSlip application={application} />
      ) : (
        <Certificate application={application} expiry={expiry} />
      )}
    </PageShell>
  );
};

const PageShell = ({ children }) => (
  <div style={{
    minHeight: '100vh',
    background: '#f0f2f5',
    padding: 30,
    position: 'relative',
  }}>
    <div style={{ position: 'absolute', top: 20, right: 20 }}>
      <LanguageToggleLight />
    </div>
    <div style={{ maxWidth: 780, margin: '0 auto' }}>{children}</div>
  </div>
);

const CollectionSlip = ({ application }) => {
  const data = application.application_data || {};
  const window = application.collection_window || {};
  const readyDate = window.ready_date ? new Date(window.ready_date) : null;
  const validUntil = window.valid_until ? new Date(window.valid_until) : null;
  const fees = data.fees || {};
  const payment = data.payment || {};
  const collectionBranch = data.collection_branch || 'Maseru';
  const verifyUrl = getCertificateVerifyUrl(application.application_reference);

  return (
    <div style={{
      background: 'white',
      borderRadius: 8,
      padding: 40,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <img
          src={`${process.env.PUBLIC_URL}/assets/logos/lesotho-coat-of-arms.png`}
          alt="Lesotho"
          style={{ height: 70, marginBottom: 8 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <h1 style={{ color: '#003366', margin: 0, fontSize: 22 }}>Government of Lesotho</h1>
        <p style={{ color: '#666', margin: '4px 0 0 0', fontSize: 13 }}>
          {DEPARTMENT_NAMES[application.department_id]}
        </p>
      </div>

      <div style={{
        borderTop: '2px solid #003366',
        borderBottom: '2px solid #003366',
        padding: '12px 0',
        marginBottom: 30,
        textAlign: 'center',
      }}>
        <h2 style={{ color: '#003366', margin: 0, fontSize: 20, letterSpacing: 2 }}>
          {application.service_type.toUpperCase()} — COLLECTION SLIP
        </h2>
      </div>

      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
          Applicant
        </div>
        <div style={{ fontSize: 22, fontWeight: 'bold', color: '#003366', marginTop: 4 }}>
          {application.citizen_name}
        </div>
        <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
          National ID: <strong>{application.citizen_national_id}</strong>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14,
        marginBottom: 24,
      }}>
        <SlipField label="Application Reference" value={application.application_reference} />
        <SlipField label="Payment Reference" value={payment.reference || '—'} />
        <SlipField label="Amount Paid" value={`M ${(fees.total || 0).toLocaleString()}`} />
        <SlipField label="Collection Branch" value={collectionBranch} />
        {readyDate && (
          <SlipField
            label="Ready for Collection From"
            value={readyDate.toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
            highlight
          />
        )}
        {validUntil && (
          <SlipField
            label="Valid Until"
            value={validUntil.toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
            warn
          />
        )}
      </div>

      <div style={{
        background: '#fff8e0',
        border: '1px solid #ffe08a',
        borderRadius: 6,
        padding: 16,
        fontSize: 13,
        color: '#7a5a00',
        marginBottom: 24,
      }}>
        <div style={{ marginBottom: 6 }}>
          ⚠ <strong>Bring this slip AND your National ID card.</strong>
        </div>
        <div style={{ marginBottom: 6 }}>
          ⚠ If you do not collect within 14 days of the ready date, your document will be
          returned to Maseru.
        </div>
        <div>
          ⚠ Someone else cannot collect on your behalf unless they present a signed
          authorisation letter and their own National ID.
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap',
        paddingTop: 20,
        borderTop: '1px solid #eee',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            Staff Verification
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 4, maxWidth: 380 }}>
            The office clerk will scan this QR code to confirm the slip is authentic before
            handing over the document.
          </div>
        </div>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(verifyUrl)}`}
          alt="Verify QR"
          style={{ width: 140, height: 140 }}
        />
      </div>
    </div>
  );
};

const Certificate = ({ application, expiry }) => {
  const verifyUrl = getCertificateVerifyUrl(application.application_reference);
  const issuedDate = application.completed_at?.toDate?.() || new Date();

  return (
    <div style={{
      background: 'white',
      borderRadius: 8,
      padding: 50,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      position: 'relative',
      border: '1px solid #c9d9ec',
    }}>
      <div style={{
        position: 'absolute',
        top: 20, left: 20, right: 20, bottom: 20,
        border: '2px solid #003366',
        borderRadius: 4,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img
            src={`${process.env.PUBLIC_URL}/assets/logos/lesotho-coat-of-arms.png`}
            alt="Lesotho"
            style={{ height: 80, marginBottom: 10 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 style={{ color: '#003366', margin: 0, fontSize: 22, letterSpacing: 1 }}>
            Government of Lesotho
          </h1>
          <p style={{ color: '#666', margin: '6px 0 0 0', fontSize: 13 }}>
            {DEPARTMENT_NAMES[application.department_id]}
          </p>
        </div>

        <div style={{
          borderTop: '2px solid #003366',
          borderBottom: '2px solid #003366',
          padding: '14px 0',
          marginBottom: 40,
          textAlign: 'center',
        }}>
          <h2 style={{ color: '#003366', margin: 0, fontSize: 22, letterSpacing: 3 }}>
            {application.service_type.toUpperCase()}
          </h2>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
            This is to certify that
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#003366',
            padding: '12px 0',
            borderTop: '1px solid #c9d9ec',
            borderBottom: '1px solid #c9d9ec',
            marginBottom: 16,
          }}>
            {application.citizen_name}
          </div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
            National ID:{' '}
            <strong style={{ color: '#003366' }}>
              {application.citizen_national_id}
            </strong>
          </div>
          <div style={{
            fontSize: 14, color: '#666', marginTop: 16,
            maxWidth: 480, margin: '16px auto 0',
          }}>
            has been granted this certificate in accordance with the laws of the Kingdom of Lesotho.
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 20,
          background: '#f7f9fc',
          padding: 20,
          borderRadius: 6,
          marginBottom: 30,
        }}>
          <Meta label="Reference Number" value={application.application_reference} />
          <Meta
            label="Issue Date"
            value={issuedDate.toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          />
          <Meta label="Status" value="APPROVED" green />
          {expiry && (
            <Meta
              label="Valid Until"
              value={expiry.toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            />
          )}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 30,
          paddingTop: 30,
          borderTop: '1px solid #eee',
          flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 11, color: '#888', maxWidth: 380 }}>
            This certificate can be verified online by scanning the QR code on the right, or by
            visiting the verification page and entering the reference number above.
          </div>
          <div style={{ textAlign: 'center' }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}`}
              alt="Verify QR"
              style={{ width: 120, height: 120 }}
            />
            <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
              Scan to verify
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SlipField = ({ label, value, highlight, warn }) => (
  <div style={{
    background: highlight ? '#e6f4ea' : warn ? '#fff4e5' : '#f9f9f9',
    border: `1px solid ${highlight ? '#a8d5b8' : warn ? '#ffd8a8' : '#e0e0e0'}`,
    borderRadius: 6,
    padding: 12,
  }}>
    <div style={{
      fontSize: 10,
      color: '#888',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: 'bold',
      marginBottom: 4,
    }}>
      {label}
    </div>
    <div style={{
      fontSize: 14,
      fontWeight: 'bold',
      color: highlight ? '#006600' : warn ? '#cc6600' : '#003366',
    }}>
      {value}
    </div>
  </div>
);

const Meta = ({ label, value, green }) => (
  <div>
    <div style={{
      fontSize: 10,
      color: '#888',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: 'bold',
      marginBottom: 4,
    }}>
      {label}
    </div>
    <div style={{
      fontSize: 14,
      fontWeight: 'bold',
      color: green ? '#006600' : '#003366',
    }}>
      {value}
    </div>
  </div>
);

export default CertificateView;