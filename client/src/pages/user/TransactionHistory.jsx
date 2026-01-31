// src/pages/user/TransactionHistory.jsx
// User's transaction history - matches Treasury admin style
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Mail, Search, Filter, Calendar, X, CheckCircle } from 'lucide-react';

export default function TransactionHistory() {
  const { theme, isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const intervalRef = useRef(null);

  const fetchTransactions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const data = await api.get(`/user/transactions?${params}`);
      if (data?.transactions) {
        setTransactions(data.transactions);
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: data.pagination.total || 0,
            totalPages: data.pagination.totalPages || 1
          }));
        }
      }
    } catch (error) {
      if (!silent) toast.error('Failed to load transactions');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    intervalRef.current = setInterval(() => fetchTransactions(true), 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [typeFilter, searchTerm, startDate, endDate, pagination.page]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleRequestHistory = async () => {
    setRequesting(true);
    try {
      // Send request to backend to email transaction history
      await api.post('/user/request-transaction-history', {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined
      });
      setRequestSuccess(true);
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestSuccess(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to request transaction history. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  // Filter transactions locally for search
  const filteredTransactions = transactions.filter(tx => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    return (
      tx.transactionId?.toLowerCase().includes(query) ||
      tx._id?.toLowerCase().includes(query) ||
      tx.description?.toLowerCase().includes(query) ||
      tx.merchant?.name?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div style={{ color: theme.accent.primary }} className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: `${theme.accent.primary} transparent transparent transparent` }} />
        Loading transactions...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)' }} className="mb-6 border-b-2 pb-5">
        <div className="mb-5">
          <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
            <span>📜</span> Transaction History
          </h2>
          <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
            Showing {filteredTransactions.length} of {pagination.total || transactions.length} transactions • Auto-refreshes every 30s
          </p>
        </div>

        {/* Filters Row - Matches Treasury admin style */}
        <div className="flex gap-3 items-end flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label style={{ color: theme.text.secondary }} className="block text-[11px] font-bold uppercase tracking-wide mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.text.muted }} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="min-w-[140px]">
            <label style={{ color: theme.text.secondary }} className="block text-[11px] font-bold uppercase tracking-wide mb-2">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="credit">Cash-In</option>
              <option value="debit">Purchases</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex gap-2 items-end">
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-[11px] font-bold uppercase tracking-wide mb-2">
                From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                className="px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            </div>
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-[11px] font-bold uppercase tracking-wide mb-2">
                To
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                className="px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            </div>
          </div>

          {/* Request Transaction History Button */}
          <button
            onClick={() => setShowRequestModal(true)}
            style={{
              background: isDarkMode ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)',
              color: '#3B82F6',
              borderColor: 'rgba(59,130,246,0.3)'
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 font-semibold text-sm hover:opacity-80 transition whitespace-nowrap"
          >
            <Mail className="w-4 h-4" />
            Request History
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="flex-1 overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <div style={{ color: theme.text.tertiary }} className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p>No transactions found</p>
            <p className="text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl border overflow-hidden">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr style={{ background: isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)' }}>
                  <th style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)', color: theme.accent.primary }}
                      className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">Date & Time</th>
                  <th style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)', color: theme.accent.primary }}
                      className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">Description</th>
                  <th style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)', color: theme.accent.primary }}
                      className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">Type</th>
                  <th style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)', color: theme.accent.primary }}
                      className="text-right p-4 text-[11px] font-extrabold uppercase border-b-2">Amount</th>
                  <th style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)', color: theme.accent.primary }}
                      className="text-right p-4 text-[11px] font-extrabold uppercase border-b-2">Balance After</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx, idx) => (
                  <tr
                    key={tx._id || tx.id || idx}
                    className="hover:bg-white/5 cursor-pointer transition"
                    style={{ borderBottom: `1px solid ${theme.border.primary}` }}
                    onClick={() => setSelectedTransaction(tx)}
                  >
                    <td style={{ color: theme.text.primary }} className="p-4">
                      <div className="font-semibold">{tx.date || new Date(tx.createdAt).toLocaleDateString()}</div>
                      <div style={{ color: theme.text.muted }} className="text-xs">{tx.time || new Date(tx.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td style={{ color: theme.text.primary }} className="p-4">
                      <div className="flex items-center gap-3">
                        <div style={{
                          background: tx.transactionType === 'credit' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'
                        }} className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                          {tx.transactionType === 'credit' ? '💵' : '🛒'}
                        </div>
                        <div>
                          <div className="font-semibold">{tx.transactionType === 'credit' ? 'Cash-In' : tx.description || 'Purchase'}</div>
                          {tx.merchant?.name && (
                            <div style={{ color: theme.text.muted }} className="text-xs">@ {tx.merchant.name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: tx.transactionType === 'credit' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                        color: tx.transactionType === 'credit' ? '#10B981' : '#EF4444',
                      }}>
                        {tx.transactionType === 'credit' ? 'Cash-In' : 'Purchase'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span style={{ color: tx.transactionType === 'credit' ? '#10B981' : '#EF4444' }} className="font-bold text-base">
                        {tx.transactionType === 'credit' ? '+' : '-'}₱{Math.abs(tx.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ color: theme.text.primary }} className="p-4 text-right font-semibold">
                      {tx.balanceAfter !== undefined
                        ? `₱${tx.balanceAfter.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                        : '—'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ borderColor: theme.border.primary }} className="p-4 border-t flex items-center justify-between">
                <p style={{ color: theme.text.muted }} className="text-sm">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    style={{
                      background: pagination.page === 1 ? 'rgba(100,100,100,0.2)' : theme.bg.tertiary,
                      color: pagination.page === 1 ? theme.text.muted : theme.accent.primary,
                      borderColor: pagination.page === 1 ? 'transparent' : theme.accent.primary
                    }}
                    className="px-4 py-2 rounded-lg text-sm border-2 font-semibold disabled:cursor-not-allowed transition hover:opacity-80"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    style={{
                      background: pagination.page === pagination.totalPages ? 'rgba(100,100,100,0.2)' : theme.bg.tertiary,
                      color: pagination.page === pagination.totalPages ? theme.text.muted : theme.accent.primary,
                      borderColor: pagination.page === pagination.totalPages ? 'transparent' : theme.accent.primary
                    }}
                    className="px-4 py-2 rounded-lg text-sm border-2 font-semibold disabled:cursor-not-allowed transition hover:opacity-80"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            style={{ background: theme.bg.secondary, borderColor: theme.border.primary }}
            className="w-full max-w-md rounded-2xl border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              background: selectedTransaction.transactionType === 'credit' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'
            }} className="p-6 text-center">
              <div className="text-4xl mb-2">
                {selectedTransaction.transactionType === 'credit' ? '💵' : '🛒'}
              </div>
              <p style={{ color: selectedTransaction.transactionType === 'credit' ? '#10B981' : '#EF4444' }} className="font-bold text-3xl">
                {selectedTransaction.transactionType === 'credit' ? '+' : '-'}₱{Math.abs(selectedTransaction.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
              <p style={{ color: theme.text.secondary }} className="text-sm mt-1 capitalize">
                {selectedTransaction.transactionType === 'credit' ? 'Cash-In' : 'Purchase'}
              </p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              <div style={{ borderColor: theme.border.primary }} className="flex justify-between py-3 border-b">
                <span style={{ color: theme.text.secondary }} className="text-sm">Transaction ID</span>
                <span style={{ color: theme.text.primary, fontFamily: 'monospace' }} className="text-xs">
                  {selectedTransaction._id?.slice(-12) || 'N/A'}
                </span>
              </div>
              <div style={{ borderColor: theme.border.primary }} className="flex justify-between py-3 border-b">
                <span style={{ color: theme.text.secondary }} className="text-sm">Date & Time</span>
                <span style={{ color: theme.text.primary }} className="text-sm">
                  {selectedTransaction.date || new Date(selectedTransaction.createdAt).toLocaleDateString()} {selectedTransaction.time || new Date(selectedTransaction.createdAt).toLocaleTimeString()}
                </span>
              </div>
              {selectedTransaction.merchant?.name && (
                <div style={{ borderColor: theme.border.primary }} className="flex justify-between py-3 border-b">
                  <span style={{ color: theme.text.secondary }} className="text-sm">Merchant</span>
                  <span style={{ color: theme.text.primary }} className="text-sm">
                    {selectedTransaction.merchant.name}
                  </span>
                </div>
              )}
              {selectedTransaction.balanceBefore !== undefined && (
                <div style={{ borderColor: theme.border.primary }} className="flex justify-between py-3 border-b">
                  <span style={{ color: theme.text.secondary }} className="text-sm">Balance Before</span>
                  <span style={{ color: theme.text.primary }} className="text-sm">
                    ₱{selectedTransaction.balanceBefore.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {selectedTransaction.balanceAfter !== undefined && (
                <div style={{ borderColor: theme.border.primary }} className="flex justify-between py-3 border-b">
                  <span style={{ color: theme.text.secondary }} className="text-sm">Balance After</span>
                  <span style={{ color: theme.text.primary }} className="text-sm font-bold">
                    ₱{selectedTransaction.balanceAfter.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {selectedTransaction.description && (
                <div className="py-3">
                  <span style={{ color: theme.text.secondary }} className="text-sm block mb-1">Description</span>
                  <span style={{ color: theme.text.primary }} className="text-sm">
                    {selectedTransaction.description}
                  </span>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="p-4">
              <button
                onClick={() => setSelectedTransaction(null)}
                style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full py-3 rounded-xl font-bold border hover:opacity-80 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Transaction History Modal */}
      {showRequestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => !requesting && setShowRequestModal(false)}
        >
          <div
            style={{ background: isDarkMode ? '#1E2347' : '#FFFFFF', borderColor: theme.border.primary }}
            className="w-full max-w-md rounded-2xl border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {requestSuccess ? (
              <div className="p-8 text-center">
                <div style={{ background: 'rgba(16,185,129,0.2)' }} className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-500 mb-2">Request Sent!</h3>
                <p style={{ color: theme.text.secondary }}>
                  Your transaction history will be sent to your email shortly.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ background: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.3)' }} className="p-5 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-6 h-6 text-blue-500" />
                      <div>
                        <h2 className="text-lg font-bold text-blue-500">Request Transaction History</h2>
                        <p style={{ color: theme.text.secondary }} className="text-sm">Get a formatted copy via email</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowRequestModal(false)}
                      disabled={requesting}
                      style={{ color: theme.text.secondary }}
                      className="hover:opacity-70 disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                  <p style={{ color: theme.text.secondary }} className="text-sm">
                    We'll send a formatted PDF of your transaction history to your registered email address.
                  </p>

                  <div style={{ background: theme.bg.tertiary, borderColor: theme.border.primary }} className="p-4 rounded-xl border">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-5 h-5" style={{ color: theme.accent.primary }} />
                      <span style={{ color: theme.text.primary }} className="font-semibold">Date Range (Optional)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-1">From</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          style={{ background: theme.bg.secondary, color: theme.text.primary, borderColor: theme.border.primary }}
                          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-1">To</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          style={{ background: theme.bg.secondary, color: theme.text.primary, borderColor: theme.border.primary }}
                          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                    <p style={{ color: theme.text.muted }} className="text-xs mt-2">
                      Leave empty to get all transactions
                    </p>
                  </div>

                  <div style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)' }} className="p-4 rounded-xl border">
                    <p style={{ color: theme.text.secondary }} className="text-sm">
                      <strong style={{ color: '#3B82F6' }}>Note:</strong> The email will be sent to your registered email address and may take a few minutes to arrive. Check your spam folder if you don't see it.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-4 border-t" style={{ borderColor: theme.border.primary }}>
                  <button
                    onClick={() => setShowRequestModal(false)}
                    disabled={requesting}
                    style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                    className="flex-1 py-3 rounded-xl font-semibold border hover:opacity-80 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestHistory}
                    disabled={requesting}
                    className="flex-1 py-3 rounded-xl font-bold bg-blue-500 text-white hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {requesting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send to Email
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
