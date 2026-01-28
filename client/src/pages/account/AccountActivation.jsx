// client/src/pages/account/AccountActivation.jsx
// Account activation flow for new users and admins
// Flow: Terms & Conditions → New PIN → OTP Verification → Success

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:3000/api";

// Terms and Conditions content
const TERMS_CONTENT = {
  admin: {
    title: "Administrator Terms and Conditions",
    sections: [
      {
        title: "1. Administrative Responsibilities",
        content: "As an administrator of the NUCash system, you are entrusted with managing financial transactions, user accounts, and system configurations. You agree to perform your duties with utmost integrity and professionalism."
      },
      {
        title: "2. Data Privacy and Confidentiality",
        content: "You acknowledge that you will have access to sensitive user information including personal data and financial records. You agree to maintain strict confidentiality and comply with the Data Privacy Act of 2012 (Republic Act No. 10173)."
      },
      {
        title: "3. Security Protocols",
        content: "You agree to follow all security protocols including: keeping your PIN confidential, logging out after each session, reporting any suspicious activities immediately, and never sharing your credentials with others."
      },
      {
        title: "4. Transaction Handling",
        content: "All financial transactions must be processed accurately and recorded properly. Any discrepancies must be reported immediately to your supervisor. Unauthorized transactions or fund manipulation is strictly prohibited and may result in disciplinary action."
      },
      {
        title: "5. System Usage",
        content: "The NUCash administrative system is to be used solely for authorized purposes. Personal use, unauthorized access to other accounts, or any form of system abuse is prohibited."
      },
      {
        title: "6. Liability",
        content: "You understand that any violation of these terms may result in suspension of access, disciplinary action, and potential legal consequences. National University reserves the right to audit all administrative activities."
      }
    ]
  },
  user: {
    title: "NUCash User Agreement",
    sections: [
      {
        title: "1. Account Registration",
        content: "By activating your NUCash account, you confirm that all information provided during registration is accurate and complete. You agree to keep your account information up to date."
      },
      {
        title: "2. PIN Security",
        content: "Your 6-digit PIN is your primary authentication method. You are responsible for keeping your PIN confidential. Never share your PIN with anyone, including NUCash staff. We will never ask for your PIN."
      },
      {
        title: "3. RFID Card Usage",
        content: "Your NUCash account is linked to your RFID card. Report any lost or stolen cards immediately to the Treasury Office. You are responsible for all transactions made with your card until it is reported lost."
      },
      {
        title: "4. Transaction Terms",
        content: "All transactions are final once processed. Your NUCash balance can be used for shuttle fare payments, merchant purchases, and other campus services. Negative balances up to the allowed limit may be permitted."
      },
      {
        title: "5. Privacy Policy",
        content: "National University collects and processes your personal data in accordance with the Data Privacy Act of 2012. Your transaction history and account information are kept confidential and used only for system operations."
      },
      {
        title: "6. Account Deactivation",
        content: "You may request to deactivate your account at any time. Any remaining balance will be refunded according to university policy. Inactive accounts may be automatically suspended after extended periods of non-use."
      }
    ]
  }
};

