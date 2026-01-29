// src/pages/admin/Treasury/ConfigPage.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';

export default function ConfigPage() {
  const { theme } = useTheme();

  const [config, setConfig] = useState({
    minCashIn: 10,
    maxCashIn: 10000,
    dailyCashInLimit: 50000,
    autoLogoutMinutes: 30
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem('adminData');
    if (data) {
      setAdminData(JSON.parse(data));
    }
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
    <div className="h-full flex flex-col max-w-3xl">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-[30px] border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>⚙️</span> Settings
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          Configure treasury operations and limits
        </p>
      </div>

      {/* Admin Profile */}
      <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border mb-5">
        <h3 style={{ color: theme.text.primary }} className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>👤</span> Admin Profile
        </h3>
        <div className="flex items-center gap-4">
          <div style={{ background: theme.accent.primary, color: theme.accent.secondary }} className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl">
            {adminData?.firstName?.charAt(0) || 'A'}
          </div>
          <div>
            <p style={{ color: theme.text.primary }} className="font-bold text-lg">
              {adminData?.firstName} {adminData?.lastName}
            </p>
            <p style={{ color: theme.text.secondary }} className="text-sm">
              {adminData?.email}
            </p>
            <span style={{ background: '#10B98120', color: '#10B981' }} className="text-xs font-semibold px-2 py-1 rounded mt-2 inline-block">
              Treasury Admin
            </span>
          </div>
        </div>
      </div>

      {/* Cash-In Limits */}
      <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border mb-5">
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
              style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none"
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
              style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none"
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
              style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Security */}
      <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="p-6 rounded-2xl border mb-5">
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
            style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
            className="w-full px-4 py-3 rounded-xl border focus:outline-none max-w-xs"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveConfig}
          disabled={saving}
          style={{
            background: saving ? 'rgba(100,100,100,0.3)' : theme.accent.primary,
            color: saving ? theme.text.muted : theme.accent.secondary
          }}
          className="px-8 py-3 rounded-xl font-bold transition hover:opacity-90"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
