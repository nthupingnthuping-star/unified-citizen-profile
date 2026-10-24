import { useLanguage } from '../../i18n/LanguageContext';

const SimpleModeToggle = ({ variant = 'dark' }) => {
  const { simpleMode, toggleSimpleMode } = useLanguage();

  const isLight = variant === 'light';

  const bg = isLight
    ? 'rgba(255,255,255,0.15)'
    : simpleMode
    ? '#003366'
    : 'white';

  const color = isLight
    ? 'white'
    : simpleMode
    ? 'white'
    : '#003366';

  const border = isLight
    ? '1px solid rgba(255,255,255,0.4)'
    : simpleMode
    ? '1px solid #003366'
    : '1px solid #003366';

  return (
    <button
      type="button"
      onClick={toggleSimpleMode}
      title={simpleMode ? 'Switch back to normal size' : 'Switch to big text (easier to read)'}
      style={{
        background: bg,
        color,
        border,
        padding: '8px 14px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 16 }}>
        {simpleMode ? '🔎' : '🔍'}
      </span>
      <span>
        {simpleMode ? 'Normal size' : 'Big text'}
      </span>
    </button>
  );
};

export default SimpleModeToggle;