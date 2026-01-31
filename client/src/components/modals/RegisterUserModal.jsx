// client/src/components/modals/RegisterUserModal.jsx
// Treasury admin modal for registering new users

import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, CreditCard, AlertCircle, CheckCircle, User, Mail, IdCard, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';

// RFID Hex conversion utility (byte-reversed / little-endian)
// Only converts if needed - doesn't double convert
const normalizeRfidHex = (input) => {
  if (!input) return '';

  // Remove any spaces, colons, or dashes and uppercase
  let cleaned = input.replace(/[\s:-]/g, '').toUpperCase();

  // If it's already 8 character hex, assume it's already in correct format
  if (/^[0-9A-F]{8}$/.test(cleaned)) {
    return cleaned;
  }

  // If it's a different length hex, try to normalize
  if (/^[0-9A-F]+$/.test(cleaned)) {
    // Pad to even length if needed
    if (cleaned.length % 2 !== 0) cleaned = '0' + cleaned;
    // Reverse bytes for little-endian
    const bytes = cleaned.match(/.{2}/g) || [];
    return bytes.reverse().join('');
  }

  // If it's decimal, convert to hex then reverse
  if (/^\d+$/.test(cleaned)) {
    const decimal = BigInt(cleaned);
    let hex = decimal.toString(16).toUpperCase();
    // Pad to even length
    if (hex.length % 2 !== 0) hex = '0' + hex;
    // Pad to 8 characters if less
    while (hex.length < 8) hex = '0' + hex;
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

// Mask RFID for display
const maskRfid = (rfid) => {
  if (!rfid || rfid.length < 4) return '***';
  return '****' + rfid.slice(-4);
};

export default function RegisterUserModal({ isOpen, onClose, onSuccess, prefillRfid = '' }) {
  const { theme, isDarkMode } = useTheme();
  const [step, setStep] = useState(1); // 1: RFID Scan, 2: User Details, 3: Summary, 4: Success
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const rfidInputRef = useRef(null);

  // Store the normalized RFID separately from the input
  const [rfidInput, setRfidInput] = useState('');
  const [normalizedRfid, setNormalizedRfid] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    role: 'student',
    schoolUId: '',
    email: ''
  });

  const [registeredUser, setRegisteredUser] = useState(null);

  // Handle prefilled RFID from cash-in modal
  useEffect(() => {
    if (isOpen && prefillRfid) {
      // prefillRfid is already normalized from CashInModal
      setNormalizedRfid(prefillRfid);
      setRfidInput(prefillRfid);
      // Skip to step 2 since RFID is already provided
      setStep(2);
    }
  }, [prefillRfid, isOpen]);

  // Focus on RFID input when modal opens
  useEffect(() => {
    if (isOpen && step === 1 && rfidInputRef.current && !prefillRfid) {
      setTimeout(() => rfidInputRef.current?.focus(), 100);
    }
  }, [isOpen, step, prefillRfid]);

  const resetForm = () => {
    setStep(1);
    setRfidInput('');
    setNormalizedRfid('');
    setFormData({
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

  // Handle RFID input change
  const handleRfidChange = (e) => {
    const value = e.target.value.toUpperCase();
    setRfidInput(value);
  };

  // Check if RFID is already registered
  const handleRfidCheck = async () => {
    if (!rfidInput.trim()) {
      toast.error('Please scan or enter RFID');
      return;
    }

    setChecking(true);
    try {
      // Normalize the RFID to hex format
      const hexRfid = normalizeRfidHex(rfidInput.trim());

      // Check if RFID exists
      const response = await api.get(`/admin/treasury/users/check-rfid?rfidUId=${hexRfid}`);

      if (!response.available) {
        toast.error('This RFID is already registered to another user');
        setChecking(false);
        return;
      }

      // RFID is available, store the normalized version and proceed
      setNormalizedRfid(hexRfid);
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

    // Check if school ID and email are available
    setChecking(true);
    try {
      const schoolId = cleanSchoolId(formData.schoolUId);

      // Check school ID
      const schoolResponse = await api.get(`/admin/treasury/users/check-schoolid?schoolUId=${schoolId}`);
      if (!schoolResponse.available) {
        toast.error('This School ID is already registered');
        setChecking(false);
        return;
      }

      setStep(3);
    } catch (error) {
      console.error('Validation error:', error);
      toast.error(error.message || 'Error validating user details');
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
        rfidUId: normalizedRfid,  // Use the normalized RFID
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
        schoolUId: cleanSchoolId(formData.schoolUId),
        email: formData.email.trim().toLowerCase(),
        pin: tempPin
      };

      const response = await api.post('/admin/treasury/users/register', payload);

      if (response.success) {
        setRegisteredUser({ ...response.user, emailSent: response.emailSent });
        setStep(4);
        toast.success('User registered successfully!');

        if (response.emailSent) {
          toast.info('Temporary PIN has been sent to the user\'s email');
        } else {
          toast.warning('Could not send email. Please inform the user of their temporary PIN manually.');
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop - covers everything including header */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div
        style={{
          background: isDarkMode ? '#1E2347' : '#FFFFFF',
          borderColor: theme.border.primary
        }}
        className="relative rounded-2xl shadow-2xl border w-full max-w-2xl overflow-hidden animate-fadeIn"
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

        {/* Progress Steps */}
        <div
          style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : 'rgba(243,244,246,0.5)' }}
          className="flex items-center justify-center gap-3 py-4 px-6"
        >
          {[
            { num: 1, label: 'RFID' },
            { num: 2, label: 'Details' },
            { num: 3, label: 'Summary' },
            { num: 4, label: 'Complete' }
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={`flex items-center gap-2 ${step >= s.num ? '' : 'opacity-40'}`}>
                <div
                  style={{
                    background: step >= s.num ? theme.accent.primary : 'transparent',
                    borderColor: step >= s.num ? theme.accent.primary : theme.border.primary,
                    color: step >= s.num ? (isDarkMode ? '#181D40' : '#FFFFFF') : theme.text.secondary
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 text-sm"
                >
                  {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                </div>
                <span
                  style={{ color: step >= s.num ? theme.accent.primary : theme.text.secondary }}
                  className="hidden sm:inline font-medium text-sm"
                >
                  {s.label}
                </span>
              </div>
              {i < 3 && (
                <div
                  style={{ background: step > s.num ? theme.accent.primary : theme.border.primary }}
                  className="w-8 h-0.5 rounded"
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">

          {/* STEP 1: RFID Scan */}
          {step === 1 && (
            <div className="space-y-5">
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
                    Format will be automatically converted to Hex (little-endian).
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
                {rfidInput && (
                  <p style={{ color: theme.text.tertiary }} className="text-xs mt-2">
                    Will be stored as: <span className="font-mono">{normalizeRfidHex(rfidInput)}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
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
                  onClick={handleRfidCheck}
                  disabled={!rfidInput.trim() || checking}
                  style={{
                    background: theme.accent.primary,
                    color: isDarkMode ? '#181D40' : '#FFFFFF'
                  }}
                  className="flex-1 py-3 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {checking ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Checking...</>
                  ) : (
                    <>Continue →</>
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
                className="p-3 rounded-xl border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CreditCard style={{ color: theme.accent.primary }} className="w-5 h-5" />
                  <div>
                    <p style={{ color: theme.text.secondary }} className="text-xs">RFID Tag</p>
                    <p style={{ color: theme.text.primary }} className="font-mono font-semibold">
                      {maskRfid(normalizedRfid)}
                    </p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label style={{ color: theme.text.primary }} className="font-semibold mb-1.5 block text-sm">
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
                    className="w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
                <div>
                  <label style={{ color: theme.text.primary }} className="font-semibold mb-1.5 block text-sm">
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
                    className="w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
                <div>
                  <label style={{ color: theme.text.primary }} className="font-semibold mb-1.5 block text-sm">
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
                    className="w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label style={{ color: theme.text.primary }} className="font-semibold mb-1.5 block text-sm">
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
                      className="py-2.5 rounded-xl border font-semibold capitalize transition-all hover:opacity-90"
                    >
                      {role === 'student' ? '🎓 ' : '👔 '}{role}
                    </button>
                  ))}
                </div>
              </div>

              {/* School ID */}
              <div>
                <label style={{ color: theme.text.primary }} className="font-semibold mb-1.5 block text-sm">
                  School ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IdCard style={{ color: theme.text.tertiary }} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-400/50 font-mono"
                  />
                </div>
                <p style={{ color: theme.text.tertiary }} className="text-xs mt-1">
                  Format: ####-###### (will be stored as 10 digits)
                </p>
              </div>

              {/* Email */}
              <div>
                <label style={{ color: theme.text.primary }} className="font-semibold mb-1.5 block text-sm">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail style={{ color: theme.text.tertiary }} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
                <p style={{ color: theme.text.tertiary }} className="text-xs mt-1">
                  Temporary PIN will be sent to this email
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    if (prefillRfid) {
                      handleClose();
                    } else {
                      setStep(1);
                    }
                  }}
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
                    <><Loader2 className="w-5 h-5 animate-spin" /> Validating...</>
                  ) : (
                    <>Review →</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Summary */}
          {step === 3 && (
            <div className="space-y-5">
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
                    Please verify all information before registering.
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
                  { label: 'RFID Tag', value: maskRfid(normalizedRfid) },
                  { label: 'Full Name', value: `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}` },
                  { label: 'User Type', value: formData.role, badge: true },
                  { label: 'School ID', value: formData.schoolUId },
                  { label: 'Email', value: formData.email }
                ].map((item, idx) => (
                  <div
                    key={item.label}
                    style={{ borderColor: theme.border.primary }}
                    className={`flex justify-between items-center px-4 py-3 ${idx < 4 ? 'border-b' : ''}`}
                  >
                    <span style={{ color: theme.text.secondary }} className="text-sm">{item.label}</span>
                    {item.badge ? (
                      <span
                        style={{
                          background: formData.role === 'student' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)',
                          color: formData.role === 'student' ? '#3B82F6' : '#A855F7'
                        }}
                        className="px-3 py-1 rounded-full text-sm font-semibold capitalize"
                      >
                        {formData.role === 'student' ? '🎓 ' : '👔 '}{item.value}
                      </span>
                    ) : (
                      <span style={{ color: theme.text.primary }} className="font-semibold text-sm">
                        {item.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  borderColor: 'rgba(16,185,129,0.3)'
                }}
                className="p-4 rounded-xl border"
              >
                <p className="font-semibold text-sm text-emerald-500">
                  📧 What happens next?
                </p>
                <ul style={{ color: theme.text.secondary }} className="text-sm mt-2 space-y-1">
                  <li>• A temporary PIN will be generated and emailed to the user</li>
                  <li>• The user must log in and change their PIN to activate</li>
                  <li>• Status: <span className="font-semibold text-yellow-500">Inactive</span> until PIN is changed</li>
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
                  ← Edit
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 bg-emerald-500 text-white"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Registering...</>
                  ) : (
                    <><UserPlus className="w-5 h-5" /> Register User</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <div className="text-center space-y-5">
              <div style={{ background: 'rgba(16,185,129,0.2)' }} className="w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-emerald-500">Registration Successful!</h3>
                <p style={{ color: theme.text.secondary }} className="mt-2">
                  {registeredUser?.emailSent
                    ? 'A temporary PIN has been sent to the user\'s email.'
                    : 'User registered but email could not be sent.'}
                </p>
              </div>

              {/* Email Status */}
              {registeredUser && !registeredUser.emailSent && (
                <div
                  style={{
                    background: 'rgba(251,191,36,0.15)',
                    borderColor: 'rgba(251,191,36,0.4)'
                  }}
                  className="p-4 rounded-xl border flex items-start gap-3 text-left"
                >
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-500" />
                  <div>
                    <p className="font-semibold text-yellow-500 text-sm">Email Not Sent</p>
                    <p style={{ color: theme.text.secondary }} className="text-sm mt-1">
                      Please inform the user of their temporary PIN manually or ask them to request a new PIN through the app.
                    </p>
                  </div>
                </div>
              )}

              {registeredUser && registeredUser.emailSent && (
                <div
                  style={{
                    background: 'rgba(16,185,129,0.15)',
                    borderColor: 'rgba(16,185,129,0.4)'
                  }}
                  className="p-4 rounded-xl border flex items-start gap-3 text-left"
                >
                  <Mail className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
                  <div>
                    <p className="font-semibold text-emerald-500 text-sm">Email Sent Successfully</p>
                    <p style={{ color: theme.text.secondary }} className="text-sm mt-1">
                      The user should check their inbox (and spam folder) for the temporary PIN.
                    </p>
                  </div>
                </div>
              )}

              {registeredUser && (
                <div
                  style={{
                    background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                    borderColor: theme.border.primary
                  }}
                  className="rounded-xl border p-5 text-left space-y-2"
                >
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }} className="text-sm">User ID</span>
                    <span style={{ color: theme.text.primary }} className="font-mono font-semibold">
                      {registeredUser.userId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }} className="text-sm">Name</span>
                    <span style={{ color: theme.text.primary }} className="font-semibold">
                      {registeredUser.firstName} {registeredUser.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }} className="text-sm">School ID</span>
                    <span style={{ color: theme.text.primary }} className="font-mono">
                      {registeredUser.schoolUId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }} className="text-sm">Email</span>
                    <span style={{ color: theme.text.primary }} className="text-sm">
                      {registeredUser.email}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t" style={{ borderColor: theme.border.primary }}>
                    <span style={{ color: theme.text.secondary }} className="text-sm">Status</span>
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
