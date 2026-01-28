// src/merchant/components/Logs/LogsList.jsx
// Merchant portal logs - simplified version matching motorpool design

import React, { useState, useEffect } from 'react';

export default function LogsList({ merchantData }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  const loadLogs = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('merchantToken');

      const response = await fetch(`${API_URL}/api/merchant/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error loading logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // Refresh logs every 10 seconds
    const interval = setInterval(loadLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      log.eventType?.toLowerCase().includes(searchLower) ||
      log.type?.toLowerCase().includes(searchLower) ||
      log.title?.toLowerCase().includes(searchLower) ||
      log.description?.toLowerCase().includes(searchLower) ||
      log.message?.toLowerCase().includes(searchLower) ||
      new Date(log.timestamp).toLocaleString().toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        marginBottom: '30px',
        borderBottom: '2px solid rgba(255, 212, 28, 0.2)',
        paddingBottom: '20px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#FFD41C',
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>📋</span> Activity Logs
          </h2>
          <p style={{
            fontSize: '13px',
            color: 'rgba(251, 251, 251, 0.6)',
            margin: 0
          }}>
            Showing {filteredLogs.length} logs • Page {currentPage} of {Math.max(1, totalPages)}
          </p>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search logs..."
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
            outline: 'none'
          }}
        />
      </div>

      {/* Scrollable Area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
      {filteredLogs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          color: 'rgba(251, 251, 251, 0.5)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <div>{searchQuery ? 'No logs found' : 'No activity logs yet'}</div>
        </div>
      ) : (
        <>
          {/* Logs Table */}
          <div style={{
            background: 'linear-gradient(135deg, #1E2347 0%, #181D40 100%)',
            borderRadius: '16px',
            border: '2px solid rgba(255, 212, 28, 0.3)',
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ background: 'rgba(255, 212, 28, 0.1)' }}>
                  <th style={headerStyle}>Timestamp</th>
                  <th style={headerStyle}>Type</th>
                  <th style={headerStyle}>Title</th>
                  <th style={headerStyle}>Description</th>
                  <th style={headerStyle}>Severity</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((log, index) => (
                  <tr
                    key={log._id || index}
                    style={{
                      borderBottom: index < currentLogs.length - 1
                        ? '1px solid rgba(255, 212, 28, 0.1)'
                        : 'none'
                    }}
                  >
                    <td style={cellStyle}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={cellStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: log.eventType === 'admin_action' || log.type === 'admin_action'
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'rgba(168, 85, 247, 0.2)',
                        color: log.eventType === 'admin_action' || log.type === 'admin_action'
                          ? '#3B82F6'
                          : '#A855F7'
                      }}>
                        {log.eventType || log.type || 'N/A'}
                      </span>
                    </td>
                    <td style={{ ...cellStyle, fontWeight: 600 }}>
                      {log.title || 'N/A'}
                    </td>
                    <td style={{
                      ...cellStyle,
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'rgba(251, 251, 251, 0.7)'
                    }}>
                      {log.description || log.message || 'N/A'}
                    </td>
                    <td style={cellStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: log.severity === 'warning'
                          ? 'rgba(251, 191, 36, 0.2)'
                          : log.severity === 'error'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(34, 197, 94, 0.2)',
                        color: log.severity === 'warning'
                          ? '#FBBF24'
                          : log.severity === 'error'
                          ? '#EF4444'
                          : '#22C55E'
                      }}>
                        {log.severity || 'info'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              background: 'rgba(30, 35, 71, 0.5)',
              borderRadius: '12px',
              border: '2px solid rgba(255, 212, 28, 0.2)'
            }}>
              <div style={{
                fontSize: '13px',
                color: 'rgba(251, 251, 251, 0.6)'
              }}>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    background: currentPage === 1
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(255, 212, 28, 0.15)',
                    border: '2px solid rgba(255, 212, 28, 0.3)',
                    borderRadius: '8px',
                    color: currentPage === 1
                      ? 'rgba(251, 251, 251, 0.3)'
                      : '#FFD41C',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 16px',
                    background: currentPage === totalPages
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(255, 212, 28, 0.15)',
                    border: '2px solid rgba(255, 212, 28, 0.3)',
                    borderRadius: '8px',
                    color: currentPage === totalPages
                      ? 'rgba(251, 251, 251, 0.3)'
                      : '#FFD41C',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
      </div>

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
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const cellStyle = {
  padding: '16px',
  fontSize: '14px',
  color: 'rgba(251, 251, 251, 0.9)'
};
