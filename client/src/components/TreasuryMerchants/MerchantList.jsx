// components/TreasuryMerchants/MerchantList.jsx
import React from 'react';

function MerchantCard({ merchant, onView }) {
  const isActive = merchant.isActive !== false;

  return (
    <div 
      style={{
        background: 'linear-gradient(135deg, #1E2347 0%, #181D40 100%)',
        borderRadius: '16px',
        border: '2px solid rgba(255, 212, 28, 0.3)',
        padding: '24px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
        opacity: isActive ? 1 : 0.7,
        minHeight: '280px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 212, 28, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header with ID Badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div style={{
          padding: '6px 14px',
          background: 'rgba(255, 212, 28, 0.15)',
          border: '1px solid rgba(255, 212, 28, 0.3)',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#FFD41C'
        }}>
          {merchant.id || merchant.merchantId || 'N/A'}
        </div>
        <div style={{
          width: '12px',
          height: '12px',
          background: isActive ? '#10B981' : '#EF4444',
          borderRadius: '50%',
          boxShadow: `0 0 0 3px ${isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          animation: isActive ? 'pulse 2s ease-in-out infinite' : 'none'
        }} />
      </div>

      {/* Business Name */}
      <h3 style={{
        fontSize: '20px',
        fontWeight: 700,
        color: '#FBFBFB',
        margin: '0 0 16px 0'
      }}>
        {merchant.name || 'Unknown Merchant'}
      </h3>

      {/* Stats Grid */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '16px',
        flex: 1
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: '13px',
            color: 'rgba(251, 251, 251, 0.6)',
            fontWeight: 500
          }}>
            Current Balance
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#10B981'
          }}>
            ₱{(merchant.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: '13px',
            color: 'rgba(251, 251, 251, 0.6)',
            fontWeight: 500
          }}>
            Total Collections
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#3B82F6'
          }}>
            ₱{(merchant.collections || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: '13px',
            color: 'rgba(251, 251, 251, 0.6)',
            fontWeight: 500
          }}>
            Today's Transactions
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#FBFBFB'
          }}>
            {merchant.todayTx || 0}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div style={{
        paddingTop: '16px',
        borderTop: '1px solid rgba(255, 212, 28, 0.2)'
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(merchant);
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#FFD41C',
            color: '#181D40',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(255, 212, 28, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e6c019';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 212, 28, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFD41C';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 212, 28, 0.4)';
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

export default function MerchantList({ merchants, onView }) {
  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px'
      }}>
        {merchants.map((merchant) => (
          <MerchantCard key={merchant.id} merchant={merchant} onView={onView} />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
          }
          50% {
            opacity: 0.7;
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.1);
          }
        }
      `}</style>
    </div>
  );
}