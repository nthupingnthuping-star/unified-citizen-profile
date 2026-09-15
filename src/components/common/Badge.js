const Badge = ({ children, color = 'blue', size = 'medium' }) => {
  const colors = {
    blue: { bg: '#e6f0fa', color: '#003366' },
    green: { bg: '#d4edda', color: '#155724' },
    yellow: { bg: '#fff3cd', color: '#856404' },
    red: { bg: '#f8d7da', color: '#721c24' },
    gray: { bg: '#eee', color: '#333' },
    purple: { bg: '#e6dcf5', color: '#4a1e9e' },
  };

  const sizes = {
    small: { padding: '2px 8px', fontSize: 11 },
    medium: { padding: '4px 12px', fontSize: 12 },
    large: { padding: '6px 16px', fontSize: 14 },
  };

  const c = colors[color] || colors.blue;

  return (
    <span style={{
      display: 'inline-block',
      borderRadius: 12,
      fontWeight: 'bold',
      textTransform: 'capitalize',
      ...sizes[size],
      ...c,
    }}>
      {children}
    </span>
  );
};

export default Badge;