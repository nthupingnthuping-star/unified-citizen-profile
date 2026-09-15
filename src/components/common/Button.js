const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  style = {},
}) => {
  const variants = {
    primary: { background: '#003366', color: 'white', border: 'none' },
    secondary: { background: '#eee', color: '#333', border: '1px solid #ccc' },
    success: { background: '#006600', color: 'white', border: 'none' },
    danger: { background: '#cc0000', color: 'white', border: 'none' },
    outline: { background: 'white', color: '#003366', border: '1px solid #003366' },
  };

  const sizes = {
    small: { padding: '6px 14px', fontSize: 12 },
    medium: { padding: '10px 20px', fontSize: 14 },
    large: { padding: '14px 30px', fontSize: 16 },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        fontWeight: 'bold',
        width: fullWidth ? '100%' : 'auto',
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export default Button;