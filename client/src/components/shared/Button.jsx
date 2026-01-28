// src/admin/components/Common/Button.jsx
import React from 'react';

/**
 * Reusable Button Component with Tailwind CSS
 *
 * @param {Object} props
 * @param {'primary'|'secondary'|'danger'|'success'} props.variant - Button style variant
 * @param {'sm'|'md'|'lg'|'small'} props.size - Button size
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onClick - Click handler
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.icon - Optional icon to display before text
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
  className = '',
  ...props
}) {
  // Map 'small' to 'sm' for backward compatibility
  const normalizedSize = size === 'small' ? 'sm' : size;

  // Size classes
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-[13px]',
    lg: 'px-6 py-3 text-sm'
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-[#FFD41C] text-[#1E2347] border-none',
    secondary: 'bg-[rgba(255,212,28,0.2)] text-[#FFD41C] border border-[rgba(255,212,28,0.3)]',
    danger: 'bg-[#EF4444] text-white border-none',
    success: 'bg-[#22C55E] text-white border-none'
  };

  // Base classes
  const baseClasses = `
    rounded-lg font-bold uppercase tracking-wide
    inline-flex items-center gap-1.5
    transition-all duration-200
    ${disabled || loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:-translate-y-0.5'}
    ${sizeClasses[normalizedSize]}
    ${variantClasses[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      className={baseClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
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
