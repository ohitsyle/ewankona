// src/admin/components/Profile/ChangePasswordModal.jsx
// Modal for changing admin password with 6-digit PIN and OTP verification

import React, { useState } from 'react';

export default function ChangePasswordModal({ isOpen, onClose, adminData }) {
  const [step, setStep] = useState(1); // 1: Enter PINs, 2: Enter OTP, 3: Success
  const [formData, setFormData] = useState({
    oldPin: '',
    newPin: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

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
      const response = await fetch('http://localhost:3000/api/admin-auth/send-otp', {
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
      const response = await fetch('http://localhost:3000/api/admin-auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          oldPassword: formData.oldPin,
          newPassword: formData.newPin,
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

  const handleClose = () => {
    setStep(1);
    setFormData({ oldPin: '', newPin: '', otp: '' });
    setError('');
    setOtpSent(false);
    setShowConfirm(false);
    onClose();
  };

  const renderStep1 = () => (
    <>
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
    </>
  );

  const renderStep2 = () => (
    <>
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
    </>
  );

  const renderStep3 = () => (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
      <h3 style={{
        fontSize: '20px',
        fontWeight: 700,
        color: '#22C55E',
        marginBottom: '12px'
      }}>
        Password Changed Successfully!
      </h3>
      <p style={{
        fontSize: '14px',
        color: 'rgba(251, 251, 251, 0.7)',
        marginBottom: '24px'
      }}>
        Your password has been updated. Please use your new PIN for future logins.
      </p>
      <button
        onClick={handleClose}
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
        Close
      </button>
    </div>
  );

  return (
    <>
      {/* Modal Overlay */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 18, 39, 0.9)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease'
        }}
      >
        {/* Modal Content */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1227 100%)',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '2px solid rgba(255, 212, 28, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            animation: 'slideIn 0.3s ease'
          }}
        >
          {/* Modal Header */}
          <div style={{
            padding: '24px',
            borderBottom: '2px solid rgba(255, 212, 28, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#FFD41C',
                margin: '0 0 4px 0'
              }}>
                Change Password
              </h2>
              <p style={{
                fontSize: '12px',
                color: 'rgba(251, 251, 251, 0.6)',
                margin: 0
              }}>
                {step === 1 && 'Enter your old and new PIN'}
                {step === 2 && 'Verify with OTP'}
                {step === 3 && 'Password updated'}
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: 'none',
                color: '#EF4444',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              ×
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '24px' }}>
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
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Step Content */}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>

          {/* Step Indicator (only for steps 1 and 2) */}
          {step !== 3 && (
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 212, 28, 0.2)',
              display: 'flex',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {[1, 2].map((s) => (
                <div
                  key={s}
                  style={{
                    width: step >= s ? '40px' : '10px',
                    height: '4px',
                    background: step >= s ? '#FFD41C' : 'rgba(255, 212, 28, 0.2)',
                    borderRadius: '2px',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

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
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}