import { useLanguage } from '../../i18n/LanguageContext';

const LanguageToggle = () => {
  const { language, changeLanguage } = useLanguage();

  const btnStyle = (active) => ({
    padding: '6px 12px',
    background: active ? '#ffcc00' : 'rgba(255,255,255,0.1)',
    color: active ? '#003366' : 'white',
    border: active ? '2px solid #ffcc00' : '1px solid rgba(255,255,255,0.3)',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 45,
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: 4,
    }}>
      <button
        type="button"
        style={btnStyle(language === 'en')}
        onClick={() => changeLanguage('en')}
        title="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        style={btnStyle(language === 'st')}
        onClick={() => changeLanguage('st')}
        title="Fetolela ho Sesotho"
      >
        ST
      </button>
    </div>
  );
};

export default LanguageToggle;