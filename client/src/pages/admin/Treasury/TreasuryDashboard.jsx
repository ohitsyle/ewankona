// client/src/pages/admin/Treasury/TreasuryDashboard.jsx
// Treasury Dashboard - Now uses TreasuryLayout for consistent design

import React, { useState, useEffect } from "react";
import { useTheme } from "../../../context/ThemeContext";

import Analytics from "../../../components/TreasuryDashboard/Analytics";
import CashIn from "../../../components/TreasuryDashboard/CashIn";
import Register from "../../../components/TreasuryDashboard/Register";
import TransactionTable from "../../../components/TreasuryDashboard/TransactionTable";

import { getTreasuryTransactions } from "../../../services/treasuryApi";

export default function TreasuryDashboard() {
  const { theme, isDarkMode } = useTheme();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransactions() {
      try {
        setLoading(true);
        const res = await getTreasuryTransactions();

        if (res.success) {
          const formatted = res.transactions.map((tx) => {
            const dateObj = new Date(tx.createdAt);
            return {
              date: dateObj.toLocaleDateString("en-GB"),
              time: dateObj.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              amount: tx.amount,
              idNumber: tx.idNumber,
              userName: tx.userName,
              email: tx.email,
              transactionType: tx.transactionType,
              status: tx.status,
              balance: tx.balance,
              id: tx.transactionId || tx._id,
              _id: tx._id,
              admin: tx.admin,
              createdAt: tx.createdAt,
            };
          });

          setTransactions(formatted);
        }
      } catch (error) {
        console.error("Failed to load transactions:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
    const interval = setInterval(loadTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-8 border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-3">
          <span>💰</span> Treasury Dashboard
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-sm m-0">
          Real-time treasury analytics • Manage cash-ins and user registrations
        </p>
      </div>

      {/* ANALYTICS (FULL WIDTH) */}
      <div className="mb-8">
        <Analytics />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-2 gap-5 flex-1">
        {/* LEFT COLUMN - Actions */}
        <div className="flex flex-col gap-5">
          <CashIn />
          <Register />
        </div>

        {/* RIGHT COLUMN - Transactions */}
        <div className="flex flex-col">
          <TransactionTable
            transactions={recentTransactions}
            loading={loading}
            showHeader={true}
            showColors={true}
            compact={false}
          />
        </div>
      </div>
    </div>
  );
}
