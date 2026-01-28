// src/components/TreasuryDashboard/CashIn.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { toast } from "react-toastify";
import { searchUserByRFID } from "../../services/treasuryApi";

export default function CashIn() {
  const navigate = useNavigate();
  const { theme, isDarkMode } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState("input"); // "input", "found", "notFound"
  const [rfid, setRfid] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (modalOpen && inputRef.current) inputRef.current.focus();
  }, [modalOpen]);

  const handleSearchUser = async () => {
    if (!rfid.trim()) {
      toast.error("Please enter RFID");
      return;
    }

    setSearching(true);
    try {
      const response = await searchUserByRFID(rfid.trim());
      if (response.success) {
        setFoundUser(response.user);
        setStep("found");
      } else {
        setStep("notFound");
      }
    } catch (error) {
      console.error(error);
      setStep("notFound");
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

  const handleRegisterRedirect = () => {
    navigate("/admin/treasury/register", { state: { rfid: rfid.trim() } });
    closeModal();
  };

  const baseColor = isDarkMode ? '255, 212, 28' : '59, 130, 246';

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
            padding: '12px 16px'
          }}
          className="flex items-center justify-between"
        >
          <h3 style={{ color: theme.accent.secondary }} className="font-bold text-base">💰 Cash In</h3>
        </div>

        <div
          style={{
            padding: "20px",
            position: "relative",
            minHeight: "120px",
            color: theme.text.primary,
          }}
        >
          <p style={{ color: theme.text.secondary }} className="text-sm mb-4">
            Add balance to a user's account after verifying their ID card.
          </p>

          <button
            onClick={() => setModalOpen(true)}
            style={{
              background: theme.accent.primary,
              color: theme.accent.secondary,
              width: '100%',
              boxShadow: isDarkMode ? '0 4px 12px rgba(255,212,28,0.3)' : '0 4px 12px rgba(59,130,246,0.3)'
            }}
            className="font-semibold px-4 py-3 text-sm rounded-lg transition hover:opacity-90"
          >
            Start Cash In Process →
          </button>
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
                padding: '24px',
                borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: theme.accent.primary, margin: 0 }}>
                {step === 'input' && '💰 Cash In - Scan RFID'}
                {step === 'found' && '✓ User Found'}
                {step === 'notFound' && '⚠️ User Not Found'}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: 'rgba(239,68,68,0.2)',
                  border: 'none',
                  color: '#EF4444',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >×</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Input Step */}
              {step === "input" && (
                <>
                  <p style={{ color: theme.text.secondary, marginBottom: '20px', fontSize: '14px' }}>
                    Place cursor in the field below and scan the user's RFID card
                  </p>
                  <div
                    style={{
                      background: isDarkMode ? 'rgba(255,212,28,0.05)' : 'rgba(59,130,246,0.05)',
                      padding: '20px',
                      borderRadius: '12px',
                      marginBottom: '20px'
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
                        padding: '14px',
                        border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                        borderRadius: '8px',
                        background: 'rgba(251,251,251,0.05)',
                        color: theme.text.primary,
                        fontSize: '16px',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box'
                      }}
                      className="focus:outline-none"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={closeModal}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'transparent',
                        color: theme.text.primary,
                        border: `2px solid ${theme.border.primary}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSearchUser}
                      disabled={searching || !rfid.trim()}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: searching || !rfid.trim() ? 'rgba(100,100,100,0.2)' : theme.accent.primary,
                        color: searching || !rfid.trim() ? 'rgba(251,251,251,0.3)' : theme.accent.secondary,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: searching || !rfid.trim() ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                        boxShadow: searching || !rfid.trim() ? 'none' : (isDarkMode ? '0 4px 12px rgba(255,212,28,0.4)' : '0 4px 12px rgba(59,130,246,0.4)')
                      }}
                    >
                      {searching ? "Searching..." : "Search User"}
                    </button>
                  </div>
                </>
              )}

              {/* Found Step */}
              {step === "found" && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>✓</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#10B981', marginBottom: '12px' }}>
                    User Found Successfully
                  </h3>
                  <p style={{ color: theme.text.secondary, marginBottom: '24px', fontSize: '14px' }}>
                    Proceed to the Cash In form to add balance
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={closeModal}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'transparent',
                        color: theme.text.primary,
                        border: `2px solid ${theme.border.primary}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProceedCashIn}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(16,185,129,0.4)'
                      }}
                    >
                      Proceed to Cash In →
                    </button>
                  </div>
                </div>
              )}

              {/* Not Found Step */}
              {step === "notFound" && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px', color: theme.accent.primary }}>⚠️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: theme.accent.primary, marginBottom: '12px' }}>
                    User Not Found
                  </h3>
                  <p style={{ color: theme.text.primary, marginBottom: '8px', fontSize: '14px' }}>
                    The RFID <span style={{ fontWeight: 700, color: theme.accent.primary, fontFamily: 'monospace' }}>{rfid}</span> is not registered.
                  </p>
                  <p style={{ color: theme.text.secondary, marginBottom: '24px', fontSize: '14px' }}>
                    Would you like to register this user?
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={closeModal}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'transparent',
                        color: theme.text.primary,
                        border: `2px solid ${theme.border.primary}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRegisterRedirect}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: theme.accent.primary,
                        color: theme.accent.secondary,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        boxShadow: isDarkMode ? '0 4px 12px rgba(255,212,28,0.4)' : '0 4px 12px rgba(59,130,246,0.4)'
                      }}
                    >
                      Register User →
                    </button>
                  </div>
                </div>
              )}
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
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
