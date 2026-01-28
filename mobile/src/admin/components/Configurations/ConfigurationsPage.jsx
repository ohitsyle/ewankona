// src/admin/components/Configurations/ConfigurationsPage.jsx
// System configurations: Auto-export reports

import React, { useState, useEffect } from 'react';
import api from '../../services/api';

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
  const [showManualExportModal, setShowManualExportModal] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);
  const [dateRange, setDateRange] = useState('all'); // all, 24hr, week, month, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    loadConfigurations();
    loadExportHistory();
  }, []);

  const loadConfigurations = async () => {
    try {
      const data = await api.get('/admin/configurations');
      if (data) {
        setConfigurations(data);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  };

  const loadExportHistory = async () => {
    try {
      const data = await api.get('/admin/configurations/export-history');
      setExportHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading export history:', error);
    }
  };

  const handleSaveAutoExport = async () => {
    setLoading(true);
    try {
      await api.put('/admin/configurations/auto-export', configurations.autoExport);
      showAlert('success', 'Auto-export settings saved successfully!');
      setShowExportModal(false);
      loadConfigurations();
    } catch (error) {
      showAlert('error', error.response?.data?.error || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleManualExport = async () => {
    setLoading(true);
    try {
      // Calculate date range
      let startDate, endDate;
      const now = new Date();

      if (dateRange === '24hr') {
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        endDate = now;
      } else if (dateRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
      } else if (dateRange === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
      } else if (dateRange === 'custom') {
        if (!customStartDate || !customEndDate) {
          showAlert('error', 'Please select both start and end dates');
          setLoading(false);
          return;
        }
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate + 'T23:59:59');
      }

      const result = await api.post('/admin/configurations/manual-export-all', {
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        dateRange
      });

      showAlert('success', `All data exported successfully! (${result.totalRecords} total records)`);

      // Trigger download
      if (result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.fileName || `nucash_export_all_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setShowManualExportModal(false);
      setDateRange('all');
      setCustomStartDate('');
      setCustomEndDate('');
      loadExportHistory();
    } catch (error) {
      showAlert('error', error.response?.data?.error || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExport = async (exportId) => {
    try {
      const result = await api.get(`/admin/configurations/download-export/${exportId}`);
      if (result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      showAlert('error', 'Failed to download export');
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
          Configure automated data exports and system settings
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
                System automatically exports all data as ZIP files for backup and compliance.
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
              Export All Data Now
            </h4>
            <p style={{ color: 'rgba(251,251,251,0.6)', fontSize: '13px', marginBottom: '16px' }}>
              Download a complete ZIP file with all system data including drivers, trips, transactions, users, shuttles, routes, logs, phones, concerns, and merchants.
            </p>
            <button
              onClick={() => setShowManualExportModal(true)}
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
                      <span style={{ color: '#FFD41C', fontWeight: 700 }}>{exp.exportType}</span>
                      <span style={{ color: 'rgba(251,251,251,0.5)', marginLeft: '16px', fontSize: '13px' }}>
                        {new Date(exp.exportedAt || exp.timestamp || exp.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {exp.status === 'success' ? (
                      <button
                        onClick={() => handleDownloadExport(exp._id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: 'rgba(34,197,94,0.2)',
                          color: '#22C55E',
                          border: '2px solid rgba(34,197,94,0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(34,197,94,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(34,197,94,0.2)';
                        }}
                      >
                        📥 Download
                      </button>
                    ) : (
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: 'rgba(239,68,68,0.2)',
                        color: '#EF4444'
                      }}>
                        ✗ Failed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Export Date Range Modal */}
      {showManualExportModal && (
        <div
          onClick={() => setShowManualExportModal(false)}
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
              maxWidth: '500px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h3 style={{ color: '#FFD41C', fontSize: '22px', fontWeight: 700, margin: '0 0 8px 0' }}>
              Select Date Range
            </h3>
            <p style={{ color: 'rgba(251,251,251,0.6)', fontSize: '13px', margin: '0 0 24px 0' }}>
              Choose which records to include in the export
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {[
                { value: 'all', label: '📅 All Time', desc: 'Export all records' },
                { value: '24hr', label: '🕐 Last 24 Hours', desc: 'Records from the past day' },
                { value: 'week', label: '📆 This Week', desc: 'Records from the past 7 days' },
                { value: 'month', label: '📊 This Month', desc: 'Records from current month' },
                { value: 'custom', label: '🎯 Custom Range', desc: 'Choose specific dates' }
              ].map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    background: dateRange === option.value ? 'rgba(255, 212, 28, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: `2px solid ${dateRange === option.value ? 'rgba(255, 212, 28, 0.4)' : 'rgba(255, 212, 28, 0.15)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (dateRange !== option.value) {
                      e.currentTarget.style.background = 'rgba(255, 212, 28, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (dateRange !== option.value) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="dateRange"
                    value={option.value}
                    checked={dateRange === option.value}
                    onChange={(e) => setDateRange(e.target.value)}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#FBFBFB', fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                      {option.label}
                    </div>
                    <div style={{ color: 'rgba(251,251,251,0.5)', fontSize: '12px' }}>
                      {option.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Custom Date Inputs */}
            {dateRange === 'custom' && (
              <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: '#FFD41C' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '2px solid rgba(255, 212, 28, 0.3)',
                        borderRadius: '8px',
                        color: '#FBFBFB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: '#FFD41C' }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '2px solid rgba(255, 212, 28, 0.3)',
                        borderRadius: '8px',
                        color: '#FBFBFB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleManualExport}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  background: loading ? '#9CA3AF' : '#22C55E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(34, 197, 94, 0.4)',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? '⏳ Exporting...' : '📥 Export Now'}
              </button>
              <button
                onClick={() => {
                  setShowManualExportModal(false);
                  setDateRange('all');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
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
      )}

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
              Set up when and how often the system should automatically export data.
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
                  {['Drivers', 'Trips', 'Transactions', 'Users', 'Shuttles', 'Routes', 'Logs', 'Phones', 'Concerns', 'Merchants'].map((type) => (
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
