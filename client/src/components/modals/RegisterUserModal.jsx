// client/src/components/modals/RegisterUserModal.jsx
// Treasury admin modal for registering new users - Motorpool design style

import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, CreditCard, AlertCircle, CheckCircle, User, Mail, IdCard, Loader2 } from 'lucide-react';
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

// Format school ID for display (####-######)
const formatSchoolIdDisplay = (value) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 10)}`;
};

// Clean school ID for storage (##########)
const cleanSchoolId = (value) => {
  return value.replace(/\D/g, '').slice(0, 10);
};

export default function RegisterUserModal({ isOpen, onClose, onSuccess, prefillRfid = '' }) {
  const { theme, isDarkMode } = useTheme();
  const [step, setStep] = useState(1); // 1: RFID Scan, 2: User Details, 3: Summary, 4: Success
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const rfidInputRef = useRef(null);

  const [formData, setFormData] = useState({
    rfidUId: prefillRfid || '',
    firstName: '',
    middleName: '',
    lastName: '',
    role: 'student',
    schoolUId: '',
    email: ''
  });

  const [registeredUser, setRegisteredUser] = useState(null);

  // Focus on RFID input when modal opens
  useEffect(() => {
    if (isOpen && step === 1 && rfidInputRef.current) {
      setTimeout(() => rfidInputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  // Handle prefilled RFID
  useEffect(() => {
    if (prefillRfid && isOpen) {
      setFormData(prev => ({ ...prev, rfidUId: prefillRfid }));
      // Auto-proceed to step 2 if RFID is prefilled
      handleRfidCheck(prefillRfid);
    }
  }, [prefillRfid, isOpen]);

  const resetForm = () => {
    setStep(1);
    setFormData({
      rfidUId: '',
      firstName: '',
      middleName: '',
      lastName: '',
      role: 'student',
      schoolUId: '',
      email: ''
    });
    setRegisteredUser(null);
    setLoading(false);
    setChecking(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Handle RFID input change and convert to little-endian hex
  const handleRfidChange = (e) => {
    const value = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, rfidUId: value }));
  };

  // Check if RFID is already registered
  const handleRfidCheck = async (rfidValue = formData.rfidUId) => {
    if (!rfidValue.trim()) {
      toast.error('Please scan or enter RFID');
      return;
    }

    setChecking(true);
    try {
      // Convert to little-endian hex format
      const hexRfid = convertToLittleEndianHex(rfidValue.trim());

      // Check if RFID exists
      const response = await api.get(`/admin/treasury/users/check-rfid?rfidUId=${hexRfid}`);

      if (!response.available) {
        toast.error('This RFID is already registered to another user');
        setChecking(false);
        return;
      }

      // RFID is available, proceed to user details
      setFormData(prev => ({ ...prev, rfidUId: hexRfid }));
      setStep(2);
    } catch (error) {
      console.error('RFID check error:', error);
      toast.error(error.message || 'Error checking RFID');
    } finally {
      setChecking(false);
    }
  };

  // Handle Enter key on RFID input
  const handleRfidKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRfidCheck();
    }
  };

  // Handle school ID input with formatting
  const handleSchoolIdChange = (e) => {
    const formatted = formatSchoolIdDisplay(e.target.value);
    setFormData(prev => ({ ...prev, schoolUId: formatted }));
  };

  // Validate form before proceeding to summary
  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return false;
    }
    if (!formData.schoolUId || cleanSchoolId(formData.schoolUId).length !== 10) {
      toast.error('Please enter a valid 10-digit School ID');
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  // Proceed to summary
  const handleProceedToSummary = async () => {
    if (!validateForm()) return;

    // Check if school ID is available
    setChecking(true);
    try {
      const schoolId = cleanSchoolId(formData.schoolUId);
      const response = await api.get(`/admin/treasury/users/check-schoolid?schoolUId=${schoolId}`);

      if (!response.available) {
        toast.error('This School ID is already registered');
        setChecking(false);
        return;
      }

      setStep(3);
    } catch (error) {
      console.error('School ID check error:', error);
      toast.error(error.message || 'Error checking School ID');
    } finally {
      setChecking(false);
    }
  };

  // Register the user
  const handleRegister = async () => {
    setLoading(true);
    try {
      // Generate a random 6-digit PIN
      const tempPin = Math.floor(100000 + Math.random() * 900000).toString();

      const payload = {
        rfidUId: formData.rfidUId,
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
        schoolUId: cleanSchoolId(formData.schoolUId),
        email: formData.email.trim().toLowerCase(),
        pin: tempPin
      };

      const response = await api.post('/treasury/register', payload);

      if (response.success) {
        setRegisteredUser(response.user);
        setStep(4);
        toast.success('User registered successfully!');

        if (response.emailSent) {
          toast.info('Temporary PIN sent to user\'s email');
        }
      } else {
        toast.error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register user');
    } finally {
      setLoading(false);
    }
  };

  // Finish and close
  const handleFinish = () => {
    if (onSuccess) onSuccess(registeredUser);
    handleClose();
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
              ? 'linear-gradient(135deg, rgba(255,212,28,0.2) 0%, rgba(255,212,28,0.1) 100%)'
              : 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.1) 100%)',
            borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'
          }}
          className="px-6 py-4 flex items-center justify-between border-b"
        >
          <div className="flex items-center gap-3">
            <UserPlus style={{ color: theme.accent.primary }} className="w-6 h-6" />
            <div>
              <h2 style={{ color: theme.accent.primary }} className="text-xl font-bold">
                Register New User
              </h2>
              <p style={{ color: theme.text.secondary }} className="text-sm">
                Add a new student or employee to NUCash
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
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
            { num: 1, label: 'RFID' },
            { num: 2, label: 'Details' },
            { num: 3, label: 'Summary' },
            { num: 4, label: 'Complete' }
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={`flex items-center gap-2 ${step >= s.num ? '' : 'opacity-50'}`}>
                <div
                  style={{
                    background: step >= s.num ? theme.accent.primary : 'transparent',
                    borderColor: step >= s.num ? theme.accent.primary : theme.border.primary,
                    color: step >= s.num ? (isDarkMode ? '#181D40' : '#FFFFFF') : theme.text.secondary
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold border-2"
                >
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                </div>
                <span
                  style={{ color: step >= s.num ? theme.accent.primary : theme.text.secondary }}
                  className="hidden sm:inline font-semibold text-sm"
                >
                  {s.label}
                </span>
              </div>
              {i < 3 && (
                <div
                  style={{
                    background: step > s.num ? theme.accent.primary : theme.border.primary
                  }}
                  className="w-8 sm:w-16 h-1 rounded"
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">

          {/* STEP 1: RFID Scan */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                style={{
                  background: isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)',
                  borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'
                }}
                className="p-4 rounded-xl border flex items-start gap-3"
              >
                <CreditCard style={{ color: theme.accent.primary }} className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p style={{ color: theme.text.primary }} className="font-semibold">
                    Scan User's ID Card
                  </p>
                  <p style={{ color: theme.text.secondary }} className="text-sm mt-1">
                    Place the ID card on the RFID scanner or type the RFID manually.
                    Format will be automatically converted to Hex (byte-reversed).
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
                  value={formData.rfidUId}
                  onChange={handleRfidChange}
                  onKeyDown={handleRfidKeyDown}
                  placeholder="Scan or enter RFID..."
                  style={{
                    background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                    color: theme.text.primary,
                    borderColor: theme.border.primary
                  }}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-400/50 font-mono text-lg tracking-wider"
                  autoComplete="off"
                />
                <p style={{ color: theme.text.tertiary }} className="text-xs mt-2">
                  The RFID will be automatically converted to little-endian hex format
                </p>
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
                  onClick={() => handleRfidCheck()}
                  disabled={!formData.rfidUId.trim() || checking}
                  style={{
                    background: theme.accent.primary,
                    color: isDarkMode ? '#181D40' : '#FFFFFF'
                  }}
                  className="flex-1 py-3 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {checking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>Continue <span className="ml-1">→</span></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: User Details */}
          {step === 2 && (
            <div className="space-y-4">
              {/* RFID Display */}
              <div
                style={{
                  background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                  borderColor: theme.border.primary
                }}
                className="p-4 rounded-xl border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CreditCard style={{ color: theme.accent.primary }} className="w-5 h-5" />
                  <div>
                    <p style={{ color: theme.text.secondary }} className="text-xs">RFID Tag</p>
                    <p style={{ color: theme.text.primary }} className="font-mono font-semibold">
                      {'*'.repeat(formData.rfidUId.length - 4)}{formData.rfidUId.slice(-4)}
                    </p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label style={{ color: theme.text.primary }} className="font-semibold mb-2 block text-sm">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Juan"
                    style={{
                      background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                      color: theme.text.primary,
                      borderColor: theme.border.primary
                    }}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
                <div>
                  <label style={{ color: theme.text.primary }} className="font-semibold mb-2 block text-sm">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
                    placeholder="Dela"
                    style={{
                      background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                      color: theme.text.primary,
                      borderColor: theme.border.primary
                    }}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
                <div>
                  <label style={{ color: theme.text.primary }} className="font-semibold mb-2 block text-sm">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Cruz"
                    style={{
                      background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                      color: theme.text.primary,
                      borderColor: theme.border.primary
                    }}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label style={{ color: theme.text.primary }} className="font-semibold mb-2 block text-sm">
                  User Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['student', 'employee'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role }))}
                      style={{
                        background: formData.role === role
                          ? theme.accent.primary
                          : isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                        color: formData.role === role
                          ? (isDarkMode ? '#181D40' : '#FFFFFF')
                          : theme.text.primary,
                        borderColor: formData.role === role ? theme.accent.primary : theme.border.primary
                      }}
                      className="py-3 rounded-xl border font-semibold capitalize transition-all hover:opacity-90"
                    >
                      {role === 'student' ? '🎓 ' : '👔 '}{role}
                    </button>
                  ))}
                </div>
              </div>

              {/* School ID */}
              <div>
                <label style={{ color: theme.text.primary }} className="font-semibold mb-2 block text-sm">
                  School ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IdCard
                    style={{ color: theme.text.tertiary }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  />
                  <input
                    type="text"
                    value={formData.schoolUId}
                    onChange={handleSchoolIdChange}
                    placeholder="2024-123456"
                    maxLength={11}
                    style={{
                      background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                      color: theme.text.primary,
                      borderColor: theme.border.primary
                    }}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-400/50 font-mono"
                  />
                </div>
                <p style={{ color: theme.text.tertiary }} className="text-xs mt-1">
                  Format: ####-###### (will be stored as 10 digits)
                </p>
              </div>

              {/* Email */}
              <div>
                <label style={{ color: theme.text.primary }} className="font-semibold mb-2 block text-sm">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    style={{ color: theme.text.tertiary }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="juan.delacruz@nu.edu.ph"
                    style={{
                      background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                      color: theme.text.primary,
                      borderColor: theme.border.primary
                    }}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
                <p style={{ color: theme.text.tertiary }} className="text-xs mt-1">
                  Temporary PIN will be sent to this email
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  style={{
                    background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB',
                    color: theme.text.primary
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
                >
                  ← Back
                </button>
                <button
                  onClick={handleProceedToSummary}
                  disabled={checking}
                  style={{
                    background: theme.accent.primary,
                    color: isDarkMode ? '#181D40' : '#FFFFFF'
                  }}
                  className="flex-1 py-3 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {checking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>Continue <span className="ml-1">→</span></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Summary */}
          {step === 3 && (
            <div className="space-y-6">
              <div
                style={{
                  background: isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)',
                  borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'
                }}
                className="p-4 rounded-xl border flex items-start gap-3"
              >
                <AlertCircle style={{ color: theme.accent.primary }} className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p style={{ color: theme.text.primary }} className="font-semibold">
                    Review User Details
                  </p>
                  <p style={{ color: theme.text.secondary }} className="text-sm mt-1">
                    Please verify all information before registering. A temporary PIN will be sent to the user's email.
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                  borderColor: theme.border.primary
                }}
                className="rounded-xl border overflow-hidden"
              >
                {[
                  { label: 'RFID Tag', value: '***' + formData.rfidUId.slice(-4), icon: CreditCard },
                  { label: 'Full Name', value: `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`, icon: User },
                  { label: 'User Type', value: formData.role.charAt(0).toUpperCase() + formData.role.slice(1), icon: null, badge: true },
                  { label: 'School ID', value: formData.schoolUId, icon: IdCard },
                  { label: 'Email', value: formData.email, icon: Mail }
                ].map((item, idx) => (
                  <div
                    key={item.label}
                    style={{ borderColor: theme.border.primary }}
                    className={`flex justify-between items-center p-4 ${idx < 4 ? 'border-b' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon && <item.icon style={{ color: theme.text.tertiary }} className="w-4 h-4" />}
                      <span style={{ color: theme.text.secondary }}>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span
                        style={{
                          background: formData.role === 'student' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)',
                          color: formData.role === 'student' ? '#3B82F6' : '#A855F7'
                        }}
                        className="px-3 py-1 rounded-full text-sm font-semibold"
                      >
                        {formData.role === 'student' ? '🎓' : '👔'} {item.value}
                      </span>
                    ) : (
                      <span style={{ color: theme.text.primary }} className="font-semibold">
                        {item.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div
                style={{
                  background: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.1)',
                  borderColor: 'rgba(16,185,129,0.3)'
                }}
                className="p-4 rounded-xl border"
              >
                <p style={{ color: '#10B981' }} className="font-semibold text-sm">
                  📧 What happens next?
                </p>
                <ul style={{ color: theme.text.secondary }} className="text-sm mt-2 space-y-1">
                  <li>• A temporary PIN will be generated and emailed to the user</li>
                  <li>• The user must log in and change their PIN to activate their account</li>
                  <li>• Account status: <span className="font-semibold text-yellow-500">Inactive</span> until PIN is changed</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  style={{
                    background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB',
                    color: theme.text.primary
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  style={{
                    background: '#10B981',
                    color: '#FFFFFF'
                  }}
                  className="flex-1 py-3 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Register User
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div
                style={{ background: 'rgba(16,185,129,0.2)' }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              >
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>

              <div>
                <h3 style={{ color: '#10B981' }} className="text-2xl font-bold">
                  Registration Successful!
                </h3>
                <p style={{ color: theme.text.secondary }} className="mt-2">
                  The user has been registered and a temporary PIN has been sent to their email.
                </p>
              </div>

              {registeredUser && (
                <div
                  style={{
                    background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                    borderColor: theme.border.primary
                  }}
                  className="rounded-xl border p-6 text-left space-y-3"
                >
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>User ID</span>
                    <span style={{ color: theme.text.primary }} className="font-mono font-semibold">
                      {registeredUser.userId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>Name</span>
                    <span style={{ color: theme.text.primary }} className="font-semibold">
                      {registeredUser.firstName} {registeredUser.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>School ID</span>
                    <span style={{ color: theme.text.primary }} className="font-mono">
                      {registeredUser.schoolUId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>Email</span>
                    <span style={{ color: theme.text.primary }}>
                      {registeredUser.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>Status</span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-500">
                      Pending Activation
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleFinish}
                style={{
                  background: theme.accent.primary,
                  color: isDarkMode ? '#181D40' : '#FFFFFF'
                }}
                className="w-full py-3 rounded-xl font-bold transition-all hover:opacity-90"
              >
                Done
              </button>
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
