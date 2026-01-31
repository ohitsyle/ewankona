// src/pages/admin/Sysad/ConfigPage.jsx
// System Admin Configuration - Maintenance Mode, Export Settings, Deactivation Scheduler

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import {
  Settings, Shield, Download, Calendar, Clock, Power, AlertTriangle,
  CheckCircle, X, Loader2, Archive, FileText, RefreshCw, Users
} from 'lucide-react';

export default function SysadConfigPage() {
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    maintenanceMode: false,
    autoExport: {
      enabled: false,
      frequency: 'daily',
      time: '00:00',
      dataTypes: ['transactions', 'users']
    },
    deactivationScheduler: {
      enabled: false,
      date: '',
      time: ''
    }
  });
  const [exportArchives, setExportArchives] = useState({ automatic: [], manual: [] });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Purple accent for sysad
  const accentColor = '#8B5CF6';

  useEffect(() => {
    fetchConfig();
    fetchExportArchives();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/sysad/config');
      if (data) {
        setConfig(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExportArchives = async () => {
    try {
      const data = await api.get('/admin/sysad/export-archives');
      if (data) {
        setExportArchives(data);
      }
    } catch (error) {
      console.error('Failed to fetch archives:', error);
    }
  };

  const handleToggleMaintenance = async () => {
    const newValue = !config.maintenanceMode;
    if (newValue && !window.confirm('Are you sure you want to enable maintenance mode? All users except system admins will be locked out.')) {
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin/sysad/maintenance-mode', { enabled: newValue });
      setConfig(prev => ({ ...prev, maintenanceMode: newValue }));
      toast.success(`Maintenance mode ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update maintenance mode');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAutoExport = async (settings) => {
    setSaving(true);
    try {
      await api.post('/admin/sysad/auto-export-settings', settings);
      setConfig(prev => ({ ...prev, autoExport: settings }));
      toast.success('Auto-export settings saved');
      setShowScheduleModal(false);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleManualExport = async (dateRange, dataTypes) => {
    try {
      const response = await api.post('/admin/sysad/manual-export', { dateRange, dataTypes });
      toast.success('Export generated successfully');
      setShowExportModal(false);
      fetchExportArchives();
      // Trigger download
      if (response.downloadUrl) {
        window.open(response.downloadUrl, '_blank');
      }
    } catch (error) {
      toast.error('Failed to generate export');
    }
  };

  const handleSaveDeactivationSchedule = async () => {
    if (!config.deactivationScheduler.date || !config.deactivationScheduler.time) {
      toast.error('Please set both date and time');
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin/sysad/deactivation-schedule', config.deactivationScheduler);
      toast.success('Deactivation schedule saved');
    } catch (error) {
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadArchive = async (archiveId) => {
    try {
      const response = await api.get(`/admin/sysad/download-archive/${archiveId}`);
      if (response.downloadUrl) {
        window.open(response.downloadUrl, '_blank');
      }
    } catch (error) {
      toast.error('Failed to download archive');
    }
  };

  if (loading) {
    return (
      <div style={{ color: accentColor }} className="text-center py-20">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        Loading configuration...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-220px)] flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-6 border-b-2 pb-5">
        <h2 style={{ color: accentColor }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>⚙️</span> System Configuration
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          Manage system settings, maintenance mode, and scheduled tasks
        </p>
      </div>

      <div className="space-y-6">
        {/* Maintenance Mode */}
        <div
          style={{ background: theme.bg.card, borderColor: config.maintenanceMode ? 'rgba(239,68,68,0.5)' : theme.border.primary }}
          className="p-6 rounded-2xl border-2"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                style={{ background: config.maintenanceMode ? 'rgba(239,68,68,0.2)' : `${accentColor}20` }}
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <Shield className="w-6 h-6" style={{ color: config.maintenanceMode ? '#EF4444' : accentColor }} />
              </div>
              <div>
                <h3 style={{ color: theme.text.primary }} className="font-bold text-lg mb-1">Maintenance Mode</h3>
                <p style={{ color: theme.text.secondary }} className="text-sm mb-3">
                  When enabled, only system administrators can access the system. All other users will see a maintenance message.
                </p>
                {config.maintenanceMode && (
                  <div
                    style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-red-500 text-sm font-semibold">System is in maintenance mode</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleToggleMaintenance}
              disabled={saving}
              style={{
                background: config.maintenanceMode ? '#EF4444' : '#10B981',
                color: '#FFFFFF'
              }}
              className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5" />}
              {config.maintenanceMode ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Report Export Section */}
        <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border">
          <div className="flex items-center gap-3 mb-6">
            <div style={{ background: `${accentColor}20` }} className="w-10 h-10 rounded-full flex items-center justify-center">
              <Download className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <h3 style={{ color: theme.text.primary }} className="font-bold text-lg">Report Export</h3>
              <p style={{ color: theme.text.secondary }} className="text-sm">Configure automatic and manual report exports</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Automatic Export */}
            <div
              style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', borderColor: theme.border.primary }}
              className="p-4 rounded-xl border"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 style={{ color: theme.text.primary }} className="font-semibold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" style={{ color: accentColor }} />
                  Automatic Export
                </h4>
                <span
                  style={{
                    background: config.autoExport?.enabled ? 'rgba(16,185,129,0.2)' : 'rgba(107,114,128,0.2)',
                    color: config.autoExport?.enabled ? '#10B981' : '#6B7280'
                  }}
                  className="px-2 py-1 rounded text-xs font-bold"
                >
                  {config.autoExport?.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p style={{ color: theme.text.secondary }} className="text-sm mb-4">
                {config.autoExport?.enabled
                  ? `Running ${config.autoExport.frequency} at ${config.autoExport.time}`
                  : 'No automatic export configured'}
              </p>
              <button
                onClick={() => setShowScheduleModal(true)}
                style={{ background: `${accentColor}20`, color: accentColor, borderColor: `${accentColor}40` }}
                className="w-full py-2.5 rounded-lg font-semibold text-sm border hover:opacity-80 transition"
              >
                Configure Schedule
              </button>
            </div>

            {/* Manual Export */}
            <div
              style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', borderColor: theme.border.primary }}
              className="p-4 rounded-xl border"
            >
              <h4 style={{ color: theme.text.primary }} className="font-semibold flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4" style={{ color: accentColor }} />
                Manual Export
              </h4>
              <p style={{ color: theme.text.secondary }} className="text-sm mb-4">
                Generate a one-time export with custom date range
              </p>
              <button
                onClick={() => setShowExportModal(true)}
                style={{ background: accentColor, color: '#FFFFFF' }}
                className="w-full py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition"
              >
                Download Report Data
              </button>
            </div>
          </div>

          {/* Export Archives */}
          <div className="mt-6">
            <h4 style={{ color: theme.text.primary }} className="font-semibold mb-3 flex items-center gap-2">
              <Archive className="w-4 h-4" style={{ color: accentColor }} />
              Export Archives
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Automatic Archives */}
              <div
                style={{ background: isDarkMode ? 'rgba(15,18,39,0.3)' : '#F3F4F6', borderColor: theme.border.primary }}
                className="p-4 rounded-xl border"
              >
                <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase mb-3">Automatic Export Archives</p>
                {exportArchives.automatic?.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {exportArchives.automatic.map((archive, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                        <span style={{ color: theme.text.primary }} className="text-sm">{archive.name}</span>
                        <button
                          onClick={() => handleDownloadArchive(archive.id)}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: theme.text.muted }} className="text-sm">No automatic exports yet</p>
                )}
              </div>

              {/* Manual Archives */}
              <div
                style={{ background: isDarkMode ? 'rgba(15,18,39,0.3)' : '#F3F4F6', borderColor: theme.border.primary }}
                className="p-4 rounded-xl border"
              >
                <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase mb-3">Manual Export Archives</p>
                {exportArchives.manual?.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {exportArchives.manual.map((archive, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                        <span style={{ color: theme.text.primary }} className="text-sm">{archive.name}</span>
                        <button
                          onClick={() => handleDownloadArchive(archive.id)}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: theme.text.muted }} className="text-sm">No manual exports yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Deactivation Scheduler */}
        <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border">
          <div className="flex items-center gap-3 mb-6">
            <div style={{ background: 'rgba(239,68,68,0.2)' }} className="w-10 h-10 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 style={{ color: theme.text.primary }} className="font-bold text-lg">Student Deactivation Scheduler</h3>
              <p style={{ color: theme.text.secondary }} className="text-sm">
                Schedule automatic deactivation of all STUDENT accounts (employees and admins not affected)
              </p>
            </div>
          </div>

          <div
            style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }}
            className="p-4 rounded-xl border mb-6 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p style={{ color: theme.text.secondary }} className="text-sm">
              <strong className="text-amber-500">Warning:</strong> This will deactivate ALL student accounts at the scheduled time.
              Employees and admin accounts will not be affected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">
                Enable Scheduler
              </label>
              <button
                onClick={() => setConfig(prev => ({
                  ...prev,
                  deactivationScheduler: { ...prev.deactivationScheduler, enabled: !prev.deactivationScheduler.enabled }
                }))}
                style={{
                  background: config.deactivationScheduler?.enabled ? '#EF4444' : 'rgba(107,114,128,0.2)',
                  color: config.deactivationScheduler?.enabled ? '#FFFFFF' : theme.text.secondary
                }}
                className="w-full py-3 rounded-xl font-semibold transition"
              >
                {config.deactivationScheduler?.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">
                Date
              </label>
              <input
                type="date"
                value={config.deactivationScheduler?.date || ''}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  deactivationScheduler: { ...prev.deactivationScheduler, date: e.target.value }
                }))}
                disabled={!config.deactivationScheduler?.enabled}
                style={{
                  background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                  color: theme.text.primary,
                  borderColor: theme.border.primary
                }}
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">
                Time
              </label>
              <input
                type="time"
                value={config.deactivationScheduler?.time || ''}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  deactivationScheduler: { ...prev.deactivationScheduler, time: e.target.value }
                }))}
                disabled={!config.deactivationScheduler?.enabled}
                style={{
                  background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                  color: theme.text.primary,
                  borderColor: theme.border.primary
                }}
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {config.deactivationScheduler?.enabled && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveDeactivationSchedule}
                disabled={saving}
                style={{ background: '#EF4444', color: '#FFFFFF' }}
                className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save Schedule
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manual Export Modal */}
      {showExportModal && (
        <ManualExportModal
          theme={theme}
          isDarkMode={isDarkMode}
          onClose={() => setShowExportModal(false)}
          onExport={handleManualExport}
        />
      )}

      {/* Auto Export Schedule Modal */}
      {showScheduleModal && (
        <AutoExportModal
          theme={theme}
          isDarkMode={isDarkMode}
          config={config.autoExport}
          onClose={() => setShowScheduleModal(false)}
          onSave={handleSaveAutoExport}
          saving={saving}
        />
      )}
    </div>
  );
}

// Manual Export Modal
function ManualExportModal({ theme, isDarkMode, onClose, onExport }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dataTypes, setDataTypes] = useState(['transactions', 'users']);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select date range');
      return;
    }
    setExporting(true);
    await onExport({ startDate, endDate }, dataTypes);
    setExporting(false);
  };

  const toggleDataType = (type) => {
    setDataTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        style={{ background: isDarkMode ? '#1E2347' : '#FFFFFF', borderColor: theme.border.primary }}
        className="relative rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }} className="px-6 py-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5" /> Manual Export
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
              />
            </div>
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">Data to Export</label>
            <div className="flex flex-wrap gap-2">
              {['transactions', 'users', 'merchants', 'logs'].map(type => (
                <button
                  key={type}
                  onClick={() => toggleDataType(type)}
                  style={{
                    background: dataTypes.includes(type) ? '#8B5CF6' : (isDarkMode ? 'rgba(30,35,71,0.8)' : '#F9FAFB'),
                    color: dataTypes.includes(type) ? '#FFFFFF' : theme.text.secondary,
                    borderColor: theme.border.primary
                  }}
                  className="px-3 py-2 rounded-lg font-semibold text-xs border capitalize transition"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              style={{ background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB', color: theme.text.primary }}
              className="flex-1 py-3 rounded-xl font-semibold transition hover:opacity-80"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || dataTypes.length === 0}
              style={{ background: '#8B5CF6', color: '#FFFFFF' }}
              className="flex-1 py-3 rounded-xl font-semibold transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Auto Export Schedule Modal
function AutoExportModal({ theme, isDarkMode, config, onClose, onSave, saving }) {
  const [settings, setSettings] = useState({
    enabled: config?.enabled || false,
    frequency: config?.frequency || 'daily',
    time: config?.time || '00:00',
    dataTypes: config?.dataTypes || ['transactions', 'users']
  });

  const toggleDataType = (type) => {
    setSettings(prev => ({
      ...prev,
      dataTypes: prev.dataTypes.includes(type)
        ? prev.dataTypes.filter(t => t !== type)
        : [...prev.dataTypes, type]
    }));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        style={{ background: isDarkMode ? '#1E2347' : '#FFFFFF', borderColor: theme.border.primary }}
        className="relative rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }} className="px-6 py-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5" /> Auto Export Schedule
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span style={{ color: theme.text.primary }} className="font-semibold">Enable Auto Export</span>
            <button
              onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
              style={{
                background: settings.enabled ? '#10B981' : 'rgba(107,114,128,0.3)',
                color: '#FFFFFF'
              }}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition"
            >
              {settings.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div>
            <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">Frequency</label>
            <select
              value={settings.frequency}
              onChange={(e) => setSettings(prev => ({ ...prev, frequency: e.target.value }))}
              disabled={!settings.enabled}
              style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none disabled:opacity-50"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">Export Time</label>
            <input
              type="time"
              value={settings.time}
              onChange={(e) => setSettings(prev => ({ ...prev, time: e.target.value }))}
              disabled={!settings.enabled}
              style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">Data Types</label>
            <div className="flex flex-wrap gap-2">
              {['transactions', 'users', 'merchants', 'logs'].map(type => (
                <button
                  key={type}
                  onClick={() => toggleDataType(type)}
                  disabled={!settings.enabled}
                  style={{
                    background: settings.dataTypes.includes(type) ? '#8B5CF6' : (isDarkMode ? 'rgba(30,35,71,0.8)' : '#F9FAFB'),
                    color: settings.dataTypes.includes(type) ? '#FFFFFF' : theme.text.secondary,
                    borderColor: theme.border.primary
                  }}
                  className="px-3 py-2 rounded-lg font-semibold text-xs border capitalize transition disabled:opacity-50"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              style={{ background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB', color: theme.text.primary }}
              className="flex-1 py-3 rounded-xl font-semibold transition hover:opacity-80"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(settings)}
              disabled={saving}
              style={{ background: '#8B5CF6', color: '#FFFFFF' }}
              className="flex-1 py-3 rounded-xl font-semibold transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
