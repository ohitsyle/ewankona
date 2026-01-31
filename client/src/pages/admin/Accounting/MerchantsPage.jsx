// src/pages/admin/Accounting/MerchantsPage.jsx
// View merchants and their transaction flow (read-only for Accounting)
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import { Search, X, Store, TrendingUp, Calendar, Clock, DollarSign, Users, Truck } from 'lucide-react';

export default function AccountingMerchantsPage() {
  const { theme, isDarkMode } = useTheme();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const intervalRef = useRef(null);

  const fetchMerchants = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('isActive', statusFilter === 'active');
      if (searchTerm) params.append('search', searchTerm);

      const data = await api.get(`/admin/accounting/merchants?${params}`);
      if (data?.merchants) {
        setMerchants(data.merchants);
      }
    } catch (error) {
      if (!silent) toast.error('Failed to load merchants');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();

    intervalRef.current = setInterval(() => fetchMerchants(true), 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [statusFilter, searchTerm]);

  // Filter merchants locally
  const filteredMerchants = merchants.filter(m => {
    const matchesSearch = !searchTerm ||
      m.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.merchantId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && m.isActive !== false) ||
      (statusFilter === 'inactive' && m.isActive === false);

    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalMerchants = merchants.length;
  const activeMerchants = merchants.filter(m => m.isActive !== false).length;
  const totalCollections = merchants.reduce((sum, m) => sum + (m.totalCollections || 0), 0);
  const todayCollections = merchants.reduce((sum, m) => sum + (m.todayCollections || 0), 0);

  return (
    <div className="min-h-[calc(100vh-220px)] flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-6 border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>🏪</span> Merchants
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          View merchant accounts and transaction metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div
          style={{ background: theme.bg.card, borderColor: 'rgba(59, 130, 246, 0.3)' }}
          className="p-4 rounded-xl border flex items-center gap-4"
        >
          <div style={{ background: 'rgba(59, 130, 246, 0.2)' }} className="w-12 h-12 rounded-full flex items-center justify-center">
            <Store className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase">Total Merchants</p>
            <p className="text-2xl font-bold text-blue-500">{totalMerchants}</p>
          </div>
        </div>

        <div
          style={{ background: theme.bg.card, borderColor: 'rgba(16, 185, 129, 0.3)' }}
          className="p-4 rounded-xl border flex items-center gap-4"
        >
          <div style={{ background: 'rgba(16, 185, 129, 0.2)' }} className="w-12 h-12 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase">Active</p>
            <p className="text-2xl font-bold text-emerald-500">{activeMerchants}</p>
          </div>
        </div>

        <div
          style={{ background: theme.bg.card, borderColor: 'rgba(251, 191, 36, 0.3)' }}
          className="p-4 rounded-xl border flex items-center gap-4"
        >
          <div style={{ background: 'rgba(251, 191, 36, 0.2)' }} className="w-12 h-12 rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase">Total Collections</p>
            <p className="text-2xl font-bold text-yellow-500">₱{totalCollections.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div
          style={{ background: theme.bg.card, borderColor: 'rgba(139, 92, 246, 0.3)' }}
          className="p-4 rounded-xl border flex items-center gap-4"
        >
          <div style={{ background: 'rgba(139, 92, 246, 0.2)' }} className="w-12 h-12 rounded-full flex items-center justify-center">
            <Calendar className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase">Today's Collections</p>
            <p className="text-2xl font-bold text-violet-500">₱{todayCollections.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          background: isDarkMode ? 'rgba(15,18,39,0.8)' : theme.bg.card,
          borderColor: theme.accent.primary
        }}
        className="rounded-xl border-2 p-3 mb-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
      >
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search
            style={{ color: theme.text.tertiary }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
          />
          <input
            type="text"
            placeholder="Search merchants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              color: theme.text.primary,
              borderColor: 'transparent'
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none placeholder:text-gray-500"
          />
        </div>

        {/* Divider */}
        <div style={{ background: theme.border.primary }} className="hidden sm:block w-px h-8" />

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'inactive'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                background: statusFilter === status ? theme.accent.primary : (isDarkMode ? 'rgba(30,35,71,0.8)' : '#F9FAFB'),
                color: statusFilter === status ? (isDarkMode ? '#181D40' : '#FFFFFF') : theme.text.primary,
                borderColor: theme.border.primary
              }}
              className="px-3 py-2 rounded-lg font-semibold text-xs border hover:opacity-80 transition capitalize"
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p style={{ color: theme.text.secondary }} className="text-sm">
          Showing <span style={{ color: theme.accent.primary }} className="font-bold">{filteredMerchants.length}</span> of {merchants.length} merchants
        </p>
      </div>

      {/* Merchants Grid */}
      <div className="flex-1">
        <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl border overflow-hidden">
          {loading ? (
            <div style={{ color: theme.accent.primary }} className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: `${theme.accent.primary} transparent transparent transparent` }} />
              Loading merchants...
            </div>
          ) : filteredMerchants.length === 0 ? (
            <div style={{ color: theme.text.tertiary }} className="text-center py-20">
              <div className="text-5xl mb-4">🏪</div>
              <p className="font-semibold">No merchants found</p>
              <p className="text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredMerchants.map((merchant) => (
                <MerchantCard
                  key={merchant._id || merchant.merchantId}
                  merchant={merchant}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  onView={() => setSelectedMerchant(merchant)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Merchant Details Modal */}
      {selectedMerchant && (
        <MerchantModal
          merchant={selectedMerchant}
          theme={theme}
          isDarkMode={isDarkMode}
          onClose={() => setSelectedMerchant(null)}
        />
      )}
    </div>
  );
}

