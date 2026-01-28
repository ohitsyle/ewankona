// src/merchant/components/Common/Alert.jsx
import React, { useEffect } from 'react';
import styles from './Common.module.css';

/**
 * Alert Component - Toast notifications
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
  autoClose = 5000,
}) {
  useEffect(() => {
    if (autoClose > 0 && onClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  if (!message) return null;

  const icon = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }[variant];

  return (
    <div className={`${styles.alert} ${styles[`alert-${variant}`]}`}>
      <span>{icon}</span>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
