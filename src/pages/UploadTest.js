import { useState } from 'react';
import CloudinaryUpload from '../components/common/CloudinaryUpload';

const UploadTest = () => {
  const [url, setUrl] = useState(null);
  return (
    <div style={{ padding: 40, maxWidth: 700, margin: '0 auto' }}>
      <h1>Cloudinary Upload Test</h1>
      <CloudinaryUpload label="Test Document" onUpload={setUrl} />
      {url && (
        <div style={{ marginTop: 20 }}>
          <p><strong>Uploaded URL:</strong></p>
          <a href={url} target="_blank" rel="noreferrer" style={{ color: '#0066cc', wordBreak: 'break-all' }}>
            {url}
          </a>
        </div>
      )}
    </div>
  );
};

export default UploadTest;