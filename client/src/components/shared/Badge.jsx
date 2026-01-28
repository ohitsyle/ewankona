// src/admin/components/Common/Badge.jsx
import React from 'react';

/**
 * Badge Component - Status indicators with Tailwind CSS
 *
 * @param {'success'|'warning'|'danger'|'info'} variant - Badge color variant
 * @param {React.ReactNode} children - Badge content
 */
export default function Badge({ variant = 'info', children, className = '' }) {
  const variantClasses = {
    success: 'bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.3)]',
    warning: 'bg-[rgba(251,191,36,0.15)] text-[#FBBF24] border-[rgba(251,191,36,0.3)]',
    danger: 'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.3)]',
    info: 'bg-[rgba(59,130,246,0.15)] text-[#3B82F6] border-[rgba(59,130,246,0.3)]',
  }[variant];

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}
