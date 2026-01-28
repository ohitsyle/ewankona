// client/src/pages/admin/Shared/TransactionsPage.jsx
// Shared Transactions page for Treasury and Accounting modules
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { getTreasuryTransactions } from "../../../services/treasuryApi";
import { toast } from "react-toastify";

import Header from "../../../components/layouts/Header";
import Footer from "../../../components/layouts/Footer";
import Navbar from "../../../components/layouts/Navbar";

export default function TransactionsPage() {
  const { theme, isDarkMode } = useTheme();
  const location = useLocation();
  const isTreasury = location.pathname.startsWith("/treasury");

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [transactionType, setTransactionType] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm,
        startDate,
        endDate,
        transactionType
      };

      const response = await getTreasuryTransactions(params);
      setTransactions(response.transactions || response.data || []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTransactions();
  };

  const handleExport = () => {
    toast.info("Export feature coming soon");
  };

  const baseColor = isDarkMode ? '255, 212, 28' : '59, 130, 246';

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg.primary,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ position: "sticky", top: 0, zIndex: 1000 }}>
        <Header />
      </div>

      <div style={{ flex: 1, padding: "40px" }}>
        <Navbar />

        {/* Page Header */}
        <div
          className="mb-5 p-3 rounded-lg"
          style={{
            background: `rgba(${baseColor}, 0.1)`,
            borderBottom: `2px solid ${theme.accent.primary}`,
          }}
        >
          <h1
            className="text-2xl font-bold"
            style={{ color: theme.accent.primary }}
          >
            📋 Transaction History
          </h1>
        </div>

        {/* Filters */}
        <div
          className="mb-4 p-4 rounded-lg"
          style={{
            background: theme.bg.card,
            border: `1px solid rgba(${baseColor}, 0.2)`
          }}
        >
          <div className="grid grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Search by user, amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: theme.bg.secondary,
                color: theme.text.primary,
                border: `1px solid rgba(${baseColor}, 0.3)`,
              }}
              className="px-3 py-2 rounded-md outline-none"
            />

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                background: theme.bg.secondary,
                color: theme.text.primary,
                border: `1px solid rgba(${baseColor}, 0.3)`,
              }}
              className="px-3 py-2 rounded-md outline-none"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                background: theme.bg.secondary,
                color: theme.text.primary,
                border: `1px solid rgba(${baseColor}, 0.3)`,
              }}
              className="px-3 py-2 rounded-md outline-none"
            />

            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              style={{
                background: theme.bg.secondary,
                color: theme.text.primary,
                border: `1px solid rgba(${baseColor}, 0.3)`,
              }}
              className="px-3 py-2 rounded-md outline-none"
            >
              <option value="">All Types</option>
              <option value="cash_in">Cash In</option>
              <option value="shuttle">Shuttle</option>
              <option value="merchant">Merchant</option>
            </select>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSearch}
              style={{
                background: theme.accent.primary,
                color: theme.bg.primary,
              }}
              className="px-4 py-2 rounded-md font-semibold hover:opacity-80 transition"
            >
              🔍 Search
            </button>

            <button
              onClick={handleExport}
              style={{
                background: theme.bg.secondary,
                color: theme.accent.primary,
                border: `1px solid ${theme.accent.primary}`,
              }}
              className="px-4 py-2 rounded-md font-semibold hover:opacity-80 transition"
            >
              📥 Export
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: theme.bg.card,
            border: `1px solid rgba(${baseColor}, 0.2)`
          }}
        >
          {loading ? (
            <div className="p-8 text-center" style={{ color: theme.text.secondary }}>
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center" style={{ color: theme.text.secondary }}>
              No transactions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      background: `rgba(${baseColor}, 0.1)`,
                      borderBottom: `2px solid rgba(${baseColor}, 0.3)`,
                    }}
                  >
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.text.primary }}>
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.text.primary }}>
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.text.primary }}>
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.text.primary }}>
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.text.primary }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr
                      key={transaction._id || index}
                      style={{
                        borderBottom: `1px solid rgba(${baseColor}, 0.1)`,
                      }}
                      className="hover:bg-white/5 transition"
                    >
                      <td className="px-4 py-3 text-sm" style={{ color: theme.text.primary }}>
                        {new Date(transaction.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: theme.text.secondary }}>
                        {transaction.type || transaction.transactionType || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: theme.text.primary }}>
                        {transaction.userName || transaction.user?.fullName || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: theme.accent.primary }}>
                        ₱{(transaction.amount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: transaction.status === 'completed' ? '#10B981' : '#EF4444',
                            color: '#fff'
                          }}
                        >
                          {transaction.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
