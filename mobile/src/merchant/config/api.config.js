// src/merchant/config/api.config.js
// Merchant portal API configuration

// Determine environment
const ENV = process.env.NODE_ENV || 'development';

// API URLs per environment
// In development, use relative path for webpack dev server proxy
// In production, use full URL
const API_URLS = {
  development: '/api',  // Relative path - webpack dev server will proxy to localhost:3000
  staging: 'https://staging-api.nucash.com/api',
  production: 'https://api.nucash.com/api'
};

// Merchant API Configuration
export const MERCHANT_API_CONFIG = {
  baseURL: process.env.REACT_APP_API_BASE_URL || API_URLS[ENV],
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Feature Flags
export const FEATURES = {
  enableLogging: ENV === 'development',
  enableAnalytics: ENV === 'production',
  enableDebugMode: ENV === 'development'
};

export default MERCHANT_API_CONFIG;
