const Spinner = ({ size = 'medium', text = 'Loading...' }) => {
  const sizes = { small: 20, medium: 40, large: 60 };
  const s = sizes[size] || sizes.medium;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        width: s, height: s,
        border: '4px solid #eee',
        borderTop: '4px solid #003366',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      {text && (
        <p style={{ marginTop: 10, color: '#666', fontSize: 14 }}>{text}</p>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Spinner;