import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getUserTransactions } from '../../services/userApi';

export default function TransactionHistory() {
  const { theme, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await getUserTransactions({ page: currentPage, limit: 50 });
      if (response?.success) {
        setTransactions(response.transactions || []);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) =>
    tx.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 pb-5" style={{ borderBottom: `2px solid ${theme.border.primary}` }}>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: theme.accent.primary,
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span>📊</span> Transaction History
          </h2>
          <p style={{ fontSize: '13px', color: theme.text.secondary, margin: 0 }}>
            Showing 1-{totalPages} of {totalPages} • Page {currentPage} of {totalPages}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <svg
                style={{ color: theme.text.tertiary }}
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by transaction ID or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.05)',
                border: `2px solid ${theme.border.primary}`,
                color: theme.text.primary,
                padding: '12px 16px 12px 48px',
                borderRadius: '12px',
                width: '100%',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.05)',
            borderRadius: '16px',
            border: `1px solid ${theme.border.primary}`,
            overflow: 'hidden'
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '80px 20px',
                color: theme.text.secondary
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: `4px solid ${theme.accent.primary}40`,
                  borderTopColor: theme.accent.primary,
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: theme.text.tertiary
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
              <p style={{ fontSize: '16px', fontWeight: 600 }}>No transactions found</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      background: isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)',
                      borderBottom: `2px solid ${theme.accent.primary}40`
                    }}
                  >
                    <th
                      style={{
                        color: theme.accent.primary,
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Transaction ID
                    </th>
                    <th
                      style={{
                        color: theme.accent.primary,
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        color: theme.accent.primary,
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Time
                    </th>
                    <th
                      style={{
                        color: theme.accent.primary,
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Details
                    </th>
                    <th
                      style={{
                        color: theme.accent.primary,
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx, idx) => (
                    <tr
                      key={tx.id || idx}
                      style={{
                        borderBottom: `1px solid ${theme.border.primary}`,
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDarkMode
                          ? 'rgba(255,212,28,0.05)'
                          : 'rgba(59,130,246,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{ padding: '16px', color: theme.text.secondary, fontSize: '13px', fontFamily: 'monospace' }}>
                        {tx.id || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', color: theme.text.primary, fontSize: '14px', fontWeight: 500 }}>
                        {tx.date || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', color: theme.text.secondary, fontSize: '13px' }}>
                        {tx.time || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', color: theme.text.primary, fontSize: '14px', fontWeight: 500 }}>
                        {tx.details || 'N/A'}
                      </td>
                      <td
                        style={{
                          padding: '16px',
                          fontSize: '14px',
                          fontWeight: 700,
                          color: tx.amount > 0 ? '#22C55E' : '#EF4444'
                        }}
                      >
                        {tx.amount > 0
                          ? `+₱${Number(tx.amount).toFixed(2)}`
                          : `-₱${Math.abs(Number(tx.amount)).toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
    </div>
  );
}
