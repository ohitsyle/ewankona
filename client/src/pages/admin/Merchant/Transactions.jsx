// src/merchant/components/Transactions/TransactionsList.jsx
import React, { useState, useEffect } from 'react';

export default function TransactionsList() {
  const [transactions, setTransactions] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week, month
  const [merchantFilter, setMerchantFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTransactions();
    loadMerchants();
    const interval = setInterval(loadTransactions, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadTransactions = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('merchantToken');

      const response = await fetch(`${API_URL}/api/merchant/transactions?filter=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load transactions');
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMerchants = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('merchantToken');

      const response = await fetch(`${API_URL}/api/merchant/merchants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load merchants');
      const data = await response.json();
      setMerchants(data.merchants || []);
    } catch (error) {
      console.error('Error loading merchants:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Merchant', 'Student', 'Amount', 'Status'];
    const csvRows = [headers.join(',')];

    filteredTransactions.forEach(tx => {
      const row = [
        new Date(tx.timestamp).toLocaleString(),
        `"${tx.merchantName || 'N/A'}"`,
        `"${tx.studentName || 'N/A'}"`,
        tx.amount.toFixed(2),
        tx.status
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesMerchant = merchantFilter === 'all' || tx.merchantName === merchantFilter;
    const matchesSearch = !searchQuery ||
      tx.merchantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.amount?.toString().includes(searchQuery);

    return matchesMerchant && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#FFD41C'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 212, 28, 0.3)',
          borderTopColor: '#FFD41C',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header with Export Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#FBFBFB',
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>💳</span> All Transactions
          </h2>
          <p style={{
            fontSize: '13px',
            color: 'rgba(251, 251, 251, 0.6)',
            margin: 0
          }}>
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={filteredTransactions.length === 0}
          style={{
            padding: '12px 24px',
            background: filteredTransactions.length === 0
              ? 'rgba(255, 255, 255, 0.05)'
              : '#10B981',
            color: filteredTransactions.length === 0
              ? 'rgba(251, 251, 251, 0.3)'
              : '#FFF',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: filteredTransactions.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (filteredTransactions.length > 0) {
              e.currentTarget.style.background = '#059669';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (filteredTransactions.length > 0) {
              e.currentTarget.style.background = '#10B981';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <span>📥</span> Export to CSV
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{ marginBottom: '20px' }}>
        {/* Search Input */}
        <input
          type="text"
          placeholder="🔍 Search transactions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '12px 16px',
            background: 'rgba(30, 35, 71, 0.5)',
            border: '2px solid rgba(255, 212, 28, 0.3)',
            borderRadius: '10px',
            color: '#FBFBFB',
            fontSize: '14px',
            outline: 'none',
            marginBottom: '16px'
          }}
        />

        {/* Time Period Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {['all', 'today', 'week', 'month'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '10px 20px',
                background: filter === f ? '#FFD41C' : 'rgba(255, 212, 28, 0.1)',
                color: filter === f ? '#181D40' : '#FFD41C',
                border: '2px solid rgba(255, 212, 28, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (filter !== f) {
                  e.currentTarget.style.background = 'rgba(255, 212, 28, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== f) {
                  e.currentTarget.style.background = 'rgba(255, 212, 28, 0.1)';
                }
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Merchant Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#FFD41C'
          }}>
            Filter by Merchant:
          </label>
          <select
            value={merchantFilter}
            onChange={(e) => setMerchantFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              background: 'rgba(30, 35, 71, 0.5)',
              border: '2px solid rgba(255, 212, 28, 0.3)',
              borderRadius: '8px',
              color: '#FBFBFB',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              minWidth: '200px'
            }}
          >
            <option value="all">All Merchants</option>
            {merchants.map((merchant, idx) => (
              <option key={merchant._id || idx} value={merchant.businessName}>
                {merchant.businessName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: 'linear-gradient(135deg, #1E2347 0%, #181D40 100%)',
          borderRadius: '16px',
          border: '2px solid rgba(255, 212, 28, 0.3)',
          color: 'rgba(251, 251, 251, 0.5)'
        }}>
          <div className="text-5xl mb-4">💳</div>
          <div>{searchQuery || merchantFilter !== 'all' ? 'No transactions match your filters' : 'No transactions found'}</div>
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, #1E2347 0%, #181D40 100%)',
          borderRadius: '16px',
          border: '2px solid rgba(255, 212, 28, 0.3)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 212, 28, 0.1)' }}>
                <th style={headerStyle}>Date</th>
                <th style={headerStyle}>Merchant</th>
                <th style={headerStyle}>Student</th>
                <th style={headerStyle}>Amount</th>
                <th style={headerStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx, i) => (
                <tr
                  key={tx._id || i}
                  style={{
                    borderBottom: i < filteredTransactions.length - 1
                      ? '1px solid rgba(255, 212, 28, 0.1)'
                      : 'none'
                  }}
                >
                  <td style={cellStyle}>{new Date(tx.timestamp).toLocaleString()}</td>
                  <td style={cellStyle}>{tx.merchantName || 'N/A'}</td>
                  <td style={cellStyle}>{tx.studentName || 'N/A'}</td>
                  <td style={{ ...cellStyle, fontWeight: 600, color: '#10B981' }}>
                    ₱{tx.amount.toFixed(2)}
                  </td>
                  <td style={cellStyle}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: tx.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: tx.status === 'Completed' ? '#10B981' : '#EF4444'
                    }}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const headerStyle = {
  padding: '16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 700,
  color: '#FFD41C',
  textTransform: 'uppercase'
};

const cellStyle = {
  padding: '16px',
  fontSize: '14px',
  color: 'rgba(251, 251, 251, 0.9)'
};
