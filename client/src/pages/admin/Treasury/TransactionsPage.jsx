// src/pages/admin/Treasury/TransactionsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import TransactionTable from '../../../components/TreasuryDashboard/TransactionTable';
import SearchBar from '../../../components/shared/SearchBar';
import StatusFilter from '../../../components/shared/StatusFilter';
import DateRangeFilter from '../../../components/shared/DateRangeFilter';
import ExportButton from '../../../components/shared/ExportButton';
import { exportToCSV } from '../../../utils/csvExport';

export default function TransactionsPage() {
  const { theme, isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const intervalRef = useRef(null);

  const fetchTransactions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const params = new URLSearchParams();
      params.append('limit', '100');
      if (filterType) params.append('transactionType', filterType);
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

  const handleExport = () => {
    const dataToExport = filteredTransactions.map(tx => ({
      Date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : tx.date || '',
      Time: tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString() : tx.time || '',
      'ID Number': tx.idNumber || tx.schoolUId || '',
      Name: tx.userName || '',
      Type: tx.transactionType === 'credit' ? 'Cash-In' : 'Payment',
      Amount: tx.amount,
      'Processed By': tx.transactionType === 'credit' ? (tx.adminName || tx.processedBy || 'Treasury') : '—',
      'Transaction ID': tx.transactionId || tx._id || ''
    }));
    exportToCSV(dataToExport, 'transactions');
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
      tx.businessName?.toLowerCase().includes(query) ||
      tx.adminName?.toLowerCase().includes(query) ||
      tx.processedBy?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 border-b-2 pb-5" style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)' }}>
        <div className="mb-5">
          <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
            <span>📋</span> Transactions
          </h2>
          <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
            Showing {filteredTransactions.length} transactions • Auto-refreshes every 10s
          </p>
        </div>

        {/* Filters Row - Same style as Logs */}
        <div className="flex gap-3 items-end flex-wrap">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by ID, name, transaction ID..."
          />
          <StatusFilter
            value={filterType}
            onChange={setFilterType}
            label="Type"
            options={[
              { value: 'credit', label: 'Cash-In' },
              { value: 'debit', label: 'Payment' }
            ]}
          />
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
          <ExportButton
            onClick={handleExport}
            disabled={filteredTransactions.length === 0}
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="flex-1 overflow-y-auto">
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
  );
}
