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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F1227] to-[#181D40] relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 35px,
            rgba(255, 212, 28, 0.02) 35px,
            rgba(255, 212, 28, 0.02) 70px
          )`
        }}
      />

      {/* Login Card */}
      <div className="bg-[rgba(30,35,71,0.95)] rounded-[20px] p-12 w-full max-w-[450px] border-2 border-[rgba(255,212,28,0.3)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-[#FFD41C] rounded-[20px] flex items-center justify-center text-4xl font-extrabold text-[#181D40] shadow-[0_0_0_6px_rgba(255,212,28,0.2)]">
            NU
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-[#FBFBFB] mb-2">
            {step.startsWith('forgot') ? 'Reset PIN' : 'Sign In'}
          </h1>
          <p className="text-sm text-[#FFD41C] font-semibold uppercase tracking-wider">
            {step.startsWith('forgot') ? 'Account Recovery' : title}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-5 py-3.5 bg-[rgba(239,68,68,0.15)] border-2 border-[rgba(239,68,68,0.3)] rounded-xl text-[#EF4444] text-sm font-semibold mb-6 flex items-center gap-2.5">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {resetSuccess && (
          <div className="px-5 py-3.5 bg-[rgba(16,185,129,0.15)] border-2 border-[rgba(16,185,129,0.3)] rounded-xl text-[#10B981] text-sm font-semibold mb-6 flex items-center gap-2.5 text-center">
            <span>✅</span>
            <span>PIN reset successful! Redirecting to login...</span>
          </div>
        )}

        {/* STEP 1: Email */}
        {step === 'email' && (
          <div>
            <div className="mb-7">
              <label className="block mb-2 text-xs font-bold text-[#FFD41C] uppercase tracking-wide">
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
                className="w-full px-4 py-3.5 border-2 border-[rgba(255,212,28,0.3)] rounded-[10px] bg-[rgba(251,251,251,0.05)] text-[rgba(251,251,251,0.9)] text-[15px] transition-all duration-300 outline-none focus:border-[rgba(255,212,28,0.6)] hover:border-[rgba(255,212,28,0.5)]"
              />
            </div>

            <button
              onClick={handleEmailSubmit}
              disabled={loading}
              className="w-full px-4 py-4 bg-[#FFD41C] text-[#181D40] border-none rounded-[10px] text-base font-bold cursor-pointer uppercase tracking-wider shadow-[0_6px_20px_rgba(255,212,28,0.4)] transition-all duration-300 hover:shadow-[0_8px_25px_rgba(255,212,28,0.5)] hover:transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>

            <div className="mt-5 text-center">
              <button
                onClick={handleShowForgotPin}
                className="bg-transparent border-none text-[#FFD41C] text-[13px] font-semibold cursor-pointer underline p-2 hover:text-[#ffd700] transition-colors"
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
            <div className="mb-6 px-4 py-3 bg-[rgba(255,212,28,0.1)] rounded-[10px] flex items-center justify-between">
              <div className="flex items-center gap-2.5 flex-1 overflow-hidden">
                <span className="text-lg">👤</span>
                <span className="text-[rgba(251,251,251,0.9)] text-sm font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
                  {email}
                </span>
              </div>
              <button
                onClick={handleBackToEmail}
                className="bg-transparent border-none text-[#FFD41C] text-xs font-bold cursor-pointer px-2 py-1 uppercase tracking-wide flex-shrink-0 hover:text-[#ffd700] transition-colors"
              >
                Change
              </button>
            </div>

            <div className="mb-7">
              <label className="block mb-2 text-xs font-bold text-[#FFD41C] uppercase tracking-wide">
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
                className="w-full px-4 py-3.5 border-2 border-[rgba(255,212,28,0.3)] rounded-[10px] bg-[rgba(251,251,251,0.05)] text-[rgba(251,251,251,0.9)] text-[15px] transition-all duration-300 outline-none tracking-[4px] text-center font-bold focus:border-[rgba(255,212,28,0.6)] hover:border-[rgba(255,212,28,0.5)]"
              />
            </div>

            <button
              onClick={handlePinSubmit}
              disabled={loading}
              className={`w-full px-4 py-4 ${loading ? 'bg-[rgba(255,212,28,0.5)]' : 'bg-[#FFD41C]'} text-[#181D40] border-none rounded-[10px] text-base font-bold ${loading ? 'cursor-not-allowed' : 'cursor-pointer'} uppercase tracking-wider ${loading ? '' : 'shadow-[0_6px_20px_rgba(255,212,28,0.4)] hover:shadow-[0_8px_25px_rgba(255,212,28,0.5)] hover:transform hover:scale-[1.02]'} transition-all duration-300 flex items-center justify-center gap-2.5`}
            >
              {loading ? (
                <>
                  <div className="w-[18px] h-[18px] border-[3px] border-[rgba(24,29,64,0.3)] border-t-[#181D40] rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>🔐</span>
                  <span>Sign In</span>
                </>
              )}
            </button>

            <div className="mt-5 text-center">
              <button
                onClick={handleShowForgotPin}
                className="bg-transparent border-none text-[#FFD41C] text-[13px] font-semibold cursor-pointer underline p-2 hover:text-[#ffd700] transition-colors"
              >
                Forgot your PIN?
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Forgot PIN - Email */}
        {step === 'forgot-email' && (
          <div>
            <p className="text-[rgba(251,251,251,0.7)] text-sm leading-relaxed mb-6 text-center">
              Enter your email address and we'll send you a 6-digit OTP to reset your PIN.
            </p>

            <div className="mb-7">
              <label className="block mb-2 text-xs font-bold text-[#FFD41C] uppercase tracking-wide">
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
                className="w-full px-4 py-3.5 border-2 border-[rgba(255,212,28,0.3)] rounded-[10px] bg-[rgba(251,251,251,0.05)] text-[rgba(251,251,251,0.9)] text-[15px] transition-all duration-300 outline-none focus:border-[rgba(255,212,28,0.6)] hover:border-[rgba(255,212,28,0.5)]"
              />
            </div>

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className={`w-full px-4 py-4 ${loading ? 'bg-[rgba(255,212,28,0.5)]' : 'bg-[#FFD41C]'} text-[#181D40] border-none rounded-[10px] text-base font-bold ${loading ? 'cursor-not-allowed' : 'cursor-pointer'} uppercase tracking-wider ${loading ? '' : 'shadow-[0_6px_20px_rgba(255,212,28,0.4)] hover:shadow-[0_8px_25px_rgba(255,212,28,0.5)] hover:transform hover:scale-[1.02]'} transition-all duration-300 mb-3`}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>

            <button
              onClick={handleBackToLogin}
              disabled={loading}
              className="w-full px-4 py-3.5 bg-transparent text-[#FFD41C] border-2 border-[rgba(255,212,28,0.3)] rounded-[10px] text-sm font-semibold cursor-pointer uppercase tracking-wide transition-all duration-300 hover:bg-[rgba(255,212,28,0.1)] hover:border-[rgba(255,212,28,0.5)]"
            >
              Back to Sign In
            </button>
          </div>
        )}

        {/* STEP 4: Forgot PIN - Verify OTP */}
        {step === 'forgot-otp' && (
          <div>
            <p className="text-[rgba(251,251,251,0.7)] text-sm leading-relaxed mb-2 text-center">
              We've sent a 6-digit OTP to:
            </p>
            <p className="text-[#FFD41C] text-[15px] font-semibold mb-6 text-center">
              {forgotEmail}
            </p>

            <div className="mb-7">
              <label className="block mb-2 text-xs font-bold text-[#FFD41C] uppercase tracking-wide">
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
                className="w-full px-4 py-3.5 border-2 border-[rgba(255,212,28,0.3)] rounded-[10px] bg-[rgba(251,251,251,0.05)] text-[rgba(251,251,251,0.9)] text-[15px] transition-all duration-300 outline-none tracking-[4px] text-center font-bold focus:border-[rgba(255,212,28,0.6)] hover:border-[rgba(255,212,28,0.5)]"
              />
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className={`w-full px-4 py-4 ${loading ? 'bg-[rgba(255,212,28,0.5)]' : 'bg-[#FFD41C]'} text-[#181D40] border-none rounded-[10px] text-base font-bold ${loading ? 'cursor-not-allowed' : 'cursor-pointer'} uppercase tracking-wider ${loading ? '' : 'shadow-[0_6px_20px_rgba(255,212,28,0.4)] hover:shadow-[0_8px_25px_rgba(255,212,28,0.5)] hover:transform hover:scale-[1.02]'} transition-all duration-300 mb-3`}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              onClick={handleBackToLogin}
              disabled={loading}
              className="w-full px-4 py-3.5 bg-transparent text-[#FFD41C] border-2 border-[rgba(255,212,28,0.3)] rounded-[10px] text-sm font-semibold cursor-pointer uppercase tracking-wide transition-all duration-300 hover:bg-[rgba(255,212,28,0.1)] hover:border-[rgba(255,212,28,0.5)]"
            >
              Cancel
            </button>
          </div>
        )}

        {/* STEP 5: Forgot PIN - New PIN */}
        {step === 'forgot-newpin' && (
          <div>
            <p className="text-[rgba(251,251,251,0.7)] text-sm leading-relaxed mb-6 text-center">
              Enter your new 6-digit PIN
            </p>

            <div className="mb-7">
              <label className="block mb-2 text-xs font-bold text-[#FFD41C] uppercase tracking-wide">
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
                className="w-full px-4 py-3.5 border-2 border-[rgba(255,212,28,0.3)] rounded-[10px] bg-[rgba(251,251,251,0.05)] text-[rgba(251,251,251,0.9)] text-[15px] transition-all duration-300 outline-none tracking-[4px] text-center font-bold focus:border-[rgba(255,212,28,0.6)] hover:border-[rgba(255,212,28,0.5)]"
              />
            </div>

            <button
              onClick={handleNewPin}
              disabled={loading}
              className="w-full px-4 py-4 bg-[#FFD41C] text-[#181D40] border-none rounded-[10px] text-base font-bold cursor-pointer uppercase tracking-wider shadow-[0_6px_20px_rgba(255,212,28,0.4)] transition-all duration-300 mb-3 hover:shadow-[0_8px_25px_rgba(255,212,28,0.5)] hover:transform hover:scale-[1.02]"
            >
              Next
            </button>

            <button
              onClick={handleBackToLogin}
              disabled={loading}
              className="w-full px-4 py-3.5 bg-transparent text-[#FFD41C] border-2 border-[rgba(255,212,28,0.3)] rounded-[10px] text-sm font-semibold cursor-pointer uppercase tracking-wide transition-all duration-300 hover:bg-[rgba(255,212,28,0.1)] hover:border-[rgba(255,212,28,0.5)]"
            >
              Cancel
            </button>
          </div>
        )}

        {/* STEP 6: Forgot PIN - Confirm PIN */}
        {step === 'forgot-confirm' && (
          <div>
            <p className="text-[rgba(251,251,251,0.7)] text-sm leading-relaxed mb-6 text-center">
              Confirm your new 6-digit PIN
            </p>

            <div className="mb-7">
              <label className="block mb-2 text-xs font-bold text-[#FFD41C] uppercase tracking-wide">
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
                className="w-full px-4 py-3.5 border-2 border-[rgba(255,212,28,0.3)] rounded-[10px] bg-[rgba(251,251,251,0.05)] text-[rgba(251,251,251,0.9)] text-[15px] transition-all duration-300 outline-none tracking-[4px] text-center font-bold focus:border-[rgba(255,212,28,0.6)] hover:border-[rgba(255,212,28,0.5)]"
              />
            </div>

            <button
              onClick={handleConfirmPin}
              disabled={loading}
              className={`w-full px-4 py-4 ${loading ? 'bg-[rgba(255,212,28,0.5)]' : 'bg-[#FFD41C]'} text-[#181D40] border-none rounded-[10px] text-base font-bold ${loading ? 'cursor-not-allowed' : 'cursor-pointer'} uppercase tracking-wider ${loading ? '' : 'shadow-[0_6px_20px_rgba(255,212,28,0.4)] hover:shadow-[0_8px_25px_rgba(255,212,28,0.5)] hover:transform hover:scale-[1.02]'} transition-all duration-300 mb-3 flex items-center justify-center gap-2.5`}
            >
              {loading ? (
                <>
                  <div className="w-[18px] h-[18px] border-[3px] border-[rgba(24,29,64,0.3)] border-t-[#181D40] rounded-full animate-spin" />
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
              className="w-full px-4 py-3.5 bg-transparent text-[#FFD41C] border-2 border-[rgba(255,212,28,0.3)] rounded-[10px] text-sm font-semibold cursor-pointer uppercase tracking-wide transition-all duration-300 hover:bg-[rgba(255,212,28,0.1)] hover:border-[rgba(255,212,28,0.5)]"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[rgba(255,212,28,0.2)] text-center">
          <p className="text-xs text-[rgba(251,251,251,0.5)] m-0">
            © 2024 National University Laguna | NUCash System
          </p>
        </div>
      </div>
    </div>
  );
}
