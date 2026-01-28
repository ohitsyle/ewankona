// client/src/pages/admin/Shared/Config.jsx
// Shared Configuration page for Treasury and Accounting modules
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { toast } from "react-toastify";

import Header from "../../../components/layouts/Header";
import Footer from "../../../components/layouts/Footer";
import Navbar from "../../../components/layouts/Navbar";

export default function Config() {
  const { theme, isDarkMode } = useTheme();
  const location = useLocation();
  const isTreasury = location.pathname.startsWith("/treasury");

  const [settings, setSettings] = useState({
    maxTransactionAmount: 10000,
    minCashInAmount: 50,
    enableNotifications: true,
    enableEmailAlerts: false,
    autoApproveTransactions: false,
    sessionTimeout: 30
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    toast.success("Settings saved successfully");
    // API call would go here
  };

  const handleReset = () => {
    setSettings({
      maxTransactionAmount: 10000,
      minCashInAmount: 50,
      enableNotifications: true,
      enableEmailAlerts: false,
      autoApproveTransactions: false,
      sessionTimeout: 30
    });
    toast.info("Settings reset to defaults");
  };

  const baseColor = isDarkMode ? '255, 212, 28' : '59, 130, 246';

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg.primary,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ position: "sticky", top: 0, zIndex: 1000 }}>
        <Header />
      </div>

      <div style={{ flex: 1, padding: "40px" }}>
        <Navbar />

        {/* Page Header */}
        <div
          className="mb-5 p-3 rounded-lg"
          style={{
            background: `rgba(${baseColor}, 0.1)`,
            borderBottom: `2px solid ${theme.accent.primary}`,
          }}
        >
          <h1
            className="text-2xl font-bold"
            style={{ color: theme.accent.primary }}
          >
            ⚙️ Configuration
          </h1>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Transaction Settings */}
          <div
            className="p-5 rounded-lg"
            style={{
              background: theme.bg.card,
              border: `1px solid rgba(${baseColor}, 0.2)`
            }}
          >
            <h2 className="text-lg font-bold mb-4" style={{ color: theme.text.primary }}>
              💰 Transaction Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: theme.text.secondary }}>
                  Maximum Transaction Amount (₱)
                </label>
                <input
                  type="number"
                  value={settings.maxTransactionAmount}
                  onChange={(e) => handleSettingChange('maxTransactionAmount', parseInt(e.target.value))}
                  style={{
                    background: theme.bg.secondary,
                    color: theme.text.primary,
                    border: `1px solid rgba(${baseColor}, 0.3)`,
                  }}
                  className="w-full px-3 py-2 rounded-md outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: theme.text.secondary }}>
                  Minimum Cash-In Amount (₱)
                </label>
                <input
                  type="number"
                  value={settings.minCashInAmount}
                  onChange={(e) => handleSettingChange('minCashInAmount', parseInt(e.target.value))}
                  style={{
                    background: theme.bg.secondary,
                    color: theme.text.primary,
                    border: `1px solid rgba(${baseColor}, 0.3)`,
                  }}
                  className="w-full px-3 py-2 rounded-md outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoApprove"
                  checked={settings.autoApproveTransactions}
                  onChange={(e) => handleSettingChange('autoApproveTransactions', e.target.checked)}
                  style={{ accentColor: theme.accent.primary }}
                />
                <label htmlFor="autoApprove" className="text-sm" style={{ color: theme.text.primary }}>
                  Auto-approve transactions under ₱500
                </label>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div
            className="p-5 rounded-lg"
            style={{
              background: theme.bg.card,
              border: `1px solid rgba(${baseColor}, 0.2)`
            }}
          >
            <h2 className="text-lg font-bold mb-4" style={{ color: theme.text.primary }}>
              🔔 Notification Settings
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableNotifications"
                  checked={settings.enableNotifications}
                  onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                  style={{ accentColor: theme.accent.primary }}
                />
                <label htmlFor="enableNotifications" className="text-sm" style={{ color: theme.text.primary }}>
                  Enable push notifications
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableEmailAlerts"
                  checked={settings.enableEmailAlerts}
                  onChange={(e) => handleSettingChange('enableEmailAlerts', e.target.checked)}
                  style={{ accentColor: theme.accent.primary }}
                />
                <label htmlFor="enableEmailAlerts" className="text-sm" style={{ color: theme.text.primary }}>
                  Enable email alerts for large transactions
                </label>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div
            className="p-5 rounded-lg"
            style={{
              background: theme.bg.card,
              border: `1px solid rgba(${baseColor}, 0.2)`
            }}
          >
            <h2 className="text-lg font-bold mb-4" style={{ color: theme.text.primary }}>
              🔐 Security Settings
            </h2>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: theme.text.secondary }}>
                Session Timeout (minutes)
              </label>
              <select
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                style={{
                  background: theme.bg.secondary,
                  color: theme.text.primary,
                  border: `1px solid rgba(${baseColor}, 0.3)`,
                }}
                className="w-full px-3 py-2 rounded-md outline-none"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            style={{
              background: theme.accent.primary,
              color: theme.bg.primary,
            }}
            className="flex-1 py-3 rounded-md font-semibold hover:opacity-80 transition"
          >
            💾 Save Changes
          </button>

          <button
            onClick={handleReset}
            style={{
              background: theme.bg.secondary,
              color: theme.accent.primary,
              border: `1px solid ${theme.accent.primary}`,
            }}
            className="px-6 py-3 rounded-md font-semibold hover:opacity-80 transition"
          >
            🔄 Reset to Defaults
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
