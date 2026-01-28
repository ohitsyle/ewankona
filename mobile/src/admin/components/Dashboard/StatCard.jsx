// src/admin/components/Dashboard/StatCard.jsx
import React from 'react';
import Spinner from '../Common/Spinner';
import styles from './Dashboard.module.css';

export default function StatCard({ icon, label, value, subtitle, loading }) {
  if (loading) {
    return (
      <div className={styles.statCard}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statChange}>{subtitle}</div>
    </div>
  );
}