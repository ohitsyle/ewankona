// client/src/components/TreasuryDashboard/Register.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { toast } from "react-toastify";
import { searchUserByRFID } from "../../services/treasuryApi";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, isDarkMode } = useTheme();
  const prefilledRfid = location.state?.rfid || "";

  const [modalOpen, setModalOpen] = useState(false);
  const [rfid, setRfid] = useState(prefilledRfid);
  const [searching, setSearching] = useState(false);
  const [step, setStep] = useState("input"); // "input", "found"
  const [foundUser, setFoundUser] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (modalOpen && inputRef.current) inputRef.current.focus();
  }, [modalOpen]);

  useEffect(() => {
    if (prefilledRfid) setModalOpen(true);
  }, [prefilledRfid]);

  const handleSearchUser = async () => {
    if (!rfid.trim()) {
      toast.error("Please enter RFID");
      return;
    }

    setSearching(true);
    try {
      const res = await searchUserByRFID(rfid.trim());
      if (res.success) {
        // User already exists - show error
        setFoundUser(res.user);
        setStep("found");
      } else {
        // User not found - go directly to registration form
        navigate("/admin/treasury/register", {
          state: { rfidUId: rfid.trim(), rfid: rfid.trim() }
        });
        closeModal();
      }
    } catch {
      // Error or user not found - go directly to registration form
      navigate("/admin/treasury/register", {
        state: { rfidUId: rfid.trim(), rfid: rfid.trim() }
      });
      closeModal();
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      handleSearchUser();
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setStep("input");
    setRfid("");
    setFoundUser(null);
  };

  const handleProceedCashIn = () => {
    navigate("/admin/treasury/cashin", { state: { user: foundUser } });
    closeModal();
  };


  const baseColor = isDarkMode ? '255, 212, 28' : '59, 130, 246';

  const getModalTitle = () => {
    switch (step) {
      case 'input':
        return '🆔 Scan or Enter RFID';
      case 'found':
        return '⚠️ User Already Registered';
      default:
        return '🆔 Register User';
    }
  };

  return (
    <>
      {/* Dashboard Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: "12px",
          overflow: "hidden",
          background: theme.bg.card,
          border: `1px solid rgba(${baseColor}, 0.2)`,
          boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(59,130,246,0.1)'
        }}
      >
        <div
          style={{
            background: theme.accent.primary,
            borderBottom: `1px solid rgba(${baseColor}, 0.3)`,
            padding: '8px 16px'
          }}
          className="flex items-center justify-between"
        >
          <h3 style={{ color: theme.accent.secondary }} className="font-bold text-m">🆔 Register User</h3>
        </div>

        <div
          style={{
            padding: "16px",
            position: "relative",
            minHeight: "90px",
            color: theme.text.primary,
          }}
        >
          <p style={{ color: theme.text.secondary }} className="text-sm mb-2">
            Register a new user by scanning or entering RFID.
          </p>

          <div style={{ position: "absolute", bottom: "20px", right: "16px" }}>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                background: theme.accent.primary,
                color: theme.accent.secondary,
                boxShadow: isDarkMode ? '0 4px 12px rgba(255,212,28,0.4)' : '0 4px 12px rgba(59,130,246,0.4)'
              }}
              className="font-semibold px-3 py-1 text-sm rounded-md transition hover:opacity-90"
            >
              Register
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15,18,39,0.9)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1227 100%)',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '85vh',
              overflow: 'auto',
              border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              animation: 'slideIn 0.3s ease'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: `rgba(${baseColor}, 0.1)`,
                borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backdropFilter: 'blur(10px)'
              }}
            >
              <h2
                style={{
                  color: theme.accent.primary,
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  margin: 0
                }}
              >
                {getModalTitle()}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: theme.text.primary,
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Input Step */}
              {step === "input" && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: theme.text.secondary, marginBottom: '20px', fontSize: '0.95rem' }}>
                    Place cursor in field and scan card, or enter manually
                  </p>
                  <div
                    style={{
                      background: `rgba(${baseColor}, 0.08)`,
                      padding: '24px',
                      borderRadius: '12px',
                      marginBottom: '20px',
                      border: `1px solid rgba(${baseColor}, 0.2)`
                    }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="RFID will appear here..."
                      value={rfid}
                      onChange={(e) => setRfid(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.3)',
                        color: theme.text.primary,
                        border: `2px solid rgba(${baseColor}, 0.4)`,
                        padding: '12px 16px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        fontSize: '1.1rem',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => e.target.style.border = `2px solid ${theme.accent.primary}`}
                      onBlur={(e) => e.target.style.border = `2px solid rgba(${baseColor}, 0.4)`}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={closeModal}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'rgba(107, 114, 128, 0.3)',
                        color: theme.text.secondary,
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(107, 114, 128, 0.4)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(107, 114, 128, 0.3)'}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSearchUser}
                      disabled={searching || !rfid.trim()}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: searching || !rfid.trim() ? 'rgba(107, 114, 128, 0.5)' : theme.accent.primary,
                        color: searching || !rfid.trim() ? theme.text.muted : theme.accent.secondary,
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        cursor: searching || !rfid.trim() ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: searching || !rfid.trim() ? 'none' : (isDarkMode ? '0 4px 12px rgba(255,212,28,0.4)' : '0 4px 12px rgba(59,130,246,0.4)')
                      }}
                      onMouseEnter={(e) => {
                        if (!searching && rfid.trim()) {
                          e.target.style.opacity = '0.9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.opacity = '1';
                      }}
                    >
                      {searching ? "🔍 Searching..." : "✓ Proceed"}
                    </button>
                  </div>
                </div>
              )}

              {/* Found Step */}
              {step === "found" && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '4rem',
                    marginBottom: '16px',
                    color: '#10B981',
                    animation: 'bounceIn 0.5s ease'
                  }}>
                    ✓
                  </div>
                  <h3 style={{
                    color: '#10B981',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '12px'
                  }}>
                    User Already Registered
                  </h3>
                  <p style={{
                    color: theme.text.secondary,
                    marginBottom: '24px',
                    fontSize: '0.95rem'
                  }}>
                    This RFID is already in the system. Proceed to Cash In?
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={closeModal}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'rgba(251, 251, 251, 0.1)',
                        color: theme.text.primary,
                        border: `1px solid rgba(${baseColor}, 0.3)`,
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(251, 251, 251, 0.15)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(251, 251, 251, 0.1)'}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProceedCashIn}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: theme.accent.primary,
                        color: theme.accent.secondary,
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isDarkMode ? '0 4px 12px rgba(255,212,28,0.4)' : '0 4px 12px rgba(59,130,246,0.4)'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      💰 Cash In
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Animations */}
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
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
