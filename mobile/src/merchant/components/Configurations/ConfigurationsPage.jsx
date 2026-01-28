// src/merchant/components/Configurations/ConfigurationsPage.jsx
// Merchant admin configurations

import React, { useState, useEffect } from 'react';

export default function ConfigurationsPage() {
  const [configurations, setConfigurations] = useState({
    autoExport: {
      frequency: 'daily',
      exportTypes: [],
      time: '00:00',
      emailRecipients: []
    }
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);

  useEffect(() => {
    loadConfigurations();
    loadExportHistory();
  }, []);

  const loadConfigurations = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('merchantToken');

      const response = await fetch(`${API_URL}/api/merchant/configurations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setConfigurations(data);
        }
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  };

  const loadExportHistory = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('merchantToken');

      const response = await fetch(`${API_URL}/api/merchant/configurations/export-history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExportHistory(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading export history:', error);
    }
  };

  const handleSaveAutoExport = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('merchantToken');

      const response = await fetch(`${API_URL}/api/merchant/configurations/auto-export`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configurations.autoExport)
      });

      if (response.ok) {
        showAlert('success', 'Auto-export settings saved successfully!');
        setShowExportModal(false);
        loadConfigurations();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      showAlert('error', 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleManualExport = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('merchantToken');

      const response = await fetch(`${API_URL}/api/merchant/configurations/manual-export-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        showAlert('success', `All merchant data exported successfully! (${result.totalRecords} total records)`);

        // Trigger download
        if (result.downloadUrl) {
          const link = document.createElement('a');
          link.href = result.downloadUrl;
          link.download = result.fileName || `merchant_export_all_${new Date().toISOString().split('T')[0]}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        loadExportHistory();
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      showAlert('error', error.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', borderBottom: '2px solid rgba(255,212,28,0.2)', paddingBottom: '16px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#FFD41C', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>⚙️</span> System Configurations
        </h2>
        <p style={{ fontSize: '13px', color: 'rgba(251,251,251,0.6)', margin: 0 }}>
          Configure automated data exports for merchant transactions and logs
        </p>
      </div>

      {/* Alert */}
      {alert && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '16px 24px',
          borderRadius: '12px',
          background: alert.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
          color: alert.type === 'success' ? '#22C55E' : '#EF4444',
          border: `2px solid ${alert.type === 'success' ? '#22C55E' : '#EF4444'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 10000,
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{alert.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
        {/* Auto-Export Section */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255,212,28,0.2)',
          padding: '28px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h3 style={{ color: '#FFD41C', fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📊</span> Automated Data Export
              </h3>
              <p style={{ color: 'rgba(251,251,251,0.6)', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                System automatically exports merchant data as ZIP files for backup and compliance.
                <br />Configure the schedule and download reports manually anytime.
              </p>
            </div>
            <button
              onClick={() => setShowExportModal(true)}
              style={{
                padding: '12px 20px',
                background: 'rgba(255, 212, 28, 0.15)',
                border: '2px solid rgba(255, 212, 28, 0.3)',
                borderRadius: '10px',
                color: '#FFD41C',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 212, 28, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(255, 212, 28, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 212, 28, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 212, 28, 0.3)';
              }}
            >
              <span>⚙️</span>
              <span>Configure Schedule</span>
            </button>
          </div>

          {/* Current Settings Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <SettingCard
              icon="📅"
              label="Frequency"
              value={configurations.autoExport.frequency?.charAt(0).toUpperCase() + configurations.autoExport.frequency?.slice(1) || 'Not set'}
            />
            <SettingCard
              icon="🕐"
              label="Export Time"
              value={configurations.autoExport.time || 'Not set'}
            />
            <SettingCard
              icon="📦"
              label="Data Types"
              value={`${configurations.autoExport.exportTypes?.length || 0} selected`}
            />
          </div>

          {/* Manual Export Button */}
          <div style={{
            padding: '24px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '2px dashed rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
            <h4 style={{ color: '#FBFBFB', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
              Export All Merchant Data Now
            </h4>
            <p style={{ color: 'rgba(251,251,251,0.6)', fontSize: '13px', marginBottom: '16px' }}>
              Download a complete ZIP file with all merchant system data including merchants, transactions, and logs.
            </p>
            <button
              onClick={handleManualExport}
              disabled={loading}
              style={{
                padding: '14px 32px',
                background: loading ? '#9CA3AF' : '#22C55E',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(34, 197, 94, 0.4)',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)';
                }
              }}
            >
              {loading ? '⏳ Exporting...' : '📥 Download All Data (ZIP)'}
            </button>
          </div>
        </div>

        {/* Export History */}
        {exportHistory.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255,212,28,0.2)',
            padding: '28px'
          }}>
            <h3 style={{ color: '#FFD41C', fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📜</span> Recent Export History
            </h3>
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {exportHistory.slice(0, 10).map((exp, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,212,28,0.1)',
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.borderColor = 'rgba(255,212,28,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255,212,28,0.1)';
                    }}
                  >
                    <div>
                      <span style={{ color: '#FFD41C', fontWeight: 700 }}>{exp.type}</span>
                      <span style={{ color: 'rgba(251,251,251,0.5)', marginLeft: '16px', fontSize: '13px' }}>
                        {new Date(exp.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      background: exp.status === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                      color: exp.status === 'success' ? '#10B981' : '#EF4444'
                    }}>
                      {exp.status === 'success' ? '✓ Success' : '✗ Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auto-Export Configuration Modal */}
      {showExportModal && (
        <div
          onClick={() => setShowExportModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 18, 39, 0.9)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1227 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 212, 28, 0.2)',
              padding: '32px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h3 style={{ color: '#FFD41C', fontSize: '22px', fontWeight: 700, margin: '0 0 8px 0' }}>
              Configure Export Schedule
            </h3>
            <p style={{ color: 'rgba(251,251,251,0.6)', fontSize: '13px', margin: '0 0 24px 0' }}>
              Set up when and how often the system should automatically export merchant data.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Frequency */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Frequency
                </label>
                <select
                  value={configurations.autoExport.frequency}
                  onChange={(e) => setConfigurations({
                    ...configurations,
                    autoExport: { ...configurations.autoExport, frequency: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(255, 212, 28, 0.3)',
                    borderRadius: '8px',
                    color: '#FBFBFB',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="daily" style={{ background: '#1E2347' }}>📅 Daily</option>
                  <option value="weekly" style={{ background: '#1E2347' }}>📅 Weekly</option>
                  <option value="monthly" style={{ background: '#1E2347' }}>📅 Monthly</option>
                  <option value="custom" style={{ background: '#1E2347' }}>📅 Custom Date</option>
                </select>
              </div>

              {/* Time */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Export Time (24-hour)
                </label>
                <input
                  type="time"
                  value={configurations.autoExport.time}
                  onChange={(e) => setConfigurations({
                    ...configurations,
                    autoExport: { ...configurations.autoExport, time: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(255, 212, 28, 0.3)',
                    borderRadius: '8px',
                    color: '#FBFBFB',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Export Types */}
              <div>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Data Types to Export
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {['Merchants', 'Transactions', 'Logs'].map((type) => (
                    <label
                      key={type}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px',
                        background: configurations.autoExport.exportTypes?.includes(type)
                          ? 'rgba(255, 212, 28, 0.15)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: `2px solid ${configurations.autoExport.exportTypes?.includes(type)
                          ? 'rgba(255, 212, 28, 0.4)'
                          : 'rgba(255, 212, 28, 0.15)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 212, 28, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = configurations.autoExport.exportTypes?.includes(type)
                          ? 'rgba(255, 212, 28, 0.15)'
                          : 'rgba(255, 255, 255, 0.05)';
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={configurations.autoExport.exportTypes?.includes(type) || false}
                        onChange={(e) => {
                          const types = configurations.autoExport.exportTypes || [];
                          const newTypes = e.target.checked
                            ? [...types, type]
                            : types.filter(t => t !== type);
                          setConfigurations({
                            ...configurations,
                            autoExport: { ...configurations.autoExport, exportTypes: newTypes }
                          });
                        }}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                      <span style={{ color: '#FBFBFB', fontSize: '14px', fontWeight: 600 }}>{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={handleSaveAutoExport}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: loading ? '#9CA3AF' : '#FFD41C',
                    color: '#181D40',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 4px 12px rgba(255, 212, 28, 0.4)',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? '⏳ Saving...' : '💾 Save Settings'}
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: 'rgba(255, 212, 28, 0.1)',
                    color: '#FFD41C',
                    border: '2px solid rgba(255, 212, 28, 0.3)',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function SettingCard({ icon, label, value }) {
  return (
    <div style={{
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 212, 28, 0.15)'
    }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '12px', color: 'rgba(251, 251, 251, 0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: '16px', color: '#FBFBFB', fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
}
