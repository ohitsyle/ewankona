// src/shared/components/Auth/Login.jsx
// Multi-step login component (Microsoft-style) with forgot PIN

import React, { useState } from 'react';

export default function Login({ onLogin, apiEndpoint, title = "Admin Portal" }) {
  const [step, setStep] = useState('email'); // 'email', 'pin', 'forgot-email', 'forgot-otp', 'forgot-newpin', 'forgot-confirm'
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Step 1: Email submission
  const handleEmailSubmit = () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    // Move to PIN step
    setStep('pin');
  };

  // Step 2: PIN submission and login
  const handlePinSubmit = async () => {
    setError('');

    if (!pin.trim()) {
      setError('Please enter your PIN');
      return;
    }

    // Validate PIN format
    if (!/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Attempting login:', { email, endpoint: apiEndpoint });

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, pin })
      });

      const data = await response.json();

      // Check if account requires activation
      if (data.requiresActivation) {
        console.log('⚠️  Account requires activation, redirecting...');
        // Redirect to activation page with account details (on backend server port 3000)
        const activationUrl = `http://localhost:3000/activate?accountId=${data.accountId}&accountType=${data.accountType || 'admin'}&email=${encodeURIComponent(data.email)}`;
        window.location.href = activationUrl;
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      console.log('✅ Login successful:', data);

      // Call parent callback with user data
      onLogin(data);
    } catch (err) {
      console.error('❌ Login error:', err);
      let errorMessage = 'Failed to login. Please try again.';

      if (err.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP to email
  const handleSendOtp = async () => {
    setError('');

    if (!forgotEmail.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const API_URL = apiEndpoint.replace('/login', '');
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // Move to OTP verification step
      setStep('forgot-otp');
    } catch (err) {
      console.error('❌ Send OTP error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setError('');

    if (!otpCode.trim()) {
      setError('Please enter the OTP code');
      return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      setError('OTP must be exactly 6 digits');
      return;
    }

    setLoading(true);

    try {
      const API_URL = apiEndpoint.replace('/login', '');
      const response = await fetch(`${API_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail, otp: otpCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      // Move to new PIN step
      setStep('forgot-newpin');
    } catch (err) {
      console.error('❌ Verify OTP error:', err);
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Enter new PIN
  const handleNewPin = () => {
    setError('');

    if (!newPin.trim()) {
      setError('Please enter a new PIN');
      return;
    }

    if (!/^\d{6}$/.test(newPin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    // Move to confirm PIN step
    setStep('forgot-confirm');
  };

  // Step 4: Confirm new PIN and reset
  const handleConfirmPin = async () => {
    setError('');

    if (!confirmPin.trim()) {
      setError('Please confirm your new PIN');
      return;
    }

    if (!/^\d{6}$/.test(confirmPin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setError('PINs do not match. Please try again.');
      return;
    }

    setLoading(true);

    try {
      const API_URL = apiEndpoint.replace('/login', '');
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotEmail,
          otp: otpCode,
          newPin: newPin
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset PIN');
      }

      // Show success and redirect to login
      setResetSuccess(true);
      setTimeout(() => {
        setStep('email');
        setResetSuccess(false);
        setForgotEmail('');
        setOtpCode('');
        setNewPin('');
        setConfirmPin('');
      }, 3000);
    } catch (err) {
      console.error('❌ Reset PIN error:', err);
      setError(err.message || 'Failed to reset PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter' && !loading) {
      action();
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setPin('');
    setError('');
  };

  const handleShowForgotPin = () => {
    setStep('forgot-email');
    setForgotEmail(email);
    setError('');
  };

  const handleBackToLogin = () => {
    setStep('email');
    setForgotEmail('');
    setOtpCode('');
    setNewPin('');
    setConfirmPin('');
    setError('');
    setResetSuccess(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F1227 0%, #181D40 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 35px,
          rgba(255, 212, 28, 0.02) 35px,
          rgba(255, 212, 28, 0.02) 70px
        )`,
        pointerEvents: 'none'
      }} />

      {/* Login Card */}
      <div style={{
        background: 'rgba(30, 35, 71, 0.95)',
        borderRadius: '20px',
        padding: '48px',
        width: '100%',
        maxWidth: '450px',
        border: '2px solid rgba(255, 212, 28, 0.3)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#FFD41C',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            fontWeight: 800,
            color: '#181D40',
            boxShadow: '0 0 0 6px rgba(255, 212, 28, 0.2)'
          }}>
            NU
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#FBFBFB',
            margin: '0 0 8px 0'
          }}>
            {step.startsWith('forgot') ? 'Reset PIN' : 'Sign In'}
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#FFD41C',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: 0
          }}>
            {step.startsWith('forgot') ? 'Account Recovery' : title}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '14px 20px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#EF4444',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {resetSuccess && (
          <div style={{
            padding: '14px 20px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            color: '#10B981',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textAlign: 'center'
          }}>
            <span>✅</span>
            <span>PIN reset successful! Redirecting to login...</span>
          </div>
        )}

        {/* STEP 1: Email */}
        {step === 'email' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#FFD41C',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => handleKeyPress(e, handleEmailSubmit)}
                disabled={loading}
                placeholder="user@nu-laguna.edu.ph"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid rgba(255, 212, 28, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(251, 251, 251, 0.05)',
                  color: 'rgba(251, 251, 251, 0.9)',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            </div>

            <button
              onClick={handleEmailSubmit}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: '#FFD41C',
                color: '#181D40',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 6px 20px rgba(255, 212, 28, 0.4)',
                transition: 'all 0.3s ease'
              }}
            >
              Next
            </button>

            <div style={{
              marginTop: '20px',
              textAlign: 'center'
            }}>
              <button
                onClick={handleShowForgotPin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFD41C',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '8px'
                }}
              >
                Forgot your PIN?
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PIN */}
        {step === 'pin' && (
          <div>
            {/* Show email with back button */}
            <div style={{
              marginBottom: '24px',
              padding: '12px 16px',
              background: 'rgba(255, 212, 28, 0.1)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flex: 1,
                overflow: 'hidden'
              }}>
                <span style={{
                  fontSize: '18px'
                }}>👤</span>
                <span style={{
                  color: 'rgba(251, 251, 251, 0.9)',
                  fontSize: '14px',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {email}
                </span>
              </div>
              <button
                onClick={handleBackToEmail}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFD41C',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  flexShrink: 0
                }}
              >
                Change
              </button>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#FFD41C',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                6-Digit PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => handleKeyPress(e, handlePinSubmit)}
                disabled={loading}
                placeholder="Enter your 6-digit PIN"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid rgba(255, 212, 28, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(251, 251, 251, 0.05)',
                  color: 'rgba(251, 251, 251, 0.9)',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  letterSpacing: '4px',
                  textAlign: 'center',
                  fontWeight: 700
                }}
              />
            </div>

            <button
              onClick={handlePinSubmit}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? 'rgba(255, 212, 28, 0.5)' : '#FFD41C',
                color: '#181D40',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(255, 212, 28, 0.4)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '3px solid rgba(24, 29, 64, 0.3)',
                    borderTopColor: '#181D40',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>🔐</span>
                  <span>Sign In</span>
                </>
              )}
            </button>

            <div style={{
              marginTop: '20px',
              textAlign: 'center'
            }}>
              <button
                onClick={handleShowForgotPin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFD41C',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '8px'
                }}
              >
                Forgot your PIN?
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Forgot PIN - Email */}
        {step === 'forgot-email' && (
          <div>
            <p style={{
              color: 'rgba(251, 251, 251, 0.7)',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Enter your email address and we'll send you a 6-digit OTP to reset your PIN.
            </p>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#FFD41C',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => {
                  setForgotEmail(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => handleKeyPress(e, handleSendOtp)}
                disabled={loading}
                placeholder="user@nu-laguna.edu.ph"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid rgba(255, 212, 28, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(251, 251, 251, 0.05)',
                  color: 'rgba(251, 251, 251, 0.9)',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            </div>

            <button
              onClick={handleSendOtp}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? 'rgba(255, 212, 28, 0.5)' : '#FFD41C',
                color: '#181D40',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(255, 212, 28, 0.4)',
                transition: 'all 0.3s ease',
                marginBottom: '12px'
              }}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>

            <button
              onClick={handleBackToLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: '#FFD41C',
                border: '2px solid rgba(255, 212, 28, 0.3)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease'
              }}
            >
              Back to Sign In
            </button>
          </div>
        )}

        {/* STEP 4: Forgot PIN - Verify OTP */}
        {step === 'forgot-otp' && (
          <div>
            <p style={{
              color: 'rgba(251, 251, 251, 0.7)',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              We've sent a 6-digit OTP to:
            </p>
            <p style={{
              color: '#FFD41C',
              fontSize: '15px',
              fontWeight: 600,
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              {forgotEmail}
            </p>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#FFD41C',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Enter OTP Code
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => handleKeyPress(e, handleVerifyOtp)}
                disabled={loading}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid rgba(255, 212, 28, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(251, 251, 251, 0.05)',
                  color: 'rgba(251, 251, 251, 0.9)',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  letterSpacing: '4px',
                  textAlign: 'center',
                  fontWeight: 700
                }}
              />
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? 'rgba(255, 212, 28, 0.5)' : '#FFD41C',
                color: '#181D40',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(255, 212, 28, 0.4)',
                transition: 'all 0.3s ease',
                marginBottom: '12px'
              }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              onClick={handleBackToLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: '#FFD41C',
                border: '2px solid rgba(255, 212, 28, 0.3)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease'
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* STEP 5: Forgot PIN - New PIN */}
        {step === 'forgot-newpin' && (
          <div>
            <p style={{
              color: 'rgba(251, 251, 251, 0.7)',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Enter your new 6-digit PIN
            </p>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#FFD41C',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                New PIN
              </label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => handleKeyPress(e, handleNewPin)}
                disabled={loading}
                placeholder="Enter new 6-digit PIN"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid rgba(255, 212, 28, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(251, 251, 251, 0.05)',
                  color: 'rgba(251, 251, 251, 0.9)',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  letterSpacing: '4px',
                  textAlign: 'center',
                  fontWeight: 700
                }}
              />
            </div>

            <button
              onClick={handleNewPin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: '#FFD41C',
                color: '#181D40',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 6px 20px rgba(255, 212, 28, 0.4)',
                transition: 'all 0.3s ease',
                marginBottom: '12px'
              }}
            >
              Next
            </button>

            <button
              onClick={handleBackToLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: '#FFD41C',
                border: '2px solid rgba(255, 212, 28, 0.3)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease'
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* STEP 6: Forgot PIN - Confirm PIN */}
        {step === 'forgot-confirm' && (
          <div>
            <p style={{
              color: 'rgba(251, 251, 251, 0.7)',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Confirm your new 6-digit PIN
            </p>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#FFD41C',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Confirm New PIN
              </label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => handleKeyPress(e, handleConfirmPin)}
                disabled={loading}
                placeholder="Re-enter new 6-digit PIN"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid rgba(255, 212, 28, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(251, 251, 251, 0.05)',
                  color: 'rgba(251, 251, 251, 0.9)',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  letterSpacing: '4px',
                  textAlign: 'center',
                  fontWeight: 700
                }}
              />
            </div>

            <button
              onClick={handleConfirmPin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? 'rgba(255, 212, 28, 0.5)' : '#FFD41C',
                color: '#181D40',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(255, 212, 28, 0.4)',
                transition: 'all 0.3s ease',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '3px solid rgba(24, 29, 64, 0.3)',
                    borderTopColor: '#181D40',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span>Resetting PIN...</span>
                </>
              ) : (
                <>
                  <span>✅</span>
                  <span>Reset PIN</span>
                </>
              )}
            </button>

            <button
              onClick={handleBackToLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: '#FFD41C',
                border: '2px solid rgba(255, 212, 28, 0.3)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease'
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 212, 28, 0.2)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '12px',
            color: 'rgba(251, 251, 251, 0.5)',
            margin: 0
          }}>
            © 2024 National University Laguna | NUCash System
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
