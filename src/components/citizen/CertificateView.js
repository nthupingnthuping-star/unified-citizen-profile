import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
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

  if (loading) return <PageShell><div style={{ textAlign: 'center', padding: 40 }}>Loading...</div></PageShell>;
  
  if (notFound) return (
    <PageShell>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2 style={{ color: '#cc0000' }}>Application not found</h2>
        <Link to="/dashboard" style={{ color: '#003366' }}>← Back to Dashboard</Link>
      </div>
    </PageShell>
  );

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
            style={{ background: '#006600', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 6, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}
          >
            📥 Download / Print {isSlip ? 'Collection Slip' : 'Certificate'}
          </button>
        )}
        <Link to="/dashboard" style={{ background: 'white', color: '#003366', border: '1px solid #003366', padding: '10px 18px', borderRadius: 6, fontSize: 14, textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </div>

      {!valid ? (
        <div style={{ background: 'white', borderRadius: 8, padding: 40, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h2 style={{ color: '#856404' }}>Not yet available</h2>
          <p style={{ color: '#666' }}>This document will become available once approved.</p>
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
  <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: 30, position: 'relative' }}>
    <div style={{ position: 'absolute', top: 20, right: 20 }}><LanguageToggleLight /></div>
    <div style={{ maxWidth: 850, margin: '0 auto' }}>{children}</div>
  </div>
);

// ==========================================
// DYNAMIC CERTIFICATE ROUTER
// ==========================================
const Certificate = ({ application, expiry }) => {
  const isDeathCert = application.service_type.toLowerCase().includes('death');
  const isChangeOfName = application.service_type.toLowerCase().includes('change of name');
  
  if (isDeathCert) {
    return <DeathCertificate application={application} />;
  }
  
  if (isChangeOfName) {
    return <ChangeOfNameCertificate application={application} expiry={expiry} />;
  }
  
  // Default to a standard formal certificate (Tax Clearance, Police Clearance, etc.)
  return <StandardCertificate application={application} expiry={expiry} />;
};

// ==========================================
// 1. DEATH CERTIFICATE LAYOUT
// ==========================================
const DeathCertificate = ({ application }) => {
  const data = application.application_data || {};
  const deceased = data.deceased || {};
  const issuedDate = application.completed_at?.toDate?.() || new Date();

  const dateOfDeath = deceased.date_of_death 
    ? new Date(deceased.date_of_death).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase() 
    : '—';
  const dateOfRegistration = issuedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
  
  const fullNameParts = (deceased.full_name || application.citizen_name || '').trim().split(' ');
  const firstName = fullNameParts[0] || '';
  const surname = fullNameParts.length > 1 ? fullNameParts[fullNameParts.length - 1] : '';

  const idNumber = deceased.national_id || application.citizen_national_id || '—';
  const certNumber = application.application_reference || '—';

  return (
    <div style={{ background: 'white', border: '1px solid #ccc', padding: '40px 50px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Times New Roman, serif', color: '#000' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 'bold' }}>Certificate Number:<br/>{certNumber}</div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <img src={`${process.env.PUBLIC_URL}/assets/logos/lesotho-coat-of-arms.png`} alt="Lesotho Logo" style={{ height: 60, marginBottom: 5 }} onError={(e) => { e.target.style.display = 'none'; }} />
          <div style={{ fontSize: 12, letterSpacing: 2 }}>KINGDOM OF LESOTHO</div>
        </div>
        <div>
           <div style={{ height: 40, width: 150, background: 'repeating-linear-gradient(90deg, #000, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 5px, transparent 5px, transparent 9px, #000 9px, #000 12px, transparent 12px, transparent 14px)' }}></div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h2 style={{ fontSize: 22, letterSpacing: 4, margin: 0, textTransform: 'uppercase', borderBottom: '1px solid #000', display: 'inline-block', paddingBottom: 5 }}>
          Death Certificate
        </h2>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 30 }}>
        <tbody>
          <TableRow num="1." label="ID NUMBER" value={idNumber} />
          <TableRow num="2." label="NAME(S)" value={firstName} />
          <TableRow num="3." label="SURNAME" value={surname} />
          <TableRow num="4." label="GENDER" value={deceased.gender || data.gender || 'MALE'} />
          <TableRow num="5." label="AGE" value={deceased.age || '—'} />
          <TableRow num="6." label="NATIONALITY" value="MOSOTHO" />
          <TableRow num="7." label="PROFESSION OR OCCUPATION" value={deceased.occupation || '—'} />
          <TableRow num="8." label="DATE OF DEATH" value={dateOfDeath} />
          <TableRow num="9." label="PLACE OF DEATH" value={deceased.place_of_death || '—'} />
          <TableRow num="10." label="CAUSE OF DEATH" value={deceased.cause_of_death || '—'} />
          <TableRow num="11." label="RESIDENTIAL ADDRESS AT DEATH" value={deceased.residential_address || data.collection_branch || '—'} />
          <TableRow num="12." label="DATE OF REGISTRATION" value={dateOfRegistration} />
        </tbody>
      </table>

      <div style={{ fontSize: 11, textAlign: 'center', marginBottom: 30, fontStyle: 'italic', padding: '0 20px' }}>
        I hereby certify that the above particulars are true and that the particulars contained in this certificate are in the best of my belief an extract of the Register of Deaths kept by the Registrar of the National Identity, Citizenship and Passports under the Births and Deaths Registration Act 1973 (Act No. 22 of 1973) as amended.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 40 }}>
        <div style={{ fontSize: 13, fontWeight: 'bold', textAlign: 'center', flex: 1 }}>
          Dated this <span style={{ textDecoration: 'underline' }}>{issuedDate.getDate()}</span> day of <span style={{ textDecoration: 'underline' }}>{issuedDate.toLocaleDateString('en-GB', { month: 'long' })}</span> {issuedDate.getFullYear()}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
           <div style={{ border: '2px solid #1e3a8a', color: '#1e3a8a', padding: '10px 15px', fontSize: 10, textAlign: 'center', opacity: 0.7 }}>
             <div>MINISTRY OF HOME AFFAIRS</div>
             <div>PLACE: NATIONAL IDENTITY &</div>
             <div>CIVIL REGISTRATION</div>
             <div style={{ fontSize: 14, fontWeight: 'bold', margin: '5px 0', color: '#888' }}>{new Date().toISOString().split('T')[0]}</div>
             <div>MASERU - LESOTHO</div>
           </div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'cursive', fontSize: 20, marginBottom: 5, transform: 'rotate(-5deg)' }}>S.</div>
          <div style={{ borderTop: '1px solid #000', width: '80%', margin: '0 auto', paddingTop: 5, fontSize: 11, fontWeight: 'bold' }}>
            NAPO KHIELE<br/>Director National Identity and Civil Registration
          </div>
        </div>
      </div>
    </div>
  );
};

