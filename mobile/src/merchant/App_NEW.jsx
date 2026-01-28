// src/merchant/App.jsx
// Merchant admin portal - Main app component
// REDESIGNED to match motorpool admin layout

import React, { useState, useEffect } from 'react';
import Login from '../shared/components/Auth/Login';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Dashboard from './components/Dashboard/Dashboard';
import MerchantsList from './components/Merchants/MerchantsList';
import TransactionsList from './components/Transactions/TransactionsList';
import ReportsPage from './components/Reports/ReportsPage';
import LogsList from './components/Logs/LogsList';
import ProfilePage from './components/Profile/ProfilePage';
import './styles/global.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [merchantData, setMerchantData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  // Check for existing session on mount
  useEffect(() => {
    // First check if credentials were passed via URL (from cross-origin redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlData = urlParams.get('data');

    if (urlToken && urlData) {
      try {
        // Store credentials from URL to localStorage
        const decodedData = JSON.parse(decodeURIComponent(urlData));
        localStorage.setItem('merchantToken', decodeURIComponent(urlToken));
        localStorage.setItem('merchantData', JSON.stringify(decodedData));

        // Clean URL by removing query parameters
        window.history.replaceState({}, document.title, '/merchant');

        // Set state
        setMerchantData(decodedData);
        setIsAuthenticated(true);
        console.log('✅ Merchant credentials loaded from URL and stored');
        return;
      } catch (err) {
        console.error('Failed to parse URL credentials:', err);
      }
    }

    // Otherwise check localStorage for existing session
    const token = localStorage.getItem('merchantToken');
    const storedMerchant = localStorage.getItem('merchantData');

    if (token && storedMerchant) {
      try {
        const merchant = JSON.parse(storedMerchant);
        setMerchantData(merchant);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to parse stored merchant data:', err);
        handleLogout();
      }
    }
  }, []);

  const handleLogin = (data) => {
    console.log('✅ Merchant login successful:', data);

    // Check if this is actually an admin with merchant role
    if (data.admin) {
      // Admin login response
      if (data.admin.role !== 'merchant') {
        console.log('🔄 Motorpool admin detected, redirecting to admin portal...');
        // Encode credentials for cross-origin redirect
        const encodedToken = encodeURIComponent(data.token);
        const encodedData = encodeURIComponent(JSON.stringify(data.admin));
        window.location.href = `http://localhost:3001?token=${encodedToken}&data=${encodedData}`;
        return;
      }

      // Merchant admin - store as merchant data
      localStorage.setItem('merchantToken', data.token);
      localStorage.setItem('merchantData', JSON.stringify(data.admin));
      setMerchantData(data.admin);
      setIsAuthenticated(true);
    } else if (data.merchant) {
      // Merchant login response (from merchant auth endpoint)
      localStorage.setItem('merchantToken', data.token);
      localStorage.setItem('merchantData', JSON.stringify(data.merchant));
      setMerchantData(data.merchant);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('merchantToken');
    localStorage.removeItem('merchantData');
    setMerchantData(null);
    setIsAuthenticated(false);
    setActiveTab('home');
  };

  // Show login screen if not authenticated
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

  // Main dashboard layout - MATCHING MOTORPOOL STRUCTURE
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header - NO TABS */}
      <Header
        merchantData={merchantData}
        onLogout={handleLogout}
        onOpenProfile={() => setActiveTab('profile')}
      />

      {/* Tab Navigation - BELOW HEADER, MATCHING MOTORPOOL */}
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
            { id: 'merchants', icon: '🏪', label: 'Merchants' },
            { id: 'transactions', icon: '💳', label: 'Transactions' },
            { id: 'reports', icon: '📊', label: 'Reports' },
            { id: 'logs', icon: '📋', label: 'Logs' }
          ].map((tab) => (
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

      {/* Main Content - MATCHING MOTORPOOL */}
      <main style={{
        flex: 1,
        padding: '32px 40px',
        overflowY: 'auto',
        background: 'transparent'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {activeTab === 'home' && <Dashboard merchantData={merchantData} />}
          {activeTab === 'merchants' && <MerchantsList merchantData={merchantData} />}
          {activeTab === 'transactions' && <TransactionsList merchantData={merchantData} />}
          {activeTab === 'reports' && <ReportsPage merchantData={merchantData} />}
          {activeTab === 'logs' && <LogsList merchantData={merchantData} />}
          {activeTab === 'profile' && <ProfilePage merchantData={merchantData} onLogout={handleLogout} />}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
