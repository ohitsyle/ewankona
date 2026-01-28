// src/admin/components/Settings/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.get('/admin/settings');
      setSettings(data || {});
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings if load fails
      setSettings({
        general: {
          systemName: 'NUCash Motorpool System',
          supportEmail: 'support@nucash.com',
          maintenanceMode: false
        },
        fare: {
          baseFare: 15,
          perKmRate: 5,
          currency: 'PHP'
        },
        shuttle: {
          maxCapacity: 20,
          autoAssignment: true,
          maintenanceAlertThreshold: 30
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          driverAlerts: true
        }
      });
      setLoading(false);
    }
  };

  const handleSaveSetting = async (section, key, value) => {
    setSaving(true);
    try {
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');

      // Update local state
      const updatedSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          [key]: value
        }
      };
      setSettings(updatedSettings);

      // Save to backend
      await api.put('/admin/settings', {
        section,
        key,
        value,
        adminId: adminData._id,
        adminName: adminData.name
      });

      console.log(`✅ Setting updated: ${section}.${key} = ${value}`);
    } catch (error) {
      console.error('Error saving setting:', error);
      alert('Failed to save setting. Please try again.');
      loadSettings(); // Reload settings on error
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#FFD41C' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '30px', borderBottom: '2px solid rgba(255,212,28,0.2)', paddingBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#FFD41C', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>⚙️</span> System Settings
        </h2>
        <p style={{ fontSize: '13px', color: 'rgba(251,251,251,0.6)', margin: 0 }}>
          Configure system-wide settings and preferences
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px' }}>
        {/* Settings Navigation */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255,212,28,0.2)',
          padding: '20px',
          height: 'fit-content'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFD41C', marginBottom: '16px' }}>
            Settings
          </h3>
          {[
            { id: 'general', icon: '🏢', label: 'General' },
            { id: 'fare', icon: '💰', label: 'Fare Settings' },
            { id: 'shuttle', icon: '🚐', label: 'Shuttle Config' },
            { id: 'notifications', icon: '🔔', label: 'Notifications' }
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: activeSection === section.id ? 'rgba(255,212,28,0.15)' : 'transparent',
                border: activeSection === section.id ? '2px solid rgba(255,212,28,0.3)' : '2px solid transparent',
                borderRadius: '8px',
                color: activeSection === section.id ? '#FFD41C' : 'rgba(251,251,251,0.7)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
                textAlign: 'left'
              }}
            >
              <span style={{ fontSize: '18px' }}>{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255,212,28,0.2)',
          padding: '24px'
        }}>
          {activeSection === 'general' && (
            <GeneralSettings
              settings={settings.general || {}}
              onSave={(key, value) => handleSaveSetting('general', key, value)}
              saving={saving}
            />
          )}
          {activeSection === 'fare' && (
            <FareSettings
              settings={settings.fare || {}}
              onSave={(key, value) => handleSaveSetting('fare', key, value)}
              saving={saving}
            />
          )}
          {activeSection === 'shuttle' && (
            <ShuttleSettings
              settings={settings.shuttle || {}}
              onSave={(key, value) => handleSaveSetting('shuttle', key, value)}
              saving={saving}
            />
          )}
          {activeSection === 'notifications' && (
            <NotificationSettings
              settings={settings.notifications || {}}
              onSave={(key, value) => handleSaveSetting('notifications', key, value)}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// General Settings Component
function GeneralSettings({ settings, onSave, saving }) {
  const [systemName, setSystemName] = useState(settings.systemName || '');
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail || '');

  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFD41C', marginBottom: '20px' }}>
        General Settings
      </h3>

      <SettingRow
        label="System Name"
        description="Display name for the motorpool system"
      >
        <input
          type="text"
          value={systemName}
          onChange={(e) => setSystemName(e.target.value)}
          onBlur={() => onSave('systemName', systemName)}
          disabled={saving}
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,212,28,0.3)',
            borderRadius: '8px',
            color: '#FBFBFB',
            fontSize: '13px'
          }}
        />
      </SettingRow>

      <SettingRow
        label="Support Email"
        description="Contact email for system support"
      >
        <input
          type="email"
          value={supportEmail}
          onChange={(e) => setSupportEmail(e.target.value)}
          onBlur={() => onSave('supportEmail', supportEmail)}
          disabled={saving}
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,212,28,0.3)',
            borderRadius: '8px',
            color: '#FBFBFB',
            fontSize: '13px'
          }}
        />
      </SettingRow>

      <SettingRow
        label="Maintenance Mode"
        description="Temporarily disable system for maintenance"
      >
        <ToggleSwitch
          value={settings.maintenanceMode}
          onChange={(value) => onSave('maintenanceMode', value)}
          disabled={saving}
        />
      </SettingRow>
    </div>
  );
}

