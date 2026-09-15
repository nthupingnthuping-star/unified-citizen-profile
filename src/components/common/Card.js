const Card = ({ children, title, padding = 25, style = {} }) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: 8,
      padding,
      border: '1px solid #ddd',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      ...style,
    }}>
      {title && (
        <h3 style={{ marginTop: 0, color: '#003366', marginBottom: 15 }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;