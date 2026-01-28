// src/admin/components/Profile/ProfilePage.jsx
// Full page for admin profile with personal info and password management

import React, { useState } from 'react';

export default function ProfilePage({ adminData }) {
  const [activeSection, setActiveSection] = useState('personal'); // 'personal' or 'security'
  const [step, setStep] = useState(1); // For password change: 1: Enter PINs, 2: Enter OTP, 3: Success
  const [formData, setFormData] = useState({
    oldPin: '',
    newPin: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (field, value) => {
    // Only allow digits
    if (field !== 'otp' && !/^\d*$/.test(value)) return;

    // Limit to 6 digits for PINs
    if ((field === 'oldPin' || field === 'newPin') && value.length > 6) return;

    // Limit to 6 digits for OTP
    if (field === 'otp' && value.length > 6) return;

    setFormData({
      ...formData,
      [field]: value
    });
    setError('');
  };

  const handleSendOTP = async () => {
    if (!formData.oldPin || formData.oldPin.length !== 6) {
      setError('Old PIN must be exactly 6 digits');
      return;
    }

    if (!formData.newPin || formData.newPin.length !== 6) {
      setError('New PIN must be exactly 6 digits');
      return;
    }

    if (formData.oldPin === formData.newPin) {
      setError('New PIN must be different from old PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/admin/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          email: adminData.email,
          purpose: 'password_change'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      setStep(2);
      setError('');
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError('OTP must be exactly 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/admin/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          oldPin: formData.oldPin,
          newPin: formData.newPin,
          otp: formData.otp
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setStep(3);
      setError('');
    } catch (err) {
      console.error('Change password error:', err);
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordForm = () => {
    setStep(1);
    setFormData({ oldPin: '', newPin: '', otp: '' });
    setError('');
    setOtpSent(false);
    setShowConfirm(false);
  };

  const getInitials = () => {
    if (!adminData) return '?';
    const first = adminData.firstName?.[0] || '';
    const last = adminData.lastName?.[0] || '';
    return (first + last).toUpperCase();
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      motorpool: 'Motorpool Admin',
      merchant: 'Merchant Admin',
      treasury: 'Treasury Admin',
      accounting: 'Accounting Admin',
      sysad: 'System Administrator'
    };
    return roleMap[role] || role;
  };

  const renderPersonalInfo = () => (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '16px',
      border: '1px solid rgba(255,212,28,0.2)',
      overflow: 'hidden'
    }}>
      {/* Profile Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,212,28,0.2) 0%, rgba(255,212,28,0.05) 100%)',
        padding: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        borderBottom: '1px solid rgba(255,212,28,0.2)'
      }}>
        {/* Avatar */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFD41C 0%, #F59E0B 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          fontWeight: 800,
          color: '#181D40',
          boxShadow: '0 0 0 6px rgba(255,212,28,0.2)'
        }}>
          {getInitials()}
        </div>

        {/* Name and Role */}
        <div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#FBFBFB',
            margin: '0 0 8px 0'
          }}>
            {adminData?.firstName} {adminData?.lastName}
          </h2>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            background: 'rgba(255,212,28,0.2)',
            border: '1px solid rgba(255,212,28,0.4)',
            borderRadius: '20px',
            color: '#FFD41C',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {getRoleLabel(adminData?.role)}
          </div>
        </div>
      </div>

      {/* Personal Info Grid */}
      <div style={{ padding: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px'
        }}>
          <InfoField label="Admin ID" value={adminData?.adminId} />
          <InfoField label="School UID" value={adminData?.schoolUId} />
          <InfoField label="Email Address" value={adminData?.email} />
          <InfoField label="RFID UID" value={adminData?.rfidUId} />
          <InfoField label="First Name" value={adminData?.firstName} />
          <InfoField label="Last Name" value={adminData?.lastName} />
          <InfoField
            label="Account Status"
            value={adminData?.isActive ? 'Active' : 'Inactive'}
            highlight={adminData?.isActive ? 'success' : 'error'}
          />
          <InfoField
            label="Verified"
            value={adminData?.verified ? 'Yes' : 'No'}
            highlight={adminData?.verified ? 'success' : 'warning'}
          />
          <InfoField
            label="Last Login"
            value={adminData?.lastLogin ? new Date(adminData.lastLogin).toLocaleString() : 'Never'}
            fullWidth
          />
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '16px',
      border: '1px solid rgba(255,212,28,0.2)',
      overflow: 'hidden'
    }}>
      {/* Security Header */}
      <div style={{
        background: 'rgba(255,212,28,0.05)',
        padding: '24px 32px',
        borderBottom: '1px solid rgba(255,212,28,0.2)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#FFD41C',
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>🔐</span> Security Settings
        </h3>
        <p style={{
          fontSize: '14px',
          color: 'rgba(251,251,251,0.6)',
          margin: 0
        }}>
          Update your 6-digit PIN for enhanced security
        </p>
      </div>

      <div style={{ padding: '32px' }}>

      {/* Error Alert */}
      {error && (
        <div style={{
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
        }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {step === 1 && (
        <div style={{ maxWidth: '500px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#FFD41C',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Enter Old PIN (6 digits) *
            </label>
            <input
              type="password"
              value={formData.oldPin}
              onChange={(e) => handleChange('oldPin', e.target.value)}
              disabled={loading}
              placeholder="••••••"
              maxLength="6"
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid rgba(255, 212, 28, 0.3)',
                borderRadius: '10px',
                background: 'rgba(251, 251, 251, 0.05)',
                color: 'rgba(251, 251, 251, 0.9)',
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
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#FFD41C',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Enter New PIN (6 digits) *
            </label>
            <input
              type="password"
              value={formData.newPin}
              onChange={(e) => handleChange('newPin', e.target.value)}
              disabled={loading}
              placeholder="••••••"
              maxLength="6"
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid rgba(255, 212, 28, 0.3)',
                borderRadius: '10px',
                background: 'rgba(251, 251, 251, 0.05)',
                color: 'rgba(251, 251, 251, 0.9)',
                fontSize: '24px',
                fontWeight: 700,
                letterSpacing: '12px',
                textAlign: 'center',
                boxSizing: 'border-box',
                fontFamily: 'monospace'
              }}
            />
            <p style={{
              fontSize: '11px',
              color: 'rgba(251, 251, 251, 0.5)',
              marginTop: '8px',
              marginBottom: 0
            }}>
              Must be different from old PIN
            </p>
          </div>

          <button
            onClick={handleSendOTP}
            disabled={loading || formData.oldPin.length !== 6 || formData.newPin.length !== 6}
            style={{
              width: '100%',
              padding: '14px',
              background: loading || formData.oldPin.length !== 6 || formData.newPin.length !== 6
                ? 'rgba(255, 212, 28, 0.3)'
                : '#FFD41C',
              color: '#181D40',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading || formData.oldPin.length !== 6 || formData.newPin.length !== 6
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
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(24, 29, 64, 0.3)',
                  borderTopColor: '#181D40',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
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

      {step === 2 && (
        <div style={{ maxWidth: '500px' }}>
          <div style={{
            padding: '16px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📧</div>
            <div style={{
              fontSize: '14px',
              color: '#3B82F6',
              fontWeight: 600,
              marginBottom: '4px'
            }}>
              OTP Sent Successfully!
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(251, 251, 251, 0.7)'
            }}>
              Check your email: {adminData?.email}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#FFD41C',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Enter OTP (6 digits) *
            </label>
            <input
              type="text"
              value={formData.otp}
              onChange={(e) => handleChange('otp', e.target.value)}
              disabled={loading}
              placeholder="______"
              maxLength="6"
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid rgba(255, 212, 28, 0.3)',
                borderRadius: '10px',
                background: 'rgba(251, 251, 251, 0.05)',
                color: 'rgba(251, 251, 251, 0.9)',
                fontSize: '24px',
                fontWeight: 700,
                letterSpacing: '12px',
                textAlign: 'center',
                boxSizing: 'border-box',
                fontFamily: 'monospace'
              }}
            />
            <p style={{
              fontSize: '11px',
              color: 'rgba(251, 251, 251, 0.5)',
              marginTop: '8px',
              marginBottom: 0
            }}>
              OTP expires in 10 minutes
            </p>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={loading || formData.otp.length !== 6}
            style={{
              width: '100%',
              padding: '14px',
              background: loading || formData.otp.length !== 6
                ? 'rgba(255, 212, 28, 0.3)'
                : '#FFD41C',
              color: '#181D40',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading || formData.otp.length !== 6
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
            <span>🔐</span>
            <span>Change Password</span>
          </button>
        </div>
      )}

      {step === 3 && (
        <div style={{ textAlign: 'center', padding: '40px 0', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>✅</div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#22C55E',
            marginBottom: '12px'
          }}>
            Password Changed Successfully!
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'rgba(251, 251, 251, 0.7)',
            marginBottom: '32px'
          }}>
            Your password has been updated. Please use your new PIN for future logins.
          </p>
          <button
            onClick={resetPasswordForm}
            style={{
              padding: '14px 32px',
              background: '#FFD41C',
              color: '#181D40',
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

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
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
              background: '#1a1f3a',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              border: '2px solid rgba(255, 212, 28, 0.3)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#FBFBFB',
              marginBottom: '12px'
            }}>
              Confirm Password Change
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'rgba(251, 251, 251, 0.7)',
              marginBottom: '24px'
            }}>
              Are you sure you want to change your password? You will need to use the new PIN for future logins.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(251, 251, 251, 0.1)',
                  color: 'rgba(251, 251, 251, 0.7)',
                  border: '1px solid rgba(251, 251, 251, 0.2)',
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
                  setShowConfirm(false);
                  handleChangePassword();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#FFD41C',
                  color: '#181D40',
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

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '30px', borderBottom: '2px solid rgba(255,212,28,0.2)', paddingBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#FFD41C', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>👤</span> My Profile
        </h2>
        <p style={{ fontSize: '13px', color: 'rgba(251,251,251,0.6)', margin: 0 }}>
          Manage your account information and security settings
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '30px'
      }}>
        <button
          onClick={() => setActiveSection('personal')}
          style={{
            padding: '12px 24px',
            background: activeSection === 'personal'
              ? 'rgba(255, 212, 28, 0.15)'
              : 'rgba(30, 35, 71, 0.4)',
            border: activeSection === 'personal'
              ? '2px solid rgba(255, 212, 28, 0.4)'
              : '2px solid rgba(255, 212, 28, 0.1)',
            borderRadius: '12px',
            color: activeSection === 'personal'
              ? '#FFD41C'
              : 'rgba(251, 251, 251, 0.7)',
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
            background: activeSection === 'security'
              ? 'rgba(255, 212, 28, 0.15)'
              : 'rgba(30, 35, 71, 0.4)',
            border: activeSection === 'security'
              ? '2px solid rgba(255, 212, 28, 0.4)'
              : '2px solid rgba(255, 212, 28, 0.1)',
            borderRadius: '12px',
            color: activeSection === 'security'
              ? '#FFD41C'
              : 'rgba(251, 251, 251, 0.7)',
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
      {activeSection === 'personal' && renderPersonalInfo()}
      {activeSection === 'security' && renderSecuritySettings()}
    </div>
  );
}

// Info Field Component
function InfoField({ label, value, highlight, fullWidth }) {
  const getHighlightColor = () => {
    if (highlight === 'success') return { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', color: '#22C55E' };
    if (highlight === 'error') return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', color: '#EF4444' };
    if (highlight === 'warning') return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', color: '#F59E0B' };
    return null;
  };

  const highlightStyle = getHighlightColor();

  return (
    <div style={{
      gridColumn: fullWidth ? '1 / -1' : 'span 1'
    }}>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontSize: '11px',
        fontWeight: 700,
        color: 'rgba(255,212,28,0.8)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </label>
      <div style={{
        padding: '12px 16px',
        background: highlightStyle ? highlightStyle.bg : 'rgba(251,251,251,0.05)',
        border: `1px solid ${highlightStyle ? highlightStyle.border : 'rgba(255,212,28,0.1)'}`,
        borderRadius: '8px',
        color: highlightStyle ? highlightStyle.color : 'rgba(251,251,251,0.9)',
        fontSize: '15px',
        fontWeight: highlight ? 700 : 500
      }}>
        {value || 'N/A'}
      </div>
    </div>
  );
}
