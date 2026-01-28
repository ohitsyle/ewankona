// src/admin/components/common/StatusFilter.jsx
import React from 'react';

export default function StatusFilter({ value, onChange, options, label = "Status" }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' }}>
      <label style={{
        fontSize: '11px',
        fontWeight: 700,
        color: '#FFD41C',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '10px 12px',
          border: '2px solid rgba(255, 212, 28, 0.3)',
          borderRadius: '10px',
          background: 'rgba(251, 251, 251, 0.05)',
          color: 'rgba(251, 251, 251, 0.9)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          outline: 'none'
        }}
      >
        <option value="">All</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
