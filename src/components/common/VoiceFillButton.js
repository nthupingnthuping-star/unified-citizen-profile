import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import VoiceFillWizard from './VoiceFillWizard';

const VoiceFillButton = ({ fields, onComplete }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const voiceLang = 'en-ZA';
  const [hover, setHover] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: hover ? '#004080' : '#003366',
          color: 'white',
          border: 'none',
          padding: '10px 18px',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: hover ? '0 4px 12px rgba(0, 51, 102, 0.25)' : '0 2px 6px rgba(0, 51, 102, 0.15)',
          transition: 'all 0.2s ease',
          marginBottom: 16,
          fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: 16 }}>🎙️</span>
        <span>{t('use_voice_to_fill')}</span>
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