// Merchant Card
function MerchantCard({ merchant, theme, isDarkMode, onView }) {
  const isActive = merchant.isActive !== false;
  const isMotorpool = merchant.type === 'motorpool';

  return (
    <div
      style={{
        background: isDarkMode ? 'rgba(30,35,71,0.6)' : theme.bg.tertiary,
        borderColor: isMotorpool ? 'rgba(139, 92, 246, 0.4)' : theme.border.primary
      }}
      className="p-5 rounded-xl border cursor-pointer hover:opacity-90 transition relative overflow-hidden"
      onClick={onView}
    >
      {/* Motorpool Badge */}
      {isMotorpool && (
        <div
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}
          className="absolute top-0 right-0 px-3 py-1 rounded-bl-lg text-white text-xs font-bold flex items-center gap-1"
        >
          <Truck className="w-3 h-3" /> Shuttle
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div
          style={{
            background: isMotorpool ? 'rgba(139,92,246,0.15)' : 'rgba(255,212,28,0.15)',
            color: isMotorpool ? '#8B5CF6' : '#FFD41C'
          }}
          className="px-3 py-1 rounded-lg text-xs font-bold"
        >
          {merchant.merchantId || 'N/A'}
        </div>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: isActive ? '#10B981' : '#EF4444'
        }} />
      </div>

      <h4 style={{ color: theme.text.primary }} className="font-bold text-lg mb-2">
        {merchant.businessName || merchant.name || 'Unknown'}
      </h4>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span style={{ color: theme.text.secondary }} className="text-xs">Today's Sales</span>
          <span style={{ color: '#10B981' }} className="font-bold text-sm">
            ₱{(merchant.todayCollections || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: theme.text.secondary }} className="text-xs">Total Collections</span>
          <span style={{ color: '#3B82F6' }} className="font-bold text-sm">
            ₱{(merchant.totalCollections || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: theme.text.secondary }} className="text-xs">Transactions</span>
          <span style={{ color: theme.text.primary }} className="font-bold text-sm">
            {(merchant.totalTransactions || 0).toLocaleString()}
          </span>
        </div>
      </div>

      <button
        style={{
          background: isMotorpool
            ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'
            : theme.accent.primary,
          color: isMotorpool ? '#FFFFFF' : theme.accent.secondary
        }}
        className="w-full mt-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition"
      >
        View Details
      </button>
    </div>
  );
}

