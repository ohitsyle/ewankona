// src/admin/components/Common/Input.jsx
import React from 'react';
import styles from './Common.module.css';

/**
 * Input Component
 * 
 * @param {string} label - Input label
 * @param {string} type - Input type
 * @param {string} placeholder - Placeholder text
 * @param {string} value - Input value
 * @param {Function} onChange - Change handler
 * @param {boolean} required - Required field
 * @param {boolean} disabled - Disabled state
 */
export default function Input({
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  required = false,
  disabled = false,
  name,
  className = '',
  ...props
}) {
  return (
    <div className={styles['form-group']}>
      {label && (
        <label className={styles.label} htmlFor={name}>
          {label} {required && '*'}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        className={`${styles.input} ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        {...props}
      />
    </div>
  );
}