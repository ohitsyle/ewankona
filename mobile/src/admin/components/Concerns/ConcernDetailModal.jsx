// src/admin/components/Concerns/ConcernDetailModal.jsx
import React from 'react';

export default function ConcernDetailModal({ concern, onClose }) {
  if (!concern) return null;

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return { bg: 'rgba(239,68,68,0.2)', color: '#EF4444' };
      case 'medium': return { bg: 'rgba(251,191,36,0.2)', color: '#FBBF24' };
      default: return { bg: 'rgba(34,197,94,0.2)', color: '#22C55E' };
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'resolved': return { bg: 'rgba(34,197,94,0.2)', color: '#22C55E' };
      case 'in_progress': return { bg: 'rgba(59,130,246,0.2)', color: '#3B82F6' };
      case 'closed': return { bg: 'rgba(107,114,128,0.2)', color: '#6B7280' };
      default: return { bg: 'rgba(251,191,36,0.2)', color: '#FBBF24' };
    }
  };

  const priorityStyle = getPriorityColor(concern.priority);
  const statusStyle = getStatusColor(concern.status);

  return (
    <div onClick={onClose} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(15,18,39,0.9)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1227 100%)',
        borderRadius: '16px',
        maxWidth: '700px',
        width: '90%',
        maxHeight: '85vh',
        overflow: 'auto',
        border: '2px solid rgba(255,212,28,0.3)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'slideIn 0.3s ease'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '24px',
          borderBottom: '2px solid rgba(255,212,28,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FFD41C', margin: 0 }}>
                Concern Details
              </h2>
              <span style={{ fontSize: '14px', color: 'rgba(251,251,251,0.5)', fontWeight: 600 }}>
                #{concern.concernId || concern._id.slice(-6)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: priorityStyle.bg,
                color: priorityStyle.color
              }}>
                {concern.priority || 'low'} priority
              </span>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: statusStyle.bg,
                color: statusStyle.color
              }}>
                {concern.status || 'pending'}
              </span>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: 'rgba(59,130,246,0.2)',
                color: '#3B82F6'
              }}>
                {concern.category || 'general'}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(239,68,68,0.2)',
            border: 'none',
            color: '#EF4444',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>×</button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {/* User Information */}
          <div style={{
            background: 'rgba(255,212,28,0.05)',
            border: '1px solid rgba(255,212,28,0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase', marginBottom: '12px' }}>
              User Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>User Name</div>
                <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)', fontWeight: 600 }}>
                  {concern.userName || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>User ID</div>
                <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)', fontFamily: 'monospace' }}>
                  {concern.userId || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Submitted At</div>
                <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)' }}>
                  {new Date(concern.submittedAt || concern.createdAt).toLocaleString()}
                </div>
              </div>
              {concern.email && (
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Email</div>
                  <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)' }}>
                    {concern.email}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Concern Title */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase', marginBottom: '8px' }}>
              Subject
            </h3>
            <div style={{
              fontSize: '16px',
              color: 'rgba(251,251,251,0.95)',
              fontWeight: 600,
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255,212,28,0.1)'
            }}>
              {concern.title || concern.subject || 'No title provided'}
            </div>
          </div>

          {/* Concern Description */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase', marginBottom: '8px' }}>
              Description
            </h3>
            <div style={{
              fontSize: '14px',
              color: 'rgba(251,251,251,0.85)',
              lineHeight: '1.6',
              padding: '16px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255,212,28,0.1)',
              whiteSpace: 'pre-wrap'
            }}>
              {concern.description || concern.message || 'No description provided'}
            </div>
          </div>

          {/* Additional Details */}
          {(concern.attachments || concern.metadata) && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,212,28,0.1)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase', marginBottom: '12px' }}>
                Additional Information
              </h3>
              {concern.attachments && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Attachments</div>
                  <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.7)' }}>
                    {concern.attachments.length || 0} file(s)
                  </div>
                </div>
              )}
              {concern.metadata && (
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Metadata</div>
                  <div style={{ fontSize: '13px', color: 'rgba(251,251,251,0.6)', fontFamily: 'monospace' }}>
                    {JSON.stringify(concern.metadata, null, 2)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Response/Notes Section */}
          {concern.response && (
            <div style={{
              background: 'rgba(34,197,94,0.05)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', marginBottom: '8px' }}>
                Admin Response
              </h3>
              <div style={{
                fontSize: '14px',
                color: 'rgba(251,251,251,0.85)',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {concern.response}
              </div>
              {concern.respondedAt && (
                <div style={{ fontSize: '12px', color: 'rgba(251,251,251,0.5)', marginTop: '8px' }}>
                  Responded at: {new Date(concern.respondedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '2px solid rgba(255,212,28,0.2)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} style={{
            padding: '12px 24px',
            background: '#FFD41C',
            color: '#181D40',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255,212,28,0.4)'
          }}>
            Close
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
