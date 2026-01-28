import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { getUserTransactions } from "../../services/userApi";
import RequestTransactionModal from "./RequestTransactionModal";

export default function MyTransactions({ onBalanceUpdate }) {
  const { theme, isDarkMode } = useTheme();
  const [filterOption, setFilterOption] = useState("Today");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const dropdownRef = useRef(null);
  const calendarRef = useRef(null);
  const intervalRef = useRef(null);
  const controllerRef = useRef(null);

  const FILTER_OPTIONS = ["Today", "Last 7 Days", "Last 30 Days"];

  const mapFilter = (option) => {
    switch (option) {
      case "Today":
        return "today";
      case "Last 7 Days":
        return "7days";
      case "Last 30 Days":
        return "30days";
      default:
        return "all";
    }
  };

  // =============================
  // SAFE FETCH
  // =============================
  const fetchData = async (silent = false) => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    controllerRef.current = new AbortController();

    try {
      // Only show loading on initial load or when user manually changes filter
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const filter = selectedDate ? "all" : mapFilter(filterOption);
      const data = await getUserTransactions(filter, {
        signal: controllerRef.current.signal,
      });

      if (data?.success) {
        let list = data.transactions || [];

        if (selectedDate) {
          list = list.filter((tx) => tx.date === selectedDate);
        }

        setTransactions(list);

        if (onBalanceUpdate && data.balance !== undefined) {
          onBalanceUpdate(data.balance);
        }
      } else {
        setError(data?.message || "Failed to load transactions");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Error fetching transactions");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setIsInitialLoad(false);
    }
  };

  // 🚀 Instant load
  useEffect(() => {
    fetchData();
  }, []);

  // 🔄 Auto-refresh (clean, single interval)
  useEffect(() => {
    const startInterval = () => {
      intervalRef.current = setInterval(() => fetchData(true), 5000); // Silent refresh
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (!document.hidden) startInterval();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval();
      } else {
        fetchData(true); // Silent refresh when tab becomes visible
        startInterval();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      controllerRef.current?.abort();
    };
  }, [filterOption, selectedDate]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
      if (calendarRef.current && !calendarRef.current.contains(e.target))
        setCalendarOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateChange = (e) => {
    const value = e.target.value;
    if (value) {
      const formatted = new Date(value).toLocaleDateString("en-GB");
      setSelectedDate(formatted);
      setFilterOption(formatted);
      setCalendarOpen(false);
    }
  };

  const renderTable = () => {
    // Only show loading on initial load
    if (loading && isInitialLoad) {
      return (
        <div style={{ color: theme.text.tertiary }} className="flex items-center justify-center flex-1 py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 rounded-full" style={{ borderColor: theme.accent.primary, borderTopColor: 'transparent' }}></div>
            <span>Loading transactions...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center flex-1 text-red-400 py-16">
          {error}
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div style={{ borderColor: theme.border.primary, color: theme.text.tertiary }} className="flex flex-col items-center justify-center flex-1 border rounded-b-xl p-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-base">No transactions found</p>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-auto">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ background: isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)' }}>
                {["Date", "Time", "Details", "Amount", "Transaction ID"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        color: theme.accent.primary,
                        borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`
                      }}
                      className="text-left p-4 text-[11px] font-extrabold uppercase"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr
                  key={tx.id || idx}
                  style={{ borderBottom: `1px solid ${theme.border.primary}` }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td style={{ padding: '16px', color: theme.text.primary }}>{tx.date}</td>
                  <td style={{ padding: '16px', color: theme.text.primary }}>{tx.time}</td>
                  <td style={{ padding: '16px', color: theme.text.primary }}>{tx.details}</td>
                  <td
                    style={{ padding: '16px' }}
                    className={`font-bold ${
                      tx.amount > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {tx.amount > 0
                      ? `+₱${Number(tx.amount).toFixed(2)}`
                      : `-₱${Math.abs(Number(tx.amount)).toFixed(2)}`}
                  </td>
                  <td style={{ padding: '16px', color: theme.text.secondary }} className="text-xs">
                    {tx.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        style={{
          background: theme.bg.card,
          borderColor: theme.border.primary
        }}
        className="flex flex-col w-full h-[500px] rounded-2xl border overflow-hidden"
      >
        {/* Header */}
        <div
          style={{ borderColor: theme.border.primary }}
          className="p-5 border-b flex justify-between items-center"
        >
          <div>
            <h3 style={{ color: theme.accent.primary }} className="m-0 mb-1 text-lg font-bold flex items-center gap-2">
              <span>📊</span>
              My Transactions
            </h3>
            <p style={{ color: theme.text.secondary }} className="m-0 text-xs">
              Real-time transaction history • Auto-refreshes every 5s
            </p>
          </div>

          <div className="flex gap-2 items-center">
            {/* Calendar */}
            <div className="relative" ref={calendarRef}>
              <button
                onClick={() => setCalendarOpen((p) => !p)}
                style={{
                  background: theme.bg.tertiary,
                  color: theme.text.primary,
                  borderColor: theme.border.primary
                }}
                className="p-2 rounded-md border hover:opacity-80 transition-opacity"
                title="Select date"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {calendarOpen && (
                <input
                  type="date"
                  onChange={handleDateChange}
                  max={new Date().toISOString().split("T")[0]}
                  style={{
                    background: theme.bg.tertiary,
                    color: theme.text.primary,
                    borderColor: theme.border.primary
                  }}
                  className="absolute top-11 right-0 border rounded-md p-2 z-50 shadow-lg"
                />
              )}
            </div>

            {/* Filter - Hidden on mobile, visible on md and up */}
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((p) => !p)}
                style={{
                  background: theme.bg.tertiary,
                  color: theme.text.primary,
                  borderColor: theme.border.primary
                }}
                className="px-3 py-2 text-xs rounded-md border w-32 truncate hover:opacity-80 transition-opacity"
              >
                {filterOption}
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    background: theme.bg.tertiary,
                    borderColor: theme.border.primary
                  }}
                  className="absolute top-11 right-0 border rounded-md w-32 z-50 shadow-lg overflow-hidden"
                >
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      style={{ color: theme.text.primary }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors"
                      onClick={() => {
                        setSelectedDate(null);
                        setFilterOption(opt);
                        setDropdownOpen(false);
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Request */}
            <button
              onClick={() => setShowRequestModal(true)}
              style={{
                background: theme.bg.tertiary,
                color: theme.text.primary,
                borderColor: theme.border.primary
              }}
              className="px-3 py-2 text-xs rounded-md border hover:opacity-80 transition-opacity font-medium"
            >
              Request
            </button>
          </div>
        </div>

        {renderTable()}
      </div>

      {showRequestModal && (
        <RequestTransactionModal onClose={() => setShowRequestModal(false)} />
      )}
    </>
  );
}