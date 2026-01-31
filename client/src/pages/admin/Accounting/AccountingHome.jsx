// src/pages/admin/Accounting/AccountingHome.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';

export default function AccountingHome() {
  const { theme, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    todayCashIn: 0,
    todayCashOut: 0,
    todayTransactions: 0,
    totalUsers: 0,
    totalMerchants: 0,
    totalBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const intervalRef = useRef(null);

  const fetchAnalytics = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const data = await api.get(`/admin/accounting/analytics?range=${dateRange}`);
      if (data) {
        setAnalytics({
          todayCashIn: data.todayCashIn || 0,
          todayCashOut: data.todayCashOut || 0,
          todayTransactions: data.todayTransactions || 0,
          totalUsers: data.totalUsers || 0,
          totalMerchants: data.totalMerchants || 0,
          totalBalance: data.totalBalance || 0
        });
      }
    } catch (error) {
      if (!silent) console.error('Failed to load analytics');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    intervalRef.current = setInterval(() => fetchAnalytics(true), 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [dateRange]);

  const netFlow = analytics.todayCashIn - analytics.todayCashOut;

  // Quick navigation items
  const quickNavItems = [
    {
      path: '/admin/accounting/transactions',
      icon: '📋',
      label: 'Transactions',
      description: 'View all cash-in and transaction history',
      color: '#3B82F6'
    },
    {
      path: '/admin/accounting/merchants',
      icon: '🏪',
      label: 'Merchants',
      description: 'Browse merchant accounts and details',
      color: '#F59E0B'
    },
    {
      path: '/admin/accounting/logs',
      icon: '📊',
      label: 'Activity Logs',
      description: 'View system activity and audit trail',
      color: '#A855F7'
    },
    {
      path: '/admin/accounting/config',
      icon: '⚙️',
      label: 'Settings',
      description: 'Configure accounting settings and exports',
      color: '#10B981'
    }
  ];

  if (loading) {
    return (
      <div style={{ color: theme.accent.primary }} className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: `${theme.accent.primary} transparent transparent transparent` }} />
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-[30px] border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>📊</span> Accounting Dashboard
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          Financial reports and transaction analytics • Auto-updates every minute
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2 mb-5">
        {[
          { value: 'today', label: 'Today' },
          { value: 'week', label: 'This Week' },
          { value: 'month', label: 'This Month' }
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setDateRange(value)}
            style={{
              background: dateRange === value ? theme.accent.primary : theme.bg.card,
              color: dateRange === value ? theme.accent.secondary : theme.text.primary,
              borderColor: theme.border.primary
            }}
            className="px-4 py-2 rounded-xl font-bold text-sm border hover:opacity-80 transition"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-4 gap-5 mb-5">
        <StatCard icon="💵" label="CASH-IN" value={`₱${analytics.todayCashIn.toLocaleString()}`} subtitle="loaded" color="#10B981" theme={theme} />
        <StatCard icon="💸" label="CASH-OUT" value={`₱${analytics.todayCashOut.toLocaleString()}`} subtitle="withdrawn" color="#EF4444" theme={theme} />
        <StatCard icon="📈" label="NET FLOW" value={`₱${netFlow.toLocaleString()}`} subtitle={netFlow >= 0 ? 'positive' : 'negative'} color={netFlow >= 0 ? '#10B981' : '#EF4444'} theme={theme} />
        <StatCard icon="📊" label="TRANSACTIONS" value={analytics.todayTransactions} subtitle="total" color="#3B82F6" theme={theme} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-5 mb-5">
        <StatCard icon="👥" label="TOTAL USERS" value={analytics.totalUsers.toLocaleString()} subtitle="registered" color="#A855F7" theme={theme} />
        <StatCard icon="🏪" label="MERCHANTS" value={analytics.totalMerchants.toLocaleString()} subtitle="active" color="#F59E0B" theme={theme} />
        <StatCard icon="🏦" label="SYSTEM BALANCE" value={`₱${analytics.totalBalance.toLocaleString()}`} subtitle="in circulation" color="#06B6D4" theme={theme} />
      </div>

      {/* Quick Navigation */}
      <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border">
        <h3 style={{ color: theme.text.primary }} className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>🚀</span> Quick Navigation
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {quickNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                borderColor: theme.border.primary
              }}
              className="p-5 rounded-2xl border text-left hover:scale-[1.02] transition-all duration-200 group"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = item.color;
                e.currentTarget.style.boxShadow = `0 8px 20px ${item.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.border.primary;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{item.icon}</div>
              <div style={{ color: theme.text.primary, fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>
                {item.label}
              </div>
              <div style={{ color: theme.text.secondary, fontSize: '12px', lineHeight: 1.4 }}>
                {item.description}
              </div>
              <div
                style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: item.color,
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                <span>Go to {item.label}</span>
                <span style={{ transition: 'transform 0.2s' }} className="group-hover:translate-x-1">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stat Card
function StatCard({ icon, label, value, subtitle, color, theme }) {
  return (
    <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border relative overflow-hidden">
      <div className="absolute right-4 top-4 text-[40px] opacity-15">{icon}</div>
      <div style={{ color: theme.text.secondary }} className="text-[11px] font-bold uppercase tracking-wide mb-3">{label}</div>
      <div style={{ color: theme.text.primary }} className="text-[28px] font-extrabold mb-2">{value}</div>
      <div className="text-xs font-semibold inline-block py-[3px] px-[10px] rounded-xl" style={{ color, background: `${color}20` }}>{subtitle}</div>
    </div>
  );
}
