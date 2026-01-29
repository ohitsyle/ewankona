// src/pages/admin/Treasury/RegistrationForm.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';

export default function RegistrationForm() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const rfidInputRef = useRef(null);

  const [formData, setFormData] = useState({
    rfidUId: '',
    schoolUId: '',
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    role: 'student',
    pin: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.rfidUId.trim()) {
      toast.error('RFID is required');
      return false;
    }
    if (!formData.schoolUId.trim()) {
      toast.error('School ID is required');
      return false;
    }
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!formData.pin || formData.pin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const data = await api.post('/admin/treasury/register', {
        rfidUId: formData.rfidUId.trim(),
        schoolUId: formData.schoolUId.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.middleName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        pin: formData.pin
      });

      if (data?.success) {
        setRegisteredUser(data.user);
        setSuccess(true);
        toast.success('User registered successfully!');
      } else {
        toast.error(data?.message || 'Failed to register user');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to register user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewRegistration = () => {
    setFormData({
      rfidUId: '',
      schoolUId: '',
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      role: 'student',
      pin: ''
    });
    setSuccess(false);
    setRegisteredUser(null);
    rfidInputRef.current?.focus();
  };

  // Success View
  if (success) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div style={{ borderColor: theme.border.primary }} className="mb-[30px] border-b-2 pb-5">
          <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
            <span>✅</span> Registration Complete
          </h2>
          <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
            New user has been registered successfully
          </p>
        </div>

        <div className="max-w-md mx-auto w-full">
          <div style={{ background: theme.bg.card, borderColor: 'rgba(16,185,129,0.5)' }} className="rounded-2xl border-2 overflow-hidden">
            {/* Success Header */}
            <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }} className="p-6 text-center">
              <div className="text-5xl mb-3">✓</div>
              <h3 className="text-white text-xl font-bold">Registration Successful!</h3>
            </div>

            {/* User Details */}
            <div className="p-6 space-y-4">
              <div style={{ borderColor: theme.border.primary }} className="flex justify-between items-center py-3 border-b">
                <span style={{ color: theme.text.secondary }} className="text-sm">Name</span>
                <span style={{ color: theme.text.primary }} className="font-semibold">
                  {registeredUser?.firstName} {registeredUser?.lastName}
                </span>
              </div>
              <div style={{ borderColor: theme.border.primary }} className="flex justify-between items-center py-3 border-b">
                <span style={{ color: theme.text.secondary }} className="text-sm">School ID</span>
                <span style={{ color: theme.text.primary }} className="font-semibold">{registeredUser?.schoolUId}</span>
              </div>
              <div style={{ borderColor: theme.border.primary }} className="flex justify-between items-center py-3 border-b">
                <span style={{ color: theme.text.secondary }} className="text-sm">Email</span>
                <span style={{ color: theme.text.secondary }} className="text-sm">{registeredUser?.email}</span>
              </div>
              <div style={{ borderColor: theme.border.primary }} className="flex justify-between items-center py-3 border-b">
                <span style={{ color: theme.text.secondary }} className="text-sm">Role</span>
                <span style={{ color: theme.text.primary }} className="capitalize">{registeredUser?.role}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span style={{ color: theme.text.secondary }} className="text-sm">Balance</span>
                <span style={{ color: theme.accent.primary }} className="font-bold">₱0.00</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleNewRegistration}
                  style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                  className="flex-1 py-3 rounded-xl font-semibold border hover:opacity-80 transition"
                >
                  Register Another
                </button>
                <button
                  onClick={() => navigate('/admin/treasury/cashin')}
                  style={{ background: theme.accent.primary, color: theme.accent.secondary }}
                  className="flex-1 py-3 rounded-xl font-bold hover:opacity-90 transition"
                >
                  Cash In Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-[30px] border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>📝</span> Register User
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          Create a new NUCash account for a student or employee
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - IDs & Personal Info */}
        <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border">
          <h3 style={{ color: theme.text.primary }} className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>🪪</span> Identification
          </h3>

          {/* RFID & School ID */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
                RFID <span className="text-red-500">*</span>
              </label>
              <input
                ref={rfidInputRef}
                type="text"
                value={formData.rfidUId}
                onChange={(e) => handleInputChange('rfidUId', e.target.value)}
                placeholder="Scan or enter RFID"
                style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full px-4 py-3 rounded-xl border font-mono text-sm focus:outline-none"
                autoFocus
              />
            </div>
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
                School ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.schoolUId}
                onChange={(e) => handleInputChange('schoolUId', e.target.value)}
                placeholder="e.g., 2024-12345"
                style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Juan"
                style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none"
              />
            </div>
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Dela Cruz"
                style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Middle Name */}
          <div className="mb-4">
            <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
              Middle Name
            </label>
            <input
              type="text"
              value={formData.middleName}
              onChange={(e) => handleInputChange('middleName', e.target.value)}
              placeholder="Optional"
              style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="juan.delacruz@nu.edu.ph"
              style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column - Role & PIN */}
        <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border">
          <h3 style={{ color: theme.text.primary }} className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>⚙️</span> Account Settings
          </h3>

          {/* User Role */}
          <div className="mb-6">
            <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-3">
              User Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['student', 'employee'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleInputChange('role', type)}
                  style={{
                    background: formData.role === type ? theme.accent.primary : theme.bg.tertiary,
                    color: formData.role === type ? theme.accent.secondary : theme.text.primary,
                    borderColor: theme.border.primary
                  }}
                  className="py-4 rounded-xl font-bold text-sm border capitalize hover:opacity-80 transition"
                >
                  {type === 'student' ? '🎓 Student' : '👔 Employee'}
                </button>
              ))}
            </div>
          </div>

          {/* PIN */}
          <div className="mb-6">
            <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
              PIN <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={formData.pin}
              onChange={(e) => handleInputChange('pin', e.target.value)}
              placeholder="Enter 4-6 digit PIN"
              maxLength={6}
              style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none text-center tracking-widest"
            />
            <p style={{ color: theme.text.muted }} className="text-xs mt-2">
              User will use this PIN to login
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => navigate('/admin/treasury/dashboard')}
              style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
              className="flex-1 py-4 rounded-xl font-bold text-sm border hover:opacity-80 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ background: theme.accent.primary, color: theme.accent.secondary }}
              className="flex-1 py-4 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
