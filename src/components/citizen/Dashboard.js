import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { assetPath } from '../../utils/assetPath';
import { saveCitizenPhoto, saveCitizenDocument } from '../../firebase/db';
import Layout from '../common/Layout';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Alert from '../common/Alert';
import PhotoUpload from '../common/PhotoUpload';
import CloudinaryUpload from '../common/CloudinaryUpload';
import './Dashboard.css';

const DOCUMENT_TYPES = [
  { value: '', label: '— Select document type —' },
  { value: 'Birth Certificate', label: 'Birth Certificate (first-time applicants)' },
  { value: 'Old National ID', label: 'Old National ID (renewal)' },
  { value: 'Police Report', label: 'Police Report (lost / stolen)' },
  { value: 'Damaged National ID', label: 'Damaged National ID' },
  { value: "Chief's Letter", label: "Chief's Letter (proof of residence)" },
  { value: 'Passport', label: 'Passport' },
  { value: 'Other', label: 'Other' },
];

const getInitials = (fullName) => {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useLanguage();

  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url || '');
  const [documentUrl, setDocumentUrl] = useState(profile?.id_document_url || '');
  const [documentType, setDocumentType] = useState(profile?.id_document_type || '');
  const [saveMsg, setSaveMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPhotoUrl(profile?.photo_url || '');
    setDocumentUrl(profile?.id_document_url || '');
    setDocumentType(profile?.id_document_type || '');
  }, [profile]);

  const services = [
    { nameKey: 'ministry_finance', descKey: 'ministry_finance_desc', route: '/finance', logo: assetPath('/assets/logos/finance.png') },
    { nameKey: 'ministry_home_affairs', descKey: 'ministry_home_affairs_desc', route: '/home-affairs', logo: assetPath('/assets/logos/home-affairs.png') },
    { nameKey: 'ministry_traffic', descKey: 'ministry_traffic_desc', route: '/traffic', logo: assetPath('/assets/logos/traffic.png') },
    { nameKey: 'ministry_police', descKey: 'ministry_police_desc', route: '/police', logo: assetPath('/assets/logos/police.png') },
    { nameKey: 'ministry_passport', descKey: 'ministry_passport_desc', route: '/passport', logo: assetPath('/assets/logos/passport.png') },
    { nameKey: 'ministry_pensions', descKey: 'ministry_pensions_desc', route: '/pensions', logo: assetPath('/assets/logos/pensions.png') },
    { nameKey: 'ministry_access_history', descKey: 'ministry_access_history_desc', route: '/access-history', icon: '🔒' },
  ];

  const genderKey = profile?.gender?.toLowerCase() || 'male';
  const genderLabel = t(genderKey);

  const citizenshipKey = profile?.citizenship_status?.toLowerCase().includes('citizen')
    ? 'citizen'
    : 'unknown';
  const citizenshipLabel = t(citizenshipKey);

  const photoMissing = !photoUrl;

  const handleSaveDocument = async () => {
    if (!documentUrl) {
      setSaveMsg('Please upload a document first.');
      return;
    }
    if (!documentType) {
      setSaveMsg('Please select a document type.');
      return;
    }
    setSaving(true);
    setSaveMsg('');
    try {
      await saveCitizenDocument(profile.uid, {
        document_url: documentUrl,
        document_type: documentType,
      });
      setSaveMsg('✓ Document saved. Home Affairs will see it during verification.');
    } catch (err) {
      console.error(err);
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title={t('dashboard')}>
      <div className="dashboard-root">
        <p className="dashboard-welcome">
          {t('welcome_back')}, {profile?.full_name?.split(' ')[0] || t('citizen')}.
        </p>

        {/* Profile completeness alert */}
        {photoMissing && (
          <div style={{ marginBottom: 20 }}>
            <Alert type="warning">
              <strong>Your profile photo is missing.</strong> Uploading a photo will let
              every government department recognise you instantly. It also speeds up
              Home Affairs verification.
            </Alert>
          </div>
        )}

        {/* Photo upload card */}
        <div className="profile-card">
          <Card>
            <h3 style={{ marginTop: 0, color: '#003366' }}>Profile Photo</h3>
            <p style={{ fontSize: 13, color: '#666', marginTop: 0 }}>
              This photo is used across all departments — Home Affairs, Finance, Traffic,
              Pensions, Police, and Passport. You only upload it once.
            </p>

            <PhotoUpload
              label=""
              currentUrl={photoUrl}
              onUpload={async (url) => {
                setPhotoUrl(url);
                try {
                  await saveCitizenPhoto(profile.uid, url);
                } catch (err) {
                  console.error(err);
                }
              }}
            />
          </Card>
        </div>

        {/* Supporting document card */}
        <div style={{ marginTop: 20 }}>
          <Card>
            <h3 style={{ marginTop: 0, color: '#003366' }}>Supporting Document</h3>
            <p style={{ fontSize: 13, color: '#666', marginTop: 0 }}>
              Upload one supporting document to speed up your Home Affairs verification.
              This is optional — if you are a first-time ID applicant, upload your birth
              certificate. If you are renewing, upload your old ID.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 'bold',
                marginBottom: 6,
                color: '#333',
              }}>
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #ccc',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              >
                {DOCUMENT_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <CloudinaryUpload
              label="Document File (JPG, PNG, or PDF)"
              onUpload={(url) => setDocumentUrl(url)}
            />

            {documentUrl && (
              <button
                onClick={handleSaveDocument}
                disabled={saving}
                style={{
                  background: saving ? '#999' : 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 'bold',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  marginTop: 8,
                  boxShadow: saving ? 'none' : '0 4px 14px rgba(0, 51, 102, 0.25)',
                }}
              >
                {saving ? 'Saving...' : 'Save Document'}
              </button>
            )}

            {saveMsg && (
              <div style={{ marginTop: 12 }}>
                <Alert type={saveMsg.startsWith('✓') ? 'success' : 'error'}>{saveMsg}</Alert>
              </div>
            )}
          </Card>
        </div>

        {/* Profile card */}
        <div style={{ marginTop: 20 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
                fontWeight: 'bold',
                letterSpacing: 2,
                flexShrink: 0,
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0, 51, 102, 0.22)',
              }}>
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials(profile?.full_name)
                )}
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <Badge color={profile?.verified_by_home_affairs ? 'green' : 'yellow'}>
                  {profile?.verified_by_home_affairs
                    ? t('verified_by_home_affairs')
                    : t('not_verified_by_home_affairs')}
                </Badge>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 10,
                  marginBottom: 5,
                  flexWrap: 'wrap',
                }}>
                  <h2 style={{ color: '#003366', margin: 0 }}>{profile?.full_name}</h2>
                  <img
                    src={assetPath('/assets/images/flag-lesotho.png')}
                    alt="Lesotho"
                    style={{ height: 22, width: 'auto', borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 10 }}>
                  <div><strong>{t('national_id')}:</strong> {profile?.national_id}</div>
                  <div><strong>{t('date_of_birth')}:</strong> {profile?.date_of_birth}</div>
                  <div><strong>{t('gender')}:</strong> {genderLabel}</div>
                  <div><strong>{t('phone_number')}:</strong> {profile?.phone_number || '—'}</div>
                  <div><strong>{t('email')}:</strong> {profile?.email || '—'}</div>
                  <div><strong>{t('citizenship')}:</strong> {citizenshipLabel}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <h3 className="section-title">{t('available_services')}</h3>

        <div className="services-grid">
          {services.map((service) => (
            <button key={service.route} onClick={() => navigate(service.route)} className="service-tile">
              <div className="service-tile-icon">
                {service.logo ? (
                  <img
                    src={service.logo}
                    alt={t(service.nameKey)}
                    className="service-tile-logo"
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = '🏛️'; }}
                  />
                ) : (
                  <span className="service-tile-emoji">{service.icon}</span>
                )}
              </div>
              <div className="service-tile-name">{t(service.nameKey)}</div>
              <div className="service-tile-desc">{t(service.descKey)}</div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;