// src/pages/admin/Treasury/ConfigPage.jsx
// Treasury Configurations - matches Motorpool design with combined export archives
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';

export default function ConfigPage() {
  const { theme, isDarkMode } = useTheme();
  const [configurations, setConfigurations] = useState({
    autoExport: {
      frequency: 'daily',
      exportTypes: [],
      time: '00:00',
      emailRecipients: []
    }
  });
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showManualExportModal, setShowManualExportModal] = useState(false);
  const [exportArchive, setExportArchive] = useState([]);
  const [archiveFilter, setArchiveFilter] = useState('all'); // 'all', 'auto', 'manual'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Treasury-specific export types
  const TREASURY_EXPORT_TYPES = [
    { value: 'Transactions', icon: '💳', label: 'Transactions' },
    { value: 'Cash-Ins', icon: '💵', label: 'Cash-Ins' },
    { value: 'Users', icon: '👥', label: 'Users' },
    { value: 'Balances', icon: '💰', label: 'Balance Summary' },
    { value: 'Logs', icon: '📋', label: 'Treasury Logs' },
    { value: 'Concerns', icon: '💬', label: 'Treasury Concerns' }
  ];

  useEffect(() => {
    loadConfigurations();
    loadExportArchive();
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

  const loadExportArchive = async () => {
    try {
      // Load both scheduled and manual exports into one archive - filtered by treasury admin role
      const [scheduledData, historyData] = await Promise.all([
        api.get('/admin/configurations/scheduled-exports?adminRole=treasury').catch(() => []),
        api.get('/admin/configurations/export-history?adminRole=treasury').catch(() => [])
      ]);

      const scheduled = (Array.isArray(scheduledData) ? scheduledData : []).map(exp => ({
        ...exp,
        exportSource: 'auto'
      }));

      const manual = (Array.isArray(historyData) ? historyData : []).map(exp => ({
        ...exp,
        exportSource: 'manual'
      }));

      // Combine and sort by date
      const combined = [...scheduled, ...manual].sort((a, b) => {
        const dateA = new Date(a.exportedAt || a.timestamp || a.createdAt);
        const dateB = new Date(b.exportedAt || b.timestamp || b.createdAt);
        return dateB - dateA;
      });

      setExportArchive(combined);
    } catch (error) {
      console.error('Error loading export archive:', error);
    }
  };

  const handleSaveAutoExport = async () => {
    setLoading(true);
    try {
      await api.put('/admin/configurations/auto-export', configurations.autoExport);
      toast.success('Auto-export settings saved successfully!');
      setShowConfigModal(false);
      loadConfigurations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleManualExport = async () => {
    setLoading(true);
    try {
      if (!configurations.autoExport.exportTypes || configurations.autoExport.exportTypes.length === 0) {
        toast.error('Please select at least one export type in the configuration settings');
        setLoading(false);
        return;
      }

      const result = await api.post('/admin/configurations/manual-export-treasury', {
        exportTypes: configurations.autoExport.exportTypes,
        dateRange,
        customStartDate,
        customEndDate
      });

      toast.success(`Treasury data exported successfully! (${result.totalRecords || 0} total records)`);

      if (result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.fileName || `treasury_export_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setShowManualExportModal(false);
      setDateRange('all');
      setCustomStartDate('');
      setCustomEndDate('');
      loadExportArchive();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Export failed');
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
      toast.error('Failed to download export');
    }
  };

  // Filter archive based on type, search and date range
  const filteredArchive = exportArchive.filter((exp) => {
    // Type filter
    if (archiveFilter !== 'all' && exp.exportSource !== archiveFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        exp.exportType?.toLowerCase().includes(query) ||
        exp.fileName?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Date filter
    if (filterDateRange.start || filterDateRange.end) {
      const exportDate = new Date(exp.exportedAt || exp.timestamp || exp.createdAt);
      if (filterDateRange.start && exportDate < new Date(filterDateRange.start)) return false;
      if (filterDateRange.end && exportDate > new Date(filterDateRange.end + 'T23:59:59')) return false;
    }

    return true;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div style={{ marginBottom: '24px', borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}`, paddingBottom: '16px' }}>
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>⚙️</span> Treasury Settings
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          Configure automated treasury data exports and system settings
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pr-2">
        {/* Auto-Export Section */}
        <div style={{
          background: theme.bg.card,
          borderRadius: '16px',
          border: `1px solid ${theme.border.primary}`,
          padding: '28px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h3 style={{ color: theme.accent.primary, fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📊</span> Automated Treasury Export
              </h3>
              <p style={{ color: theme.text.secondary, fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                System automatically exports treasury data as ZIP files for backup and compliance.
                <br />Configure the schedule and download reports manually anytime.
              </p>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              style={{
                padding: '12px 20px',
                background: isDarkMode ? 'rgba(255,212,28,0.15)' : 'rgba(59,130,246,0.15)',
                border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                borderRadius: '10px',
                color: theme.accent.primary,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>⚙️</span>
              <span>Configure Schedule</span>
            </button>
          </div>

          {/* Current Settings Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <SettingCard icon="📅" label="Frequency" value={configurations.autoExport.frequency?.charAt(0).toUpperCase() + configurations.autoExport.frequency?.slice(1) || 'Not set'} theme={theme} />
            <SettingCard icon="🕐" label="Export Time" value={configurations.autoExport.time || 'Not set'} theme={theme} />
            <SettingCard icon="📦" label="Data Types" value={`${configurations.autoExport.exportTypes?.length || 0} selected`} theme={theme} />
          </div>

          {/* Manual Export Button */}
          <div style={{
            padding: '24px',
            background: 'rgba(34,197,94,0.1)',
            border: '2px dashed rgba(34,197,94,0.3)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
            <h4 style={{ color: theme.text.primary, fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
              Export Treasury Data Now
            </h4>
            <p style={{ color: theme.text.secondary, fontSize: '13px', marginBottom: '16px' }}>
              Download a complete ZIP file with all treasury data: transactions, cash-ins, users, balances, logs, and concerns.
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
                boxShadow: loading ? 'none' : '0 4px 12px rgba(34,197,94,0.4)',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? '⏳ Exporting...' : '📥 Download Treasury Data (ZIP)'}
            </button>
          </div>
        </div>

        {/* Combined Export Archive */}
        <div style={{
          background: theme.bg.card,
          borderRadius: '16px',
          border: `1px solid ${theme.border.primary}`,
          padding: '28px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ color: theme.accent.primary, fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🗄️</span> Export Archive
              </h3>
              <p style={{ color: theme.text.secondary, fontSize: '12px', margin: 0 }}>
                All exports - auto-scheduled and manual
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Type Filter Tabs */}
              <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${theme.border.primary}` }}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'auto', label: '🔄 Auto' },
                  { key: 'manual', label: '👆 Manual' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setArchiveFilter(tab.key)}
                    style={{
                      padding: '8px 16px',
                      background: archiveFilter === tab.key ? theme.accent.primary : 'transparent',
                      color: archiveFilter === tab.key ? (isDarkMode ? '#181D40' : '#FFFFFF') : theme.text.secondary,
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search exports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 16px',
                  background: theme.bg.tertiary,
                  border: `2px solid ${theme.border.primary}`,
                  borderRadius: '8px',
                  color: theme.text.primary,
                  fontSize: '13px',
                  outline: 'none',
                  width: '180px'
                }}
              />

              {/* Date Filter */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="date"
                  value={filterDateRange.start}
                  onChange={(e) => setFilterDateRange({ ...filterDateRange, start: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    background: theme.bg.tertiary,
                    border: `2px solid ${theme.border.primary}`,
                    borderRadius: '8px',
                    color: theme.text.primary,
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <span style={{ color: theme.text.tertiary }}>→</span>
                <input
                  type="date"
                  value={filterDateRange.end}
                  onChange={(e) => setFilterDateRange({ ...filterDateRange, end: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    background: theme.bg.tertiary,
                    border: `2px solid ${theme.border.primary}`,
                    borderRadius: '8px',
                    color: theme.text.primary,
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                {(filterDateRange.start || filterDateRange.end || searchQuery) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterDateRange({ start: '', end: '' });
                    }}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(239,68,68,0.2)',
                      border: '2px solid rgba(239,68,68,0.3)',
                      borderRadius: '8px',
                      color: '#EF4444',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredArchive.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: theme.text.tertiary,
              fontSize: '14px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>📂</div>
              <p style={{ margin: 0 }}>No exports found</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                {archiveFilter !== 'all' ? 'Try changing the filter or ' : ''}
                Configure auto-export or run a manual export to start
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredArchive.map((exp, idx) => (
                  <div
                    key={exp._id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 18px',
                      background: theme.bg.tertiary,
                      borderRadius: '10px',
                      border: `1px solid ${theme.border.primary}`,
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '20px' }}>{exp.exportSource === 'auto' ? '🔄' : '👆'}</span>
                        <span style={{ color: theme.accent.primary, fontWeight: 700, fontSize: '15px' }}>
                          {exp.exportType || 'Treasury Export'}
                        </span>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: exp.exportSource === 'auto' ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)',
                          color: exp.exportSource === 'auto' ? '#3B82F6' : '#22C55E',
                          border: `1px solid ${exp.exportSource === 'auto' ? 'rgba(59,130,246,0.3)' : 'rgba(34,197,94,0.3)'}`
                        }}>
                          {exp.exportSource === 'auto' ? 'AUTO' : 'MANUAL'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: theme.text.secondary }}>
                        <span>📅 {new Date(exp.exportedAt || exp.timestamp || exp.createdAt).toLocaleDateString()}</span>
                        <span>🕐 {new Date(exp.exportedAt || exp.timestamp || exp.createdAt).toLocaleTimeString()}</span>
                        {exp.fileName && <span>📄 {exp.fileName}</span>}
                        {exp.recordCount && <span>📊 {exp.recordCount} records</span>}
                      </div>
                    </div>
                    {exp.status === 'success' || !exp.status ? (
                      <button
                        onClick={() => handleDownloadExport(exp._id)}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 700,
                          background: 'rgba(34,197,94,0.2)',
                          color: '#22C55E',
                          border: '2px solid rgba(34,197,94,0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        📥 Download
                      </button>
                    ) : (
                      <span style={{
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        background: 'rgba(239,68,68,0.2)',
                        color: '#EF4444',
                        border: '2px solid rgba(239,68,68,0.3)'
                      }}>
                        ✗ Failed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Export Modal */}
      {showManualExportModal && (
        <DateRangeModal
          dateRange={dateRange}
          setDateRange={setDateRange}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          loading={loading}
          onExport={handleManualExport}
          onCancel={() => {
            setShowManualExportModal(false);
            setDateRange('all');
            setCustomStartDate('');
            setCustomEndDate('');
          }}
          theme={theme}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Auto-Export Configuration Modal */}
      {showConfigModal && (
        <ConfigModal
          configurations={configurations}
          setConfigurations={setConfigurations}
          exportTypes={TREASURY_EXPORT_TYPES}
          loading={loading}
          onSave={handleSaveAutoExport}
          onCancel={() => setShowConfigModal(false)}
          theme={theme}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}

// Setting Card Component
function SettingCard({ icon, label, value, theme }) {
  return (
    <div style={{
      padding: '20px',
      background: theme.bg.tertiary,
      borderRadius: '12px',
      border: `1px solid ${theme.border.primary}`
    }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '12px', color: theme.text.secondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: '16px', color: theme.text.primary, fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
}

// Date Range Modal
function DateRangeModal({ dateRange, setDateRange, customStartDate, setCustomStartDate, customEndDate, setCustomEndDate, loading, onExport, onCancel, theme, isDarkMode }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(15,18,39,0.9)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDarkMode ? 'linear-gradient(135deg, #1a1f3a 0%, #0f1227 100%)' : '#FFFFFF',
          borderRadius: '16px',
          border: `1px solid ${theme.border.primary}`,
          padding: '32px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}
      >
        <h3 style={{ color: theme.accent.primary, fontSize: '22px', fontWeight: 700, margin: '0 0 8px 0' }}>
          Select Date Range
        </h3>
        <p style={{ color: theme.text.secondary, fontSize: '13px', margin: '0 0 24px 0' }}>
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
                background: dateRange === option.value ? `${theme.accent.primary}20` : theme.bg.tertiary,
                border: `2px solid ${dateRange === option.value ? theme.accent.primary : theme.border.primary}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
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
                <div style={{ color: theme.text.primary, fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                  {option.label}
                </div>
                <div style={{ color: theme.text.secondary, fontSize: '12px' }}>
                  {option.desc}
                </div>
              </div>
            </label>
          ))}
        </div>

        {dateRange === 'custom' && (
          <div style={{ marginBottom: '24px', padding: '16px', background: theme.bg.tertiary, borderRadius: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: theme.accent.primary }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: theme.bg.secondary,
                    border: `2px solid ${theme.border.primary}`,
                    borderRadius: '8px',
                    color: theme.text.primary,
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: theme.accent.primary }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: theme.bg.secondary,
                    border: `2px solid ${theme.border.primary}`,
                    borderRadius: '8px',
                    color: theme.text.primary,
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onExport}
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
              boxShadow: loading ? 'none' : '0 4px 12px rgba(34,197,94,0.4)',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Exporting...' : '📥 Export Now'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: '14px 24px',
              background: theme.bg.tertiary,
              color: theme.text.primary,
              border: `2px solid ${theme.border.primary}`,
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
  );
}

// Configuration Modal
function ConfigModal({ configurations, setConfigurations, exportTypes, loading, onSave, onCancel, theme, isDarkMode }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(15,18,39,0.9)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDarkMode ? 'linear-gradient(135deg, #1a1f3a 0%, #0f1227 100%)' : '#FFFFFF',
          borderRadius: '16px',
          border: `1px solid ${theme.border.primary}`,
          padding: '32px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}
      >
        <h3 style={{ color: theme.accent.primary, fontSize: '22px', fontWeight: 700, margin: '0 0 8px 0' }}>
          Configure Export Schedule
        </h3>
        <p style={{ color: theme.text.secondary, fontSize: '13px', margin: '0 0 24px 0' }}>
          Set up when and how often the system should automatically export data.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Frequency */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: theme.accent.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                background: theme.bg.tertiary,
                border: `2px solid ${theme.border.primary}`,
                borderRadius: '8px',
                color: theme.text.primary,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="daily" style={{ background: isDarkMode ? '#1E2347' : '#FFFFFF' }}>📅 Daily</option>
              <option value="weekly" style={{ background: isDarkMode ? '#1E2347' : '#FFFFFF' }}>📅 Weekly</option>
              <option value="monthly" style={{ background: isDarkMode ? '#1E2347' : '#FFFFFF' }}>📅 Monthly</option>
            </select>
          </div>

          {/* Time */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: theme.accent.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                background: theme.bg.tertiary,
                border: `2px solid ${theme.border.primary}`,
                borderRadius: '8px',
                color: theme.text.primary,
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Export Types */}
          <div>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: 700, color: theme.accent.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Data Types to Export
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {exportTypes.map((type) => (
                <label
                  key={type.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    background: configurations.autoExport.exportTypes?.includes(type.value)
                      ? `${theme.accent.primary}20`
                      : theme.bg.tertiary,
                    border: `2px solid ${configurations.autoExport.exportTypes?.includes(type.value)
                      ? theme.accent.primary
                      : theme.border.primary}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={configurations.autoExport.exportTypes?.includes(type.value) || false}
                    onChange={(e) => {
                      const types = configurations.autoExport.exportTypes || [];
                      const newTypes = e.target.checked
                        ? [...types, type.value]
                        : types.filter(t => t !== type.value);
                      setConfigurations({
                        ...configurations,
                        autoExport: { ...configurations.autoExport, exportTypes: newTypes }
                      });
                    }}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '16px' }}>{type.icon}</span>
                  <span style={{ color: theme.text.primary, fontSize: '14px', fontWeight: 600 }}>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={onSave}
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px 24px',
                background: loading ? '#9CA3AF' : theme.accent.primary,
                color: isDarkMode ? '#181D40' : '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(255,212,28,0.4)',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? '⏳ Saving...' : '💾 Save Settings'}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px 24px',
                background: theme.bg.tertiary,
                color: theme.text.primary,
                border: `2px solid ${theme.border.primary}`,
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
  );
}
