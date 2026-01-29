// src/pages/admin/Treasury/TransactionsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import TransactionTable from '../../../components/TreasuryDashboard/TransactionTable';

export default function TransactionsPage() {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('today');
  const intervalRef = useRef(null);

  const fetchTransactions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterDate !== 'all') params.append('period', filterDate);
      if (searchQuery) params.append('search', searchQuery);

      const data = await api.get(`/admin/treasury/transactions?${params}`);
      if (data?.transactions) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      if (!silent) toast.error('Failed to load transactions');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    intervalRef.current = setInterval(() => fetchTransactions(true), 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [filterType, filterDate, searchQuery]);

  const handleExport = async () => {
    try {
      toast.info('Exporting transactions...');
      // Export functionality
    } catch (error) {
      toast.error('Failed to export');
    }
  };

  // Filter transactions locally for search
  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tx.id?.toLowerCase().includes(query) ||
      tx.idNumber?.toLowerCase().includes(query) ||
      tx.userName?.toLowerCase().includes(query) ||
      tx.businessName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-[30px] border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>📋</span> Transactions
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          View and search all NUCash transactions • Auto-refreshes every 10s
        </p>
      </div>

      {/* Filters */}
      <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-4 rounded-2xl border mb-5 flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="flex-1 relative min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
          <input
            type="text"
            placeholder="Search by ID, name, or transaction..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
            className="w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'credit', label: 'Cash-In' },
            { value: 'debit', label: 'Cash-Out' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterType(value)}
              style={{
                background: filterType === value ? theme.accent.primary : theme.bg.tertiary,
                color: filterType === value ? theme.accent.secondary : theme.text.primary,
                borderColor: theme.border.primary
              }}
              className="px-4 py-2 rounded-xl font-bold text-sm border hover:opacity-80 transition"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div className="flex gap-2">
          {[
            { value: 'today', label: 'Today' },
            { value: '7days', label: '7 Days' },
            { value: '30days', label: '30 Days' },
            { value: 'all', label: 'All Time' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterDate(value)}
              style={{
                background: filterDate === value ? theme.accent.primary : theme.bg.tertiary,
                color: filterDate === value ? theme.accent.secondary : theme.text.primary,
                borderColor: theme.border.primary
              }}
              className="px-3 py-2 rounded-xl font-bold text-xs border hover:opacity-80 transition"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
          className="px-4 py-2 rounded-xl font-bold text-sm border hover:opacity-80 transition flex items-center gap-2"
        >
          <span>📥</span> Export
        </button>
      </div>

      {/* Transactions Table */}
      <div className="flex-1 overflow-y-auto">
        <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl border overflow-hidden">
          {loading ? (
            <div style={{ color: theme.accent.primary }} className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: `${theme.accent.primary} transparent transparent transparent` }} />
              Loading transactions...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{ color: theme.text.tertiary }} className="text-center py-20">
              <div className="text-5xl mb-4">📋</div>
              <p>No transactions found</p>
            </div>
          ) : (
            <TransactionTable
              transactions={filteredTransactions}
              showHeader={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
