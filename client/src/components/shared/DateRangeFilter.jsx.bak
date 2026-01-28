// src/admin/components/common/DateRangeFilter.jsx
import React from 'react';

export default function DateRangeFilter({ startDate, endDate, onStartChange, onEndChange }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#FFD41C',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          From
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
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
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#FFD41C',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          To
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
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
        />
      </div>
      {(startDate || endDate) && (
        <button
          onClick={() => {
            onStartChange('');
            onEndChange('');
          }}
          style={{
            padding: '10px 16px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: '#EF4444',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Clear Dates
        </button>
      )}
    </div>
  );
}
