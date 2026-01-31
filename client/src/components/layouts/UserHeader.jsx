// src/components/layouts/UserHeader.jsx
// User-specific header matching Motorpool design patterns

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../common/ThemeToggle';

export default function UserHeader({ userData, onLogout, onOpenProfile }) {
  const { theme, isDarkMode } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = () => {
    if (!userData) return 'U';
    const first = userData.firstName?.[0] || '';
    const last = userData.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getFullName = () => {
    if (!userData) return 'User';
    return `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User';
  };

  return (
    <header className="sticky top-0 z-[1000] flex justify-between items-center px-3 py-3 sm:px-4 sm:py-4 md:px-10 md:py-5" style={{
      background: isDarkMode ? 'linear-gradient(135deg, #181D40 0%, #0f1227 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 100%)',
      borderBottom: `2px solid ${theme.accent.primary}`,
      boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(59, 130, 246, 0.08)'
    }}>
      {/* Left Side - Logo & Title */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
        <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-[45px] md:h-[45px] rounded-lg flex items-center justify-center font-extrabold text-base sm:text-lg md:text-[22px]" style={{
          background: theme.accent.primary,
          color: isDarkMode ? '#181D40' : '#FFFFFF',
          boxShadow: `0 0 0 3px ${isDarkMode ? 'rgba(255, 212, 28, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
        }}>
          NU
        </div>

        <div>
          <h1 className="text-base sm:text-lg md:text-2xl font-bold m-0" style={{ color: theme.text.primary, letterSpacing: '0.5px' }}>
            NUCash
          </h1>
          <p className="text-[10px] sm:text-xs font-semibold uppercase m-0 mt-0.5 hidden sm:block" style={{ color: theme.accent.primary, letterSpacing: '1px' }}>
            Student Portal
          </p>
        </div>
      </div>

      {/* Right Side - Theme Toggle & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 sm:gap-2 rounded-full p-1 pr-2 sm:pr-3 cursor-pointer transition-all duration-200"
            style={{
              background: isDarkMode ? 'rgba(255, 212, 28, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              border: `2px solid ${theme.accent.primary}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDarkMode ? 'rgba(255, 212, 28, 0.2)' : 'rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDarkMode ? 'rgba(255, 212, 28, 0.1)' : 'rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-extrabold text-xs sm:text-sm flex-shrink-0" style={{
              background: theme.accent.primary,
              color: isDarkMode ? '#181D40' : '#FFFFFF'
            }}>
              {getInitials()}
            </div>
            <svg className="w-3 h-3 hidden sm:block" viewBox="0 0 12 12" fill="none" style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
              <path d="M2 4L6 8L10 4" stroke={theme.accent.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-12 right-0 rounded-xl py-2 min-w-[180px] sm:min-w-[220px] z-50" style={{
              background: isDarkMode ? 'rgba(30, 35, 71, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              border: `2px solid ${theme.border.primary}`,
              boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.15)',
              animation: 'fadeIn 0.2s ease'
            }}>
              {/* Profile Info */}
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border.primary}`, marginBottom: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text.primary, marginBottom: '4px' }}>{getFullName()}</div>
                <div style={{ fontSize: '12px', color: theme.text.secondary }}>{userData?.email || 'student@nu.edu.ph'}</div>
                <div style={{ fontSize: '10px', color: theme.accent.primary, textTransform: 'uppercase', fontWeight: 600, marginTop: '6px', letterSpacing: '0.5px' }}>
                  {userData?.accountType === 'employee' ? 'Employee' : 'Student'}
                </div>
              </div>

              {/* Menu Items */}
              <button
                onClick={() => { setShowDropdown(false); onOpenProfile && onOpenProfile(); }}
                style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: theme.text.primary, fontSize: '14px', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = isDarkMode ? 'rgba(255, 212, 28, 0.1)' : 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.color = theme.accent.primary; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.text.primary; }}
              >
                <span style={{ fontSize: '16px' }}>👤</span>
                <span>Manage Profile</span>
              </button>

              <div style={{ height: '1px', background: theme.border.primary, margin: '8px 0' }} />

              <button
                onClick={() => { setShowDropdown(false); onLogout(); }}
                style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: '#EF4444', fontSize: '14px', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '16px' }}>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}
