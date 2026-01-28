// src/merchant/components/Reports/ReportsPage.jsx
import React, { useState, useEffect } from 'react';

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('merchantToken');

      const response = await fetch(`${API_URL}/api/merchant/reports?range=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load reports');
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (format) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const token = localStorage.getItem('merchantToken');
    window.open(`${API_URL}/api/merchant/reports/download?format=${format}&range=${dateRange}&token=${token}`, '_blank');
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#FFD41C' }}>Loading reports...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#FBFBFB', margin: 0 }}>
          Reports & Analytics
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => downloadReport('csv')}
            style={{
              padding: '10px 20px',
              background: '#10B981',
              color: '#FFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => downloadReport('pdf')}
            style={{
              padding: '10px 20px',
              background: '#EF4444',
              color: '#FFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['today', 'week', 'month', 'quarter', 'year'].map(range => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            style={{
              padding: '10px 20px',
              background: dateRange === range ? '#FFD41C' : 'rgba(255, 212, 28, 0.1)',
              color: dateRange === range ? '#181D40' : '#FFD41C',
              border: '2px solid rgba(255, 212, 28, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (dateRange !== range) {
                e.currentTarget.style.background = 'rgba(255, 212, 28, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (dateRange !== range) {
                e.currentTarget.style.background = 'rgba(255, 212, 28, 0.1)';
              }
            }}
          >
            {range === 'today' ? 'Today' : range}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <ReportCard
          title="Total Revenue"
          value={`₱${(reportData?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon="💰"
          color="#FFD41C"
        />
        <ReportCard
          title="Total Transactions"
          value={(reportData?.totalTransactions || 0).toLocaleString()}
          icon="💳"
          color="#3B82F6"
        />
        <ReportCard
          title="Average Transaction"
          value={`₱${(reportData?.avgTransaction || 0).toFixed(2)}`}
          icon="📊"
          color="#10B981"
        />
        <ReportCard
          title="Active Merchants"
          value={reportData?.activeMerchants || 0}
          icon="🏪"
          color="#8B5CF6"
        />
      </div>

      {reportData?.topMerchants && (
        <div style={{
          background: '#1E2347',
          borderRadius: '16px',
          border: '2px solid rgba(255, 212, 28, 0.3)',
          padding: '24px',
          marginTop: '24px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FBFBFB', marginBottom: '16px' }}>
            Top Performing Merchants
          </h3>
          {reportData.topMerchants.map((m, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px',
              background: 'rgba(255, 212, 28, 0.05)',
              borderRadius: '8px',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#FBFBFB', fontWeight: 600 }}>{m.name}</span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>₱{m.revenue.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ title, value, icon, color }) {
  return (
    <div style={{
      background: '#1E2347',
      borderRadius: '16px',
      border: '2px solid rgba(255, 212, 28, 0.3)',
      padding: '24px'
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(251, 251, 251, 0.7)', marginBottom: '8px', textTransform: 'uppercase' }}>
        {title}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
