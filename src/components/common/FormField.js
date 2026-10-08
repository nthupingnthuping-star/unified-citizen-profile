const FormField = ({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  fromProfile = false,
  placeholder = '',
  as = 'input',
  options = [],
  rows = 3,
}) => {
  const inputStyle = {
    width: '100%',
    padding: 10,
    border: '1px solid #ccc',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box',
    background: fromProfile ? '#f0f7ff' : 'white',
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
      }}>
        <label style={{ fontSize: 13, color: '#333', fontWeight: 'bold' }}>
          {label}{required ? ' *' : ''}
        </label>
        {fromProfile && (
          <span style={{
            background: '#006600',
            color: 'white',
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 10,
            fontWeight: 'bold',
            letterSpacing: 0.3,
          }}>
            ✓ from profile
          </span>
        )}
      </div>

      {as === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          style={inputStyle}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : as === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={rows}
          placeholder={placeholder}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          style={inputStyle}
        />
      )}
    </div>
  );
};

export default FormField;