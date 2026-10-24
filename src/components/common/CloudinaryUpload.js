import { useState } from 'react';

// ============================================================
// CLOUDINARY CONFIGURATION
// ============================================================
const CLOUD_NAME = 'gykoybmc';
const UPLOAD_PRESET = 'pension_upload_unsigned';
const DEFAULT_FOLDER = 'citizen_documents';

// ============================================================
// CLOUDINARY UPLOAD COMPONENT
// Direct fetch upload — no widget script needed.
// Compact layout, no "Change" button after upload.
// ============================================================
const CloudinaryUpload = ({
  label,
  onUpload,
  folder = DEFAULT_FOLDER,
  formats = ['png', 'jpg', 'jpeg', 'pdf'],
  maxSizeMB = 5,
  currentUrl = null,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState(currentUrl);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!formats.includes(ext)) {
      setError(`Only ${formats.join(', ').toUpperCase()} files are allowed.`);
      e.target.value = '';
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum ${maxSizeMB} MB.`);
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);
      if (folder) fd.append('folder', folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        { method: 'POST', body: fd }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || 'Upload failed.');
      }

      setFileUrl(data.secure_url);
      setFileName(file.name);
      if (onUpload) onUpload(data.secure_url);
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    setFileUrl(null);
    setFileName('');
    setError('');
    if (onUpload) onUpload(null);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 'bold',
            marginBottom: 6,
            color: '#333',
          }}
        >
          {label}
        </label>
      )}

      {error && (
        <div
          style={{
            background: '#fff0f0',
            border: '1px solid #ffcccc',
            color: '#cc0000',
            padding: 8,
            borderRadius: 6,
            fontSize: 12,
            marginBottom: 6,
          }}
        >
          {error}
        </div>
      )}

      {fileUrl ? (
        /* ---------- Compact "Uploaded" row ---------- */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '8px 12px',
            background: '#e6f4ea',
            border: '1px solid #a8d5b8',
            borderRadius: 6,
            flexWrap: 'nowrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
              flex: 1,
            }}
          >
            <span
              style={{
                color: '#006600',
                fontWeight: 'bold',
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              ✓
            </span>
            <span
              style={{
                fontSize: 12,
                color: '#006600',
                fontWeight: 'bold',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {fileName || 'Uploaded'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                background: 'white',
                border: '1px solid #003366',
                color: '#003366',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block',
              }}
            >
              View
            </a>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || uploading}
              style={{
                background: 'white',
                border: '1px solid #cc0000',
                color: '#cc0000',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                cursor: disabled || uploading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* ---------- Compact upload button ---------- */
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: disabled || uploading ? '#999' : '#f0f6ff',
            border: '1px dashed #99b3cc',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 12,
            cursor: disabled || uploading ? 'not-allowed' : 'pointer',
            color: disabled || uploading ? 'white' : '#003366',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
          }}
        >
          {uploading ? '⏳ Uploading…' : '📎 Choose File'}
          <input
            type="file"
            accept={formats.map((f) => `.${f}`).join(',')}
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            style={{ display: 'none' }}
          />
        </label>
      )}
    </div>
  );
};

export default CloudinaryUpload;