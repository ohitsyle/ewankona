// src/admin/components/Common/Button.jsx
import React from 'react';

/**
 * Reusable Button Component with inline styles
 *
 * @param {Object} props
 * @param {'primary'|'secondary'|'danger'|'success'} props.variant - Button style variant
 * @param {'sm'|'md'|'lg'|'small'} props.size - Button size
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onClick - Click handler
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.icon - Optional icon to display before text
 * @param {object} props.style - Custom inline styles
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children,
  icon,
  type = 'button',
  style = {},
  ...props
}) {
  // Map 'small' to 'sm' for backward compatibility
  const normalizedSize = size === 'small' ? 'sm' : size;

  // Size styles
  const sizeStyles = {
    sm: { padding: '8px 16px', fontSize: '12px' },
    md: { padding: '10px 20px', fontSize: '13px' },
    lg: { padding: '12px 24px', fontSize: '14px' }
  };

  // Variant styles
  const variantStyles = {
    primary: {
      background: '#FFD41C',
      color: '#1E2347',
      border: 'none'
    },
    secondary: {
      background: 'rgba(255,212,28,0.2)',
      color: '#FFD41C',
      border: '1px solid rgba(255,212,28,0.3)'
    },
    danger: {
      background: '#EF4444',
      color: '#FFFFFF',
      border: 'none'
    },
    success: {
      background: '#22C55E',
      color: '#FFFFFF',
      border: 'none'
    }
  };

  // Base button styles
  const baseStyles = {
    borderRadius: '8px',
    fontWeight: 700,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    opacity: disabled || loading ? 0.5 : 1,
    ...sizeStyles[normalizedSize],
    ...variantStyles[variant],
    ...style
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const buttonStyle = {
    ...baseStyles,
    transform: isHovered && !disabled && !loading ? 'translateY(-2px)' : 'translateY(0)'
  };

  return (
    <button
      type={type}
      style={buttonStyle}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {loading ? (
        <>
          <span style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite'
          }}></span>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}