// src/merchant/components/Common/SearchBar.jsx
// Reusable search bar component

import React from 'react';

export default function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <span style={{
        position: 'absolute',
        left: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '18px',
        color: 'rgba(255,212,28,0.6)'
      }}>
        🔍
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px 16px 12px 44px',
          border: '2px solid rgba(255, 212, 28, 0.3)',
          borderRadius: '10px',
          background: 'rgba(251, 251, 251, 0.05)',
          color: 'rgba(251, 251, 251, 0.9)',
          fontSize: '14px',
          boxSizing: 'border-box',
          transition: 'all 0.3s ease',
          outline: 'none'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgba(255, 212, 28, 0.6)';
          e.target.style.background = 'rgba(251, 251, 251, 0.08)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(255, 212, 28, 0.3)';
          e.target.style.background = 'rgba(251, 251, 251, 0.05)';
        }}
      />
    </div>
  );
}
