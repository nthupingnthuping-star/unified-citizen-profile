import { useState, useRef } from 'react';

// ============================================================
// CLOUDINARY CONFIG
// ============================================================
const CLOUD_NAME = 'gykoybmc';
const UPLOAD_PRESET = 'pension_upload_unsigned';
const FOLDER = 'citizen_photos';

// ============================================================
// PHOTO UPLOAD
// WhatsApp-style avatar with camera badge.
// Once a photo exists, the citizen CANNOT change it — the
// camera badge disappears and the avatar becomes read-only.
// This prevents account takeover via photo replacement.
// ============================================================
const PhotoUpload = ({
  currentUrl = '',
  onUpload,
  disabled = false,
  size = 110,
}) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const [error, setError] = useState('');

  // 🔒 LOCK: as soon as a photo exists (or has just been uploaded),
  // the citizen can no longer change it.
  const locked = Boolean(preview);

  const openPicker = () => {
    if (locked) return;      // silent no-op when locked
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['png', 'jpg', 'jpeg'].includes(ext)) {
      setError('Only PNG, JPG, or JPEG images are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Maximum 5 MB.');
      e.target.value = '';
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);
      fd.append('folder', FOLDER);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        { method: 'POST', body: fd }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Upload failed.');

      setPreview(data.secure_url);
      if (onUpload) onUpload(data.secure_url);
    } catch (err) {
      console.error(err);
      setPreview(currentUrl);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
      e.target.value = '';
    }
  };

  const badgeSize = Math.round(size * 0.32);
  const iconSize = Math.round(badgeSize * 0.55);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled || uploading || locked}
        style={{
          position: 'relative',
          width: size,
          height: size,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: locked ? 'default' : (disabled || uploading ? 'not-allowed' : 'pointer'),
          borderRadius: '50%',
        }}
        aria-label={locked ? 'Profile photo' : 'Upload profile photo'}
        title={locked ? 'Profile photo is locked' : 'Upload profile photo'}
      >
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: Math.round(size * 0.4),
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0, 51, 102, 0.22)',
            border: '3px solid white',
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ opacity: 0.7 }}>👤</span>
          )}
        </div>

        {/* Camera badge — only shown BEFORE first upload */}
        {!locked && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: badgeSize,
              height: badgeSize,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #006600 0%, #00a050 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0, 102, 0, 0.4)',
              pointerEvents: 'none',
            }}
          >
            <svg
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}

        {/* Uploading overlay */}
        {uploading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 'bold',
            }}
          >
            …
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        onChange={handleFileSelect}
        disabled={disabled || uploading || locked}
        style={{ display: 'none' }}
      />

      {error && (
        <div
          style={{
            marginTop: 10,
            background: '#fff0f0',
            border: '1px solid #ffcccc',
            color: '#cc0000',
            padding: 8,
            borderRadius: 6,
            fontSize: 12,
            maxWidth: 280,
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;