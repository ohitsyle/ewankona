// client/src/components/AccountManager/ChangePin.jsx
import React, { useState, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

export default function ChangePin() {
  const { backendUrl, userData, getUserData } = useContext(AppContext);
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    oldPin: '',
    newPin: '',
    confirmPin: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (field, value) => {
    if (field !== 'otp' && !/^\d*$/.test(value)) return;
    if ((field === 'oldPin' || field === 'newPin' || field === 'confirmPin') && value.length > 6) return;
    if (field === 'otp' && value.length > 6) return;

    setFormData({
      ...formData,
      [field]: value
    });
    setError('');
  };

  const handleSendOtp = async () => {
    if (!formData.oldPin || formData.oldPin.length !== 6) {
      setError('Old PIN must be exactly 6 digits');
      return;
    }

    if (!formData.newPin || formData.newPin.length !== 6) {
      setError('New PIN must be exactly 6 digits');
      return;
    }

    if (!formData.confirmPin || formData.confirmPin.length !== 6) {
      setError('Please confirm your new PIN');
      return;
    }

    if (formData.newPin !== formData.confirmPin) {
      setError('New PIN and Confirm PIN do not match');
      return;
    }

    if (formData.oldPin === formData.newPin) {
      setError('New PIN must be different from old PIN');
      return;
    }

    if (!userData?.email) {
      setError('User email not found');
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(
        `${backendUrl}/api/auth/send-reset-otp`,
        { email: userData.email },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success("OTP sent to your email!");
        setOtpSent(true);
        setStep(2);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError('OTP must be exactly 6 digits');
      return;
    }

    try {
      setLoading(true);

      // Verify OTP first
      const verifyRes = await axios.post(
        `${backendUrl}/api/auth/verify-reset-otp`,
        { email: userData.email, otp: formData.otp },
        { withCredentials: true }
      );

      if (!verifyRes.data.success) {
        setError("Invalid or expired OTP");
        return;
      }

      // Change PIN
      const { data } = await axios.post(
        `${backendUrl}/api/auth/change-pin-with-otp`,
        {
          currentPin: formData.oldPin,
          newPin: formData.newPin,
          confirmPin: formData.confirmPin,
          email: userData.email,
          otp: formData.otp
        },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success("PIN changed successfully!");
        setStep(3);
        await getUserData();
      } else {
        setError(data.message || "Failed to change PIN");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change PIN");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({ oldPin: '', newPin: '', confirmPin: '', otp: '' });
    setError('');
    setOtpSent(false);
    setShowConfirm(false);
  };

  return (
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
          <span>🔐</span> Change PIN
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
                Confirm New PIN (6 digits) *
              </label>
              <input
                type="password"
                value={formData.confirmPin}
                onChange={(e) => handleChange('confirmPin', e.target.value)}
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
              onClick={handleSendOtp}
              disabled={loading || formData.oldPin.length !== 6 || formData.newPin.length !== 6 || formData.confirmPin.length !== 6}
              style={{
                width: '100%',
                padding: '14px',
                background: loading || formData.oldPin.length !== 6 || formData.newPin.length !== 6 || formData.confirmPin.length !== 6
                  ? 'rgba(255, 212, 28, 0.3)'
                  : '#FFD41C',
                color: '#181D40',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading || formData.oldPin.length !== 6 || formData.newPin.length !== 6 || formData.confirmPin.length !== 6
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
                  <div className="spinner" />
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
                Check your email: {userData?.email}
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
              <span>Change PIN</span>
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
              PIN Changed Successfully!
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'rgba(251, 251, 251, 0.7)',
              marginBottom: '32px'
            }}>
              Your PIN has been updated. Please use your new PIN for future logins.
            </p>
            <button
              onClick={resetForm}
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
                Confirm PIN Change
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'rgba(251, 251, 251, 0.7)',
                marginBottom: '24px'
              }}>
                Are you sure you want to change your PIN? You will need to use the new PIN for future logins.
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
                    handleChangePin();
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
          .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(24, 29, 64, 0.3);
            border-top-color: #181D40;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}