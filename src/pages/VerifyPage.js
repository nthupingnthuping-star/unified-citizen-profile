import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getApplicationByReference,
  isCertificateValid,
  getCertificateExpiry,
  DEPARTMENT_NAMES,
} from '../firebase/db';
import { useLanguage } from '../i18n/LanguageContext';
import { assetPath } from '../utils/assetPath';
import LanguageToggleLight from '../components/common/LanguageToggleLight';
import Card from '../components/common/Card';

const VerifyPage = () => {
  const { reference } = useParams();
  const { t } = useLanguage();
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
      backgroundImage: `url(${assetPath('/assets/images/government-building.jpg')})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(0,51,102,0.92) 0%, rgba(0,85,170,0.85) 100%)',
      }} />

      {/* Language toggle top-right */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 20 }}>
        <LanguageToggleLight />
      </div>

      <div style={{
        position: 'relative',
        maxWidth: 600,
        width: '100%',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img
            src={assetPath('/assets/logos/lesotho-coat-of-arms.png')}
            alt="Lesotho"
            style={{ height: 80, marginBottom: 10 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 style={{ color: 'white', margin: 0, fontSize: 24 }}>
            {t('certificate_verification')}
          </h1>
          <p style={{ color: '#b3d4ff', fontSize: 14, margin: '5px 0 0 0' }}>
            {t('government_of_lesotho')}
          </p>
        </div>

        {loading ? (
          <Card>
            <p style={{ textAlign: 'center', padding: 30 }}>{t('verifying')}</p>
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
              <h2 style={{ color: '#cc0000', margin: '0 0 10px 0' }}>
                {t('certificate_not_found')}
              </h2>
              <p style={{ color: '#666' }}>
                {t('certificate')}: <strong>{reference}</strong>
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
              <h2 style={{ color: '#856404', margin: '0 0 10px 0' }}>
                {t('invalid_certificate')}
              </h2>
              <p style={{ color: '#666' }}>
                {t('status')}: <strong>{t(application.status)}</strong>
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
              <h2 style={{ color: '#cc0000', margin: '0 0 10px 0' }}>
                {t('expired_certificate')}
              </h2>
              <p style={{ color: '#666' }}>
                {t('valid_until')}: <strong>{expiry.toLocaleDateString()}</strong>
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
              <h2 style={{ color: '#006600', margin: '0 0 20px 0' }}>
                {t('authentic_certificate')}
              </h2>

              <div style={{
                textAlign: 'left',
                background: '#f9f9f9',
                padding: 20,
                borderRadius: 6,
                marginTop: 20,
              }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {t('issued_to')}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#003366' }}>
                    {application.citizen_name}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {t('national_id')}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
                    {application.citizen_national_id}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {t('service_type')}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
                    {application.service_type}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {t('issued_by')}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
                    {DEPARTMENT_NAMES[application.department_id]}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {t('reference_number')}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
                    {application.application_reference}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {t('issue_date')}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
                    {application.completed_at?.toDate?.().toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }) || '—'}
                  </div>
                </div>
                {expiry && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {t('valid_until')}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
                      {expiry.toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" style={{ color: 'white', fontSize: 14 }}>
            {t('back_to_home')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;