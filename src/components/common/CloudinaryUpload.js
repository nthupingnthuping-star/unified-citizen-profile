import { useState, useEffect } from 'react';

const CLOUD_NAME = 'gykoybmc';
const UPLOAD_PRESET = 'pension_upload_unsigned';

const CloudinaryUpload = ({
  label,
  onUpload,
  folder = 'citizen_documents',
  formats = ['png', 'jpg', 'jpeg', 'pdf'],
  maxSizeMB = 5,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState('');

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
        folder: folder,
        sources: ['local', 'camera'],
        multiple: false,
        resourceType: 'auto',
        clientAllowedFormats: formats,
        maxFileSize: maxSizeMB * 1024 * 1024,
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          const url = result.info.secure_url;
          const name = result.info.original_filename || 'document';
          setFileUrl(url);
          setFileName(name);
          if (onUpload) onUpload(url);
        }
      }
    );
    widget.open();
  };

  const handleClear = () => {
    setFileUrl(null);
    setFileName('');
    if (onUpload) onUpload(null);
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block',
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#333',
      }}>
        {label}
      </label>

      {fileUrl ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: 12,
          background: '#e6f4ea',
          border: '1px solid #a8d5b8',
          borderRadius: 6,
        }}>
          <div>
            <div style={{ color: '#006600', fontWeight: 'bold', fontSize: 13 }}>
              ✓ Uploaded
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              {fileName}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={openWidget} style={{
              background: 'white', border: '1px solid #006600', color: '#006600',
              padding: '6px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 'bold',
            }}>
              Change
            </button>
            <button type="button" onClick={handleClear} style={{
              background: 'white', border: '1px solid #cc0000', color: '#cc0000',
              padding: '6px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 'bold',
            }}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={openWidget} style={{
          background: '#f0f6ff',
          border: '1px dashed #99b3cc',
          borderRadius: 6,
          padding: '12px 20px',
          fontSize: 13,
          cursor: 'pointer',
          color: '#003366',
          fontWeight: 'bold',
        }}>
          📎 Choose File to Upload
        </button>
      )}
    </div>
  );
};

export default CloudinaryUpload;