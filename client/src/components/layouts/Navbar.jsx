import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, isDarkMode } = useTheme();

  const isTreasury = location.pathname.startsWith("/admin/treasury");

  const TREASURY_TABS = [
    { id: "dashboard", label: "Dashboard", icon: "📊", route: "/admin/treasury/dashboard" },
    { id: "transactions", label: "Transaction History", icon: "📋", route: "/admin/treasury/transactions" },
    { id: "merchants", label: "Merchants", icon: "🛒", route: "/admin/treasury/merchants" },
    { id: "logs", label: "Logs", icon: "📑", route: "/admin/treasury/logs" },
    { id: "concerns", label: "Concerns", icon: "⚠️", route: "/admin/treasury/concerns" },
    { id: "config", label: "Configuration", icon: "⚙️", route: "/admin/treasury/config" },
  ];

  const ACCOUNTING_TABS = [
    { id: "home", label: "Home", icon: "🏠", route: "/admin/accounting/home" },
    { id: "transactions", label: "Transaction History", icon: "📋", route: "/admin/accounting/transactions" },
    { id: "merchants", label: "Merchants", icon: "🛒", route: "/admin/accounting/merchants" },
    { id: "logs", label: "Logs", icon: "📑", route: "/admin/accounting/logs" },
    { id: "concerns", label: "Concerns", icon: "⚠️", route: "/admin/accounting/concerns" },
    { id: "config", label: "Configuration", icon: "⚙️", route: "/admin/accounting/config" },
  ];

  const tabs = isTreasury ? TREASURY_TABS : ACCOUNTING_TABS;
  const baseColor = isDarkMode ? '255, 212, 28' : '59, 130, 246';

  return (
    <nav
      style={{
        background: theme.bg.secondary,
        borderColor: theme.border.primary,
        boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(59, 130, 246, 0.08)',
        borderRadius: '12px',
        padding: '12px 24px',
        marginBottom: '20px',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease'
      }}
      className="flex gap-2 border"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.border.hover;
        e.currentTarget.style.boxShadow = isDarkMode ? '0 8px 30px rgba(0, 0, 0, 0.4)' : '0 8px 30px rgba(59, 130, 246, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.border.primary;
        e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(59, 130, 246, 0.08)';
      }}
    >
      {tabs.map((tab) => {
        const isActive = location.pathname.startsWith(tab.route);

        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.route)}
            style={{
              background: isActive ? theme.accent.primary : 'transparent',
              color: isActive ? theme.accent.secondary : theme.text.secondary,
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
              boxShadow: isActive ? (isDarkMode ? '0 4px 12px rgba(255,212,28,0.4)' : '0 4px 12px rgba(59,130,246,0.4)') : 'none'
            }}
            className="flex items-center gap-2 font-semibold text-sm"
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)';
                e.currentTarget.style.color = theme.accent.primary;
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = isDarkMode ? '0 2px 8px rgba(255,212,28,0.2)' : '0 2px 8px rgba(59,130,246,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme.text.secondary;
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <span className={`text-base transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
