// src/pages/admin/Treasury/MerchantsPage.jsx
// View merchants and their transaction flow (read-only for Treasury)
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';

export default function MerchantsPage() {
  const { theme } = useTheme();
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
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const data = await api.get(`/admin/treasury/merchants?${params}`);
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
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    return (
      m.businessName?.toLowerCase().includes(query) ||
      m.merchantId?.toLowerCase().includes(query) ||
      m.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-[30px] border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>🏪</span> Merchants
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          View merchant accounts and balances (read-only)
        </p>
      </div>

      {/* Filters */}
      <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-4 rounded-2xl border mb-5 flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="flex-1 relative min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
          <input
            type="text"
            placeholder="Search merchants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
            className="w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {['all', 'active', 'inactive'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                background: statusFilter === status ? theme.accent.primary : theme.bg.tertiary,
                color: statusFilter === status ? theme.accent.secondary : theme.text.primary,
                borderColor: theme.border.primary
              }}
              className="px-4 py-2 rounded-xl font-bold text-sm border capitalize hover:opacity-80 transition"
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Merchants List */}
      <div className="flex-1 overflow-y-auto">
        <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl border overflow-hidden">
          {loading ? (
            <div style={{ color: theme.accent.primary }} className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: `${theme.accent.primary} transparent transparent transparent` }} />
              Loading merchants...
            </div>
          ) : filteredMerchants.length === 0 ? (
            <div style={{ color: theme.text.tertiary }} className="text-center py-20">
              <div className="text-5xl mb-4">🏪</div>
              <p>No merchants found</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 p-4">
              {filteredMerchants.map((merchant) => (
                <MerchantCard
                  key={merchant._id || merchant.merchantId}
                  merchant={merchant}
                  theme={theme}
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
          onClose={() => setSelectedMerchant(null)}
        />
      )}
    </div>
  );
}

// Merchant Card
function MerchantCard({ merchant, theme, onView }) {
  const isActive = merchant.isActive !== false;

  return (
    <div
      style={{ background: theme.bg.tertiary, borderColor: theme.border.primary }}
      className="p-5 rounded-xl border cursor-pointer hover:opacity-90 transition"
      onClick={onView}
    >
      <div className="flex justify-between items-start mb-3">
        <div style={{ background: 'rgba(255,212,28,0.15)', color: '#FFD41C' }} className="px-3 py-1 rounded-lg text-xs font-bold">
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
          <span style={{ color: theme.text.secondary }} className="text-xs">Balance</span>
          <span style={{ color: '#10B981' }} className="font-bold text-sm">
            ₱{(merchant.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: theme.text.secondary }} className="text-xs">Collections</span>
          <span style={{ color: '#3B82F6' }} className="font-bold text-sm">
            ₱{(merchant.totalCollections || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <button
        style={{ background: theme.accent.primary, color: theme.accent.secondary }}
        className="w-full mt-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition"
      >
        View Details
      </button>
    </div>
  );
}

// Merchant Modal (read-only)
function MerchantModal({ merchant, theme, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: theme.bg.secondary, borderColor: theme.border.primary }}
        className="w-full max-w-md rounded-2xl border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: theme.accent.primary }} className="p-6 text-center">
          <div className="text-4xl mb-2">🏪</div>
          <h3 style={{ color: theme.accent.secondary }} className="text-xl font-bold">
            {merchant.businessName || merchant.name}
          </h3>
          <p style={{ color: theme.accent.secondary, opacity: 0.8 }} className="text-sm">
            {merchant.merchantId}
          </p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div style={{ borderColor: theme.border.primary }} className="flex justify-between py-3 border-b">
            <span style={{ color: theme.text.secondary }} className="text-sm">Status</span>
            <span style={{ color: merchant.isActive ? '#10B981' : '#EF4444' }} className="font-bold">
              {merchant.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div style={{ borderColor: theme.border.primary }} className="flex justify-between py-3 border-b">
            <span style={{ color: theme.text.secondary }} className="text-sm">Current Balance</span>
            <span style={{ color: '#10B981' }} className="font-bold text-lg">
              ₱{(merchant.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ borderColor: theme.border.primary }} className="flex justify-between py-3 border-b">
            <span style={{ color: theme.text.secondary }} className="text-sm">Total Collections</span>
            <span style={{ color: theme.text.primary }} className="font-bold">
              ₱{(merchant.totalCollections || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ borderColor: theme.border.primary }} className="flex justify-between py-3 border-b">
            <span style={{ color: theme.text.secondary }} className="text-sm">Email</span>
            <span style={{ color: theme.text.primary }} className="text-sm">
              {merchant.email || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between py-3">
            <span style={{ color: theme.text.secondary }} className="text-sm">Joined</span>
            <span style={{ color: theme.text.secondary }} className="text-sm">
              {merchant.createdAt ? new Date(merchant.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <div className="p-4">
          <button
            onClick={onClose}
            style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
            className="w-full py-3 rounded-xl font-bold border hover:opacity-80 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
