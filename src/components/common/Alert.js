const Alert = ({ type = 'info', children, onClose }) => {
  const colors = {
    info: { bg: '#e6f0fa', color: '#003366', border: '#b3d4f0' },
    success: { bg: '#e6ffe6', color: '#006600', border: '#b3e6b3' },
    warning: { bg: '#fff3cd', color: '#856404', border: '#ffcc00' },
    error: { bg: '#ffe6e6', color: '#cc0000', border: '#ffb3b3' },
  };

  const icons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    error: '✗',
  };

  const c = colors[type] || colors.info;

  return (
    <div style={{
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      padding: 12,
      borderRadius: 4,
      marginBottom: 15,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{icons[type]}</span>
        <span>{children}</span>
      </div>
      {onClose && (
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: c.color, fontSize: 16, padding: 0,
        }}>×</button>
      )}
    </div>
  );
};

export default Alert;