// Merchant Modal with Tabs
function MerchantModal({ merchant, theme, isDarkMode, onClose }) {
  const [activeTab, setActiveTab] = useState('metrics');
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isMotorpool = merchant.type === 'motorpool';

  useEffect(() => {
    fetchMerchantDetails();
  }, [merchant.merchantId, currentPage]);

  const fetchMerchantDetails = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/admin/accounting/merchants/${merchant.merchantId}/details?page=${currentPage}&limit=10`);
      if (data?.success) {
        setDetails(data.merchant);
        setMetrics(data.metrics);
        setTransactions(data.transactions || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      toast.error('Failed to load merchant details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tabs = [
    { id: 'metrics', label: 'Metrics & Info', icon: TrendingUp },
    { id: 'transactions', label: 'Recent Transactions', icon: Clock }
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        style={{
          background: isDarkMode ? '#1E2347' : '#FFFFFF',
          borderColor: theme.border.primary
        }}
        className="relative rounded-2xl shadow-2xl border w-full max-w-3xl max-h-[85vh] overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: isMotorpool
              ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'
              : `linear-gradient(135deg, ${theme.accent.primary} 0%, ${isDarkMode ? '#B8860B' : '#2563EB'} 100%)`
          }}
          className="px-6 py-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div
              style={{ background: 'rgba(255,255,255,0.2)' }}
              className="w-14 h-14 rounded-full flex items-center justify-center"
            >
              {isMotorpool ? (
                <Truck className="w-7 h-7 text-white" />
              ) : (
                <Store className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {merchant.businessName || merchant.name}
              </h2>
              <p className="text-white/80 text-sm font-mono">
                {merchant.merchantId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', borderColor: theme.border.primary }}
          className="px-6 py-3 border-b flex gap-2"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id
                    ? (isMotorpool ? '#8B5CF6' : theme.accent.primary)
                    : 'transparent',
                  color: activeTab === tab.id
                    ? (isMotorpool || !isDarkMode ? '#FFFFFF' : '#181D40')
                    : theme.text.secondary,
                  borderColor: activeTab === tab.id ? 'transparent' : theme.border.primary
                }}
                className="px-4 py-2 rounded-lg font-semibold text-sm border flex items-center gap-2 transition-all hover:opacity-80"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[55vh] overflow-y-auto">
          {loading ? (
            <div style={{ color: theme.accent.primary }} className="text-center py-10">
              <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: `${theme.accent.primary} transparent transparent transparent` }} />
              Loading details...
            </div>
          ) : activeTab === 'metrics' ? (
            <MetricsTab
              merchant={details || merchant}
              metrics={metrics}
              theme={theme}
              isDarkMode={isDarkMode}
              isMotorpool={isMotorpool}
            />
          ) : (
            <TransactionsTab
              transactions={transactions}
              theme={theme}
              isDarkMode={isDarkMode}
              isMotorpool={isMotorpool}
              formatDate={formatDate}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{ borderColor: theme.border.primary }}
          className="px-6 py-4 border-t flex justify-end"
        >
          <button
            onClick={onClose}
            style={{
              background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB',
              color: theme.text.primary
            }}
            className="px-6 py-2.5 rounded-xl font-semibold transition-all hover:opacity-80"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

// Metrics Tab Component
function MetricsTab({ merchant, metrics, theme, isDarkMode, isMotorpool }) {
  const accentColor = isMotorpool ? '#8B5CF6' : theme.accent.primary;

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div
          style={{
            background: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.1)',
            borderColor: 'rgba(16,185,129,0.3)'
          }}
          className="p-4 rounded-xl border"
        >
          <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase mb-1">Today's Collections</p>
          <p className="text-2xl font-bold text-emerald-500">
            ₱{(metrics?.todayCollections || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
          <p style={{ color: theme.text.muted }} className="text-xs mt-1">
            {metrics?.todayTransactions || 0} transactions
          </p>
        </div>

        <div
          style={{
            background: isDarkMode ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.1)',
            borderColor: 'rgba(59,130,246,0.3)'
          }}
          className="p-4 rounded-xl border"
        >
          <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase mb-1">This Week</p>
          <p className="text-2xl font-bold text-blue-500">
            ₱{(metrics?.weekCollections || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
          <p style={{ color: theme.text.muted }} className="text-xs mt-1">
            {metrics?.weekTransactions || 0} transactions
          </p>
        </div>

        <div
          style={{
            background: isDarkMode ? 'rgba(251,191,36,0.1)' : 'rgba(251,191,36,0.1)',
            borderColor: 'rgba(251,191,36,0.3)'
          }}
          className="p-4 rounded-xl border"
        >
          <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase mb-1">This Month</p>
          <p className="text-2xl font-bold text-yellow-500">
            ₱{(metrics?.monthCollections || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
          <p style={{ color: theme.text.muted }} className="text-xs mt-1">
            {metrics?.monthTransactions || 0} transactions
          </p>
        </div>

        <div
          style={{
            background: isMotorpool ? 'rgba(139,92,246,0.1)' : (isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)'),
            borderColor: isMotorpool ? 'rgba(139,92,246,0.3)' : (isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)')
          }}
          className="p-4 rounded-xl border"
        >
          <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase mb-1">All Time</p>
          <p className="text-2xl font-bold" style={{ color: accentColor }}>
            ₱{(metrics?.totalCollections || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
          <p style={{ color: theme.text.muted }} className="text-xs mt-1">
            {metrics?.totalTransactions || 0} transactions
          </p>
        </div>
      </div>

      {/* Merchant Info */}
      <div>
        <h4 style={{ color: theme.text.primary }} className="font-bold mb-3 flex items-center gap-2">
          {isMotorpool ? <Truck className="w-4 h-4" /> : <Store className="w-4 h-4" />}
          {isMotorpool ? 'Motorpool Info' : 'Merchant Info'}
        </h4>
        <div
          style={{
            background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
            borderColor: theme.border.primary
          }}
          className="rounded-xl border p-4 space-y-3"
        >
          <div className="flex justify-between">
            <span style={{ color: theme.text.secondary }} className="text-sm">Status</span>
            <span
              style={{
                background: merchant.isActive !== false ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                color: merchant.isActive !== false ? '#10B981' : '#EF4444'
              }}
              className="px-2 py-0.5 rounded text-xs font-bold"
            >
              {merchant.isActive !== false ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: theme.text.secondary }} className="text-sm">Type</span>
            <span style={{ color: theme.text.primary }} className="text-sm font-semibold capitalize">
              {merchant.type || 'Merchant'}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: theme.text.secondary }} className="text-sm">Email</span>
            <span style={{ color: theme.text.primary }} className="text-sm">
              {merchant.email || 'N/A'}
            </span>
          </div>
          {!isMotorpool && (
            <>
              <div className="flex justify-between">
                <span style={{ color: theme.text.secondary }} className="text-sm">Contact Person</span>
                <span style={{ color: theme.text.primary }} className="text-sm">
                  {merchant.firstName && merchant.lastName
                    ? `${merchant.firstName} ${merchant.lastName}`
                    : 'N/A'}
                </span>
              </div>
              {merchant.licenseNumber && (
                <div className="flex justify-between">
                  <span style={{ color: theme.text.secondary }} className="text-sm">License #</span>
                  <span style={{ color: theme.text.primary }} className="text-sm font-mono">
                    {merchant.licenseNumber}
                  </span>
                </div>
              )}
            </>
          )}
          <div className="flex justify-between">
            <span style={{ color: theme.text.secondary }} className="text-sm">Registered</span>
            <span style={{ color: theme.text.muted }} className="text-sm">
              {merchant.createdAt ? new Date(merchant.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Transactions Tab Component
function TransactionsTab({ transactions, theme, isDarkMode, isMotorpool, formatDate, currentPage, totalPages, onPageChange }) {
  if (transactions.length === 0) {
    return (
      <div style={{ color: theme.text.tertiary }} className="text-center py-10">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-semibold">No transactions yet</p>
        <p className="text-sm mt-1">Transactions will appear here once made</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Transactions List */}
      <div className="space-y-3">
        {transactions.map((tx, index) => (
          <div
            key={tx._id || index}
            style={{
              background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
              borderColor: theme.border.primary
            }}
            className="rounded-xl border p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div
                  style={{
                    background: isMotorpool ? 'rgba(139,92,246,0.2)' : 'rgba(16,185,129,0.2)'
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                >
                  {isMotorpool ? (
                    <Truck className="w-5 h-5 text-violet-500" />
                  ) : (
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <div>
                  <p style={{ color: theme.text.primary }} className="font-semibold text-sm">
                    {tx.userName || 'User'}
                  </p>
                  <p style={{ color: theme.text.muted }} className="text-xs">
                    {tx.userEmail || tx.cardUid || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-500">
                  +₱{(tx.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
                <p style={{ color: theme.text.muted }} className="text-xs">
                  {formatDate(tx.timestamp || tx.createdAt)}
                </p>
              </div>
            </div>
            {tx.itemDescription && (
              <div
                style={{ background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }}
                className="mt-2 px-3 py-2 rounded-lg"
              >
                <p style={{ color: theme.text.secondary }} className="text-xs">
                  {tx.itemDescription}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB',
              color: theme.text.primary
            }}
            className="px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50 transition hover:opacity-80"
          >
            Previous
          </button>
          <span style={{ color: theme.text.secondary }} className="px-4 py-2 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB',
              color: theme.text.primary
            }}
            className="px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50 transition hover:opacity-80"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
