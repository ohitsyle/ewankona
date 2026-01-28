import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { AppContext } from '../../context/AppContext';

export default function Settings() {
  const { theme, isDarkMode } = useTheme();
  const { userData, logoutUser } = useContext(AppContext);
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('personal');
  const [profileLoading, setProfileLoading] = useState(false);

  // Change PIN states
  const [pinStep, setPinStep] = useState(1);
  const [pinFormData, setPinFormData] = useState({ oldPin: '', newPin: '', otp: '' });
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinOtpSent, setPinOtpSent] = useState(false);
  const [showPinConfirm, setShowPinConfirm] = useState(false);

  // Deactivate Account states
  const [deactivateStep, setDeactivateStep] = useState(1);
  const [deactivateOtp, setDeactivateOtp] = useState('');
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [deactivateError, setDeactivateError] = useState('');
  const [deactivateOtpSent, setDeactivateOtpSent] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const getInitials = () => {
    if (!userData) return '?';
    const name = userData?.name || userData?.firstName || 'User';
    return name.charAt(0).toUpperCase();
  };

  // Change PIN handlers
  const handlePinChange = (field, value) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 6) return;

    setPinFormData({ ...pinFormData, [field]: value });
    setPinError('');
  };

  const handleSendPinOTP = async () => {
    if (!pinFormData.oldPin || pinFormData.oldPin.length !== 6) {
      setPinError('Old PIN must be exactly 6 digits');
      return;
    }
    if (!pinFormData.newPin || pinFormData.newPin.length !== 6) {
      setPinError('New PIN must be exactly 6 digits');
      return;
    }
    if (pinFormData.oldPin === pinFormData.newPin) {
      setPinError('New PIN must be different from old PIN');
      return;
    }

    setPinLoading(true);
    setPinError('');

    try {
      const response = await fetch('http://localhost:3000/api/user/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          email: userData.email,
          purpose: 'password_change'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');

      setPinOtpSent(true);
      setPinStep(2);
      setPinError('');
    } catch (err) {
      setPinError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (!pinFormData.otp || pinFormData.otp.length !== 6) {
      setPinError('OTP must be exactly 6 digits');
      return;
    }

    setPinLoading(true);
    setPinError('');

    try {
      const response = await fetch('http://localhost:3000/api/user/change-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          oldPin: pinFormData.oldPin,
          newPin: pinFormData.newPin,
          otp: pinFormData.otp
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to change PIN');

      setPinStep(3);
      setPinError('');
    } catch (err) {
      setPinError(err.message || 'Failed to change PIN. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const resetPinForm = () => {
    setPinStep(1);
    setPinFormData({ oldPin: '', newPin: '', otp: '' });
    setPinError('');
    setPinOtpSent(false);
    setShowPinConfirm(false);
  };

  // Deactivate Account handlers
  const handleSendDeactivateOTP = async () => {
    setDeactivateLoading(true);
    setDeactivateError('');

    try {
      const response = await fetch('http://localhost:3000/api/user/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          email: userData.email,
          purpose: 'account_deactivation'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');

      setDeactivateOtpSent(true);
      setDeactivateStep(2);
      setDeactivateError('');
    } catch (err) {
      setDeactivateError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!deactivateOtp || deactivateOtp.length !== 6) {
      setDeactivateError('OTP must be exactly 6 digits');
      return;
    }

    setDeactivateLoading(true);
    setDeactivateError('');

    try {
      const response = await fetch('http://localhost:3000/api/user/deactivate-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({ otp: deactivateOtp })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to deactivate account');

      setDeactivateStep(3);
      setDeactivateError('');

      // Auto-logout after 3 seconds
      setTimeout(async () => {
        await logoutUser();
        navigate('/login');
      }, 3000);
    } catch (err) {
      setDeactivateError(err.message || 'Failed to deactivate account. Please try again.');
    } finally {
      setDeactivateLoading(false);
    }
  };

  const renderPersonalInfo = () => (
    <div
      style={{
        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.05)',
        borderRadius: '16px',
        border: `1px solid ${theme.border.primary}`,
        overflow: 'hidden'
      }}
    >
      {/* Profile Header */}
      <div
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(255,212,28,0.2) 0%, rgba(255,212,28,0.05) 100%)'
            : 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.05) 100%)',
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          borderBottom: `1px solid ${theme.border.primary}`
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: theme.accent.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            fontWeight: 800,
            color: theme.accent.secondary,
            boxShadow: `0 0 0 6px ${isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}`
          }}
        >
          {getInitials()}
        </div>

        {/* Name and Role */}
        <div>
          <h2
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: theme.text.primary,
              margin: '0 0 8px 0'
            }}
          >
            {userData?.name || userData?.firstName || 'User'}
          </h2>
          <div
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)',
              border: `1px solid ${theme.accent.primary}40`,
              borderRadius: '20px',
              color: theme.accent.primary,
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            User
          </div>
        </div>
      </div>

      {/* Personal Info Grid */}
      <div style={{ padding: '32px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px'
          }}
        >
          <InfoField theme={theme} isDarkMode={isDarkMode} label="Name" value={userData?.name || userData?.firstName || 'N/A'} />
          <InfoField theme={theme} isDarkMode={isDarkMode} label="Email Address" value={userData?.email || 'N/A'} />
          <InfoField theme={theme} isDarkMode={isDarkMode} label="School ID" value={userData?.schoolId || userData?.studentId || 'N/A'} />
          <InfoField
            theme={theme}
            isDarkMode={isDarkMode}
            label="Account Status"
            value={userData?.isActive !== false ? 'Active' : 'Inactive'}
            highlight={userData?.isActive !== false ? 'success' : 'error'}
          />
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Change PIN Card */}
      <div
        style={{
          background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.05)',
          borderRadius: '16px',
          border: `1px solid ${theme.border.primary}`,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            background: isDarkMode ? 'rgba(255,212,28,0.05)' : 'rgba(59,130,246,0.05)',
            padding: '24px 32px',
            borderBottom: `1px solid ${theme.border.primary}`
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: theme.accent.primary,
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span>🔐</span> Change PIN
          </h3>
          <p style={{ fontSize: '14px', color: theme.text.secondary, margin: 0 }}>
            Update your 6-digit PIN for enhanced security
          </p>
        </div>

        <div style={{ padding: '32px' }}>
          {pinError && (
            <div
              style={{
                padding: '14px 20px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                color: '#EF4444',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span>⚠️</span>
              <span>{pinError}</span>
            </div>
          )}

          {pinStep === 1 && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: theme.accent.primary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Old PIN (6 digits) *
                </label>
                <input
                  type="password"
                  value={pinFormData.oldPin}
                  onChange={(e) => handlePinChange('oldPin', e.target.value)}
                  disabled={pinLoading}
                  placeholder="••••••"
                  maxLength="6"
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: `2px solid ${theme.border.primary}`,
                    borderRadius: '10px',
                    background: isDarkMode ? 'rgba(251, 251, 251, 0.05)' : 'rgba(59,130,246,0.05)',
                    color: theme.text.primary,
                    fontSize: '24px',
                    fontWeight: 700,
                    letterSpacing: '12px',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: theme.accent.primary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  New PIN (6 digits) *
                </label>
                <input
                  type="password"
                  value={pinFormData.newPin}
                  onChange={(e) => handlePinChange('newPin', e.target.value)}
                  disabled={pinLoading}
                  placeholder="••••••"
                  maxLength="6"
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: `2px solid ${theme.border.primary}`,
                    borderRadius: '10px',
                    background: isDarkMode ? 'rgba(251, 251, 251, 0.05)' : 'rgba(59,130,246,0.05)',
                    color: theme.text.primary,
                    fontSize: '24px',
                    fontWeight: 700,
                    letterSpacing: '12px',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace'
                  }}
                />
                <p style={{ fontSize: '11px', color: theme.text.tertiary, marginTop: '8px', marginBottom: 0 }}>
                  Must be different from old PIN
                </p>
              </div>

              <button
                onClick={handleSendPinOTP}
                disabled={pinLoading || pinFormData.oldPin.length !== 6 || pinFormData.newPin.length !== 6}
                style={{
                  width: '100%',
                  padding: '14px',
                  background:
                    pinLoading || pinFormData.oldPin.length !== 6 || pinFormData.newPin.length !== 6
                      ? theme.accent.primary + '40'
                      : theme.accent.primary,
                  color: theme.accent.secondary,
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor:
                    pinLoading || pinFormData.oldPin.length !== 6 || pinFormData.newPin.length !== 6
                      ? 'not-allowed'
                      : 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                {pinLoading ? (
                  <>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        border: `2px solid ${theme.accent.secondary}40`,
                        borderTopColor: theme.accent.secondary,
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }}
                    />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>📧</span>
                    <span>Send OTP to Email</span>
                  </>
                )}
              </button>
            </div>
          )}

          {pinStep === 2 && (
            <div>
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📧</div>
                <div style={{ fontSize: '14px', color: '#3B82F6', fontWeight: 600, marginBottom: '4px' }}>
                  OTP Sent Successfully!
                </div>
                <div style={{ fontSize: '12px', color: theme.text.secondary }}>
                  Check your email: {userData?.email}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: theme.accent.primary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Enter OTP (6 digits) *
                </label>
                <input
                  type="text"
                  value={pinFormData.otp}
                  onChange={(e) => handlePinChange('otp', e.target.value)}
                  disabled={pinLoading}
                  placeholder="______"
                  maxLength="6"
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: `2px solid ${theme.border.primary}`,
                    borderRadius: '10px',
                    background: isDarkMode ? 'rgba(251, 251, 251, 0.05)' : 'rgba(59,130,246,0.05)',
                    color: theme.text.primary,
                    fontSize: '24px',
                    fontWeight: 700,
                    letterSpacing: '12px',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace'
                  }}
                />
                <p style={{ fontSize: '11px', color: theme.text.tertiary, marginTop: '8px', marginBottom: 0 }}>
                  OTP expires in 10 minutes
                </p>
              </div>

              <button
                onClick={() => setShowPinConfirm(true)}
                disabled={pinLoading || pinFormData.otp.length !== 6}
                style={{
                  width: '100%',
                  padding: '14px',
                  background:
                    pinLoading || pinFormData.otp.length !== 6 ? theme.accent.primary + '40' : theme.accent.primary,
                  color: theme.accent.secondary,
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: pinLoading || pinFormData.otp.length !== 6 ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                <span>🔐</span>
                <span>Change PIN</span>
              </button>
            </div>
          )}

          {pinStep === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#22C55E', marginBottom: '8px' }}>
                PIN Changed Successfully!
              </h3>
              <p style={{ fontSize: '14px', color: theme.text.secondary, marginBottom: '24px' }}>
                Your PIN has been updated. Please use your new PIN for future logins.
              </p>
              <button
                onClick={resetPinForm}
                style={{
                  padding: '12px 24px',
                  background: theme.accent.primary,
                  color: theme.accent.secondary,
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Deactivate Account Card */}
      <div
        style={{
          background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.05)',
          borderRadius: '16px',
          border: `1px solid ${theme.border.primary}`,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '24px 32px',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#EF4444',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span>⚠️</span> Deactivate Account
          </h3>
          <p style={{ fontSize: '14px', color: theme.text.secondary, margin: 0 }}>
            Permanently deactivate your NUCash account
          </p>
        </div>

        <div style={{ padding: '32px' }}>
          {deactivateError && (
            <div
              style={{
                padding: '14px 20px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                color: '#EF4444',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span>⚠️</span>
              <span>{deactivateError}</span>
            </div>
          )}

          {deactivateStep === 1 && (
            <div>
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  marginBottom: '24px'
                }}
              >
                <p style={{ fontSize: '13px', color: theme.text.secondary, margin: 0 }}>
                  This action will deactivate your account. You won't be able to access NUCash services until your
                  account is reactivated by an administrator.
                </p>
              </div>

              <button
                onClick={handleSendDeactivateOTP}
                disabled={deactivateLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: deactivateLoading ? 'rgba(239, 68, 68, 0.5)' : '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: deactivateLoading ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                {deactivateLoading ? (
                  <>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#FFFFFF',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }}
                    />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>📧</span>
                    <span>Send OTP to Email</span>
                  </>
                )}
              </button>
            </div>
          )}

          {deactivateStep === 2 && (
            <div>
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📧</div>
                <div style={{ fontSize: '14px', color: '#3B82F6', fontWeight: 600, marginBottom: '4px' }}>
                  OTP Sent Successfully!
                </div>
                <div style={{ fontSize: '12px', color: theme.text.secondary }}>
                  Check your email: {userData?.email}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#EF4444',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Enter OTP (6 digits) *
                </label>
                <input
                  type="text"
                  value={deactivateOtp}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!/^\d*$/.test(value) || value.length > 6) return;
                    setDeactivateOtp(value);
                    setDeactivateError('');
                  }}
                  disabled={deactivateLoading}
                  placeholder="______"
                  maxLength="6"
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: `2px solid ${theme.border.primary}`,
                    borderRadius: '10px',
                    background: isDarkMode ? 'rgba(251, 251, 251, 0.05)' : 'rgba(59,130,246,0.05)',
                    color: theme.text.primary,
                    fontSize: '24px',
                    fontWeight: 700,
                    letterSpacing: '12px',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace'
                  }}
                />
                <p style={{ fontSize: '11px', color: theme.text.tertiary, marginTop: '8px', marginBottom: 0 }}>
                  OTP expires in 10 minutes
                </p>
              </div>

              <button
                onClick={() => setShowDeactivateConfirm(true)}
                disabled={deactivateLoading || deactivateOtp.length !== 6}
                style={{
                  width: '100%',
                  padding: '14px',
                  background:
                    deactivateLoading || deactivateOtp.length !== 6 ? 'rgba(239, 68, 68, 0.5)' : '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: deactivateLoading || deactivateOtp.length !== 6 ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                <span>⚠️</span>
                <span>Deactivate Account</span>
              </button>
            </div>
          )}

          {deactivateStep === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#22C55E', marginBottom: '8px' }}>
                Account Deactivated
              </h3>
              <p style={{ fontSize: '14px', color: theme.text.secondary, marginBottom: '8px' }}>
                Your account has been deactivated successfully.
              </p>
              <p style={{ fontSize: '12px', color: theme.text.tertiary }}>
                Logging out in 3 seconds...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pin Confirmation Modal */}
      {showPinConfirm && (
        <div
          onClick={() => setShowPinConfirm(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.bg.card,
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              border: `2px solid ${theme.border.primary}`,
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: theme.text.primary, marginBottom: '12px' }}>
              Confirm PIN Change
            </h3>
            <p style={{ fontSize: '14px', color: theme.text.secondary, marginBottom: '24px' }}>
              Are you sure you want to change your PIN? You will need to use the new PIN for future logins.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowPinConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: isDarkMode ? 'rgba(251, 251, 251, 0.1)' : 'rgba(59,130,246,0.1)',
                  color: theme.text.secondary,
                  border: `1px solid ${theme.border.primary}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPinConfirm(false);
                  handleChangePin();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: theme.accent.primary,
                  color: theme.accent.secondary,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateConfirm && (
        <div
          onClick={() => setShowDeactivateConfirm(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.bg.card,
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              border: '2px solid rgba(239, 68, 68, 0.5)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#EF4444', marginBottom: '12px' }}>
              Confirm Account Deactivation
            </h3>
            <p style={{ fontSize: '14px', color: theme.text.secondary, marginBottom: '24px' }}>
              Are you absolutely sure? This will deactivate your account and you'll be logged out immediately.
              You'll need to contact an administrator to reactivate your account.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: isDarkMode ? 'rgba(251, 251, 251, 0.1)' : 'rgba(59,130,246,0.1)',
                  color: theme.text.secondary,
                  border: `1px solid ${theme.border.primary}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeactivateConfirm(false);
                  handleDeactivateAccount();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Yes, Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div
        style={{
          marginBottom: '30px',
          borderBottom: `2px solid ${theme.border.primary}`,
          paddingBottom: '20px'
        }}
      >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: theme.accent.primary,
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span>👤</span> My Profile
          </h2>
          <p style={{ fontSize: '13px', color: theme.text.secondary, margin: 0 }}>
            Manage your account information and security settings
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
          <button
            onClick={() => setActiveSection('personal')}
            style={{
              padding: '12px 24px',
              background:
                activeSection === 'personal'
                  ? isDarkMode
                    ? 'rgba(255, 212, 28, 0.15)'
                    : 'rgba(59, 130, 246, 0.15)'
                  : isDarkMode
                  ? 'rgba(30, 35, 71, 0.4)'
                  : 'rgba(59,130,246,0.05)',
              border:
                activeSection === 'personal'
                  ? `2px solid ${theme.accent.primary}40`
                  : `2px solid ${theme.border.primary}`,
              borderRadius: '12px',
              color: activeSection === 'personal' ? theme.accent.primary : theme.text.secondary,
              fontSize: '14px',
              fontWeight: activeSection === 'personal' ? 700 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>📋</span>
            <span>Personal Information</span>
          </button>
          <button
            onClick={() => setActiveSection('security')}
            style={{
              padding: '12px 24px',
              background:
                activeSection === 'security'
                  ? isDarkMode
                    ? 'rgba(255, 212, 28, 0.15)'
                    : 'rgba(59, 130, 246, 0.15)'
                  : isDarkMode
                  ? 'rgba(30, 35, 71, 0.4)'
                  : 'rgba(59,130,246,0.05)',
              border:
                activeSection === 'security'
                  ? `2px solid ${theme.accent.primary}40`
                  : `2px solid ${theme.border.primary}`,
              borderRadius: '12px',
              color: activeSection === 'security' ? theme.accent.primary : theme.text.secondary,
              fontSize: '14px',
              fontWeight: activeSection === 'security' ? 700 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🔐</span>
            <span>Security Settings</span>
          </button>
        </div>

        {/* Content */}
        {profileLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '80px 20px',
              color: theme.text.secondary
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: `4px solid ${theme.accent.primary}40`,
                borderTopColor: theme.accent.primary,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}
            />
          </div>
        ) : (
          <>
          {activeSection === 'personal' && renderPersonalInfo()}
          {activeSection === 'security' && renderSecuritySettings()}
        </>
      )}
    </div>
  );
}

// Info Field Component
function InfoField({ theme, isDarkMode, label, value, highlight }) {
  const getHighlightColor = () => {
    if (highlight === 'success')
      return { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', color: '#22C55E' };
    if (highlight === 'error')
      return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', color: '#EF4444' };
    if (highlight === 'warning')
      return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', color: '#F59E0B' };
    return null;
  };

  const highlightStyle = getHighlightColor();

  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '11px',
          fontWeight: 700,
          color: theme.accent.primary + 'CC',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        {label}
      </label>
      <div
        style={{
          padding: '12px 16px',
          background: highlightStyle
            ? highlightStyle.bg
            : isDarkMode
            ? 'rgba(251,251,251,0.05)'
            : 'rgba(59,130,246,0.05)',
          border: `1px solid ${highlightStyle ? highlightStyle.border : theme.border.primary}`,
          borderRadius: '8px',
          color: highlightStyle ? highlightStyle.color : theme.text.primary,
          fontSize: '15px',
          fontWeight: highlight ? 700 : 500
        }}
      >
        {value || 'N/A'}
      </div>
    </div>
  );
}
