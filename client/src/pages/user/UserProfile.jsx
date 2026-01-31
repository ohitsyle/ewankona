// src/pages/user/UserProfile.jsx
// User Profile Page with Profile and Security tabs
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { User, Shield, Eye, EyeOff, AlertTriangle, CheckCircle, X } from 'lucide-react';

export default function UserProfile() {
  const { theme, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // PIN change state
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [changingPin, setChangingPin] = useState(false);

  // Deactivation state
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateStep, setDeactivateStep] = useState(1); // 1: reason, 2: OTP verification
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Get from localStorage first
      const storedData = localStorage.getItem('userData');
      if (storedData && storedData !== 'undefined' && storedData !== 'null') {
        const parsed = JSON.parse(storedData);
        setUserData(parsed);
        setProfileForm({
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          email: parsed.email || '',
          phone: parsed.phone || ''
        });
      }

      // Then fetch fresh data from API
      const data = await api.get('/user/profile');
      if (data) {
        setUserData(data);
        setProfileForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const data = await api.put('/user/profile', profileForm);
      if (data?.success) {
        toast.success('Profile updated successfully!');
        // Update localStorage
        const updated = { ...userData, ...profileForm };
        localStorage.setItem('userData', JSON.stringify(updated));
        setUserData(updated);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePin = async () => {
    // Validation
    if (!pinForm.currentPin || !pinForm.newPin || !pinForm.confirmPin) {
      toast.error('Please fill in all PIN fields');
      return;
    }

    if (pinForm.newPin.length !== 6 || !/^\d+$/.test(pinForm.newPin)) {
      toast.error('PIN must be exactly 6 digits');
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      toast.error('New PINs do not match');
      return;
    }

    setChangingPin(true);
    try {
      const data = await api.post('/user/change-pin', {
        currentPin: pinForm.currentPin,
        newPin: pinForm.newPin
      });

      if (data?.success) {
        toast.success('PIN changed successfully!');
        setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to change PIN');
    } finally {
      setChangingPin(false);
    }
  };

  const handleSendDeactivationOtp = async () => {
    if (!deactivateReason.trim()) {
      toast.error('Please provide a reason for deactivation');
      return;
    }

    setSendingOtp(true);
    try {
      const data = await api.post('/user/send-deactivation-otp', {
        reason: deactivateReason.trim()
      });

      if (data?.success) {
        toast.success('Verification code sent to your email');
        setDeactivateStep(2);
        setOtpSent(true);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setDeactivating(true);
    try {
      const data = await api.post('/user/request-deactivation', {
        reason: deactivateReason.trim(),
        otp: otpCode
      });

      if (data?.success) {
        toast.success('Deactivation request submitted. You will be notified via email.');
        setShowDeactivateModal(false);
        setDeactivateReason('');
        setOtpCode('');
        setDeactivateStep(1);
        setOtpSent(false);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit deactivation request');
    } finally {
      setDeactivating(false);
    }
  };

  const handleCloseDeactivateModal = () => {
    if (!deactivating && !sendingOtp) {
      setShowDeactivateModal(false);
      setDeactivateReason('');
      setOtpCode('');
      setDeactivateStep(1);
      setOtpSent(false);
    }
  };

  if (loading) {
    return (
      <div style={{ color: theme.accent.primary }} className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: `${theme.accent.primary} transparent transparent transparent` }} />
        Loading profile...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)' }} className="mb-6 border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>👤</span> Manage Profile
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          Update your personal information and security settings
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'profile' ? theme.accent.primary : 'transparent',
            color: activeTab === 'profile' ? (isDarkMode ? '#181D40' : '#FFFFFF') : theme.text.secondary,
            border: `2px solid ${activeTab === 'profile' ? theme.accent.primary : theme.border.primary}`,
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('security')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'security' ? theme.accent.primary : 'transparent',
            color: activeTab === 'security' ? (isDarkMode ? '#181D40' : '#FFFFFF') : theme.text.secondary,
            border: `2px solid ${activeTab === 'security' ? theme.accent.primary : theme.border.primary}`,
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Shield className="w-4 h-4" />
          Security
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'profile' ? (
          // Profile Tab
          <div className="max-w-2xl space-y-6">
            <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border">
              <h3 style={{ color: theme.text.primary }} className="text-lg font-bold mb-5 flex items-center gap-2">
                <span>📝</span> Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  />
                </div>

                <div>
                  <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  />
                </div>

                <div className="md:col-span-2">
                  <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    style={{ background: theme.bg.tertiary, color: theme.text.muted, borderColor: theme.border.primary }}
                    className="w-full px-4 py-3 rounded-xl border cursor-not-allowed opacity-60"
                  />
                  <p style={{ color: theme.text.muted }} className="text-xs mt-1">Email cannot be changed</p>
                </div>

                <div className="md:col-span-2">
                  <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+63 9XX XXX XXXX"
                    style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  style={{
                    background: savingProfile ? 'rgba(100,100,100,0.3)' : theme.accent.primary,
                    color: savingProfile ? theme.text.muted : (isDarkMode ? '#181D40' : '#FFFFFF')
                  }}
                  className="px-6 py-3 rounded-xl font-bold transition hover:opacity-90 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingProfile ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </div>

            {/* Account Info */}
            <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border">
              <h3 style={{ color: theme.text.primary }} className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>📋</span> Account Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div style={{ background: theme.bg.tertiary, borderColor: theme.border.primary }} className="p-4 rounded-xl border">
                  <p style={{ color: theme.text.secondary }} className="text-xs font-bold uppercase mb-1">School ID</p>
                  <p style={{ color: theme.text.primary }} className="font-semibold">{userData?.schoolUId || 'N/A'}</p>
                </div>
                <div style={{ background: theme.bg.tertiary, borderColor: theme.border.primary }} className="p-4 rounded-xl border">
                  <p style={{ color: theme.text.secondary }} className="text-xs font-bold uppercase mb-1">Account Type</p>
                  <p style={{ color: theme.text.primary }} className="font-semibold capitalize">{userData?.accountType || 'Student'}</p>
                </div>
                <div style={{ background: theme.bg.tertiary, borderColor: theme.border.primary }} className="p-4 rounded-xl border">
                  <p style={{ color: theme.text.secondary }} className="text-xs font-bold uppercase mb-1">Status</p>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: userData?.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                    color: userData?.isActive ? '#10B981' : '#EF4444'
                  }}>
                    {userData?.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div style={{ background: theme.bg.tertiary, borderColor: theme.border.primary }} className="p-4 rounded-xl border">
                  <p style={{ color: theme.text.secondary }} className="text-xs font-bold uppercase mb-1">Member Since</p>
                  <p style={{ color: theme.text.primary }} className="font-semibold">
                    {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Security Tab
          <div className="max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Change PIN Card */}
              <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border">
                <h3 style={{ color: theme.text.primary }} className="text-lg font-bold mb-5 flex items-center gap-2">
                  <span>🔐</span> Change PIN
                </h3>

                <div className="space-y-4">
                  <div>
                    <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
                      Current PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPin ? 'text' : 'password'}
                        value={pinForm.currentPin}
                        onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        maxLength={6}
                        placeholder="••••••"
                        style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400/30 font-mono tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPin(!showCurrentPin)}
                        style={{ color: theme.text.muted }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
                      New PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        value={pinForm.newPin}
                        onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        maxLength={6}
                        placeholder="••••••"
                        style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400/30 font-mono tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPin(!showNewPin)}
                        style={{ color: theme.text.muted }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
                      Confirm New PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPin ? 'text' : 'password'}
                        value={pinForm.confirmPin}
                        onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        maxLength={6}
                        placeholder="••••••"
                        style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400/30 font-mono tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                        style={{ color: theme.text.muted }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleChangePin}
                    disabled={changingPin}
                    style={{
                      background: changingPin ? 'rgba(100,100,100,0.3)' : theme.accent.primary,
                      color: changingPin ? theme.text.muted : (isDarkMode ? '#181D40' : '#FFFFFF')
                    }}
                    className="w-full py-3 rounded-xl font-bold transition hover:opacity-90 disabled:cursor-not-allowed mt-2"
                  >
                    {changingPin ? 'Changing...' : 'Change PIN'}
                  </button>
                </div>
              </div>

              {/* Deactivate Account Card */}
              <div style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }} className="p-6 rounded-2xl border">
                <h3 style={{ color: '#EF4444' }} className="text-lg font-bold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Deactivate Account
                </h3>

                <p style={{ color: theme.text.secondary }} className="text-sm mb-4">
                  Request to deactivate your NUCash account. This action will:
                </p>

                <ul style={{ color: theme.text.secondary }} className="text-sm space-y-2 mb-5">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    Disable your ability to use NUCash services
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    Require admin approval to process
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    Any remaining balance must be settled first
                  </li>
                </ul>

                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className="w-full py-3 rounded-xl font-bold transition hover:opacity-90 bg-red-500 text-white"
                >
                  Request Deactivation
                </button>
              </div>
            </div>

            {/* Security Tips */}
            <div style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' }} className="mt-6 p-5 rounded-2xl border">
              <h4 style={{ color: '#3B82F6' }} className="font-bold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security Tips
              </h4>
              <ul style={{ color: theme.text.secondary }} className="text-sm space-y-2">
                <li>• Never share your PIN with anyone</li>
                <li>• Change your PIN regularly (every 3 months recommended)</li>
                <li>• Use a PIN that's hard to guess (avoid birthdays, repeating numbers)</li>
                <li>• Report any suspicious activity immediately</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={handleCloseDeactivateModal}
        >
          <div
            style={{ background: isDarkMode ? '#1E2347' : '#FFFFFF', borderColor: 'rgba(239,68,68,0.3)' }}
            className="w-full max-w-md rounded-2xl border-2 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ background: 'rgba(239,68,68,0.15)' }} className="p-5 border-b border-red-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <div>
                    <h2 className="text-lg font-bold text-red-500">
                      {deactivateStep === 1 ? 'Request Deactivation' : 'Verify Your Identity'}
                    </h2>
                    <p style={{ color: theme.text.secondary }} className="text-xs">
                      Step {deactivateStep} of 2
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseDeactivateModal}
                  disabled={deactivating || sendingOtp}
                  style={{ color: theme.text.secondary }}
                  className="hover:opacity-70 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }} className="h-1">
              <div
                style={{
                  width: `${(deactivateStep / 2) * 100}%`,
                  background: '#EF4444',
                  transition: 'width 0.3s ease'
                }}
                className="h-full"
              />
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {deactivateStep === 1 ? (
                <>
                  <p style={{ color: theme.text.secondary }} className="text-sm">
                    Are you sure you want to request account deactivation? This request will be reviewed by an administrator.
                  </p>

                  <div>
                    <label style={{ color: theme.text.primary }} className="font-semibold mb-2 block">
                      Reason for deactivation <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={deactivateReason}
                      onChange={(e) => setDeactivateReason(e.target.value)}
                      placeholder="Please provide a reason..."
                      rows={4}
                      style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-400/30 resize-none"
                    />
                  </div>

                  <div style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }} className="p-4 rounded-xl border">
                    <p style={{ color: '#F59E0B' }} className="text-sm font-semibold mb-1">⚠️ Important</p>
                    <p style={{ color: theme.text.secondary }} className="text-xs">
                      If you have any remaining balance, please contact the Treasury Office to settle it before deactivation.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(59,130,246,0.15)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px' }}>
                      📧
                    </div>
                    <p style={{ color: theme.text.primary }} className="font-semibold">
                      Check your email
                    </p>
                    <p style={{ color: theme.text.secondary }} className="text-sm mt-1">
                      We sent a 6-digit verification code to<br />
                      <strong style={{ color: theme.accent.primary }}>{userData?.email}</strong>
                    </p>
                  </div>

                  <div>
                    <label style={{ color: theme.text.primary }} className="font-semibold mb-2 block text-center">
                      Enter verification code
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      placeholder="••••••"
                      style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                      className="w-full px-4 py-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-400/30 text-center text-2xl font-mono tracking-[0.5em]"
                    />
                  </div>

                  <p style={{ color: theme.text.tertiary }} className="text-xs text-center">
                    Didn't receive the code?{' '}
                    <button
                      onClick={handleSendDeactivationOtp}
                      disabled={sendingOtp}
                      style={{ color: theme.accent.primary }}
                      className="font-semibold hover:underline disabled:opacity-50"
                    >
                      {sendingOtp ? 'Sending...' : 'Resend code'}
                    </button>
                  </p>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t" style={{ borderColor: theme.border.primary }}>
              {deactivateStep === 1 ? (
                <>
                  <button
                    onClick={handleCloseDeactivateModal}
                    disabled={sendingOtp}
                    style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                    className="flex-1 py-3 rounded-xl font-semibold border hover:opacity-80 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendDeactivationOtp}
                    disabled={sendingOtp || !deactivateReason.trim()}
                    className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingOtp ? 'Sending Code...' : 'Continue →'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setDeactivateStep(1)}
                    disabled={deactivating}
                    style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                    className="flex-1 py-3 rounded-xl font-semibold border hover:opacity-80 transition disabled:opacity-50"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleDeactivateAccount}
                    disabled={deactivating || otpCode.length !== 6}
                    className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deactivating ? 'Submitting...' : 'Confirm Deactivation'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
