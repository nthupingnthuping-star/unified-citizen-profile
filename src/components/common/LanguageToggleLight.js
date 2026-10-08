import { useLanguage } from '../../i18n/LanguageContext';

const LanguageToggleLight = () => {
  const { language, changeLanguage } = useLanguage();

  const btnStyle = (active) => ({
    padding: '6px 12px',
    background: active ? '#003366' : 'white',
    color: active ? 'white' : '#003366',
    border: active ? '2px solid #003366' : '1px solid #ccc',
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
      background: 'white',
      padding: 4,
      borderRadius: 6,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <button
        type="button"
        style={btnStyle(language === 'en')}
        onClick={() => changeLanguage('en')}
        title="English"
      >
        EN
      </button>
      <button
        type="button"
        style={btnStyle(language === 'st')}
        onClick={() => changeLanguage('st')}
        title="Sesotho"
      >
        ST
      </button>
    </div>
  );
};

export default LanguageToggleLight;