// Reusable confirmation dialog component
import React from 'react';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'danger', // 'danger' or 'success'
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  const confirmButtonStyles = confirmColor === 'danger'
    ? {
        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        color: '#FFFFFF'
      }
    : {
        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        color: '#FFFFFF'
      };

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(15, 18, 39, 0.9)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1227 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 212, 28, 0.2)',
          padding: '32px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 0.3s ease'
        }}
      >
        {/* Title */}
        <h3 style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#FBFBFB',
          margin: '0 0 16px 0'
        }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{
          fontSize: '14px',
          color: 'rgba(251, 251, 251, 0.8)',
          margin: '0 0 24px 0',
          lineHeight: '1.6'
        }}>
          {message}
        </p>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 212, 28, 0.1)',
              border: '2px solid rgba(255, 212, 28, 0.3)',
              borderRadius: '8px',
              color: '#FFD41C',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 212, 28, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 212, 28, 0.1)';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '12px 24px',
              ...confirmButtonStyles,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
