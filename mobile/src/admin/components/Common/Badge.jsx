// src/admin/components/Common/Badge.jsx
import React from 'react';
import styles from './Common.module.css';

/**
 * Badge Component - Status indicators
 * 
 * @param {'success'|'warning'|'danger'|'info'} variant - Badge color variant
 * @param {React.ReactNode} children - Badge content
 */
export default function Badge({ variant = 'info', children, className = '' }) {
  const badgeClass = [
    styles.badge,
    styles[`badge-${variant}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={badgeClass}>{children}</span>;
}