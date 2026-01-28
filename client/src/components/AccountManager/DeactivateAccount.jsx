// client/src/components/AccountManager/DeactivateAccount.jsx
import React, { useState, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";

export default function DeactivateAccount() {
  const { backendUrl, userData, logout } = useContext(AppContext);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      setError("");
      
      const { data } = await axios.post(
        `${backendUrl}/api/user/deactivate/send-otp`,
        {},
        { withCredentials: true }
      );

      if (data.success) {
        toast.success("OTP sent to your email");
        setOtpSent(true);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!otp || otp.length !== 6) {
      setError("OTP must be exactly 6 digits");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const { data } = await axios.post(
        `${backendUrl}/api/user/deactivate`,
        { otp },
        { withCredentials: true }
      );

      if (data.success) {
        await logout();
        toast.success("Account deactivated successfully");
      } else {
        setError(data.message || "Failed to deactivate account");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to deactivate account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '16px',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      overflow: 'hidden'
    }}>
      {/* Danger Header */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.05)',
        padding: '24px 32px',
        borderBottom: '1px solid rgba(239, 68, 68, 0.2)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#EF4444',
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>⚠️</span> Deactivate Account
        </h3>
        <p style={{
          fontSize: '14px',
          color: 'rgba(251,251,251,0.6)',
          margin: 0
        }}>
          This action will disable access until reactivated by an administrator
        </p>
      </div>

      <div style={{ padding: '32px' }}>
        {/* Warning */}
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
          <span>This action will deactivate your account and log you out</span>
        </div>

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
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}

        <div style={{ maxWidth: '500px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#EF4444',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Email Verification
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  if (!/^\d*$/.test(e.target.value)) return;
                  if (e.target.value.length > 6) return;
                  setOtp(e.target.value);
                  setError('');
                }}
                disabled={loading || !otpSent}
                placeholder="Enter OTP"
                maxLength="6"
                style={{
                  flex: 1,
                  padding: '14px',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(251, 251, 251, 0.05)',
                  color: 'rgba(251, 251, 251, 0.9)',
                  fontSize: '16px',
                  fontWeight: 600,
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={handleSendOtp}
                disabled={loading || otpSent}
                style={{
                  padding: '14px 20px',
                  background: otpSent ? 'rgba(251, 251, 251, 0.1)' : 'rgba(239, 68, 68, 0.2)',
                  color: otpSent ? 'rgba(251, 251, 251, 0.5)' : '#EF4444',
                  border: `1px solid ${otpSent ? 'rgba(251, 251, 251, 0.2)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: otpSent ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {otpSent ? 'OTP Sent' : 'Send OTP'}
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={loading || !otpSent}
            style={{
              width: '100%',
              padding: '14px',
              background: loading || !otpSent ? 'rgba(239, 68, 68, 0.3)' : '#EF4444',
              color: loading || !otpSent ? 'rgba(251, 251, 251, 0.5)' : '#FBFBFB',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading || !otpSent ? 'not-allowed' : 'pointer',
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
                <span>Deactivating...</span>
              </>
            ) : (
              'Deactivate Account'
            )}
          </button>
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
                border: '2px solid rgba(239, 68, 68, 0.3)',
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
                Confirm Account Deactivation
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'rgba(251, 251, 251, 0.7)',
                marginBottom: '24px'
              }}>
                This will disable your account access until an administrator reactivates it. Are you sure?
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
                    handleDeactivate();
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#EF4444',
                    color: '#FBFBFB',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Deactivate
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
            border: 2px solid rgba(251, 251, 251, 0.3);
            border-top-color: #FBFBFB;
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