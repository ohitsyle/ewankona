import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { AppContext } from "../../context/AppContext";
import ThemeToggle from "../common/ThemeToggle";

export default function Header() {
  const { theme, isDarkMode } = useTheme();
  const { userData, loadingUserData, logoutUser } = useContext(AppContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Handle click outside of dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getFullName = () => {
    if (!userData) return "User";
    return userData?.name || userData?.firstName || "User";
  };

  const getInitials = () => {
    const name = getFullName();
    return name.charAt(0).toUpperCase();
  };

  const email = userData?.email || "user@nu.edu.ph";

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  if (loadingUserData) {
    return (
      <header
        style={{
          background: isDarkMode ? 'linear-gradient(135deg, #181D40 0%, #0f1227 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 100%)',
          borderBottom: `2px solid ${theme.accent.primary}`,
          boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(59, 130, 246, 0.08)',
        }}
        className="px-[40px] py-[20px]"
      >
        <p style={{ color: theme.text.primary }} className="text-sm">Loading user info...</p>
      </header>
    );
  }

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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
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
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: theme.text.primary,
            letterSpacing: '0.5px',
            margin: 0
          }}>
            NUCash System
          </h1>
          <p style={{
            fontSize: '12px',
            color: theme.accent.primary,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: '2px 0 0 0'
          }}>
            Digital Wallet System
          </p>
        </div>
      </div>

      {/* Right Side - Live Indicator & Profile */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Live Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isOnline ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
          padding: '6px 14px',
          borderRadius: '20px',
          border: isOnline ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(107, 114, 128, 0.3)'
        }}>
          <div style={{
            width: '7px',
            height: '7px',
            background: isOnline ? '#22C55E' : '#6B7280',
            borderRadius: '50%',
            animation: isOnline ? 'pulse 2s ease-in-out infinite' : 'none'
          }} />
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: isOnline ? '#22C55E' : '#6B7280'
          }}>
            {isOnline ? 'LIVE' : 'INACTIVE'}
          </span>
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
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              style={{
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            >
              <path
                d="M2 4L6 8L10 4"
                stroke={theme.accent.primary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
              <div style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 212, 28, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
                marginBottom: '8px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: theme.text.primary,
                  marginBottom: '4px'
                }}>
                  {getFullName()}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme.text.secondary
                }}>
                  {email}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: theme.accent.primary,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginTop: '6px',
                  letterSpacing: '0.5px'
                }}>
                  User
                </div>
              </div>

              {/* Menu Items */}
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate("/user/settings");
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: theme.text.primary,
                  fontSize: '14px',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255, 212, 28, 0.1)' : 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.color = theme.accent.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = theme.text.primary;
                }}
              >
                <span style={{ fontSize: '16px' }}>👤</span>
                <span>Manage Account</span>
              </button>

              <div style={{
                height: '1px',
                background: isDarkMode ? 'rgba(255, 212, 28, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                margin: '8px 0'
              }} />

              <button
                onClick={() => {
                  setShowDropdown(false);
                  handleLogout();
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: '14px',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
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
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.8);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
}