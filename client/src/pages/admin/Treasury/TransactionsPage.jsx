// src/pages/admin/Treasury/TransactionsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import TransactionTable from '../../../components/TreasuryDashboard/TransactionTable';
import { Search, FileSpreadsheet } from 'lucide-react';

export default function TransactionsPage() {
  const { theme, isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const intervalRef = useRef(null);

  const fetchTransactions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const params = new URLSearchParams();
      params.append('limit', '100');
      if (filterType !== 'all') params.append('type', filterType);
      if (searchQuery) params.append('search', searchQuery);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

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
  }, [filterType, searchQuery, startDate, endDate]);

  const handleExport = async () => {
    try {
      toast.info('Exporting transactions...');

      // Build export params
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (searchQuery) params.append('search', searchQuery);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      // Create CSV content
      const headers = ['Date', 'Time', 'ID Number', 'Name', 'Type', 'Amount', 'Transaction ID'];
      const csvContent = [
        headers.join(','),
        ...transactions.map(tx => {
          const date = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : tx.date || '';
          const time = tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString() : tx.time || '';
          return [
            date,
            time,
            tx.idNumber || tx.schoolUId || '',
            tx.userName || '',
            tx.transactionType === 'credit' ? 'Cash-In' : 'Cash-Out',
            tx.amount,
            tx.transactionId || tx._id || ''
          ].join(',');
        })
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Export completed!');
    } catch (error) {
      toast.error('Failed to export');
    }
  };

  // Filter transactions locally for search
  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tx.transactionId?.toLowerCase().includes(query) ||
      tx._id?.toLowerCase().includes(query) ||
      tx.idNumber?.toLowerCase().includes(query) ||
      tx.schoolUId?.toLowerCase().includes(query) ||
      tx.userName?.toLowerCase().includes(query) ||
      tx.businessName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-6 border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>📋</span> Transactions
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          View and search all NUCash transactions • Auto-refreshes every 10s
        </p>
      </div>

      {/* Search and Filters Bar - Matching Screenshot Style */}
      <div
        style={{
          background: isDarkMode ? 'rgba(15,18,39,0.8)' : theme.bg.card,
          borderColor: theme.accent.primary
        }}
        className="rounded-xl border-2 p-3 mb-5 flex items-center gap-4"
      >
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search
            style={{ color: theme.text.tertiary }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
          />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              color: theme.text.primary,
              borderColor: 'transparent'
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none placeholder:text-gray-500"
          />
        </div>

        {/* Divider */}
        <div style={{ background: theme.border.primary }} className="w-px h-8" />

        {/* Type Filter Dropdown */}
        <div className="flex flex-col">
          <span style={{ color: theme.text.tertiary }} className="text-[10px] font-bold uppercase tracking-wider mb-1">
            Type
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: isDarkMode ? 'rgba(30,35,71,0.8)' : '#F9FAFB',
              color: theme.text.primary,
              borderColor: theme.border.primary
            }}
            className="px-3 py-2 rounded-lg border text-sm font-medium min-w-[120px] focus:outline-none cursor-pointer"
          >
            <option value="all">All</option>
            <option value="credit">Cash-In</option>
            <option value="debit">Cash-Out</option>
          </select>
        </div>

        {/* Divider */}
        <div style={{ background: theme.border.primary }} className="w-px h-8" />

        {/* Date Range - From */}
        <div className="flex flex-col">
          <span style={{ color: theme.text.tertiary }} className="text-[10px] font-bold uppercase tracking-wider mb-1">
            From
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              background: isDarkMode ? 'rgba(30,35,71,0.8)' : '#F9FAFB',
              color: theme.text.primary,
              borderColor: theme.border.primary
            }}
            className="px-3 py-2 rounded-lg border text-sm focus:outline-none cursor-pointer"
          />
        </div>

        {/* Date Range - To */}
        <div className="flex flex-col">
          <span style={{ color: theme.text.tertiary }} className="text-[10px] font-bold uppercase tracking-wider mb-1">
            To
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              background: isDarkMode ? 'rgba(30,35,71,0.8)' : '#F9FAFB',
              color: theme.text.primary,
              borderColor: theme.border.primary
            }}
            className="px-3 py-2 rounded-lg border text-sm focus:outline-none cursor-pointer"
          />
        </div>

        {/* Divider */}
        <div style={{ background: theme.border.primary }} className="w-px h-8" />

        {/* Export Button */}
        <button
          onClick={handleExport}
          style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          }}
          className="px-4 py-2.5 rounded-lg font-bold text-sm text-white hover:opacity-90 transition flex items-center gap-2 whitespace-nowrap"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p style={{ color: theme.text.secondary }} className="text-sm">
          Showing <span style={{ color: theme.accent.primary }} className="font-bold">{filteredTransactions.length}</span> transactions
        </p>
        {(searchQuery || filterType !== 'all' || startDate || endDate) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
              setStartDate('');
              setEndDate('');
            }}
            style={{ color: theme.accent.primary }}
            className="text-sm font-semibold hover:underline"
          >
            Clear Filters
          </button>
        )}
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
