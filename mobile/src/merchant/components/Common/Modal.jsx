// src/merchant/components/Common/Modal.jsx
import React, { useEffect } from 'react';
import styles from './Common.module.css';

/**
 * Modal Component
 *
 * @param {boolean} isOpen - Modal open state
 * @param {Function} onClose - Close handler
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Modal body content
 * @param {React.ReactNode} footer - Modal footer content
 */
export default function Modal({ isOpen, onClose, title, children, footer }) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div
        className={styles['modal-content']}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles['modal-header']}>
          <h2 className={styles['modal-title']}>{title}</h2>
          <button className={styles['modal-close']} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles['modal-body']}>{children}</div>

        {footer && <div className={styles['modal-footer']}>{footer}</div>}
      </div>
    </div>
  );
}
