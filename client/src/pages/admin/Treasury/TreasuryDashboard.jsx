// src/pages/admin/Treasury/TreasuryDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import TransactionTable from '../../../components/TreasuryDashboard/TransactionTable';
import RegisterUserModal from '../../../components/modals/RegisterUserModal';
import CashInModal from '../../../components/modals/CashInModal';

export default function TreasuryDashboard() {
  const { theme, isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    todayCashIn: 0,
    todayCashOut: 0,
    todayTransactions: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalMerchants: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  // Modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCashInModal, setShowCashInModal] = useState(false);
  const [prefillRfid, setPrefillRfid] = useState('');

  const loadDashboardData = async () => {
    try {
      // Fetch treasury stats
      const statsData = await api.get('/admin/treasury/dashboard');
      if (statsData) {
        setStats({
          todayCashIn: statsData.todayCashIn || 0,
          todayCashOut: statsData.todayCashOut || 0,
          todayTransactions: statsData.todayTransactions || 0,
          totalUsers: statsData.totalUsers || 0,
          activeUsers: statsData.activeUsers || 0,
          totalMerchants: statsData.totalMerchants || 0
        });
      }

      // Fetch recent transactions
      const txData = await api.get('/admin/treasury/transactions?limit=10');
      if (txData?.transactions) {
        setRecentTransactions(txData.transactions);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 5 seconds
    intervalRef.current = setInterval(loadDashboardData, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle opening register modal from cash-in modal (when user not found)
  const handleRegisterFromCashIn = (rfid) => {
    setPrefillRfid(rfid);
    setShowCashInModal(false);
    setShowRegisterModal(true);
  };

  // Handle successful registration
  const handleRegisterSuccess = () => {
    loadDashboardData();
  };

  // Handle successful cash-in
  const handleCashInSuccess = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div style={{ color: theme.accent.primary }} className="text-center py-[60px]">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-6 border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>🏠</span> Treasury Home
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          Cash-in operations and transaction monitoring • Auto-updates every 5 seconds
        </p>
      </div>

      {/* Stats Grid - 4 cards at top */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="💵"
          label="TODAY'S CASH-IN"
          value={`₱${(stats.todayCashIn || 0).toLocaleString()}`}
          subtitle="loaded today"
          color="#10B981"
          theme={theme}
        />
        <StatCard
          icon="💸"
          label="TODAY'S CASH-OUT"
          value={`₱${(stats.todayCashOut || 0).toLocaleString()}`}
          subtitle="withdrawn today"
          color="#EF4444"
          theme={theme}
        />
        <StatCard
          icon="📊"
          label="TODAY'S TRANSACTIONS"
          value={stats.todayTransactions || 0}
          subtitle="total transactions"
          color="#3B82F6"
          theme={theme}
        />
        <StatCard
          icon="👥"
          label="ACTIVE USERS"
          value={`${stats.activeUsers || 0}/${stats.totalUsers || 0}`}
          subtitle="active / total"
          color="#A855F7"
          theme={theme}
        />
      </div>

      {/* Two Column Layout: Actions on Left, Transactions on Right */}
      <div className="flex-1 grid grid-cols-[350px_1fr] gap-6 min-h-0">
        {/* Left Column - Action Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => {
              setPrefillRfid('');
              setShowCashInModal(true);
            }}
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)',
              borderColor: 'rgba(16,185,129,0.3)'
            }}
            className="p-5 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'rgba(16,185,129,0.2)' }}>
              💵
            </div>
            <div className="text-left">
              <h3 className="text-base font-bold text-emerald-500 m-0">Cash-In for User</h3>
              <p style={{ color: theme.text.secondary }} className="text-xs m-0 mt-1">
                Load balance to NUCash account
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              setPrefillRfid('');
              setShowRegisterModal(true);
            }}
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(255,212,28,0.2) 0%, rgba(255,212,28,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.1) 100%)',
              borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'
            }}
            className="p-5 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)' }}
            >
              👤
            </div>
            <div className="text-left">
              <h3 style={{ color: theme.accent.primary }} className="text-base font-bold m-0">Register New User</h3>
              <p style={{ color: theme.text.secondary }} className="text-xs m-0 mt-1">
                Add student or employee to NUCash
              </p>
            </div>
          </button>

          {/* Quick Stats Summary */}
          <div
            style={{
              background: theme.bg.card,
              borderColor: theme.border.primary
            }}
            className="rounded-2xl border p-5 mt-2"
          >
            <h4 style={{ color: theme.accent.primary }} className="text-sm font-bold mb-4">
              📊 Quick Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span style={{ color: theme.text.secondary }} className="text-sm">Total Users</span>
                <span style={{ color: theme.text.primary }} className="font-bold">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: theme.text.secondary }} className="text-sm">Active Users</span>
                <span className="font-bold text-emerald-500">{stats.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: theme.text.secondary }} className="text-sm">Merchants</span>
                <span style={{ color: theme.text.primary }} className="font-bold">{stats.totalMerchants}</span>
              </div>
              <div style={{ borderColor: theme.border.primary }} className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span style={{ color: theme.text.secondary }} className="text-sm">Net Today</span>
                  <span className={`font-bold ${(stats.todayCashIn - stats.todayCashOut) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {(stats.todayCashIn - stats.todayCashOut) >= 0 ? '+' : ''}₱{(stats.todayCashIn - stats.todayCashOut).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Recent Transactions */}
        <div className="overflow-hidden flex flex-col">
          <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl border overflow-hidden flex-1 flex flex-col">
            <div style={{ borderColor: theme.border.primary }} className="p-4 border-b flex justify-between items-center flex-shrink-0">
              <div>
                <h3 style={{ color: theme.accent.primary }} className="m-0 mb-1 text-base font-bold">
                  📋 Recent Transactions
                </h3>
                <p style={{ color: theme.text.secondary }} className="m-0 text-xs">
                  Latest cash-in and cash-out activities
                </p>
              </div>
              <div className="flex items-center gap-2 bg-[rgba(16,185,129,0.2)] px-3 py-1.5 rounded-[20px] border border-[rgba(16,185,129,0.3)]">
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[#10B981] text-xs font-semibold">LIVE</span>
              </div>
            </div>

            {/* Transaction Table */}
            <div className="p-4 overflow-y-auto flex-1">
              {recentTransactions.length === 0 ? (
                <div style={{ color: theme.text.tertiary }} className="text-center py-16">
                  <div className="text-5xl mb-4">📋</div>
                  <p>No transactions yet today</p>
                </div>
              ) : (
                <TransactionTable
                  transactions={recentTransactions}
                  showHeader={false}
                  compact={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Register User Modal */}
      <RegisterUserModal
        isOpen={showRegisterModal}
        onClose={() => {
          setShowRegisterModal(false);
          setPrefillRfid('');
        }}
        onSuccess={handleRegisterSuccess}
        prefillRfid={prefillRfid}
      />

      {/* Cash-In Modal */}
      <CashInModal
        isOpen={showCashInModal}
        onClose={() => setShowCashInModal(false)}
        onSuccess={handleCashInSuccess}
        onRegisterUser={handleRegisterFromCashIn}
      />
    </div>
  );
}

// Stat Card Component - Compact version
function StatCard({ icon, label, value, subtitle, color, theme }) {
  return (
    <div style={{
      background: theme.bg.card,
      borderColor: theme.border.primary
    }} className="p-4 rounded-2xl border relative overflow-hidden transition-all duration-300">
      <div className="absolute right-3 top-3 text-[32px] opacity-15">
        {icon}
      </div>
      <div style={{ color: theme.text.secondary }} className="text-[10px] font-bold uppercase tracking-wide mb-2">
        {label}
      </div>
      <div style={{ color: theme.text.primary }} className="text-2xl font-extrabold mb-1">
        {value}
      </div>
      <div className="text-[10px] font-semibold inline-block py-[2px] px-[8px] rounded-lg" style={{
        color: color,
        background: `${color}20`
      }}>
        {subtitle}
      </div>
    </div>
  );
}
