// client/src/pages/admin/Treasury/TransactionsPage.jsx
// Transaction History Page - Now uses TreasuryLayout for consistent design

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { getTreasuryTransactions, exportTransactions } from '../../../services/treasuryApi';
import { toast } from 'react-toastify';
import SearchBar from '../../../components/shared/SearchBar';
import ExportButton from '../../../components/shared/ExportButton';

export default function TransactionsPage() {
  const { theme, isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const loadTransactions = async () => {
    try {
      const response = await getTreasuryTransactions({
        startDate,
        endDate,
        transactionType: typeFilter,
        search: searchQuery
      });

      if (response.success) {
        setTransactions(response.transactions || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    const interval = setInterval(loadTransactions, 30000);
    return () => clearInterval(interval);
  }, [searchQuery, typeFilter, startDate, endDate]);

  const handleExport = async () => {
    try {
      const blob = await exportTransactions({
        startDate,
        endDate,
        transactionType: typeFilter
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Transactions exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export transactions');
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (
        tx.transactionId?.toLowerCase().includes(searchLower) ||
        tx.idNumber?.toLowerCase().includes(searchLower) ||
        tx.userName?.toLowerCase().includes(searchLower) ||
        tx.email?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredTransactions.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, startDate, endDate]);

  const getTypeColor = (type) => {
    return type === 'credit'
      ? { bg: 'rgba(34,197,94,0.2)', color: '#22C55E' }
      : { bg: 'rgba(239,68,68,0.2)', color: '#EF4444' };
  };

  const baseColor = isDarkMode ? '255, 212, 28' : '59, 130, 246';

  if (loading) {
    return (
      <div className="text-center py-[60px]" style={{ color: theme.accent.primary }}>
        Loading transactions...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-[30px] pb-5" style={{ borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]" style={{ color: theme.accent.primary }}>
            <span>📋</span> Transaction History
          </h2>
          <p className="text-[13px] m-0" style={{ color: theme.text.secondary }}>
            {filteredTransactions.length > 0
              ? `Showing ${startIndex + 1}-${Math.min(endIndex, filteredTransactions.length)} of ${filteredTransactions.length} • Page ${currentPage} of ${totalPages}`
              : `Track all cash transactions • Total: ${transactions.length}`
            }
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by ID, user, or email..."
          />

          {/* Type Filter */}
          <div style={{ minWidth: '150px' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                borderRadius: '8px',
                background: 'rgba(251,251,251,0.05)',
                color: theme.text.primary,
                fontSize: '14px',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="">All Types</option>
              <option value="credit">Cash In</option>
              <option value="debit">Cash Out</option>
            </select>
          </div>

          {/* Date Range */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '12px 16px',
                border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                borderRadius: '8px',
                background: 'rgba(251,251,251,0.05)',
                color: theme.text.primary,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '12px 16px',
                border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                borderRadius: '8px',
                background: 'rgba(251,251,251,0.05)',
                color: theme.text.primary,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Export Button */}
          <ExportButton onClick={handleExport} disabled={filteredTransactions.length === 0} />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto pr-2">
        {transactions.length === 0 ? (
          <div className="text-center py-[60px] text-[rgba(251,251,251,0.5)]">
            <div className="text-5xl mb-4">📋</div>
            <div>No transactions found</div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-[60px] text-[rgba(251,251,251,0.5)]">
            <div className="text-5xl mb-4">🔍</div>
            <div style={{ marginBottom: '12px' }}>No transactions match your search</div>
            <button
              onClick={() => setSearchQuery('')}
              style={{
                padding: '8px 16px',
                background: isDarkMode ? 'rgba(255,212,28,0.15)' : 'rgba(59,130,246,0.15)',
                border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                borderRadius: '8px',
                color: theme.accent.primary,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr style={{ background: isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)' }}>
                  <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>Transaction ID</th>
                  <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>Date & Time</th>
                  <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>User</th>
                  <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>ID Number</th>
                  <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>Type</th>
                  <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>Amount</th>
                  <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((tx) => {
                  const typeStyle = getTypeColor(tx.transactionType);
                  const date = new Date(tx.createdAt);

                  return (
                    <tr key={tx._id} style={{ borderBottom: `1px solid ${theme.border.primary}` }}>
                      <td style={{ padding: '16px', color: theme.text.primary, fontFamily: 'monospace', fontSize: '11px', fontWeight: 700 }}>
                        {tx.transactionId || tx._id.slice(-8)}
                      </td>
                      <td style={{ padding: '16px', color: theme.text.primary }}>
                        {date.toLocaleDateString('en-GB')} {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '16px', color: theme.text.primary, fontWeight: 600 }}>
                        {tx.userName || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', color: theme.text.primary, fontFamily: 'monospace', fontSize: '11px' }}>
                        {tx.idNumber}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: typeStyle.bg,
                          color: typeStyle.color,
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          {tx.transactionType === 'credit' ? 'Cash In' : 'Cash Out'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: tx.transactionType === 'credit' ? '#22C55E' : '#EF4444', fontWeight: 700 }}>
                        {tx.transactionType === 'credit' ? '+' : '-'}₱{Number(tx.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '16px', color: theme.text.primary, fontWeight: 600 }}>
                        ₱{Number(tx.balance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 16px',
              background: currentPage === 1 ? 'rgba(100,100,100,0.2)' : `rgba(${baseColor}, 0.15)`,
              border: `2px solid ${currentPage === 1 ? 'rgba(100,100,100,0.3)' : `rgba(${baseColor}, 0.3)`}`,
              borderRadius: '8px',
              color: currentPage === 1 ? 'rgba(251,251,251,0.3)' : theme.accent.primary,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            ← Previous
          </button>

          <span style={{ color: theme.text.primary, fontSize: '14px', fontWeight: 600 }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 16px',
              background: currentPage === totalPages ? 'rgba(100,100,100,0.2)' : `rgba(${baseColor}, 0.15)`,
              border: `2px solid ${currentPage === totalPages ? 'rgba(100,100,100,0.3)' : `rgba(${baseColor}, 0.3)`}`,
              borderRadius: '8px',
              color: currentPage === totalPages ? 'rgba(251,251,251,0.3)' : theme.accent.primary,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