// Fare Settings Component
function FareSettings({ settings, onSave, saving }) {
  const [baseFare, setBaseFare] = useState(settings.baseFare || 15);
  const [perKmRate, setPerKmRate] = useState(settings.perKmRate || 5);

  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFD41C', marginBottom: '20px' }}>
        Fare Settings
      </h3>

      <SettingRow
        label="Base Fare"
        description="Starting fare for all trips"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#FFD41C', fontSize: '16px' }}>₱</span>
          <input
            type="number"
            value={baseFare}
            onChange={(e) => setBaseFare(parseFloat(e.target.value))}
            onBlur={() => onSave('baseFare', baseFare)}
            disabled={saving}
            min="0"
            step="1"
            style={{
              width: '120px',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,212,28,0.3)',
              borderRadius: '8px',
              color: '#FBFBFB',
              fontSize: '13px'
            }}
          />
        </div>
      </SettingRow>

      <SettingRow
        label="Per Kilometer Rate"
        description="Additional charge per kilometer traveled"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#FFD41C', fontSize: '16px' }}>₱</span>
          <input
            type="number"
            value={perKmRate}
            onChange={(e) => setPerKmRate(parseFloat(e.target.value))}
            onBlur={() => onSave('perKmRate', perKmRate)}
            disabled={saving}
            min="0"
            step="0.5"
            style={{
              width: '120px',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,212,28,0.3)',
              borderRadius: '8px',
              color: '#FBFBFB',
              fontSize: '13px'
            }}
          />
          <span style={{ color: 'rgba(251,251,251,0.6)', fontSize: '13px' }}>/km</span>
        </div>
      </SettingRow>

      <SettingRow
        label="Currency"
        description="System currency"
      >
        <div style={{ color: '#FFD41C', fontSize: '16px', fontWeight: 600 }}>
          PHP (Philippine Peso)
        </div>
      </SettingRow>
    </div>
  );
}

// Shuttle Settings Component
function ShuttleSettings({ settings, onSave, saving }) {
  const [maxCapacity, setMaxCapacity] = useState(settings.maxCapacity || 20);
  const [maintenanceThreshold, setMaintenanceThreshold] = useState(settings.maintenanceAlertThreshold || 30);

  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFD41C', marginBottom: '20px' }}>
        Shuttle Configuration
      </h3>

      <SettingRow
        label="Maximum Capacity"
        description="Default maximum passenger capacity per shuttle"
      >
        <input
          type="number"
          value={maxCapacity}
          onChange={(e) => setMaxCapacity(parseInt(e.target.value))}
          onBlur={() => onSave('maxCapacity', maxCapacity)}
          disabled={saving}
          min="1"
          max="50"
          style={{
            width: '120px',
            padding: '10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,212,28,0.3)',
            borderRadius: '8px',
            color: '#FBFBFB',
            fontSize: '13px'
          }}
        />
      </SettingRow>

      <SettingRow
        label="Auto Assignment"
        description="Automatically assign available shuttles to routes"
      >
        <ToggleSwitch
          value={settings.autoAssignment}
          onChange={(value) => onSave('autoAssignment', value)}
          disabled={saving}
        />
      </SettingRow>

      <SettingRow
        label="Maintenance Alert Threshold"
        description="Days before maintenance is due to send alerts"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            value={maintenanceThreshold}
            onChange={(e) => setMaintenanceThreshold(parseInt(e.target.value))}
            onBlur={() => onSave('maintenanceAlertThreshold', maintenanceThreshold)}
            disabled={saving}
            min="1"
            max="90"
            style={{
              width: '120px',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,212,28,0.3)',
              borderRadius: '8px',
              color: '#FBFBFB',
              fontSize: '13px'
            }}
          />
          <span style={{ color: 'rgba(251,251,251,0.6)', fontSize: '13px' }}>days</span>
        </div>
      </SettingRow>
    </div>
  );
}

// Notification Settings Component
function NotificationSettings({ settings, onSave, saving }) {
  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFD41C', marginBottom: '20px' }}>
        Notification Settings
      </h3>

      <SettingRow
        label="Email Notifications"
        description="Send email notifications for important events"
      >
        <ToggleSwitch
          value={settings.emailNotifications}
          onChange={(value) => onSave('emailNotifications', value)}
          disabled={saving}
        />
      </SettingRow>

      <SettingRow
        label="SMS Notifications"
        description="Send SMS notifications to drivers and passengers"
      >
        <ToggleSwitch
          value={settings.smsNotifications}
          onChange={(value) => onSave('smsNotifications', value)}
          disabled={saving}
        />
      </SettingRow>

      <SettingRow
        label="Driver Alerts"
        description="Send alerts to drivers for route assignments and updates"
      >
        <ToggleSwitch
          value={settings.driverAlerts}
          onChange={(value) => onSave('driverAlerts', value)}
          disabled={saving}
        />
      </SettingRow>
    </div>
  );
}

// Reusable Setting Row Component
function SettingRow({ label, description, children }) {
  return (
    <div style={{
      padding: '20px',
      borderBottom: '1px solid rgba(255,212,28,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '20px'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#FBFBFB', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(251,251,251,0.6)' }}>
          {description}
        </div>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({ value, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={{
        width: '56px',
        height: '32px',
        borderRadius: '16px',
        background: value ? '#22C55E' : 'rgba(255,255,255,0.1)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background 0.3s ease',
        opacity: disabled ? 0.5 : 1
      }}
    >
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: '#FFFFFF',
        position: 'absolute',
        top: '4px',
        left: value ? '28px' : '4px',
        transition: 'left 0.3s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }} />
    </button>
  );
}
