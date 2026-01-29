// src/pages/admin/Treasury/ConfigPage.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';

export default function ConfigPage() {
  const { theme, isDarkMode } = useTheme();

  const [config, setConfig] = useState({
    minCashIn: 10,
    maxCashIn: 10000,
    dailyCashInLimit: 50000,
    autoLogoutMinutes: 30
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/treasury/config');
      if (data?.config) {
        setConfig(prev => ({ ...prev, ...data.config }));
      }
    } catch (error) {
      // Use default config if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const data = await api.put('/admin/treasury/config', config);
      if (data?.success) {
        toast.success('Settings saved');
      } else {
        toast.error(data?.message || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div style={{ color: theme.accent.primary }} className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: `${theme.accent.primary} transparent transparent transparent` }} />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-6 border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>⚙️</span> Settings
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          Configure treasury operations and limits
        </p>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl space-y-5">
          {/* Cash-In Limits */}
          <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border">
            <h3 style={{ color: theme.text.primary }} className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>💰</span> Cash-In Limits
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
                  Minimum Amount (₱)
                </label>
                <input
                  type="number"
                  value={config.minCashIn}
                  onChange={(e) => handleInputChange('minCashIn', parseInt(e.target.value) || 0)}
                  style={{
                    background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                    color: theme.text.primary,
                    borderColor: theme.border.primary
                  }}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                />
              </div>
              <div>
                <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
                  Maximum Amount (₱)
                </label>
                <input
                  type="number"
                  value={config.maxCashIn}
                  onChange={(e) => handleInputChange('maxCashIn', parseInt(e.target.value) || 0)}
                  style={{
                    background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                    color: theme.text.primary,
                    borderColor: theme.border.primary
                  }}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                />
              </div>
              <div className="col-span-2">
                <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
                  Daily Limit per User (₱)
                </label>
                <input
                  type="number"
                  value={config.dailyCashInLimit}
                  onChange={(e) => handleInputChange('dailyCashInLimit', parseInt(e.target.value) || 0)}
                  style={{
                    background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                    color: theme.text.primary,
                    borderColor: theme.border.primary
                  }}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                />
                <p style={{ color: theme.text.tertiary }} className="text-xs mt-2">
                  Maximum amount a single user can cash-in per day
                </p>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border">
            <h3 style={{ color: theme.text.primary }} className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🔒</span> Security
            </h3>
            <div>
              <label style={{ color: theme.text.secondary }} className="block text-xs font-bold uppercase mb-2">
                Auto Logout (minutes)
              </label>
              <input
                type="number"
                value={config.autoLogoutMinutes}
                onChange={(e) => handleInputChange('autoLogoutMinutes', parseInt(e.target.value) || 0)}
                style={{
                  background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                  color: theme.text.primary,
                  borderColor: theme.border.primary
                }}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-400/30 max-w-xs"
              />
              <p style={{ color: theme.text.tertiary }} className="text-xs mt-2">
                Automatically log out after this many minutes of inactivity
              </p>
            </div>
          </div>

          {/* Notification Settings */}
          <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border">
            <h3 style={{ color: theme.text.primary }} className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🔔</span> Notifications
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded accent-yellow-500"
                />
                <span style={{ color: theme.text.primary }} className="text-sm">
                  Email notifications for large transactions
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded accent-yellow-500"
                />
                <span style={{ color: theme.text.primary }} className="text-sm">
                  Daily summary reports
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded accent-yellow-500"
                />
                <span style={{ color: theme.text.primary }} className="text-sm">
                  Alert on suspicious activity
                </span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 pb-8">
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              style={{
                background: saving ? 'rgba(100,100,100,0.3)' : theme.accent.primary,
                color: saving ? theme.text.muted : (isDarkMode ? '#181D40' : '#FFFFFF')
              }}
              className="px-8 py-3 rounded-xl font-bold transition hover:opacity-90 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
