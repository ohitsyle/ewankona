// src/merchant/App.jsx
// Merchant admin portal - Main app component

import React, { useState, useEffect } from 'react';
import Login from '../shared/components/Auth/Login';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Dashboard from './components/Dashboard/Dashboard';
import MerchantsList from './components/Merchants/MerchantsList';
import TransactionsList from './components/Transactions/TransactionsList';
import ReportsPage from './components/Reports/ReportsPage';
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
        // Store admin credentials
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminData', JSON.stringify(data.admin));
        // Redirect to admin portal
        // In development: redirect to admin dev server port
        // In production: use relative URL
        const adminUrl = process.env.NODE_ENV === 'production'
          ? '/admin'
          : 'http://localhost:3001';
        window.location.href = adminUrl;
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

  // Render content based on active tab
  const renderContent = () => {
    switch(activeTab) {
      case 'home':
        return <Dashboard merchantData={merchantData} />;
      case 'merchants':
        return <MerchantsList merchantData={merchantData} />;
      case 'transactions':
        return <TransactionsList merchantData={merchantData} />;
      case 'reports':
        return <ReportsPage merchantData={merchantData} />;
      case 'profile':
        return <ProfilePage merchantData={merchantData} onLogout={handleLogout} />;
      default:
        return <Dashboard merchantData={merchantData} />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#0F1227'
    }}>
      <Header
        merchantData={merchantData}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <main style={{
        flex: 1,
        padding: '24px',
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto'
      }}>
        {renderContent()}
      </main>

      <Footer />
    </div>
  );
}
