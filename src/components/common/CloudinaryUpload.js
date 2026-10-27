import { useState, useRef } from 'react';

// ============================================================
// CLOUDINARY CONFIGURATION
// ============================================================
const CLOUD_NAME = 'gykoybmc';
const UPLOAD_PRESET = 'pension_upload_unsigned';
const DEFAULT_FOLDER = 'citizen_documents';

// ============================================================
// HELPERS
// ============================================================
const compressImage = (file, { maxDim = 1600, quality = 0.8 } = {}) =>
  new Promise((resolve) => {
    if (!file.type.startsWith('image/')) return resolve(file);

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          resolve(
            new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
              type: 'image/jpeg',
            })
          );
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });

const uploadWithProgress = (file, { folder, onProgress }) =>
  new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    if (folder) fd.append('folder', folder);
    
    // Optimize the file on Cloudinary's servers
    fd.append('quality', 'auto:good');
    fd.append('fetch_format', 'auto');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data?.error?.message || `Upload failed with status ${xhr.status}`));
        }
      } catch (err) {
        reject(new Error('Invalid server response. Check Cloudinary upload preset.'));
      }
    };
    
    // This catches the "Failed to fetch" errors
    xhr.onerror = () => reject(new Error('Network error: Failed to fetch. Check your internet connection or Cloudinary settings.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out. Please try again.'));
    xhr.timeout = 90000; // 90 seconds timeout
    
    xhr.send(fd);
  });

// ============================================================
// COMPONENT
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
  const [progress, setProgress] = useState(0);
  const [fileUrl, setFileUrl] = useState(currentUrl);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const startRef = useRef(0);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setProgress(0);

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
    startRef.current = Date.now();
    
    try {
      // Shrink images before they leave the browser to speed up upload.
      const preparedFile = await compressImage(file);

      const data = await uploadWithProgress(preparedFile, {
        folder,
        onProgress: setProgress,
      });

      setFileUrl(data.secure_url);
      setFileName(file.name);
      if (onUpload) onUpload(data.secure_url);
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    setFileUrl(null);
    setFileName('');
    setError('');
    setProgress(0);
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
        /* ---------- Upload button + Progress Bar ---------- */
        <div>
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
            {uploading ? `⏳ Uploading… ${progress}%` : '📎 Choose File'}
            <input
              type="file"
              accept={formats.map((f) => `.${f}`).join(',')}
              onChange={handleFileSelect}
              disabled={disabled || uploading}
              style={{ display: 'none' }}
            />
          </label>
          
          {uploading && (
            <div
              style={{
                marginTop: 6,
                height: 4,
                background: '#e0e8f0',
                borderRadius: 2,
                overflow: 'hidden',
                maxWidth: 200,
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #003366 0%, #0055aa 100%)',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CloudinaryUpload;