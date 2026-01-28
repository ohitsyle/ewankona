import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { getTodayAnalytics } from "../../services/treasuryApi";
import { toast } from "react-toastify";

export default function Analytics() {
  const { theme, isDarkMode } = useTheme();
  const [analytics, setAnalytics] = useState({
    totalCashIn: 0,
    transactionCount: 0,
    studentsUsingNUCash: 0,
    activeStudents: 0,
  });

  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await getTodayAnalytics();
      if (response.success) {
        // Map backend response to frontend structure
        const backendData = response.analytics;
        setAnalytics({
          totalCashIn: backendData.todayCashIn?.amount || 0,
          transactionCount: backendData.todayCashIn?.count || 0,
          studentsUsingNUCash: backendData.totalActiveUsers || 0,
          activeStudents: backendData.totalActiveUsers || 0,
        });
      } else {
        if (showLoading) {
          toast.error("Failed to load analytics");
        }
      }
    } catch (error) {
      console.error("Analytics fetch error:", error);
      if (showLoading) {
        toast.error("Error loading analytics");
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAnalytics(true); // Show loading on initial mount
    const interval = setInterval(() => fetchAnalytics(false), 30000); // Silent refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* Stats Grid - 3 cards like Motorpool */}
      <div className="grid grid-cols-3 gap-5">
        {/* TOTAL COLLECTIONS */}
        <StatCard
          icon="💰"
          label="TODAY'S COLLECTIONS"
          value={loading && analytics.totalCashIn === 0
            ? "—"
            : `₱${analytics.totalCashIn.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
          subtitle={`${analytics.transactionCount} transactions`}
          color="#FFD41C"
          theme={theme}
        />

        {/* NUCASH USERS */}
        <StatCard
          icon="👥"
          label="ACTIVE USERS"
          value={loading && analytics.studentsUsingNUCash === 0 ? "—" : analytics.studentsUsingNUCash}
          subtitle={`${analytics.activeStudents} registered`}
          color="#10B981"
          theme={theme}
        />

        {/* NEW REGISTRATIONS */}
        <StatCard
          icon="📈"
          label="TOTAL TRANSACTIONS"
          value={analytics.transactionCount}
          subtitle="today's activity"
          color="#3B82F6"
          theme={theme}
        />
      </div>
    </div>
  );
}

// StatCard Component matching Motorpool design
function StatCard({ icon, label, value, subtitle, color, theme }) {
  return (
    <div style={{
      background: theme.bg.card,
      borderColor: theme.border.primary
    }} className="p-6 rounded-2xl border relative overflow-hidden transition-all duration-300">
      <div className="absolute right-4 top-4 text-[40px] opacity-15">
        {icon}
      </div>
      <div style={{ color: theme.text.secondary }} className="text-[11px] font-bold uppercase tracking-wide mb-3">
        {label}
      </div>
      <div style={{ color: theme.text.primary }} className="text-[32px] font-extrabold mb-2">
        {value}
      </div>
      <div className="text-xs font-semibold inline-block py-[3px] px-[10px] rounded-xl" style={{
        color: color,
        background: `${color}20`
      }}>
        {subtitle}
      </div>
    </div>
  );
}
