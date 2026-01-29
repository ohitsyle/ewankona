// src/pages/admin/Treasury/CashInForm.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';

export default function CashInForm() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const inputRef = useRef(null);

  const quickAmounts = [50, 100, 200, 500, 1000];

  const searchUser = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a School ID or RFID');
      return;
    }

    setSearching(true);
    setUser(null);

    try {
      const data = await api.get(`/admin/treasury/user/search?query=${encodeURIComponent(searchQuery.trim())}`);
      if (data?.user) {
        setUser(data.user);
        toast.success('User found!');
      } else {
        toast.error('User not found');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to find user');
    } finally {
      setSearching(false);
    }
  };

  const handleCashIn = async () => {
    if (!user) {
      toast.error('Please search for a user first');
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (numAmount < 10) {
      toast.error('Minimum cash-in is ₱10');
      return;
    }

    if (numAmount > 10000) {
      toast.error('Maximum cash-in is ₱10,000');
      return;
    }

    setLoading(true);

    try {
      const data = await api.post('/admin/treasury/cashin', {
        userId: user._id || user.userId,
        amount: numAmount
      });

      if (data?.success) {
        setReceipt({
          userName: `${user.firstName} ${user.lastName}`,
          amount: numAmount,
          newBalance: data.newBalance,
          transactionId: data.transactionId,
          timestamp: new Date().toLocaleString()
        });
        toast.success('Cash-in successful!');
      } else {
        toast.error(data?.message || 'Cash-in failed');
      }
    } catch (error) {
      toast.error(error.message || 'Cash-in failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUser(null);
    setSearchQuery('');
    setAmount('');
    setReceipt(null);
    inputRef.current?.focus();
  };

  // Receipt View
  if (receipt) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div style={{ borderColor: theme.border.primary }} className="mb-[30px] border-b-2 pb-5">
          <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
            <span>✅</span> Cash-In Complete
          </h2>
          <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
            Transaction processed successfully
          </p>
        </div>

        <div className="max-w-md mx-auto w-full">
          <div style={{ background: theme.bg.card, borderColor: 'rgba(16,185,129,0.5)' }} className="rounded-2xl border-2 overflow-hidden">
            {/* Receipt Header */}
            <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }} className="p-6 text-center">
              <div className="text-5xl mb-3">✓</div>
              <h3 className="text-white text-xl font-bold">Cash-In Successful!</h3>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4">
              <div style={{ borderColor: theme.border.primary }} className="flex justify-between items-center py-3 border-b">
                <span style={{ color: theme.text.secondary }} className="text-sm">User</span>
                <span style={{ color: theme.text.primary }} className="font-semibold">{receipt.userName}</span>
              </div>
              <div style={{ borderColor: theme.border.primary }} className="flex justify-between items-center py-3 border-b">
                <span style={{ color: theme.text.secondary }} className="text-sm">Amount</span>
                <span style={{ color: '#10B981' }} className="font-bold text-xl">
                  +₱{receipt.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ borderColor: theme.border.primary }} className="flex justify-between items-center py-3 border-b">
                <span style={{ color: theme.text.secondary }} className="text-sm">New Balance</span>
                <span style={{ color: theme.text.primary }} className="font-bold">
                  ₱{receipt.newBalance?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ borderColor: theme.border.primary }} className="flex justify-between items-center py-3 border-b">
                <span style={{ color: theme.text.secondary }} className="text-sm">Transaction ID</span>
                <span style={{ color: theme.text.secondary, fontFamily: 'monospace' }} className="text-xs">
                  {receipt.transactionId}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span style={{ color: theme.text.secondary }} className="text-sm">Date & Time</span>
                <span style={{ color: theme.text.secondary }} className="text-sm">{receipt.timestamp}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => navigate('/admin/treasury/dashboard')}
                  style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                  className="flex-1 py-3 rounded-xl font-semibold border hover:opacity-80 transition"
                >
                  Back to Home
                </button>
                <button
                  onClick={resetForm}
                  style={{ background: theme.accent.primary, color: theme.accent.secondary }}
                  className="flex-1 py-3 rounded-xl font-bold hover:opacity-90 transition"
                >
                  New Cash-In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-[30px] border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>💵</span> Cash-In
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          Load balance to user accounts
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Search Section */}
        <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border">
          <h3 style={{ color: theme.text.primary }} className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>🔍</span> Find User
          </h3>

          <div className="flex gap-3 mb-4">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUser()}
              placeholder="Enter School ID or RFID..."
              style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
              className="flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none"
              autoFocus
            />
            <button
              onClick={searchUser}
              disabled={searching}
              style={{ background: theme.accent.primary, color: theme.accent.secondary }}
              className="px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* User Card */}
          {user && (
            <div style={{ background: theme.bg.tertiary, borderColor: theme.border.primary }} className="p-5 rounded-xl border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p style={{ color: theme.text.secondary }} className="text-xs uppercase font-bold mb-1">User Found</p>
                  <h4 style={{ color: theme.text.primary }} className="text-xl font-bold">
                    {user.firstName} {user.lastName}
                  </h4>
                  <p style={{ color: theme.text.secondary }} className="text-sm">
                    {user.schoolUId} • {user.role}
                  </p>
                </div>
                <div style={{
                  background: user.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                  color: user.isActive ? '#10B981' : '#EF4444'
                }} className="px-3 py-1 rounded-full text-xs font-bold">
                  {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                </div>
              </div>

              <div style={{ borderColor: theme.border.primary }} className="pt-4 border-t">
                <p style={{ color: theme.text.secondary }} className="text-xs uppercase font-bold mb-1">Current Balance</p>
                <p style={{ color: '#10B981' }} className="text-3xl font-extrabold">
                  ₱{(user.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}

          {!user && !searching && (
            <div style={{ color: theme.text.tertiary }} className="text-center py-10">
              <div className="text-4xl mb-3">👤</div>
              <p className="text-sm">Search for a user to begin cash-in</p>
            </div>
          )}
        </div>

        {/* Amount Section */}
        <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border">
          <h3 style={{ color: theme.text.primary }} className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>💰</span> Enter Amount
          </h3>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                style={{
                  background: amount === amt.toString() ? theme.accent.primary : theme.bg.tertiary,
                  color: amount === amt.toString() ? theme.accent.secondary : theme.text.primary,
                  borderColor: theme.border.primary
                }}
                className="py-3 rounded-xl font-bold text-sm border hover:opacity-80 transition"
              >
                ₱{amt}
              </button>
            ))}
          </div>

          {/* Custom Amount Input */}
          <div className="mb-6">
            <label style={{ color: theme.text.secondary }} className="text-xs uppercase font-bold mb-2 block">
              Custom Amount
            </label>
            <div className="relative">
              <span style={{ color: theme.text.secondary }} className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold">₱</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full pl-10 pr-4 py-4 rounded-xl border text-2xl font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={resetForm}
              style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
              className="flex-1 py-4 rounded-xl font-bold text-sm border hover:opacity-80 transition"
            >
              Reset
            </button>
            <button
              onClick={handleCashIn}
              disabled={!user || !amount || loading}
              style={{ background: '#10B981', color: '#FFFFFF' }}
              className="flex-1 py-4 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Load ₱${amount || '0.00'}`}
            </button>
          </div>

          {/* New Balance Preview */}
          {user && amount && parseFloat(amount) > 0 && (
            <div style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }} className="mt-4 p-4 rounded-xl border">
              <p style={{ color: theme.text.secondary }} className="text-xs mb-1">New Balance After Cash-In</p>
              <p style={{ color: '#10B981' }} className="text-2xl font-extrabold">
                ₱{((user.balance || 0) + parseFloat(amount || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
