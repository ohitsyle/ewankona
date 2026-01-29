import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import MotorpoolHeader from './MotorpoolHeader';
import Footer from './Footer';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, isDarkMode } = useTheme();
  const [adminData] = useState(() => {
    const data = localStorage.getItem('adminData');
    return data ? JSON.parse(data) : null;
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleOpenProfile = () => {
    navigate('/admin/motorpool/profile');
  };

  // Motorpool tabs
  const motorpoolTabs = [
    { path: '/admin/motorpool', icon: '🏠', label: 'Home' },
    { path: '/admin/motorpool/routes', icon: '🗺️', label: 'Routes' },
    { path: '/admin/motorpool/drivers', icon: '👨‍✈️', label: 'Drivers' },
    { path: '/admin/motorpool/shuttles', icon: '🚐', label: 'Shuttles' },
    { path: '/admin/motorpool/trips', icon: '📍', label: 'Trips' },
    { path: '/admin/motorpool/phones', icon: '📱', label: 'Phones' },
  ];

  // System tabs
  const systemTabs = [
    { path: '/admin/logs', icon: '📋', label: 'Logs' },
    { path: '/admin/motorpool/concerns', icon: '💬', label: 'Concerns' },
    { path: '/admin/motorpool/configurations', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div style={{ background: theme.bg.primary }} className="min-h-screen flex flex-col">
      {/* Header */}
      <MotorpoolHeader
        adminData={adminData}
        onLogout={handleLogout}
        onOpenProfile={handleOpenProfile}
      />

      {/* Spacing between header and tabs */}
      <div style={{ background: theme.bg.primary }} className="h-4" />

      {/* Tab Navigation - Detached with subtle rounded corners */}
      <div
        style={{
          background: theme.bg.secondary,
          borderColor: theme.border.primary,
          boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(59, 130, 246, 0.08)'
        }}
        className="mx-8 rounded-lg px-6 py-3 border backdrop-blur-sm transition-all duration-300"
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.border.hover;
          e.currentTarget.style.boxShadow = isDarkMode ? '0 8px 30px rgba(0, 0, 0, 0.4)' : '0 8px 30px rgba(59, 130, 246, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.border.primary;
          e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(59, 130, 246, 0.08)';
        }}
      >
        <div className="flex items-center gap-2">
          {/* Motorpool Tabs */}
          {motorpoolTabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                style={{
                  background: isActive ? theme.accent.primary : 'transparent',
                  color: isActive ? theme.accent.secondary : theme.text.secondary
                }}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold text-sm
                  transition-all duration-300 ease-out
                  ${isActive ? 'shadow-lg scale-105' : 'hover:scale-102 hover:shadow-md'}
                `}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)';
                    e.currentTarget.style.color = theme.accent.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = theme.text.secondary;
                  }
                }}
              >
                <span className={`text-base transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Clearer Divider */}
          <div className="h-10 w-[2px] bg-gradient-to-b from-transparent via-[rgba(255,212,28,0.4)] to-transparent mx-4" />

          {/* System Tabs */}
          {systemTabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                style={{
                  background: isActive ? theme.accent.primary : 'transparent',
                  color: isActive ? theme.accent.secondary : theme.text.tertiary
                }}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-md font-semibold text-xs
                  transition-all duration-300 ease-out
                  ${isActive ? 'shadow-lg scale-105' : 'hover:scale-102 hover:shadow-md'}
                `}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)';
                    e.currentTarget.style.color = theme.accent.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = theme.text.tertiary;
                  }
                }}
              >
                <span className={`text-sm transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto animate-fadeIn">
        {children}
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .scale-102 {
          transform: scale(1.02);
        }
        *::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        *::-webkit-scrollbar-track {
          background: ${theme.scrollbar.track};
          border-radius: 10px;
        }
        *::-webkit-scrollbar-thumb {
          background: ${theme.scrollbar.thumb};
          border-radius: 10px;
          transition: background 0.3s ease;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: ${theme.scrollbar.thumbHover};
        }
      `}</style>

      {/* Footer */}
      <Footer />
    </div>
  );
}
