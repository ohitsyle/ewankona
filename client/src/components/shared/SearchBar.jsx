// src/admin/components/common/SearchBar.jsx
// Reusable search bar component

import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function SearchBar({ value, onChange, placeholder = "Search..." }) {
  const { theme, isDarkMode } = useTheme();

  return (
    <div className="relative w-full max-w-[400px]">
      <span style={{
        position: 'absolute',
        left: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '18px',
        color: isDarkMode ? 'rgba(255,212,28,0.6)' : 'rgba(59,130,246,0.6)'
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
          border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
          borderRadius: '10px',
          background: 'rgba(251,251,251,0.05)',
          color: 'rgba(251,251,251,0.9)',
          fontSize: '14px',
          transition: 'all 0.3s',
          outline: 'none',
          boxSizing: 'border-box'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = isDarkMode ? 'rgba(255,212,28,0.6)' : 'rgba(59,130,246,0.6)';
          e.target.style.background = 'rgba(251,251,251,0.08)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)';
          e.target.style.background = 'rgba(251,251,251,0.05)';
        }}
      />
    </div>
  );
}
