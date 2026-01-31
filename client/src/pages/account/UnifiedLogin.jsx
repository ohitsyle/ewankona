import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const { loginUser, isLoggedin } = useContext(AppContext);
  const [step, setStep] = useState('email'); // 'email', 'pin', 'forgot-email', 'forgot-otp', 'forgot-newpin', 'forgot-confirm'
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectedRole, setDetectedRole] = useState(null); // 'admin', 'merchant', 'user'
  const [pendingRedirect, setPendingRedirect] = useState(null);
  const loginAttemptRef = useRef(false);

  // Forgot PIN states
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Navigate when authentication state updates
  useEffect(() => {
    if (isLoggedin && pendingRedirect && loginAttemptRef.current) {
      console.log('✅ Authentication state confirmed, navigating to:', pendingRedirect);
      navigate(pendingRedirect, { replace: true });
      setPendingRedirect(null);
      loginAttemptRef.current = false;
    }
  }, [isLoggedin, pendingRedirect, navigate]);

  // Detect role based on email domain/pattern
  const detectRole = (emailAddress) => {
    const lowerEmail = emailAddress.toLowerCase();

    // Admin patterns (includes motorpool, merchant, treasury, accounting, sysad admins)
    if (lowerEmail.includes('motorpool') ||
        lowerEmail.includes('treasury') ||
        lowerEmail.includes('accounting') ||
        lowerEmail.includes('admin') ||
        lowerEmail.includes('sysad') ||
        lowerEmail.includes('merchant') ||
        lowerEmail.includes('cafeteria') ||
        lowerEmail.includes('bookstore') ||
        lowerEmail.includes('printshop')) {
      return 'admin';
    }

    // Default to user (students)
    return 'user';
  };

  const getRoleConfig = (role) => {
    const configs = {
      admin: {
        endpoint: 'http://localhost:3000/api/login',
        checkEndpoint: 'http://localhost:3000/api/login/check-email',
        tokenKey: 'adminToken',
        dataKey: 'adminData',
        title: 'Admin Portal',
        redirectPath: '/admin/motorpool',
        color: '#FFD41C',
        icon: '👨‍💼'
      },
      merchant: {
        endpoint: 'http://localhost:3000/api/merchant/auth/login',
        checkEndpoint: 'http://localhost:3000/api/merchant/auth/check-email',
        tokenKey: 'merchantToken',
        dataKey: 'merchantData',
        title: 'Merchant Portal',
        redirectPath: '/admin/merchant',
        color: '#22C55E',
        icon: '🏪'
      },
      user: {
        endpoint: 'http://localhost:3000/api/login',
        checkEndpoint: 'http://localhost:3000/api/login/check-email',
        tokenKey: 'userToken',
        dataKey: 'userData',
        title: 'Student Portal',
        redirectPath: '/user/dashboard',
        color: '#3B82F6',
        icon: '🎓'
      }
    };
    return configs[role];
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setError('');

    // Detect role and proceed directly to PIN step
    const role = detectRole(email);
    setDetectedRole(role);
    setStep('pin');
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();

    if (!pin) {
      setError('Please enter your PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const config = getRoleConfig(detectedRole);
      console.log('🔐 Attempting login:', { email, role: detectedRole, endpoint: config.endpoint });

      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: email, password: pin })
      });

      const data = await response.json();
      console.log('📦 Server response data:', data);

      // Check if account requires activation (isActive: false) - this returns 403 status
      if (response.status === 403 && data.requiresActivation) {
        console.log('⚠️  Account requires activation, redirecting...');

        // Ensure accountId exists before redirecting
        if (!data.accountId) {
          console.error('❌ Missing accountId in activation response:', data);
          throw new Error('Server error: Missing account ID for activation');
        }

        const activationUrl = `/activate?accountId=${data.accountId}&accountType=${data.accountType || detectedRole}&email=${encodeURIComponent(data.email || email)}&fullName=${encodeURIComponent(data.fullName || '')}`;
        console.log('🔗 Activation URL:', activationUrl);
        navigate(activationUrl);
        return;
      }

      // Check for other errors
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      console.log('✅ Login successful:', data);

      // Validate required fields
      if (!data.token) {
        throw new Error('Server error: Missing authentication token');
      }

      // Check if the response contains an admin role (motorpool, merchant, treasury, accounting, sysad, etc.)
      // This overrides the email-based detection
      const isAdminResponse = data.role && ['motorpool', 'merchant', 'treasury', 'accounting', 'sysad', 'cafeteria', 'bookstore', 'printshop'].includes(data.role);
      const actualRole = isAdminResponse ? 'admin' : detectedRole;

      // Get the correct config based on actual role
      const actualConfig = actualRole === 'admin' ? getRoleConfig('admin') : config;

      console.log('🔍 Role detection:', {
        detectedRole,
        serverRole: data.role,
        isAdminResponse,
        actualRole,
        willUseConfig: actualConfig.tokenKey
      });

      // The server returns user data at the root level for all roles
      // Extract only the relevant user information (excluding the token)
      const { token, ...userDataWithoutToken } = data;
      const userData = userDataWithoutToken;

      // Validate userData before storing
      if (!userData || typeof userData !== 'object' || Object.keys(userData).length === 0) {
        console.error('❌ Invalid user data received from server:', data);
        throw new Error('Server error: Invalid user data received');
      }

      console.log('💾 Storing user data via AppContext:', { tokenKey: actualConfig.tokenKey, dataKey: actualConfig.dataKey, userData });

      // Use AppContext's loginUser to properly set authentication state
      const isAdmin = actualRole === 'admin';
      loginUser(userData, data.token, isAdmin);

      console.log('✅ Authentication state updated via AppContext');

      // Mark that we're attempting a login (for useEffect to know this is intentional)
      loginAttemptRef.current = true;

      // Determine redirect URL
      let redirectUrl;
      if (actualRole === 'admin') {
        if (!data.role) {
          console.error('❌ Missing role in admin response:', data);
          throw new Error('Server error: Admin role not provided');
        }

        // All admin modules now use consistent /admin/{role} URL pattern
        if (data.role === 'treasury') {
          redirectUrl = '/admin/treasury/dashboard';
        } else if (data.role === 'accounting') {
          redirectUrl = '/admin/accounting/home';
        } else if (data.role === 'sysad') {
          redirectUrl = '/admin/sysad/dashboard';
        } else {
          redirectUrl = `/admin/${data.role}`;
        }
      } else {
        redirectUrl = actualConfig.redirectPath;
      }

      console.log('🔀 Setting pending redirect to:', redirectUrl);
      setPendingRedirect(redirectUrl);
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Invalid PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setPin('');
    setError('');
    setDetectedRole(null);
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const config = getRoleConfig(detectedRole);
      const response = await fetch(`${config.endpoint.replace('/login', '/forgot-password')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      console.log('✅ OTP sent to email');
      setStep('forgot-otp');
    } catch (err) {
      console.error('❌ Forgot password error:', err);
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const config = getRoleConfig(detectedRole);
      const response = await fetch(`${config.endpoint.replace('/login', '/verify-otp')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      console.log('✅ OTP verified');
      setStep('forgot-newpin');
    } catch (err) {
      console.error('❌ OTP verification error:', err);
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (e) => {
    e.preventDefault();

    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (!/^\d{6}$/.test(newPin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const config = getRoleConfig(detectedRole);
      const response = await fetch(`${config.endpoint.replace('/login', '/reset-password')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp, newPassword: newPin })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset PIN');
      }

      console.log('✅ PIN reset successful');
      // Reset to login screen
      setStep('email');
      setEmail('');
      setPin('');
      setForgotEmail('');
      setOtp('');
      setNewPin('');
      setConfirmPin('');
      setError('');
      alert('PIN reset successful! Please login with your new PIN.');
    } catch (err) {
      console.error('❌ Reset PIN error:', err);
      setError(err.message || 'Failed to reset PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (step === 'email') {
        handleEmailSubmit(e);
      } else if (step === 'pin') {
        handlePinSubmit(e);
      } else if (step === 'forgot-email') {
        handleForgotPasswordRequest(e);
      } else if (step === 'forgot-otp') {
        handleVerifyOTP(e);
      } else if (step === 'forgot-newpin') {
        handleResetPin(e);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F1227] to-[#181D40] relative overflow-hidden">
      {/* Enhanced Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#FFD41C] opacity-5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#FFD41C] opacity-5 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFD41C] opacity-3 rounded-full blur-3xl animate-pulse-slow" />

        {/* Floating particles */}
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-[#FFD41C] opacity-30 rounded-full animate-particle-1" />
        <div className="absolute top-40 right-1/3 w-3 h-3 bg-[#FFD41C] opacity-20 rounded-full animate-particle-2" />
        <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-[#FFD41C] opacity-25 rounded-full animate-particle-3" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-[#FFD41C] opacity-40 rounded-full animate-particle-4" />

        {/* Gradient lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[rgba(255,212,28,0.1)] to-transparent animate-shimmer-slow" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-[rgba(255,212,28,0.1)] to-transparent animate-shimmer-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Login Card - Enhanced with animations */}
      <div className="relative z-10 bg-[rgba(30,35,71,0.95)] rounded-[20px] p-12 w-full max-w-[450px] border-2 border-[rgba(255,212,28,0.3)] backdrop-blur-sm shadow-2xl animate-slideUp">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#FFD41C] rounded-full mb-6 shadow-lg shadow-[rgba(255,212,28,0.4)]">
            <span className="text-5xl font-extrabold text-[#181D40]">NU</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#FBFBFB] mb-2 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-[rgba(251,251,251,0.6)] text-sm">
            Sign in to access your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-[rgba(239,68,68,0.15)] border-l-4 border-[#EF4444] rounded text-[#EF4444] text-sm flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Email */}
        {step === 'email' && (
          <div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-[rgba(251,251,251,0.9)] mb-3 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-5 py-4 bg-[rgba(251,251,251,0.08)] border-2 border-[rgba(255,212,28,0.3)] rounded-xl text-[#FBFBFB] text-lg placeholder-[rgba(251,251,251,0.4)] focus:outline-none focus:border-[#FFD41C] focus:bg-[rgba(251,251,251,0.12)] transition-all"
                placeholder="you@nu.edu.ph"
                autoFocus
              />
            </div>

            <button
              onClick={handleEmailSubmit}
              disabled={loading}
              className="w-full bg-[#FFD41C] text-[#181D40] py-4 rounded-xl font-bold text-base uppercase tracking-wider hover:bg-[#FFC700] transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-2xl hover:shadow-[rgba(255,212,28,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  Verifying...
                </span>
              ) : (
                'Continue →'
              )}
            </button>
          </div>
        )}

        {/* Step 2: PIN */}
        {step === 'pin' && (
          <div>
            <button
              onClick={handleBack}
              className="mb-6 text-sm text-[#FFD41C] hover:text-[#FFC700] flex items-center gap-2 font-semibold transition-colors"
            >
              ← Change Email
            </button>

            <div className="mb-6 p-4 bg-[rgba(255,212,28,0.1)] border border-[rgba(255,212,28,0.3)] rounded-xl">
              <p className="text-xs text-[rgba(251,251,251,0.6)] uppercase tracking-wide mb-1">
                Signing in as
              </p>
              <p className="text-base text-[#FBFBFB] font-semibold">
                {email}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-[rgba(251,251,251,0.9)] mb-3 uppercase tracking-wide">
                Enter PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numeric input
                  if (value === '' || /^\d+$/.test(value)) {
                    setPin(value);
                  }
                }}
                onKeyPress={handleKeyPress}
                className="w-full px-5 py-4 bg-[rgba(251,251,251,0.08)] border-2 border-[rgba(255,212,28,0.3)] rounded-xl text-[#FBFBFB] text-2xl tracking-widest text-center placeholder-[rgba(251,251,251,0.4)] focus:outline-none focus:border-[#FFD41C] focus:bg-[rgba(251,251,251,0.12)] transition-all"
                placeholder="• • • • • •"
                autoFocus
                maxLength={6}
                inputMode="numeric"
              />
            </div>

            <button
              onClick={handlePinSubmit}
              disabled={loading}
              className="w-full bg-[#FFD41C] text-[#181D40] py-4 rounded-xl font-bold text-base uppercase tracking-wider hover:bg-[#FFC700] transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-2xl hover:shadow-[rgba(255,212,28,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            <button
              onClick={() => {
                setForgotEmail(email);
                setStep('forgot-email');
              }}
              className="w-full mt-6 text-sm text-[rgba(251,251,251,0.6)] hover:text-[#FFD41C] transition-colors font-medium"
            >
              Forgot your PIN?
            </button>
          </div>
        )}

        {/* Step 3: Forgot Password - Email Confirmation */}
        {step === 'forgot-email' && (
          <div>
            <button
              onClick={() => {
                setStep('pin');
                setForgotEmail('');
              }}
              className="mb-6 text-sm text-[#FFD41C] hover:text-[#FFC700] flex items-center gap-2 font-semibold transition-colors"
            >
              ← Back to Login
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#FBFBFB] mb-2">Forgot Your PIN?</h2>
              <p className="text-sm text-[rgba(251,251,251,0.6)]">
                We'll send a verification code to your email
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-[rgba(251,251,251,0.9)] mb-3 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-5 py-4 bg-[rgba(251,251,251,0.08)] border-2 border-[rgba(255,212,28,0.3)] rounded-xl text-[#FBFBFB] text-lg placeholder-[rgba(251,251,251,0.4)] focus:outline-none focus:border-[#FFD41C] focus:bg-[rgba(251,251,251,0.12)] transition-all"
                placeholder="you@nu.edu.ph"
                autoFocus
              />
            </div>

            <button
              onClick={handleForgotPasswordRequest}
              disabled={loading}
              className="w-full bg-[#FFD41C] text-[#181D40] py-4 rounded-xl font-bold text-base uppercase tracking-wider hover:bg-[#FFC700] transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-2xl hover:shadow-[rgba(255,212,28,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  Sending...
                </span>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </div>
        )}

        {/* Step 4: Forgot Password - OTP Verification */}
        {step === 'forgot-otp' && (
          <div>
            <button
              onClick={() => setStep('forgot-email')}
              className="mb-6 text-sm text-[#FFD41C] hover:text-[#FFC700] flex items-center gap-2 font-semibold transition-colors"
            >
              ← Back
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#FBFBFB] mb-2">Enter Verification Code</h2>
              <p className="text-sm text-[rgba(251,251,251,0.6)]">
                Check your email for the 6-digit code
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-[rgba(251,251,251,0.9)] mb-3 uppercase tracking-wide">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-5 py-4 bg-[rgba(251,251,251,0.08)] border-2 border-[rgba(255,212,28,0.3)] rounded-xl text-[#FBFBFB] text-2xl tracking-widest text-center placeholder-[rgba(251,251,251,0.4)] focus:outline-none focus:border-[#FFD41C] focus:bg-[rgba(251,251,251,0.12)] transition-all"
                placeholder="• • • • • •"
                autoFocus
                maxLength={6}
                inputMode="numeric"
              />
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              className="w-full bg-[#FFD41C] text-[#181D40] py-4 rounded-xl font-bold text-base uppercase tracking-wider hover:bg-[#FFC700] transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-2xl hover:shadow-[rgba(255,212,28,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  Verifying...
                </span>
              ) : (
                'Verify Code'
              )}
            </button>
          </div>
        )}

        {/* Step 5: Forgot Password - New PIN */}
        {step === 'forgot-newpin' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#FBFBFB] mb-2">Create New PIN</h2>
              <p className="text-sm text-[rgba(251,251,251,0.6)]">
                Enter a new 6-digit PIN
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-[rgba(251,251,251,0.9)] mb-3 uppercase tracking-wide">
                New PIN
              </label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numeric input
                  if (value === '' || /^\d+$/.test(value)) {
                    setNewPin(value);
                  }
                }}
                onKeyPress={handleKeyPress}
                className="w-full px-5 py-4 bg-[rgba(251,251,251,0.08)] border-2 border-[rgba(255,212,28,0.3)] rounded-xl text-[#FBFBFB] text-2xl tracking-widest text-center placeholder-[rgba(251,251,251,0.4)] focus:outline-none focus:border-[#FFD41C] focus:bg-[rgba(251,251,251,0.12)] transition-all"
                placeholder="• • • • • •"
                autoFocus
                maxLength={6}
                inputMode="numeric"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-[rgba(251,251,251,0.9)] mb-3 uppercase tracking-wide">
                Confirm PIN
              </label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numeric input
                  if (value === '' || /^\d+$/.test(value)) {
                    setConfirmPin(value);
                  }
                }}
                onKeyPress={handleKeyPress}
                className="w-full px-5 py-4 bg-[rgba(251,251,251,0.08)] border-2 border-[rgba(255,212,28,0.3)] rounded-xl text-[#FBFBFB] text-2xl tracking-widest text-center placeholder-[rgba(251,251,251,0.4)] focus:outline-none focus:border-[#FFD41C] focus:bg-[rgba(251,251,251,0.12)] transition-all"
                placeholder="• • • • • •"
                maxLength={6}
                inputMode="numeric"
              />
            </div>

            <button
              onClick={handleResetPin}
              disabled={loading}
              className="w-full bg-[#FFD41C] text-[#181D40] py-4 rounded-xl font-bold text-base uppercase tracking-wider hover:bg-[#FFC700] transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-2xl hover:shadow-[rgba(255,212,28,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  Resetting...
                </span>
              ) : (
                'Reset PIN'
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[rgba(255,212,28,0.2)] text-center">
          <p className="text-xs text-[rgba(251,251,251,0.4)]">
            © 2026 National University Laguna
          </p>
        </div>
      </div>

      {/* Enhanced Animations */}
      <style>{`
        /* Floating orb animations */
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
          }
          33% {
            transform: translateY(-30px) translateX(20px) scale(1.1);
          }
          66% {
            transform: translateY(-15px) translateX(-15px) scale(0.9);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
          }
          33% {
            transform: translateY(25px) translateX(-25px) scale(0.9);
          }
          66% {
            transform: translateY(-20px) translateX(15px) scale(1.1);
          }
        }

        .animate-float {
          animation: float 20s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 25s ease-in-out infinite;
        }

        /* Slow pulse for background */
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.03;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.05;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        /* Particle animations */
        @keyframes particle-1 {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-100px) translateX(50px);
            opacity: 0.6;
          }
        }

        @keyframes particle-2 {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translateY(80px) translateX(-60px) scale(1.5);
            opacity: 0.5;
          }
        }

        @keyframes particle-3 {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.25;
          }
          50% {
            transform: translateY(-120px) translateX(-40px);
            opacity: 0.5;
          }
        }

        @keyframes particle-4 {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translateY(60px) translateX(80px) scale(2);
            opacity: 0.7;
          }
        }

        .animate-particle-1 {
          animation: particle-1 15s ease-in-out infinite;
        }

        .animate-particle-2 {
          animation: particle-2 12s ease-in-out infinite;
        }

        .animate-particle-3 {
          animation: particle-3 18s ease-in-out infinite;
        }

        .animate-particle-4 {
          animation: particle-4 10s ease-in-out infinite;
        }

        /* Shimmer effect for gradient lines */
        @keyframes shimmer-slow {
          0% {
            opacity: 0.05;
          }
          50% {
            opacity: 0.15;
          }
          100% {
            opacity: 0.05;
          }
        }

        .animate-shimmer-slow {
          animation: shimmer-slow 6s ease-in-out infinite;
        }

        /* Slide up animation for login card */
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Enhanced input focus glow */
        input:focus {
          box-shadow: 0 0 0 3px rgba(255, 212, 28, 0.1),
                      0 0 20px rgba(255, 212, 28, 0.15);
        }

        /* Button hover glow */
        button:hover:not(:disabled) {
          box-shadow: 0 8px 30px rgba(255, 212, 28, 0.4),
                      0 0 40px rgba(255, 212, 28, 0.2);
        }

        /* Smooth step transitions */
        .step-transition {
          animation: fadeInStep 0.4s ease-out;
        }

        @keyframes fadeInStep {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
