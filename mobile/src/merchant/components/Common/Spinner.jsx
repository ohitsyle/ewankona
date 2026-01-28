// src/merchant/components/Common/Spinner.jsx
import React from 'react';
import styles from './Common.module.css';

/**
 * Loading Spinner Component
 *
 * @param {boolean} large - Use large size
 * @param {string} message - Optional loading message
 */
export default function Spinner({ large = false, message = 'Loading...' }) {
  return (
    <div className={styles['table-loading']}>
      <div className={large ? styles['spinner-large'] : styles.spinner}></div>
      {message && <p>{message}</p>}
    </div>
  );
}
