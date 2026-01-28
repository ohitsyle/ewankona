// client/src/components/UserDashboard/MyBalance.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { getBalance } from "../../services/userApi";

export default function MyBalance({ balance, setBalance }) {
  const { theme, isDarkMode } = useTheme();
  const [showBalance, setShowBalance] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBalance();
        if (data.success) {
          setBalance(data.balance);
        } else {
          setError(data.message || "Failed to fetch balance");
        }
      } catch (err) {
        // Silently handle error - backend endpoint may not exist yet
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, [setBalance]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderBalance = () => {
    if (loading) return "Loading...";
    if (error) return <span className="text-red-400 text-sm">{error}</span>;

    return showBalance
      ? `₱ ${balance?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
      : "₱ ********";
  };

  return (
    <div
      style={{
        background: theme.bg.card,
        borderColor: theme.border.primary
      }}
      className="p-6 rounded-2xl border relative overflow-hidden transition-all duration-300"
    >
      {/* Background Icon */}
      <div className="absolute right-4 top-4 text-[40px] opacity-15">
        💰
      </div>

      {/* Header with Dropdown */}
      <div className="relative z-10 flex items-start justify-between mb-3">
        <div style={{ color: theme.text.secondary }} className="text-[11px] font-bold uppercase tracking-wide">
          My Balance
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            style={{ color: theme.text.secondary }}
            className="text-lg font-bold hover:opacity-75 transition-opacity -mt-1"
          >
            &#8230;
          </button>

          {dropdownOpen && (
            <div
              style={{
                background: theme.bg.tertiary,
                borderColor: theme.border.primary
              }}
              className="absolute right-0 mt-2 w-32 border rounded-lg shadow-lg z-50 overflow-hidden"
            >
              <button
                style={{ color: theme.text.primary }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors"
                onClick={() => {
                  navigate("/faq");
                  setDropdownOpen(false);
                }}
              >
                FAQs
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Balance Display */}
      <div className="relative z-10 mb-2">
        <div className="flex items-center gap-3">
          <div style={{ color: theme.text.primary }} className="text-[32px] font-extrabold">
            {renderBalance()}
          </div>
          <button
            onClick={() => setShowBalance((prev) => !prev)}
            className="hover:scale-110 transition-transform"
          >
            {showBalance ? <VisibleIcon theme={theme} /> : <HiddenIcon theme={theme} />}
          </button>
        </div>
      </div>

      {/* Subtitle */}
      <div className="relative z-10">
        <div
          className="text-xs font-semibold inline-block py-[3px] px-[10px] rounded-xl"
          style={{
            color: '#10B981',
            background: '#10B98120'
          }}
        >
          Available Balance
        </div>
      </div>
    </div>
  );
}

/* Icons */
function VisibleIcon({ theme }) {
  return (
    <svg style={{ color: theme.text.secondary }} className="w-6 h-6 hover:opacity-75 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function HiddenIcon({ theme }) {
  return (
    <svg style={{ color: theme.text.secondary }} className="w-6 h-6 hover:opacity-75 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.658-3.04" />
    </svg>
  );
}
