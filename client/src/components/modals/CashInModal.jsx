// client/src/components/modals/CashInModal.jsx
// Treasury admin modal for processing cash-in transactions - Motorpool design style

import React, { useState, useEffect, useRef } from 'react';
import { X, Wallet, CreditCard, AlertCircle, CheckCircle, User, Loader2, ArrowRight, Clock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';

// RFID Hex conversion utility (byte-reversed / little-endian)
const convertToLittleEndianHex = (input) => {
  if (!input) return '';

  // Remove any spaces, colons, or dashes
  let cleaned = input.replace(/[\s:-]/g, '').toUpperCase();

  // Check if it's already hex
  if (/^[0-9A-F]+$/.test(cleaned)) {
    // If it's hex, reverse bytes (little-endian)
    if (cleaned.length % 2 === 0) {
      const bytes = cleaned.match(/.{2}/g) || [];
      return bytes.reverse().join('');
    }
    return cleaned;
  }

  // If it's decimal, convert to hex then reverse
  if (/^\d+$/.test(cleaned)) {
    const decimal = BigInt(cleaned);
    let hex = decimal.toString(16).toUpperCase();
    // Pad to even length
    if (hex.length % 2 !== 0) hex = '0' + hex;
    // Reverse bytes
    const bytes = hex.match(/.{2}/g) || [];
    return bytes.reverse().join('');
  }

  return cleaned;
};

// Preset amounts for quick selection
const PRESET_AMOUNTS = [100, 200, 300, 500, 1000];

export default function CashInModal({ isOpen, onClose, onSuccess, onRegisterUser }) {
  const { theme, isDarkMode } = useTheme();
  const [step, setStep] = useState(1); // 1: RFID Scan, 2: User Found, 3: Amount Select, 4: Countdown, 5: Success
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const rfidInputRef = useRef(null);
  const countdownRef = useRef(null);

  const [rfidInput, setRfidInput] = useState('');
  const [user, setUser] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [transaction, setTransaction] = useState(null);

  // Focus on RFID input when modal opens
  useEffect(() => {
    if (isOpen && step === 1 && rfidInputRef.current) {
      setTimeout(() => rfidInputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  // Countdown logic
  useEffect(() => {
    if (step === 4 && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (step === 4 && countdown === 0) {
      processCashIn();
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [step, countdown]);

  const resetForm = () => {
    setStep(1);
    setRfidInput('');
    setUser(null);
    setSelectedAmount(null);
    setCustomAmount('');
    setCountdown(5);
    setTransaction(null);
    setLoading(false);
    setSearching(false);
  };

  const handleClose = () => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
    }
    resetForm();
    onClose();
  };

  // Search for user by RFID
  const handleSearchUser = async () => {
    if (!rfidInput.trim()) {
      toast.error('Please scan or enter RFID');
      return;
    }

    setSearching(true);
    try {
      // Convert to little-endian hex format
      const hexRfid = convertToLittleEndianHex(rfidInput.trim());

      // Search for user
      const response = await api.get(`/treasury/search-user/${hexRfid}`);

      if (response.success && response.user) {
        setUser(response.user);
        setStep(2);
      } else {
        // User not found - offer to register
        toast.error('User not found with this RFID');
        setStep('not_found');
      }
    } catch (error) {
      console.error('Search user error:', error);
      if (error.response?.status === 404) {
        setStep('not_found');
      } else {
        toast.error(error.message || 'Error searching for user');
      }
    } finally {
      setSearching(false);
    }
  };

  // Handle Enter key on RFID input
  const handleRfidKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchUser();
    }
  };

  // Get final amount
  const getFinalAmount = () => {
    if (selectedAmount === 'custom') {
      return parseFloat(customAmount) || 0;
    }
    return selectedAmount || 0;
  };

  // Proceed to confirmation countdown
  const handleProceedToConfirm = () => {
    const amount = getFinalAmount();
    if (!amount || amount <= 0) {
      toast.error('Please select or enter a valid amount');
      return;
    }
    if (amount < 50) {
      toast.error('Minimum cash-in amount is 50');
      return;
    }
    if (amount > 10000) {
      toast.error('Maximum cash-in amount is 10,000');
      return;
    }
    setCountdown(5);
    setStep(4);
  };

  // Cancel countdown and go back
  const handleCancelCountdown = () => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
    }
    setCountdown(5);
    setStep(3);
  };

  // Process the cash-in transaction
  const processCashIn = async () => {
    setLoading(true);
    try {
      const amount = getFinalAmount();

      const response = await api.post('/treasury/cash-in', {
        rfid: user.rfidUId,
        amount: amount
      });

      if (response.success) {
        setTransaction(response.transaction);
        setUser(prev => ({ ...prev, balance: response.user.balance }));
        setStep(5);
        toast.success('Cash-in successful!');
      } else {
        toast.error(response.message || 'Cash-in failed');
        setStep(3);
      }
    } catch (error) {
      console.error('Cash-in error:', error);
      toast.error(error.message || 'Failed to process cash-in');
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  // Handle register new user
  const handleRegisterUser = () => {
    const hexRfid = convertToLittleEndianHex(rfidInput.trim());
    handleClose();
    if (onRegisterUser) {
      onRegisterUser(hexRfid);
    }
  };

  // Finish and close or cash in another
  const handleFinish = () => {
    if (onSuccess) onSuccess(transaction);
    handleClose();
  };

  const handleCashInAnother = () => {
    resetForm();
    setTimeout(() => rfidInputRef.current?.focus(), 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        style={{
          background: isDarkMode ? '#1E2347' : '#FFFFFF',
          borderColor: theme.border.primary
        }}
        className="rounded-2xl shadow-2xl border w-full max-w-3xl overflow-hidden animate-fadeIn"
      >
        {/* Header */}
        <div
          style={{
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)'
              : 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)',
            borderColor: 'rgba(16,185,129,0.3)'
          }}
          className="px-6 py-4 flex items-center justify-between border-b"
        >
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-emerald-500" />
            <div>
              <h2 className="text-xl font-bold text-emerald-500">
                Cash-In for User
              </h2>
              <p style={{ color: theme.text.secondary }} className="text-sm">
                Load balance to user's NUCash account
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading || step === 4}
            style={{ color: theme.text.secondary }}
            className="hover:opacity-70 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div
          style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : 'rgba(243,244,246,0.5)' }}
          className="flex items-center justify-center gap-4 py-6"
        >
          {[
            { num: 1, label: 'Scan' },
            { num: 2, label: 'User' },
            { num: 3, label: 'Amount' },
            { num: 4, label: 'Confirm' },
            { num: 5, label: 'Done' }
          ].map((s, i) => {
            const currentStep = step === 'not_found' ? 1 : step;
            return (
              <React.Fragment key={s.num}>
                <div className={`flex items-center gap-2 ${currentStep >= s.num ? '' : 'opacity-50'}`}>
                  <div
                    style={{
                      background: currentStep >= s.num ? '#10B981' : 'transparent',
                      borderColor: currentStep >= s.num ? '#10B981' : theme.border.primary,
                      color: currentStep >= s.num ? '#FFFFFF' : theme.text.secondary
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold border-2"
                  >
                    {currentStep > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                  </div>
                  <span
                    style={{ color: currentStep >= s.num ? '#10B981' : theme.text.secondary }}
                    className="hidden sm:inline font-semibold text-sm"
                  >
                    {s.label}
                  </span>
                </div>
                {i < 4 && (
                  <div
                    style={{
                      background: currentStep > s.num ? '#10B981' : theme.border.primary
                    }}
                    className="w-8 sm:w-12 h-1 rounded"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6">

          {/* STEP 1: RFID Scan */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  borderColor: 'rgba(16,185,129,0.3)'
                }}
                className="p-4 rounded-xl border flex items-start gap-3"
              >
                <CreditCard className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
                <div>
                  <p style={{ color: theme.text.primary }} className="font-semibold">
                    Scan User's ID Card
                  </p>
                  <p style={{ color: theme.text.secondary }} className="text-sm mt-1">
                    Place the ID card on the RFID scanner or type the RFID manually.
                    The system will look up the user's account.
                  </p>
                </div>
              </div>

              <div>
                <label style={{ color: theme.text.primary }} className="font-semibold mb-2 block">
                  RFID Tag
                </label>
                <input
                  ref={rfidInputRef}
                  type="text"
                  value={rfidInput}
                  onChange={(e) => setRfidInput(e.target.value.toUpperCase())}
                  onKeyDown={handleRfidKeyDown}
                  placeholder="Scan or enter RFID..."
                  style={{
                    background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                    color: theme.text.primary,
                    borderColor: theme.border.primary
                  }}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-400/50 font-mono text-lg tracking-wider"
                  autoComplete="off"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  style={{
                    background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB',
                    color: theme.text.primary
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSearchUser}
                  disabled={!rfidInput.trim() || searching}
                  className="flex-1 py-3 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 bg-emerald-500 text-white"
                >
                  {searching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>Search User <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* User Not Found */}
          {step === 'not_found' && (
            <div className="space-y-6 text-center">
              <div
                style={{ background: 'rgba(239,68,68,0.2)' }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              >
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>

              <div>
                <h3 style={{ color: theme.text.primary }} className="text-xl font-bold">
                  User Not Found
                </h3>
                <p style={{ color: theme.text.secondary }} className="mt-2">
                  No user is registered with this RFID.
                  <br />
                  Would you like to register a new user?
                </p>
              </div>

              <div
                style={{
                  background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                  borderColor: theme.border.primary
                }}
                className="p-4 rounded-xl border"
              >
                <p style={{ color: theme.text.secondary }} className="text-sm">Scanned RFID:</p>
                <p style={{ color: theme.text.primary }} className="font-mono font-semibold mt-1">
                  {convertToLittleEndianHex(rfidInput.trim())}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setRfidInput('');
                    setTimeout(() => rfidInputRef.current?.focus(), 100);
                  }}
                  style={{
                    background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB',
                    color: theme.text.primary
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
                >
                  Try Again
                </button>
                <button
                  onClick={handleRegisterUser}
                  style={{
                    background: theme.accent.primary,
                    color: isDarkMode ? '#181D40' : '#FFFFFF'
                  }}
                  className="flex-1 py-3 rounded-xl font-bold transition-all hover:opacity-90"
                >
                  Register New User
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: User Found */}
          {step === 2 && user && (
            <div className="space-y-6">
              <div
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  borderColor: 'rgba(16,185,129,0.3)'
                }}
                className="p-4 rounded-xl border flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <p className="font-semibold text-emerald-500">User Found!</p>
              </div>

              {/* User Info Card */}
              <div
                style={{
                  background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                  borderColor: theme.border.primary
                }}
                className="rounded-xl border overflow-hidden"
              >
                <div className="p-4 flex items-center gap-4">
                  <div
                    style={{ background: 'rgba(16,185,129,0.2)' }}
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                  >
                    <User className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: theme.text.primary }} className="font-bold text-lg">
                      {user.firstName} {user.lastName}
                    </p>
                    <p style={{ color: theme.text.secondary }} className="text-sm">
                      {user.role === 'student' ? '🎓' : '👔'} {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: theme.text.secondary }} className="text-xs">Current Balance</p>
                    <p className="text-2xl font-bold text-emerald-500">
                      {parseFloat(user.balance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div style={{ borderColor: theme.border.primary }} className="border-t">
                  {[
                    { label: 'RFID', value: '***' + user.rfidUId?.slice(-4), icon: CreditCard },
                    { label: 'School ID', value: user.schoolUId },
                    { label: 'Email', value: user.email }
                  ].map((item, idx) => (
                    <div
                      key={item.label}
                      style={{ borderColor: theme.border.primary }}
                      className={`flex justify-between items-center px-4 py-3 ${idx < 2 ? 'border-b' : ''}`}
                    >
                      <span style={{ color: theme.text.secondary }} className="text-sm">{item.label}</span>
                      <span style={{ color: theme.text.primary }} className="font-semibold font-mono">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Status Warning */}
              {!user.isActive && (
                <div
                  style={{
                    background: 'rgba(251,191,36,0.1)',
                    borderColor: 'rgba(251,191,36,0.3)'
                  }}
                  className="p-4 rounded-xl border flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-500" />
                  <div>
                    <p className="font-semibold text-yellow-500">Account Not Activated</p>
                    <p style={{ color: theme.text.secondary }} className="text-sm mt-1">
                      This user needs to change their PIN to activate their account before cash-in is allowed.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setUser(null);
                    setRfidInput('');
                    setTimeout(() => rfidInputRef.current?.focus(), 100);
                  }}
                  style={{
                    background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB',
                    color: theme.text.primary
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
                >
                  Scan Different Card
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!user.isActive}
                  className="flex-1 py-3 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 bg-emerald-500 text-white"
                >
                  Continue <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Amount Selection */}
          {step === 3 && user && (
            <div className="space-y-6">
              {/* User Summary */}
              <div
                style={{
                  background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                  borderColor: theme.border.primary
                }}
                className="p-4 rounded-xl border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <User style={{ color: theme.text.tertiary }} className="w-5 h-5" />
                  <div>
                    <p style={{ color: theme.text.primary }} className="font-semibold">
                      {user.firstName} {user.lastName}
                    </p>
                    <p style={{ color: theme.text.secondary }} className="text-sm">{user.schoolUId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p style={{ color: theme.text.secondary }} className="text-xs">Balance</p>
                  <p className="font-bold text-emerald-500">{parseFloat(user.balance || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Amount Selection */}
              <div>
                <label style={{ color: theme.text.primary }} className="font-semibold mb-3 block">
                  Select Amount
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PRESET_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount('');
                      }}
                      style={{
                        background: selectedAmount === amount
                          ? '#10B981'
                          : isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                        color: selectedAmount === amount ? '#FFFFFF' : theme.text.primary,
                        borderColor: selectedAmount === amount ? '#10B981' : theme.border.primary
                      }}
                      className="py-4 rounded-xl border font-bold text-xl transition-all hover:opacity-90"
                    >
                      {amount}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAmount('custom');
                    }}
                    style={{
                      background: selectedAmount === 'custom'
                        ? '#10B981'
                        : isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                      color: selectedAmount === 'custom' ? '#FFFFFF' : theme.text.primary,
                      borderColor: selectedAmount === 'custom' ? '#10B981' : theme.border.primary
                    }}
                    className="py-4 rounded-xl border font-semibold transition-all hover:opacity-90"
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Custom Amount Input */}
              {selectedAmount === 'custom' && (
                <div>
                  <label style={{ color: theme.text.primary }} className="font-semibold mb-2 block">
                    Enter Custom Amount
                  </label>
                  <div className="relative">
                    <span
                      style={{ color: theme.text.tertiary }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold"
                    >

                    </span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="50"
                      max="10000"
                      style={{
                        background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                        color: theme.text.primary,
                        borderColor: theme.border.primary
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-400/50 text-xl font-bold"
                    />
                  </div>
                  <p style={{ color: theme.text.tertiary }} className="text-xs mt-1">
                    Min: 50 | Max: 10,000
                  </p>
                </div>
              )}

              {/* Summary */}
              {getFinalAmount() > 0 && (
                <div
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    borderColor: 'rgba(16,185,129,0.3)'
                  }}
                  className="p-4 rounded-xl border"
                >
                  <div className="flex justify-between items-center">
                    <span style={{ color: theme.text.secondary }}>Amount to Load</span>
                    <span className="text-2xl font-bold text-emerald-500">
                      {getFinalAmount().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-500/20">
                    <span style={{ color: theme.text.secondary }}>New Balance</span>
                    <span style={{ color: theme.text.primary }} className="font-semibold">
                      {(parseFloat(user.balance || 0) + getFinalAmount()).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  style={{
                    background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB',
                    color: theme.text.primary
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
                >
                  Back
                </button>
                <button
                  onClick={handleProceedToConfirm}
                  disabled={getFinalAmount() <= 0}
                  className="flex-1 py-3 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 bg-emerald-500 text-white"
                >
                  Proceed <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Countdown Confirmation */}
          {step === 4 && user && (
            <div className="space-y-6 text-center">
              <div
                style={{ background: 'rgba(251,191,36,0.2)' }}
                className="w-32 h-32 rounded-full flex items-center justify-center mx-auto relative"
              >
                <Clock className="w-10 h-10 text-yellow-500 absolute top-4" />
                <span className="text-5xl font-bold text-yellow-500 mt-8">{countdown}</span>
              </div>

              <div>
                <h3 style={{ color: theme.text.primary }} className="text-xl font-bold">
                  Confirm Cash-In
                </h3>
                <p style={{ color: theme.text.secondary }} className="mt-2">
                  Transaction will be processed in {countdown} seconds
                </p>
              </div>

              <div
                style={{
                  background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                  borderColor: theme.border.primary
                }}
                className="rounded-xl border p-4 text-left space-y-3"
              >
                <div className="flex justify-between">
                  <span style={{ color: theme.text.secondary }}>User</span>
                  <span style={{ color: theme.text.primary }} className="font-semibold">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: theme.text.secondary }}>School ID</span>
                  <span style={{ color: theme.text.primary }} className="font-mono">
                    {user.schoolUId}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-dashed" style={{ borderColor: theme.border.primary }}>
                  <span style={{ color: theme.text.secondary }}>Amount</span>
                  <span className="text-2xl font-bold text-emerald-500">
                    {getFinalAmount().toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCancelCountdown}
                className="w-full py-3 rounded-xl font-bold transition-all hover:opacity-90 bg-red-500 text-white"
              >
                Cancel
              </button>
            </div>
          )}

          {/* STEP 5: Success */}
          {step === 5 && transaction && (
            <div className="text-center space-y-6">
              <div
                style={{ background: 'rgba(16,185,129,0.2)' }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              >
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-emerald-500">
                  Cash-In Successful!
                </h3>
                <p style={{ color: theme.text.secondary }} className="mt-2">
                  The balance has been loaded to the user's account
                </p>
              </div>

              <div
                style={{
                  background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                  borderColor: theme.border.primary
                }}
                className="rounded-xl border p-6 text-left space-y-3"
              >
                <div className="flex justify-between">
                  <span style={{ color: theme.text.secondary }}>Transaction ID</span>
                  <span style={{ color: theme.text.primary }} className="font-mono font-semibold">
                    {transaction.transactionId || transaction.transaction_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: theme.text.secondary }}>User</span>
                  <span style={{ color: theme.text.primary }} className="font-semibold">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: theme.text.secondary }}>Amount Loaded</span>
                  <span className="font-bold text-emerald-500">
                    +{parseFloat(transaction.amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t" style={{ borderColor: theme.border.primary }}>
                  <span style={{ color: theme.text.secondary }}>New Balance</span>
                  <span style={{ color: theme.text.primary }} className="text-xl font-bold">
                    {parseFloat(transaction.newBalance || user.balance).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCashInAnother}
                  style={{
                    background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB',
                    color: theme.text.primary
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
                >
                  Cash-In Another
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-1 py-3 rounded-xl font-bold transition-all hover:opacity-90 bg-emerald-500 text-white"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}
