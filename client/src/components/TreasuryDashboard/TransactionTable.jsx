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

  // ✅ FIXED: Check for both merchantId and MER-prefixed idNumber
  const isCashOut = (tx) => {
    // A cash-out is a DEBIT transaction that has a merchantId
    // Check both merchantId (from transactions page) and idNumber starting with 'MER' (from dashboard)
    const hasMerchantId = Boolean(tx.merchantId) || (tx.idNumber && tx.idNumber.startsWith('MER'));
    const result = tx.transactionType === 'debit' && hasMerchantId;
    
    return result;
  };

  // ✅ Determine if transaction is a user cash-in
  const isCashIn = (tx) => {
    // A cash-in is a CREDIT transaction without a merchantId
    return tx.transactionType === 'credit' && !tx.merchantId;
  };

  // ✅ Get ID/Merchant to display
  const getIdentifier = (tx) => {
    if (isCashOut(tx)) return tx.merchantId || tx.idNumber;
    return tx.idNumber || 'N/A';
  };

  // ✅ FIXED: Check userName for business name (used by dashboard)
  const getDetails = (tx) => {
    if (isCashOut(tx)) {
      // For cash-outs, show "Cash-Out: [Business Name]"
      const merchantInfo = tx.businessName || 
                          tx.userName || // Dashboard uses userName for business name
                          tx.displayIdNumber ||
                          tx.merchantId || 
                          tx.idNumber || // Fallback to idNumber
                          'Merchant';
      return `Cash-Out: ${merchantInfo}`;
    }
    
    if (isCashIn(tx)) {
      // For cash-ins, show "Cash-In: [Student Name]"
      const userName = tx.userName || 'User';
      return `Cash-In: ${userName}`;
    }
    
    // Fallback for other transaction types
    return tx.description || tx.userName || 'Transaction';
  };

  // ✅ Get amount color (treasury perspective)
  const getAmountColor = (tx) => {
    // If colors are disabled, return white for all
    if (!showColors) {
      return 'text-white/90';
    }
    
    // Cash-out: Treasury GIVES money to merchant (negative/red)
    if (isCashOut(tx)) {
      return 'text-red-400';
    }
    
    // Cash-in: Treasury RECEIVES money (positive/green)
    if (isCashIn(tx)) {
      return 'text-green-400';
    }
    
    return 'text-white/90';
  };

  // ✅ Format amount with sign (from treasury's perspective)
  const formatAmount = (tx) => {
    const amount = Number(tx.amount).toFixed(2);
    
    // If colors are disabled, no signs
    if (!showColors) {
      if (isCashOut(tx)) {
        return `- ₱${amount}`;
      }
      return `₱${amount}`;
    }
    
    // With colors enabled, show signs
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
                    key={tx.id || tx._id || idx}
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
                      {tx.date}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: theme.text.primary }}>
                      {tx.time}
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
                      {tx.id}
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