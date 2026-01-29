// src/pages/user/TransactionHistory.jsx
// User's transaction history with filters and search
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';

export default function TransactionHistory() {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const intervalRef = useRef(null);

  const fetchTransactions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchTerm) params.append('search', searchTerm);

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
  }, [typeFilter, searchTerm, pagination.page]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Stats
  const totalCount = transactions.length;
  const creditCount = transactions.filter(t => t.transactionType === 'credit').length;
  const debitCount = transactions.filter(t => t.transactionType === 'debit').length;

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
      <div style={{ borderColor: theme.border.primary }} className="mb-[30px] border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>📜</span> Transaction History
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          View all your NUCash transactions • Auto-updates every 30s
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-5">
        <StatCard icon="📋" label="TOTAL" value={pagination.total || totalCount} subtitle="transactions" color="#3B82F6" theme={theme} />
        <StatCard icon="💵" label="CASH-INS" value={creditCount} subtitle="received" color="#10B981" theme={theme} />
        <StatCard icon="🛒" label="PURCHASES" value={debitCount} subtitle="spent" color="#EF4444" theme={theme} />
      </div>

      {/* Filters */}
      <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-4 rounded-2xl border mb-5 flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="flex-1 relative min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
            className="w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2">
          {['all', 'credit', 'debit'].map((type) => (
            <button
              key={type}
              onClick={() => {
                setTypeFilter(type);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              style={{
                background: typeFilter === type ? theme.accent.primary : theme.bg.tertiary,
                color: typeFilter === type ? theme.accent.secondary : theme.text.primary,
                borderColor: theme.border.primary
              }}
              className="px-4 py-2 rounded-xl font-bold text-sm border capitalize hover:opacity-80 transition"
            >
              {type === 'credit' ? 'Cash-In' : type === 'debit' ? 'Purchases' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto">
        <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl border overflow-hidden">
          {transactions.length === 0 ? (
            <div style={{ color: theme.text.tertiary }} className="text-center py-20">
              <div className="text-5xl mb-4">📜</div>
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: theme.border.primary }}>
              {transactions.map((tx, idx) => (
                <div
                  key={tx._id || tx.id || idx}
                  className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition"
                  onClick={() => setSelectedTransaction(tx)}
                >
                  <div className="flex items-center gap-4">
                    <div style={{
                      background: tx.transactionType === 'credit' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'
                    }} className="w-12 h-12 rounded-full flex items-center justify-center text-xl">
                      {tx.transactionType === 'credit' ? '💵' : '🛒'}
                    </div>
                    <div>
                      <p style={{ color: theme.text.primary }} className="font-semibold">
                        {tx.transactionType === 'credit' ? 'Cash-In' : tx.description || 'Purchase'}
                      </p>
                      <p style={{ color: theme.text.muted }} className="text-xs">
                        {tx.date} • {tx.time}
                      </p>
                      {tx.merchant?.name && (
                        <p style={{ color: theme.text.secondary }} className="text-xs">
                          @ {tx.merchant.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p style={{ color: tx.transactionType === 'credit' ? '#10B981' : '#EF4444' }} className="font-bold text-lg">
                      {tx.transactionType === 'credit' ? '+' : '-'}₱{Math.abs(tx.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </p>
                    {tx.balanceAfter !== undefined && (
                      <p style={{ color: theme.text.muted }} className="text-xs">
                        Bal: ₱{tx.balanceAfter.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

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
                    color: pagination.page === 1 ? theme.text.muted : theme.text.primary,
                    borderColor: theme.border.primary
                  }}
                  className="px-3 py-1 rounded-lg text-sm border disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  style={{
                    background: pagination.page === pagination.totalPages ? 'rgba(100,100,100,0.2)' : theme.bg.tertiary,
                    color: pagination.page === pagination.totalPages ? theme.text.muted : theme.text.primary,
                    borderColor: theme.border.primary
                  }}
                  className="px-3 py-1 rounded-lg text-sm border disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
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
                  {selectedTransaction.date} {selectedTransaction.time}
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
    </div>
  );
}

// Stat Card
function StatCard({ icon, label, value, subtitle, color, theme }) {
  return (
    <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border relative overflow-hidden">
      <div className="absolute right-4 top-4 text-[40px] opacity-15">{icon}</div>
      <div style={{ color: theme.text.secondary }} className="text-[11px] font-bold uppercase tracking-wide mb-3">{label}</div>
      <div style={{ color: theme.text.primary }} className="text-[32px] font-extrabold mb-2">{value}</div>
      <div className="text-xs font-semibold inline-block py-[3px] px-[10px] rounded-xl" style={{ color, background: `${color}20` }}>{subtitle}</div>
    </div>
  );
}
