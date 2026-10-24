import { useState } from 'react';
import VoiceFillWizard from './VoiceFillWizard';

const VoiceFillButton = ({ fields, onComplete }) => {
  const [open, setOpen] = useState(false);
  const voiceLang = 'en-ZA';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          background: 'linear-gradient(135deg, #006600 0%, #00a050 100%)',
          color: 'white',
          border: 'none',
          padding: '14px 28px',
          borderRadius: 999,
          fontSize: 16,
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0, 102, 0, 0.3)',
          minHeight: 56,
          marginBottom: 20,
        }}
      >
        <span style={{ fontSize: 20 }}>🎤</span>
        <span>Fill this form by voice</span>
      </button>

      {open && (
        <VoiceFillWizard
          fields={fields}
          voiceLang={voiceLang}
          onCancel={() => setOpen(false)}
          onComplete={(values) => {
            setOpen(false);
            if (onComplete) onComplete(values);
          }}
        />
      )}
    </>
  );
};

export default VoiceFillButton;