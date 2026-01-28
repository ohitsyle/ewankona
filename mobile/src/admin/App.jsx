// src/admin/App.jsx
// Main app component with authentication and routing

import React, { useState, useEffect } from 'react';
import Login from '../shared/components/Auth/Login';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Dashboard from './components/Dashboard/Dashboard';
import DriversList from './components/Drivers/DriversList';
import ShuttlesList from './components/Shuttles/ShuttlesList';
import RoutesList from './components/Routes/RoutesList';
import PhonesList from './components/Phones/PhonesList';
import TripsList from './components/Trips/TripsList';
import ConcernsList from './components/Concerns/ConcernsList';
import LogsList from './components/Logs/LogsList';
import DriverNotifications from './components/Communication/DriverNotifications';
import ConfigurationsPage from './components/Configurations/ConfigurationsPage';
import SettingsPage from './components/Settings/SettingsPage';
import ProfilePage from './components/Profile/ProfilePage';
import './styles/global.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [tabVisibility, setTabVisibility] = useState({
    home: true,
    drivers: true,
    shuttles: true,
    routes: true,
    phones: true,
    trips: true,
    concerns: true,
    configurations: true,
    logs: true
  });

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('adminData');

    if (token && storedAdmin) {
      try {
        const admin = JSON.parse(storedAdmin);
        setAdminData(admin);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to parse stored admin data:', err);
        handleLogout();
      }
    }
  }, []);

  // Load tab visibility configuration
  useEffect(() => {
    if (isAuthenticated) {
      loadTabVisibility();
    }
  }, [isAuthenticated]);

  const loadTabVisibility = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/configurations/tab-visibility', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (response.ok) {
        const config = await response.json();
        setTabVisibility(config);
      }
    } catch (error) {
      console.error('Failed to load tab visibility:', error);
    }
  };

  const handleLogin = (data) => {
    console.log('✅ Admin login successful:', data);

    // Check if this is actually an admin with merchant role
    if (data.admin) {
      // Admin login response
      if (data.admin.role === 'merchant') {
        console.log('🔄 Merchant admin detected, redirecting to merchant portal...');
        // Encode credentials to pass via URL (since localStorage is origin-specific)
        const encodedToken = encodeURIComponent(data.token);
        const encodedData = encodeURIComponent(JSON.stringify(data.admin));
        // Redirect to merchant portal with credentials in URL
        window.location.href = `http://localhost:3000/merchant?token=${encodedToken}&data=${encodedData}`;
        return;
      }

      // Motorpool admin - proceed normally
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminData', JSON.stringify(data.admin));
      setAdminData(data.admin);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdminData(null);
    setIsAuthenticated(false);
    setActiveTab('home');
  };

  // If not authenticated, show login
  if (!isAuthenticated) {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    return (
      <Login
        onLogin={handleLogin}
        apiEndpoint={`${API_URL}/api/admin/auth/login`}
        forgotPasswordEndpoint={`${API_URL}/api/admin/auth/forgot-password`}
        title="Login Portal"
      />
    );
  }

  // Main dashboard layout
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <Header
        adminData={adminData}
        onLogout={handleLogout}
        onOpenProfile={() => setActiveTab('profile')}
      />

      {/* Tab Navigation */}
      <nav style={{
        background: 'transparent',
        padding: '12px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        position: 'sticky',
        top: '89px',
        zIndex: 100
      }}>
        {/* Main tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'home', icon: '🏠', label: 'Home' },
            { id: 'drivers', icon: '👥', label: 'Drivers' },
            { id: 'shuttles', icon: '🚐', label: 'Shuttles' },
            { id: 'routes', icon: '🗺️', label: 'Routes' },
            { id: 'phones', icon: '📱', label: 'Phones' },
            { id: 'trips', icon: '🚗', label: 'Trips' },
            { id: 'concerns', icon: '📢', label: 'Concerns' },
            { id: 'configurations', icon: '⚙️', label: 'Configurations' },
            { id: 'logs', icon: '📋', label: 'Logs' }
          ].filter(tab => tabVisibility[tab.id] !== false).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              background: activeTab === tab.id
                ? 'rgba(255, 212, 28, 0.15)'
                : 'rgba(30, 35, 71, 0.4)',
              border: activeTab === tab.id
                ? '2px solid rgba(255, 212, 28, 0.4)'
                : '2px solid rgba(255, 212, 28, 0.1)',
              borderRadius: '12px',
              color: activeTab === tab.id
                ? '#FFD41C'
                : 'rgba(251, 251, 251, 0.7)',
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? 700 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              letterSpacing: '0.3px',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'rgba(255, 212, 28, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 212, 28, 0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'rgba(30, 35, 71, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(255, 212, 28, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
        </div>

        {/* Profile tab (separate, on the right) */}
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '10px 18px',
            background: activeTab === 'profile'
              ? 'rgba(255, 212, 28, 0.15)'
              : 'rgba(30, 35, 71, 0.4)',
            border: activeTab === 'profile'
              ? '2px solid rgba(255, 212, 28, 0.4)'
              : '2px solid rgba(255, 212, 28, 0.1)',
            borderRadius: '12px',
            color: activeTab === 'profile'
              ? '#FFD41C'
              : 'rgba(251, 251, 251, 0.7)',
            fontSize: '12px',
            fontWeight: activeTab === 'profile' ? 700 : 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            letterSpacing: '0.3px',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'profile') {
              e.currentTarget.style.background = 'rgba(255, 212, 28, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 212, 28, 0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'profile') {
              e.currentTarget.style.background = 'rgba(30, 35, 71, 0.4)';
              e.currentTarget.style.borderColor = 'rgba(255, 212, 28, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <span style={{ fontSize: '16px' }}>👤</span>
          <span>Profile</span>
        </button>
      </nav>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: '32px 40px',
        overflow: 'hidden',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {activeTab === 'home' && <Dashboard />}
          {activeTab === 'drivers' && <DriversList />}
          {activeTab === 'shuttles' && <ShuttlesList />}
          {activeTab === 'routes' && <RoutesList />}
          {activeTab === 'phones' && <PhonesList />}
          {activeTab === 'trips' && <TripsList />}
          {activeTab === 'concerns' && <ConcernsList />}
          {activeTab === 'communication' && <DriverNotifications />}
          {activeTab === 'configurations' && <ConfigurationsPage />}
          {activeTab === 'logs' && <LogsList />}
          {activeTab === 'settings' && <SettingsPage />}
          {activeTab === 'profile' && <ProfilePage adminData={adminData} />}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}