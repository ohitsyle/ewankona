// src/merchant/components/Common/Table.jsx
import React from 'react';
import Spinner from './Spinner';
import styles from './Common.module.css';

/**
 * Reusable Table Component
 *
 * @param {Array} data - Array of data objects
 * @param {Array} columns - Array of column definitions
 *   Example: [
 *     { key: 'id', label: 'ID' },
 *     { key: 'name', label: 'Name' },
 *     { key: 'actions', label: 'Actions', render: (row) => <Button>Edit</Button> }
 *   ]
 * @param {boolean} loading - Loading state
 * @param {string} emptyMessage - Message when no data
 */
export default function Table({
  data = [],
  columns = [],
  loading = false,
  emptyMessage = 'No data available',
}) {
  if (loading) {
    return <Spinner large message="Loading data..." />;
  }

  if (data.length === 0) {
    return (
      <div className={styles['table-empty']}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
          📋
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={styles['table-container']}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row._id || row.id || index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