export default function AccountActivation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get activation data from URL params
  const accountId = searchParams.get("accountId");
  const accountType = searchParams.get("accountType") || "user";
  const email = searchParams.get("email") || "";
  const fullName = searchParams.get("fullName") || "";

  // Determine if this is an admin or user
  const isAdmin = ["admin", "motorpool", "treasury", "accounting", "merchant"].includes(accountType);
  const termsType = isAdmin ? "admin" : "user";

  // Steps: 'terms', 'pin', 'otp', 'success'
  const [step, setStep] = useState("terms");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Terms acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const termsRef = useRef(null);

  // PIN fields
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  // OTP fields
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Validation
  useEffect(() => {
    if (!accountId) {
      toast.error("Invalid activation link. Please try logging in again.");
      navigate("/login");
    }
  }, [accountId, navigate]);

  // Handle terms scroll
  const handleTermsScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setScrolledToBottom(true);
    }
  };

  // Accept terms and proceed
  const handleAcceptTerms = async () => {
    if (!termsAccepted) {
      toast.warning("Please read and accept the terms and conditions");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/activation/accept-terms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, accountType: isAdmin ? "admin" : "user" })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept terms");
      }

      toast.success("Terms accepted!");
      setStep("pin");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Set new PIN
  const handleSetPin = async () => {
    // Validate PIN
    if (newPin.length !== 6) {
      setError("PIN must be exactly 6 digits");
      return;
    }

    if (!/^\d{6}$/.test(newPin)) {
      setError("PIN must contain only numbers");
      return;
    }

    if (newPin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    // Check for weak PINs
    const weakPins = ["123456", "654321", "111111", "222222", "333333", "444444", "555555", "666666", "777777", "888888", "999999", "000000"];
    if (weakPins.includes(newPin)) {
      setError("Please choose a stronger PIN");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/activation/set-new-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          accountType: isAdmin ? "admin" : "user",
          newPin
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to set PIN");
      }

      toast.success("PIN set! Check your email for the verification code.");
      setStep("otp");
      setResendCooldown(60);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // OTP input handling
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split("").concat(Array(6).fill("")).slice(0, 6);
      setOtp(newOtp);
      otpRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/activation/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          accountType: isAdmin ? "admin" : "user",
          otp: otpString
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid verification code");
      }

      toast.success("Account activated successfully!");
      setStep("success");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/activation/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          accountType: isAdmin ? "admin" : "user"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      toast.success("Verification code resent!");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Navigate to login after success
  const handleGoToLogin = () => {
    navigate("/login");
  };

  const terms = TERMS_CONTENT[termsType];
  const stepLabels = ["Terms", "PIN", "Verify", "Done"];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F1227 0%, #181D40 100%)',
      position: 'relative',
      overflow: 'hidden',
      padding: '20px'
    }}>
      {/* Animated background elements */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '-80px',
          width: '384px',
          height: '384px',
          background: '#FFD41C',
          opacity: 0.05,
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '25%',
          right: '-80px',
          width: '384px',
          height: '384px',
          background: '#FFD41C',
          opacity: 0.05,
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '500px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '96px',
            height: '96px',
            background: '#FFD41C',
            borderRadius: '50%',
            marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(255, 212, 28, 0.4)'
          }}>
            <span style={{ fontSize: '48px', fontWeight: 800, color: '#181D40' }}>NU</span>
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#FBFBFB',
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px'
          }}>
            Account Activation
          </h1>
          <p style={{ color: 'rgba(251, 251, 251, 0.6)', margin: 0, fontSize: '14px' }}>
            Welcome, <span style={{ color: '#FFD41C', fontWeight: 600 }}>{fullName || email}</span>
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '32px'
        }}>
          {stepLabels.map((label, i) => {
            const stepKeys = ["terms", "pin", "otp", "success"];
            const currentIndex = stepKeys.indexOf(step);
            const isComplete = currentIndex > i;
            const isCurrent = currentIndex === i;

            return (
              <React.Fragment key={label}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    background: isCurrent
                      ? '#FFD41C'
                      : isComplete
                        ? '#22C55E'
                        : 'rgba(255, 255, 255, 0.1)',
                    color: isCurrent
                      ? '#181D40'
                      : isComplete
                        ? '#FFFFFF'
                        : 'rgba(251, 251, 251, 0.4)',
                    border: isCurrent
                      ? '3px solid rgba(255, 212, 28, 0.5)'
                      : isComplete
                        ? '3px solid rgba(34, 197, 94, 0.5)'
                        : '3px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: isCurrent
                      ? '0 4px 20px rgba(255, 212, 28, 0.4)'
                      : isComplete
                        ? '0 4px 20px rgba(34, 197, 94, 0.3)'
                        : 'none'
                  }}>
                    {isComplete ? '✓' : i + 1}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isCurrent ? '#FFD41C' : isComplete ? '#22C55E' : 'rgba(251, 251, 251, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {label}
                  </span>
                </div>
                {i < 3 && (
                  <div style={{
                    width: '40px',
                    height: '3px',
                    borderRadius: '2px',
                    background: isComplete ? '#22C55E' : 'rgba(255, 255, 255, 0.1)',
                    marginBottom: '20px'
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(30, 35, 71, 0.95)',
          borderRadius: '20px',
          border: '2px solid rgba(255, 212, 28, 0.3)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* STEP 1: Terms and Conditions */}
          {step === "terms" && (
            <>
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 212, 28, 0.15) 0%, rgba(255, 212, 28, 0.05) 100%)',
                borderBottom: '2px solid rgba(255, 212, 28, 0.2)',
                padding: '20px 24px'
              }}>
                <h2 style={{
                  color: '#FFD41C',
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span>📋</span> {terms.title}
                </h2>
                <p style={{ color: 'rgba(251, 251, 251, 0.6)', fontSize: '13px', margin: '8px 0 0 0' }}>
                  Please read carefully before proceeding
                </p>
              </div>

              <div style={{ padding: '24px' }}>
                {/* Scrollable Terms */}
                <div
                  ref={termsRef}
                  onScroll={handleTermsScroll}
                  style={{
                    height: '280px',
                    overflowY: 'auto',
                    background: 'rgba(15, 18, 39, 0.5)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '16px',
                    border: '2px solid rgba(255, 212, 28, 0.15)'
                  }}
                >
                  {terms.sections.map((section, idx) => (
                    <div key={idx} style={{ marginBottom: '20px' }}>
                      <h3 style={{
                        color: '#FFD41C',
                        fontWeight: 700,
                        fontSize: '14px',
                        margin: '0 0 8px 0'
                      }}>
                        {section.title}
                      </h3>
                      <p style={{
                        color: 'rgba(251, 251, 251, 0.7)',
                        fontSize: '13px',
                        lineHeight: '1.7',
                        margin: 0
                      }}>
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>

                {!scrolledToBottom && (
                  <p style={{
                    color: 'rgba(251, 251, 251, 0.4)',
                    fontSize: '12px',
                    textAlign: 'center',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}>
                    <span>↓</span> Scroll to the bottom to enable acceptance
                  </p>
                )}

                {/* Checkbox */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  cursor: scrolledToBottom ? 'pointer' : 'not-allowed',
                  marginBottom: '24px',
                  padding: '16px',
                  background: termsAccepted ? 'rgba(255, 212, 28, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: termsAccepted ? '2px solid rgba(255, 212, 28, 0.3)' : '2px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    disabled={!scrolledToBottom}
                    style={{
                      width: '20px',
                      height: '20px',
                      marginTop: '2px',
                      cursor: scrolledToBottom ? 'pointer' : 'not-allowed',
                      accentColor: '#FFD41C'
                    }}
                  />
                  <span style={{
                    fontSize: '14px',
                    color: scrolledToBottom ? '#FBFBFB' : 'rgba(251, 251, 251, 0.4)',
                    lineHeight: '1.5'
                  }}>
                    I have read and agree to the {isAdmin ? "Administrator" : "User"} Terms and Conditions
                  </span>
                </label>

                {error && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>⚠️</span> {error}
                  </div>
                )}

                <button
                  onClick={handleAcceptTerms}
                  disabled={!termsAccepted || loading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: (!termsAccepted || loading) ? 'rgba(255, 212, 28, 0.3)' : '#FFD41C',
                    color: '#181D40',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: (!termsAccepted || loading) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: (!termsAccepted || loading) ? 'none' : '0 4px 20px rgba(255, 212, 28, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                >
                  {loading ? "Processing..." : "Accept & Continue →"}
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Set New PIN */}
          {step === "pin" && (
            <>
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                borderBottom: '2px solid rgba(59, 130, 246, 0.2)',
                padding: '20px 24px'
              }}>
                <h2 style={{
                  color: '#3B82F6',
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span>🔐</span> Set Your New PIN
                </h2>
                <p style={{ color: 'rgba(251, 251, 251, 0.6)', fontSize: '13px', margin: '8px 0 0 0' }}>
                  Create a secure 6-digit PIN for your account
                </p>
              </div>

              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    color: '#FFD41C',
                    fontWeight: 700,
                    fontSize: '12px',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    New PIN
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPin ? "text" : "password"}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      style={{
                        width: '100%',
                        padding: '16px 50px 16px 20px',
                        borderRadius: '12px',
                        border: '2px solid rgba(255, 212, 28, 0.3)',
                        background: 'rgba(15, 18, 39, 0.5)',
                        color: '#FBFBFB',
                        fontSize: '28px',
                        fontFamily: 'monospace',
                        letterSpacing: '0.5em',
                        textAlign: 'center',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease'
                      }}
                      placeholder="••••••"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#FFD41C';
                        e.target.style.boxShadow = '0 0 0 3px rgba(255, 212, 28, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 212, 28, 0.3)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(251, 251, 251, 0.5)',
                        cursor: 'pointer',
                        fontSize: '20px',
                        padding: '4px'
                      }}
                    >
                      {showPin ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    color: '#FFD41C',
                    fontWeight: 700,
                    fontSize: '12px',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Confirm PIN
                  </label>
                  <input
                    type={showPin ? "text" : "password"}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: '12px',
                      border: '2px solid rgba(255, 212, 28, 0.3)',
                      background: 'rgba(15, 18, 39, 0.5)',
                      color: '#FBFBFB',
                      fontSize: '28px',
                      fontFamily: 'monospace',
                      letterSpacing: '0.5em',
                      textAlign: 'center',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder="••••••"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FFD41C';
                      e.target.style.boxShadow = '0 0 0 3px rgba(255, 212, 28, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 212, 28, 0.3)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* PIN Match Indicator */}
                {confirmPin && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '20px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: newPin === confirmPin ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `2px solid ${newPin === confirmPin ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: newPin === confirmPin ? '#22C55E' : '#EF4444',
                    fontSize: '14px',
                    fontWeight: 600
                  }}>
                    <span>{newPin === confirmPin ? '✓' : '✗'}</span>
                    {newPin === confirmPin ? "PINs match" : "PINs do not match"}
                  </div>
                )}

                {/* Tips */}
                <div style={{
                  background: 'rgba(255, 212, 28, 0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  border: '2px solid rgba(255, 212, 28, 0.15)'
                }}>
                  <h4 style={{
                    color: '#FFD41C',
                    fontWeight: 700,
                    fontSize: '13px',
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>💡</span> PIN Tips
                  </h4>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '20px',
                    color: 'rgba(251, 251, 251, 0.6)',
                    fontSize: '12px',
                    lineHeight: '1.8'
                  }}>
                    <li>Use 6 digits that are easy for you to remember</li>
                    <li>Avoid simple patterns like 123456 or 111111</li>
                    <li>Don't use your birthday or phone number</li>
                    <li>Never share your PIN with anyone</li>
                  </ul>
                </div>

                {error && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>⚠️</span> {error}
                  </div>
                )}

                <button
                  onClick={handleSetPin}
                  disabled={newPin.length !== 6 || newPin !== confirmPin || loading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: (newPin.length !== 6 || newPin !== confirmPin || loading) ? 'rgba(59, 130, 246, 0.3)' : '#3B82F6',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: (newPin.length !== 6 || newPin !== confirmPin || loading) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: (newPin.length !== 6 || newPin !== confirmPin || loading) ? 'none' : '0 4px 20px rgba(59, 130, 246, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                >
                  {loading ? "Setting PIN..." : "Set PIN & Continue →"}
                </button>
              </div>
            </>
          )}

          {/* STEP 3: OTP Verification */}
          {step === "otp" && (
            <>
              <div style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)',
                borderBottom: '2px solid rgba(34, 197, 94, 0.2)',
                padding: '20px 24px'
              }}>
                <h2 style={{
                  color: '#22C55E',
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span>📧</span> Verify Your Email
                </h2>
                <p style={{ color: 'rgba(251, 251, 251, 0.6)', fontSize: '13px', margin: '8px 0 0 0' }}>
                  Enter the 6-digit code sent to <strong style={{ color: '#FFD41C' }}>{email}</strong>
                </p>
              </div>

              <div style={{ padding: '24px' }}>
                {/* OTP Inputs */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '10px',
                  marginBottom: '24px'
                }}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      style={{
                        width: '52px',
                        height: '64px',
                        textAlign: 'center',
                        fontSize: '28px',
                        fontWeight: 700,
                        borderRadius: '12px',
                        border: digit ? '2px solid #22C55E' : '2px solid rgba(255, 212, 28, 0.3)',
                        background: digit ? 'rgba(34, 197, 94, 0.1)' : 'rgba(15, 18, 39, 0.5)',
                        color: '#FBFBFB',
                        outline: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#FFD41C';
                        e.target.style.boxShadow = '0 0 0 3px rgba(255, 212, 28, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = digit ? '#22C55E' : 'rgba(255, 212, 28, 0.3)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  ))}
                </div>

                {/* Resend */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <p style={{ color: 'rgba(251, 251, 251, 0.5)', fontSize: '13px', marginBottom: '8px' }}>
                    Didn't receive the code?
                  </p>
                  <button
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: (resendCooldown > 0 || loading) ? 'rgba(251, 251, 251, 0.3)' : '#FFD41C',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: (resendCooldown > 0 || loading) ? 'not-allowed' : 'pointer',
                      textDecoration: 'underline',
                      padding: '8px'
                    }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </button>
                </div>

                {error && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>⚠️</span> {error}
                  </div>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.join("").length !== 6 || loading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: (otp.join("").length !== 6 || loading) ? 'rgba(34, 197, 94, 0.3)' : '#22C55E',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: (otp.join("").length !== 6 || loading) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: (otp.join("").length !== 6 || loading) ? 'none' : '0 4px 20px rgba(34, 197, 94, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                >
                  {loading ? "Verifying..." : "Verify & Activate →"}
                </button>
              </div>
            </>
          )}

          {/* STEP 4: Success */}
          {step === "success" && (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                borderRadius: '50%',
                marginBottom: '24px',
                boxShadow: '0 8px 32px rgba(34, 197, 94, 0.4)'
              }}>
                <span style={{ fontSize: '50px', color: '#FFFFFF' }}>✓</span>
              </div>

              <h2 style={{
                color: '#22C55E',
                fontSize: '26px',
                fontWeight: 800,
                margin: '0 0 8px 0'
              }}>
                Account Activated!
              </h2>
              <p style={{
                color: 'rgba(251, 251, 251, 0.7)',
                fontSize: '15px',
                margin: '0 0 24px 0',
                lineHeight: '1.6'
              }}>
                Your account is now active. You can now log in with your new PIN.
              </p>

              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                border: '2px solid rgba(34, 197, 94, 0.3)'
              }}>
                <p style={{ color: 'rgba(251, 251, 251, 0.5)', fontSize: '12px', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Account Details
                </p>
                <p style={{ color: '#FBFBFB', fontWeight: 700, fontSize: '18px', margin: '0 0 4px 0' }}>
                  {fullName || "User"}
                </p>
                <p style={{ color: 'rgba(251, 251, 251, 0.6)', fontSize: '14px', margin: 0 }}>
                  {email}
                </p>
              </div>

              <button
                onClick={handleGoToLogin}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#FFD41C',
                  color: '#181D40',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 20px rgba(255, 212, 28, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 24px rgba(255, 212, 28, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 20px rgba(255, 212, 28, 0.4)';
                }}
              >
                Go to Login →
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          color: 'rgba(251, 251, 251, 0.3)',
          fontSize: '12px',
          marginTop: '24px',
          lineHeight: '1.6'
        }}>
          National University - Laguna Campus<br />
          © 2026 NUCash Digital Campus Wallet
        </p>
      </div>
    </div>
  );
}
