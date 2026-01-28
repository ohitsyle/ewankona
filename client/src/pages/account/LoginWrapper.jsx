// Wrapper to adapt the original Login component to work with the consolidated structure
import React from 'react';
import Login from './Login';

export default function LoginWrapper({ type = 'admin' }) {
  const config = {
    admin: {
      endpoint: 'http://localhost:3000/api/admin/auth/login',
      tokenKey: 'adminToken',
      dataKey: 'adminData',
      title: 'Admin Portal',
      redirectPath: '/admin/motorpool'
    },
    merchant: {
      endpoint: 'http://localhost:3000/api/merchant/auth/login',
      tokenKey: 'merchantToken',
      dataKey: 'merchantData',
      title: 'Merchant Portal',
      redirectPath: '/admin/merchant'
    },
    user: {
      endpoint: 'http://localhost:3000/api/user/auth/login',
      tokenKey: 'userToken',
      dataKey: 'userData',
      title: 'User Portal',
      redirectPath: '/user/dashboard'
    }
  }[type];

  const handleLogin = (data) => {
    // Store token and user data
    localStorage.setItem(config.tokenKey, data.token);
    localStorage.setItem(config.dataKey, JSON.stringify(data[type] || data.admin || data.user));

    // Redirect to appropriate dashboard
    window.location.href = config.redirectPath;
  };

  return <Login onLogin={handleLogin} apiEndpoint={config.endpoint} title={config.title} />;
}
