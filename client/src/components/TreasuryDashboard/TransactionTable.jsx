// client/src/components/TreasuryDashboard/TransactionTable.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

export default function TransactionTable({
  transactions = [],
  onRowClick,
  showHeader = true,
  showColors = true,
  compact = false
}) {
  const navigate = useNavigate();
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

  // Check for both merchantId and MER-prefixed idNumber
  const isCashOut = (tx) => {
    const hasMerchantId = Boolean(tx.merchantId) || (tx.idNumber && tx.idNumber.startsWith('MER'));
    const result = tx.transactionType === 'debit' && hasMerchantId;
    return result;
  };

  // Determine if transaction is a user cash-in
  const isCashIn = (tx) => {
    return tx.transactionType === 'credit' && !tx.merchantId;
  };

  // Get ID/Merchant to display
  const getIdentifier = (tx) => {
    if (isCashOut(tx)) return tx.merchantId || tx.idNumber;
    return tx.idNumber || tx.schoolUId || 'N/A';
  };

  // Get details
  const getDetails = (tx) => {
    if (isCashOut(tx)) {
      const merchantInfo = tx.businessName ||
                          tx.userName ||
                          tx.displayIdNumber ||
                          tx.merchantId ||
                          tx.idNumber ||
                          'Merchant';
      return `Cash-Out: ${merchantInfo}`;
    }

    if (isCashIn(tx)) {
      const userName = tx.userName || 'User';
      return `Cash-In: ${userName}`;
    }

    return tx.description || tx.userName || 'Transaction';
  };

  // Get amount color (treasury perspective)
  const getAmountColor = (tx) => {
    if (!showColors) {
      return 'text-white/90';
    }

    if (isCashOut(tx)) {
      return 'text-red-400';
    }

    if (isCashIn(tx)) {
      return 'text-green-400';
    }

    return 'text-white/90';
  };

  // Format amount with sign (from treasury's perspective)
  const formatAmount = (tx) => {
    const amount = Number(tx.amount).toFixed(2);

    if (!showColors) {
      if (isCashOut(tx)) {
        return `- ₱${amount}`;
      }
      return `₱${amount}`;
    }

    if (isCashOut(tx)) {
      return `- ₱${amount}`;
    }

    if (isCashIn(tx)) {
      return `+ ₱${amount}`;
    }

    return `₱${amount}`;
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
      {/* Optional Top Header */}
      {showHeader && (
        <div
          style={{
            background: theme.accent.primary,
            padding: '8px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h3
            style={{
              color: theme.accent.secondary,
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            📋 Recent Transactions
          </h3>
        </div>
      )}

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
                {["Date", "Time", "ID Number", "Details", "Amount", "Transaction ID"].map((h) => (
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

                // Determine amount color based on transaction type
                let amountColor = theme.text.primary;
                if (showColors) {
                  if (isCashOut(tx)) {
                    amountColor = '#EF4444'; // Red for cash-out
                  } else if (isCashIn(tx)) {
                    amountColor = '#10B981'; // Green for cash-in
                  }
                }

                return (
                  <tr
                    key={tx._id || tx.id || tx.transactionId || idx}
                    onClick={() => onRowClick?.(tx)}
                    style={{
                      borderBottom: `1px solid ${theme.border.primary}`,
                      cursor: 'pointer',
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

                    {/* ID/Merchant */}
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
