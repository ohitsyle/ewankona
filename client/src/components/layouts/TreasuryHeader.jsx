// src/components/layouts/TreasuryHeader.jsx
// Treasury-specific header matching Motorpool design patterns

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../common/ThemeToggle';

export default function TreasuryHeader({ adminData, onLogout, onOpenProfile }) {
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
    if (!adminData) return 'T';
    const first = adminData.firstName?.[0] || '';
    const last = adminData.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'T';
  };

  const getFullName = () => {
    if (!adminData) return 'Treasury Admin';
    return `${adminData.firstName || ''} ${adminData.lastName || ''}`.trim() || 'Treasury Admin';
  };

  return (
    <header style={{
      background: isDarkMode ? 'linear-gradient(135deg, #181D40 0%, #0f1227 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 100%)',
      padding: '20px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `2px solid ${theme.accent.primary}`,
      boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(59, 130, 246, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      {/* Left Side - Logo & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{
          width: '45px',
          height: '45px',
          background: theme.accent.primary,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '22px',
          color: isDarkMode ? '#181D40' : '#FFFFFF',
          boxShadow: `0 0 0 3px ${isDarkMode ? 'rgba(255, 212, 28, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
        }}>
          NU
        </div>

        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: theme.text.primary, letterSpacing: '0.5px', margin: 0 }}>
            NUCash Admin Dashboard
          </h1>
          <p style={{ fontSize: '12px', color: theme.accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '2px 0 0 0' }}>
            Treasury Management System
          </p>
        </div>
      </div>

      {/* Right Side - Live Indicator & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Live Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(34, 197, 94, 0.2)',
          padding: '6px 14px',
          borderRadius: '20px',
          border: '1px solid rgba(34, 197, 94, 0.3)'
        }}>
          <div style={{ width: '7px', height: '7px', background: '#22C55E', borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#22C55E' }}>LIVE</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: isDarkMode ? 'rgba(255, 212, 28, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              border: `2px solid ${theme.accent.primary}`,
              borderRadius: '25px',
              padding: '4px 12px 4px 4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
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
            <div style={{
              width: '32px',
              height: '32px',
              background: theme.accent.primary,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
              color: isDarkMode ? '#181D40' : '#FFFFFF',
              flexShrink: 0
            }}>
              {getInitials()}
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
              <path d="M2 4L6 8L10 4" stroke={theme.accent.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '52px',
              right: 0,
              background: isDarkMode ? 'rgba(30, 35, 71, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              borderRadius: '12px',
              padding: '8px 0',
              minWidth: '220px',
              border: `2px solid ${theme.border.primary}`,
              boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.15)',
              animation: 'fadeIn 0.2s ease'
            }}>
              {/* Profile Info */}
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border.primary}`, marginBottom: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text.primary, marginBottom: '4px' }}>{getFullName()}</div>
                <div style={{ fontSize: '12px', color: theme.text.secondary }}>{adminData?.email || 'treasury@nu.edu.ph'}</div>
                <div style={{ fontSize: '10px', color: theme.accent.primary, textTransform: 'uppercase', fontWeight: 600, marginTop: '6px', letterSpacing: '0.5px' }}>Treasury Admin</div>
              </div>

              {/* Menu Items */}
              <button
                onClick={() => { setShowDropdown(false); onOpenProfile(); }}
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