const TableRow = ({ num, label, value }) => (
  <tr style={{ borderBottom: '1px dotted #ccc' }}>
    <td style={{ padding: '8px 0', width: '40px', fontWeight: 'bold', verticalAlign: 'top' }}>{num}</td>
    <td style={{ padding: '8px 0', textTransform: 'uppercase', fontWeight: 'bold', fontSize: 12, verticalAlign: 'top' }}>{label}</td>
    <td style={{ padding: '8px 0', verticalAlign: 'top' }}></td>
    <td style={{ padding: '8px 0', textTransform: 'uppercase', fontWeight: 'bold', fontSize: 13, textAlign: 'right', verticalAlign: 'top' }}>{value}</td>
  </tr>
);

// ==========================================
// 2. CHANGE OF NAME CERTIFICATE
// ==========================================
const ChangeOfNameCertificate = ({ application, expiry }) => {
  const verifyUrl = getCertificateVerifyUrl(application.application_reference);
  const issuedDate = application.completed_at?.toDate?.() || new Date();
  const data = application.application_data || {};
  
  // Use the new_name from application_data, fallback to citizen_name if missing
  const displayName = data.new_name || application.citizen_name;
  const oldName = data.current_name || application.citizen_name;

  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 50, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', position: 'relative', border: '1px solid #c9d9ec' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, right: 20, bottom: 20, border: '2px solid #003366', borderRadius: 4, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src={`${process.env.PUBLIC_URL}/assets/logos/lesotho-coat-of-arms.png`} alt="Lesotho" style={{ height: 80, marginBottom: 10 }} onError={(e) => { e.target.style.display = 'none'; }} />
          <h1 style={{ color: '#003366', margin: 0, fontSize: 22, letterSpacing: 1 }}>Government of Lesotho</h1>
          <p style={{ color: '#666', margin: '6px 0 0 0', fontSize: 13 }}>{DEPARTMENT_NAMES[application.department_id]}</p>
        </div>

        <div style={{ borderTop: '2px solid #003366', borderBottom: '2px solid #003366', padding: '14px 0', marginBottom: 40, textAlign: 'center' }}>
          <h2 style={{ color: '#003366', margin: 0, fontSize: 22, letterSpacing: 3 }}>
            CHANGE OF NAME CERTIFICATE
          </h2>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>This is to certify that</div>
          
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#003366', padding: '12px 0', borderTop: '1px solid #c9d9ec', borderBottom: '1px solid #c9d9ec', marginBottom: 16 }}>
            {displayName}
          </div>
          
          <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
            National ID: <strong style={{ color: '#003366' }}>{application.citizen_national_id}</strong>
          </div>

          {oldName !== displayName && (
            <div style={{ fontSize: 13, color: '#888', marginTop: 8, fontStyle: 'italic' }}>
              (formerly known as {oldName})
            </div>
          )}
          
          <div style={{ fontSize: 14, color: '#666', marginTop: 16, maxWidth: 480, margin: '16px auto 0' }}>
            has been granted this Change of Name in accordance with the laws of the Kingdom of Lesotho.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, background: '#f7f9fc', padding: 20, borderRadius: 6, marginBottom: 30 }}>
          <Meta label="Reference Number" value={application.application_reference} />
          <Meta label="Issue Date" value={issuedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
          <Meta label="Status" value="APPROVED" green />
          {expiry && (
            <Meta label="Valid Until" value={expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 30, paddingTop: 30, borderTop: '1px solid #eee', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, color: '#888', maxWidth: 380 }}>
            This certificate can be verified online by scanning the QR code on the right, or by visiting the verification page and entering the reference number above.
          </div>
          <div style={{ textAlign: 'center' }}>
            <QRCodeCanvas value={verifyUrl} size={120} level="M" includeMargin={false} />
            <div style={{ fontSize: 10, color: '#888', marginTop: 6 }}>Scan to verify</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. STANDARD CERTIFICATE (Tax Clearance, etc.)
// ==========================================
const StandardCertificate = ({ application, expiry }) => {
  const verifyUrl = getCertificateVerifyUrl(application.application_reference);
  const issuedDate = application.completed_at?.toDate?.() || new Date();
  
  const title = application.service_type.toUpperCase().includes('CERTIFICATE') 
    ? application.service_type.toUpperCase() 
    : `${application.service_type.toUpperCase()} CERTIFICATE`;

  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 50, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', position: 'relative', border: '1px solid #c9d9ec' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, right: 20, bottom: 20, border: '2px solid #003366', borderRadius: 4, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src={`${process.env.PUBLIC_URL}/assets/logos/lesotho-coat-of-arms.png`} alt="Lesotho" style={{ height: 80, marginBottom: 10 }} onError={(e) => { e.target.style.display = 'none'; }} />
          <h1 style={{ color: '#003366', margin: 0, fontSize: 22, letterSpacing: 1 }}>Government of Lesotho</h1>
          <p style={{ color: '#666', margin: '6px 0 0 0', fontSize: 13 }}>{DEPARTMENT_NAMES[application.department_id]}</p>
        </div>

        <div style={{ borderTop: '2px solid #003366', borderBottom: '2px solid #003366', padding: '14px 0', marginBottom: 40, textAlign: 'center' }}>
          <h2 style={{ color: '#003366', margin: 0, fontSize: 22, letterSpacing: 3 }}>
            {title}
          </h2>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>This is to certify that</div>
          
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#003366', padding: '12px 0', borderTop: '1px solid #c9d9ec', borderBottom: '1px solid #c9d9ec', marginBottom: 16 }}>
            {application.citizen_name}
          </div>
          
          <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
            National ID: <strong style={{ color: '#003366' }}>{application.citizen_national_id}</strong>
          </div>
          
          <div style={{ fontSize: 14, color: '#666', marginTop: 16, maxWidth: 480, margin: '16px auto 0' }}>
            has been granted this {application.service_type} in accordance with the laws of the Kingdom of Lesotho.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, background: '#f7f9fc', padding: 20, borderRadius: 6, marginBottom: 30 }}>
          <Meta label="Reference Number" value={application.application_reference} />
          <Meta label="Issue Date" value={issuedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
          <Meta label="Status" value="APPROVED" green />
          {expiry && (
            <Meta label="Valid Until" value={expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 30, paddingTop: 30, borderTop: '1px solid #eee', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, color: '#888', maxWidth: 380 }}>
            This certificate can be verified online by scanning the QR code on the right, or by visiting the verification page and entering the reference number above.
          </div>
          <div style={{ textAlign: 'center' }}>
            <QRCodeCanvas value={verifyUrl} size={120} level="M" includeMargin={false} />
            <div style={{ fontSize: 10, color: '#888', marginTop: 6 }}>Scan to verify</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Meta = ({ label, value, green }) => (
  <div>
    <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 'bold', color: green ? '#006600' : '#003366' }}>{value}</div>
  </div>
);

// ==========================================
// 4. COLLECTION SLIP (For Passports, Driver's Licenses)
// ==========================================
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
    <div style={{ background: 'white', borderRadius: 8, padding: 40, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <img src={`${process.env.PUBLIC_URL}/assets/logos/lesotho-coat-of-arms.png`} alt="Lesotho" style={{ height: 70, marginBottom: 8 }} onError={(e) => { e.target.style.display = 'none'; }} />
        <h1 style={{ color: '#003366', margin: 0, fontSize: 22 }}>Government of Lesotho</h1>
        <p style={{ color: '#666', margin: '4px 0 0 0', fontSize: 13 }}>{DEPARTMENT_NAMES[application.department_id]}</p>
      </div>

      <div style={{ borderTop: '2px solid #003366', borderBottom: '2px solid #003366', padding: '12px 0', marginBottom: 30, textAlign: 'center' }}>
        <h2 style={{ color: '#003366', margin: 0, fontSize: 20, letterSpacing: 2 }}>
          {application.service_type.toUpperCase()} — COLLECTION SLIP
        </h2>
      </div>

      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Applicant</div>
        <div style={{ fontSize: 22, fontWeight: 'bold', color: '#003366', marginTop: 4 }}>{application.citizen_name}</div>
        <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>National ID: <strong>{application.citizen_national_id}</strong></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
        <SlipField label="Application Reference" value={application.application_reference} />
        <SlipField label="Payment Reference" value={payment.reference || '—'} />
        <SlipField label="Amount Paid" value={`M ${(fees.total || 0).toLocaleString()}`} />
        <SlipField label="Collection Branch" value={collectionBranch} />
        {readyDate && <SlipField label="Ready for Collection From" value={readyDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} highlight />}
        {validUntil && <SlipField label="Valid Until" value={validUntil.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} warn />}
      </div>

      <div style={{ background: '#fff8e0', border: '1px solid #ffe08a', borderRadius: 6, padding: 16, fontSize: 13, color: '#7a5a00', marginBottom: 24 }}>
        <div style={{ marginBottom: 6 }}>⚠ <strong>Bring this slip AND your National ID card.</strong></div>
        <div style={{ marginBottom: 6 }}>⚠ If you do not collect within 14 days of the ready date, your document will be returned to Maseru.</div>
        <div>⚠ Someone else cannot collect on your behalf unless they present a signed authorisation letter and their own National ID.</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap', paddingTop: 20, borderTop: '1px solid #eee' }}>
        <div>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Staff Verification</div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 4, maxWidth: 380 }}>The office clerk will scan this QR code to confirm the slip is authentic before handing over the document.</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <QRCodeCanvas value={verifyUrl} size={140} level="M" includeMargin={false} />
          <div style={{ fontSize: 10, color: '#888', marginTop: 6 }}>Scan to verify</div>
        </div>
      </div>
    </div>
  );
};

const SlipField = ({ label, value, highlight, warn }) => (
  <div style={{ background: highlight ? '#e6f4ea' : warn ? '#fff4e5' : '#f9f9f9', border: `1px solid ${highlight ? '#a8d5b8' : warn ? '#ffd8a8' : '#e0e0e0'}`, borderRadius: 6, padding: 12 }}>
    <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 'bold', color: highlight ? '#006600' : warn ? '#cc6600' : '#003366' }}>{value}</div>
  </div>
);

export default CertificateView;