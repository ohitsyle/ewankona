// src/admin/components/Common/Select.jsx
import React from 'react';
import styles from './Common.module.css';

/**
 * Select Component
 * 
 * @param {string} label - Select label
 * @param {Array} options - Array of {value, label} objects
 * @param {string} value - Selected value
 * @param {Function} onChange - Change handler
 */
export default function Select({
  label,
  options = [],
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
      <select
        id={name}
        name={name}
        className={`${styles.select} ${className}`}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}