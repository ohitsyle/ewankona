// src/pages/admin/Sysad/Dashboard.jsx
// System Admin Dashboard with comprehensive system overview

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import { Users, UserCheck, UserX, Shield, GraduationCap, Briefcase, TrendingUp, DollarSign, Activity, Store, Truck, Clock } from 'lucide-react';

export default function SysadDashboard() {
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    admins: 0,
    students: 0,
    employees: 0,
    totalBalance: 0,
    todayTransactions: 0,
    todayCashIn: 0,
    totalMerchants: 0,
    activeMerchants: 0,
    recentLogins: []
  });
  const intervalRef = useRef(null);

  const fetchMetrics = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.get('/admin/sysad/dashboard');
      if (data) {
        setMetrics(data);
      }
    } catch (error) {
      if (!silent) toast.error('Failed to load dashboard metrics');
      console.error('Dashboard error:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    intervalRef.current = setInterval(() => fetchMetrics(true), 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Purple accent color for sysad
  const accentColor = '#8B5CF6';

  if (loading) {
    return (
      <div style={{ color: accentColor }} className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: `${accentColor} transparent transparent transparent` }} />
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-220px)] flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-6 border-b-2 pb-5">
        <h2 style={{ color: accentColor }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>📊</span> System Dashboard
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          Comprehensive overview of the NUCash system • Auto-updates every 30 seconds
        </p>
      </div>

      {/* User Metrics */}
      <div className="mb-6">
        <h3 style={{ color: theme.text.primary }} className="text-lg font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" style={{ color: accentColor }} />
          User Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Users"
            value={metrics.totalUsers?.toLocaleString() || '0'}
            color="#3B82F6"
            theme={theme}
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon={<UserCheck className="w-6 h-6" />}
            label="Active Users"
            value={metrics.activeUsers?.toLocaleString() || '0'}
            color="#10B981"
            theme={theme}
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon={<UserX className="w-6 h-6" />}
            label="Inactive Users"
            value={metrics.inactiveUsers?.toLocaleString() || '0'}
            color="#EF4444"
            theme={theme}
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon={<Shield className="w-6 h-6" />}
            label="Admins"
            value={metrics.admins?.toLocaleString() || '0'}
            color="#8B5CF6"
            theme={theme}
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon={<GraduationCap className="w-6 h-6" />}
            label="Students"
            value={metrics.students?.toLocaleString() || '0'}
            color="#F59E0B"
            theme={theme}
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon={<Briefcase className="w-6 h-6" />}
            label="Employees"
            value={metrics.employees?.toLocaleString() || '0'}
            color="#06B6D4"
            theme={theme}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Financial & Transaction Metrics */}
      <div className="mb-6">
        <h3 style={{ color: theme.text.primary }} className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: accentColor }} />
          Financial Overview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Total Balance in System"
            value={`₱${(metrics.totalBalance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
            color="#10B981"
            theme={theme}
            isDarkMode={isDarkMode}
            large
          />
          <StatCard
            icon={<Activity className="w-6 h-6" />}
            label="Today's Transactions"
            value={metrics.todayTransactions?.toLocaleString() || '0'}
            color="#3B82F6"
            theme={theme}
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Today's Cash-In"
            value={`₱${(metrics.todayCashIn || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
            color="#F59E0B"
            theme={theme}
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon={<Store className="w-6 h-6" />}
            label="Active Merchants"
            value={`${metrics.activeMerchants || 0}/${metrics.totalMerchants || 0}`}
            color="#8B5CF6"
            theme={theme}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Recent Admin Activity */}
      <div className="flex-1">
        <h3 style={{ color: theme.text.primary }} className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" style={{ color: accentColor }} />
          Recent Admin Activity
        </h3>
        <div
          style={{ background: theme.bg.card, borderColor: theme.border.primary }}
          className="rounded-2xl border p-4"
        >
          {metrics.recentLogins && metrics.recentLogins.length > 0 ? (
            <div className="space-y-3">
              {metrics.recentLogins.map((login, index) => (
                <div
                  key={index}
                  style={{
                    background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                    borderColor: theme.border.primary
                  }}
                  className="p-4 rounded-xl border flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      style={{
                        background: login.eventType === 'login' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                    >
                      {login.eventType === 'login' ? (
                        <UserCheck className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <UserX className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p style={{ color: theme.text.primary }} className="font-semibold">
                        {login.adminName || 'Admin'}
                      </p>
                      <p style={{ color: theme.text.secondary }} className="text-xs">
                        {login.metadata?.adminRole || 'Admin'} • {login.adminId || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      style={{
                        background: login.eventType === 'login' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                        color: login.eventType === 'login' ? '#10B981' : '#EF4444'
                      }}
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase"
                    >
                      {login.eventType}
                    </span>
                    <p style={{ color: theme.text.muted }} className="text-xs mt-1">
                      {new Date(login.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: theme.text.tertiary }} className="text-center py-10">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-semibold">No recent admin activity</p>
              <p className="text-sm mt-1">Admin logins and logouts will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, color, theme, isDarkMode, large }) {
  return (
    <div
      style={{
        background: theme.bg.card,
        borderColor: `${color}30`
      }}
      className={`p-4 rounded-xl border flex items-center gap-4 ${large ? 'col-span-1' : ''}`}
    >
      <div
        style={{ background: `${color}20` }}
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="min-w-0">
        <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase truncate">
          {label}
        </p>
        <p style={{ color }} className={`font-bold truncate ${large ? 'text-xl' : 'text-lg'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
