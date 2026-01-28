// src/admin/components/Common/Alert.jsx
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Alert Component - Clean, swooshy toast notifications
 *
 * @param {'success'|'error'|'warning'|'info'} variant - Alert type
 * @param {string} message - Alert message
 * @param {Function} onClose - Close handler
 * @param {number} autoClose - Auto-close after ms (0 = no auto-close)
 */
export default function Alert({
  variant = 'info',
  message,
  onClose,
  autoClose = 4000,
}) {
  const { isDarkMode } = useTheme();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (autoClose > 0 && onClose) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onClose, 300); // Wait for exit animation
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  if (!message) return null;

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const icon = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i',
  }[variant];

  const styles = {
    success: {
      bg: isDarkMode ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)',
      text: '#10B981',
      border: '#10B981',
      iconBg: 'rgba(16,185,129,0.3)'
    },
    error: {
      bg: isDarkMode ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)',
      text: '#EF4444',
      border: '#EF4444',
      iconBg: 'rgba(239,68,68,0.3)'
    },
    warning: {
      bg: isDarkMode ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.15)',
      text: '#FBBF24',
      border: '#FBBF24',
      iconBg: 'rgba(251,191,36,0.3)'
    },
    info: {
      bg: isDarkMode ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)',
      text: '#3B82F6',
      border: '#3B82F6',
      iconBg: 'rgba(59,130,246,0.3)'
    },
  }[variant];

  return (
    <div
      style={{
        background: styles.bg,
        color: styles.text,
        borderLeft: `4px solid ${styles.border}`,
        padding: '14px 20px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        animation: isExiting ? 'slideOutRight 0.3s ease-out forwards' : 'slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        maxWidth: '500px',
        minWidth: '300px'
      }}
    >
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: styles.iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '16px',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: styles.text,
            cursor: 'pointer',
            fontSize: '24px',
            fontWeight: 'bold',
            padding: '0 4px',
            lineHeight: 1,
            transition: 'all 0.2s',
            opacity: 0.7
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'scale(1.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ×
        </button>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
