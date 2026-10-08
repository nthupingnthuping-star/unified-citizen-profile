import { useState, useEffect } from 'react';

const CLOUD_NAME = 'gykoybmc';
const UPLOAD_PRESET = 'pension_upload_unsigned';

const PhotoUpload = ({ label = 'Profile Photo', currentUrl, onUpload }) => {
  const [loaded, setLoaded] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(currentUrl || '');

  useEffect(() => {
    if (currentUrl) setPhotoUrl(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
    if (window.cloudinary) {
      setLoaded(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.cloudinary) {
        setLoaded(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const openWidget = () => {
    if (!window.cloudinary) {
      alert('Cloudinary script not loaded. Check index.html.');
      return;
    }
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        folder: 'citizen_documents',
        sources: ['local', 'camera'],
        multiple: false,
        resourceType: 'image',
        clientAllowedFormats: ['png', 'jpg', 'jpeg'],
        maxFileSize: 3000000,
        cropping: true,
        croppingAspectRatio: 1,
        croppingShowDimensions: false,
        showSkipCropButton: false,
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          const url = result.info.secure_url;
          setPhotoUrl(url);
          if (onUpload) onUpload(url);
        }
      }
    );
    widget.open();
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block',
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
      }}>
        {label}
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          fontWeight: 'bold',
          flexShrink: 0,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0, 51, 102, 0.22)',
        }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            '👤'
          )}
        </div>

        <div style={{ flex: 1 }}>
          <button
            type="button"
            onClick={openWidget}
            style={{
              background: loaded ? 'linear-gradient(135deg, #003366 0%, #0055aa 100%)' : '#999',
              color: 'white',
              border: 'none',
              padding: '10px 22px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 'bold',
              cursor: loaded ? 'pointer' : 'not-allowed',
              boxShadow: loaded ? '0 4px 14px rgba(0, 51, 102, 0.25)' : 'none',
            }}
          >
            {photoUrl ? '📷 Change Photo' : '📷 Upload Photo'}
          </button>
          <p style={{ fontSize: 12, color: '#666', margin: '8px 0 0 0' }}>
            Square crop, JPG or PNG, max 3 MB.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhotoUpload;