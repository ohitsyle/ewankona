// client/src/components/TreasuryDashboard/TransactionTable.jsx
import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function TransactionTable({
  transactions = [],
  onRowClick,
  showHeader = false, // Changed default to false - no more yellow header
  showColors = true,
  compact = false
}) {
  const { theme, isDarkMode } = useTheme();
  const baseColor = isDarkMode ? '255, 212, 28' : '59, 130, 246';

  // Format date from createdAt
  const formatDate = (tx) => {
    if (tx.date) return tx.date;
    if (tx.createdAt) {
      const date = new Date(tx.createdAt);
      return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
    return 'N/A';
  };

  // Format time from createdAt
  const formatTime = (tx) => {
    if (tx.time) return tx.time;
    if (tx.createdAt) {
      const date = new Date(tx.createdAt);
      return date.toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }
    return 'N/A';
  };

  // Get transaction ID
  const getTransactionId = (tx) => {
    return tx.transactionId || tx.id || tx._id || 'N/A';
  };

  // Check if it's a cash-in (credit) transaction
  const isCashIn = (tx) => {
    return tx.transactionType === 'credit';
  };

  // Check if it's a payment (debit) transaction - user paying merchant
  const isPayment = (tx) => {
    return tx.transactionType === 'debit';
  };

  // Get ID Number to display
  const getIdentifier = (tx) => {
    return tx.idNumber || tx.schoolUId || 'N/A';
  };

  // Get details/description
  const getDetails = (tx) => {
    if (isCashIn(tx)) {
      const userName = tx.userName || 'User';
      return `Cash-In: ${userName}`;
    }

    if (isPayment(tx)) {
      const merchantInfo = tx.businessName || tx.merchantName || 'Merchant';
      return `Payment: ${merchantInfo}`;
    }

    return tx.description || tx.userName || 'Transaction';
  };

  // Get processed by info
  const getProcessedBy = (tx) => {
    // For cash-in transactions, show the admin who processed it
    if (isCashIn(tx)) {
      if (tx.adminName) return tx.adminName;
      if (tx.processedBy) return tx.processedBy;
      if (tx.adminId) return `Admin #${tx.adminId}`;
      return 'Treasury';
    }

    // For payments, show a dash since it's automated
    return '—';
  };

  // Format amount with sign
  const formatAmount = (tx) => {
    const amount = Number(tx.amount).toFixed(2);

    if (isCashIn(tx)) {
      return `+ ₱${amount}`;
    }

    if (isPayment(tx)) {
      return `- ₱${amount}`;
    }

    return `₱${amount}`;
  };

  // Get amount color
  const getAmountColor = (tx) => {
    if (!showColors) return theme.text.primary;

    if (isCashIn(tx)) {
      return '#10B981'; // Green for cash-in
    }

    if (isPayment(tx)) {
      return '#EF4444'; // Red for payment/debit
    }

    return theme.text.primary;
  };

  return (
    <div
      className="flex flex-col w-full max-w-full"
      style={{
        height: compact ? '300px' : 'auto',
        background: theme.bg.card,
        border: `1px solid rgba(${baseColor}, 0.2)`,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(59,130,246,0.1)'
      }}
    >
      {/* Table Container */}
      {transactions.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            textAlign: 'center',
            color: theme.text.secondary,
            padding: '64px 16px'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
          <div>No transactions found</div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            overflow: 'auto'
          }}
        >
          <table className="w-full border-collapse text-[13px]">
            {/* Table Header */}
            <thead>
              <tr style={{ background: `rgba(${baseColor}, 0.1)` }}>
                {["Date", "Time", "ID Number", "Details", "Amount", "Processed By", "Transaction ID"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'center',
                      padding: '12px 16px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: theme.accent.primary,
                      textTransform: 'uppercase',
                      borderBottom: `2px solid rgba(${baseColor}, 0.3)`
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {transactions.map((tx, idx) => {
                const formattedAmount = formatAmount(tx);
                const amountColor = getAmountColor(tx);

                return (
                  <tr
                    key={tx._id || tx.id || tx.transactionId || idx}
                    onClick={() => onRowClick?.(tx)}
                    style={{
                      borderBottom: `1px solid ${theme.border.primary}`,
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.bg.hover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: theme.text.primary }}>
                      {formatDate(tx)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: theme.text.primary }}>
                      {formatTime(tx)}
                    </td>

                    {/* ID Number */}
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: theme.text.primary, fontFamily: 'monospace', fontSize: '11px', fontWeight: 700 }}>
                      {getIdentifier(tx)}
                    </td>

                    {/* Details */}
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: theme.text.secondary }}>
                      {getDetails(tx)}
                    </td>

                    {/* Amount with Color */}
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 'bold', color: amountColor }}>
                      {formattedAmount}
                    </td>

                    {/* Processed By */}
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: theme.text.secondary, fontSize: '12px' }}>
                      {getProcessedBy(tx)}
                    </td>

                    {/* Transaction ID */}
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: theme.text.secondary }}>
                      {getTransactionId(tx)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
