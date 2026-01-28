// src/admin/components/Logs/LogDetailModal.jsx
import React from 'react';

export default function LogDetailModal({ log, onClose }) {
  if (!log) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return { bg: 'rgba(239,68,68,0.2)', color: '#EF4444', border: 'rgba(239,68,68,0.3)' };
      case 'warning': return { bg: 'rgba(251,191,36,0.2)', color: '#FBBF24', border: 'rgba(251,191,36,0.3)' };
      default: return { bg: 'rgba(34,197,94,0.2)', color: '#22C55E', border: 'rgba(34,197,94,0.3)' };
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'admin_action': return { bg: 'rgba(59,130,246,0.2)', color: '#3B82F6', border: 'rgba(59,130,246,0.3)' };
      case 'user_action': return { bg: 'rgba(168,85,247,0.2)', color: '#A855F7', border: 'rgba(168,85,247,0.3)' };
      default: return { bg: 'rgba(255,212,28,0.2)', color: '#FFD41C', border: 'rgba(255,212,28,0.3)' };
    }
  };

  const severityStyle = getSeverityColor(log.severity);
  const typeStyle = getTypeColor(log.eventType || log.type);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1E2347 0%, #181D40 100%)',
          borderRadius: '20px',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '2px solid rgba(255,212,28,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '2px solid rgba(255,212,28,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ color: '#FFD41C', margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700 }}>
              📋 Event Log Details
            </h3>
            <p style={{ color: 'rgba(251,251,251,0.6)', margin: 0, fontSize: '12px' }}>
              Event ID: {log.eventId || log._id}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,212,28,0.15)',
              border: '2px solid rgba(255,212,28,0.3)',
              borderRadius: '8px',
              color: '#FFD41C',
              fontSize: '20px',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Timestamp & Badges */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: typeStyle.bg,
                color: typeStyle.color,
                border: `1px solid ${typeStyle.border}`
              }}>
                {log.eventType || log.type}
              </span>
              <span style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: severityStyle.bg,
                color: severityStyle.color,
                border: `1px solid ${severityStyle.border}`
              }}>
                {log.severity || 'info'}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(251,251,251,0.6)' }}>
              🕒 {new Date(log.timestamp).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>

          {/* Title */}
          {log.title && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#FFD41C',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                Title
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#FBFBFB',
                lineHeight: '1.5'
              }}>
                {log.title}
              </div>
            </div>
          )}

          {/* Description/Message */}
          {(log.description || log.message) && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#FFD41C',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                Description
              </div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(251,251,251,0.8)',
                lineHeight: '1.6',
                background: 'rgba(255,255,255,0.05)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,212,28,0.1)'
              }}>
                {log.description || log.message}
              </div>
            </div>
          )}

          {/* Additional Details */}
          {log.details && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#FFD41C',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                Additional Details
              </div>
              <div style={{
                fontSize: '13px',
                color: 'rgba(251,251,251,0.7)',
                background: 'rgba(255,255,255,0.05)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,212,28,0.1)',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}
              </div>
            </div>
          )}

          {/* User/Entity Info */}
          {(log.userId || log.adminId || log.driverId || log.entityType) && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#FFD41C',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                Entity Information
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {log.userId && (
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '10px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>User ID</div>
                    <div style={{ fontSize: '13px', color: '#FBFBFB', fontWeight: 600 }}>{log.userId}</div>
                  </div>
                )}
                {log.adminId && (
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '10px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Admin ID</div>
                    <div style={{ fontSize: '13px', color: '#FBFBFB', fontWeight: 600 }}>{log.adminId}</div>
                  </div>
                )}
                {log.driverId && (
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '10px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Driver ID</div>
                    <div style={{ fontSize: '13px', color: '#FBFBFB', fontWeight: 600 }}>{log.driverId}</div>
                  </div>
                )}
                {log.entityType && (
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '10px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Entity Type</div>
                    <div style={{ fontSize: '13px', color: '#FBFBFB', fontWeight: 600 }}>{log.entityType}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
