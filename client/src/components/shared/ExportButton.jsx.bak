// src/admin/components/common/ExportButton.jsx
// Reusable CSV export button

import React from 'react';

export default function ExportButton({ onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '12px 20px',
        background: disabled ? 'rgba(255, 212, 28, 0.3)' : 'rgba(255, 212, 28, 0.15)',
        border: '2px solid rgba(255, 212, 28, 0.4)',
        borderRadius: '10px',
        color: disabled ? 'rgba(255,212,28,0.5)' : '#FFD41C',
        fontSize: '14px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = 'rgba(255, 212, 28, 0.25)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = 'rgba(255, 212, 28, 0.15)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <span>📥</span>
      <span>Export CSV</span>
    </button>
  );
}
