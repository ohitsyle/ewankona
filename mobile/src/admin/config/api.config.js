// src/admin/config/api.config.js
// Admin panel API configuration

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

// Admin API Configuration
export const ADMIN_API_CONFIG = {
  baseURL: process.env.REACT_APP_API_BASE_URL || API_URLS[ENV],
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Google Maps Configuration
export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

// Feature Flags
export const FEATURES = {
  enableLogging: ENV === 'development',
  enableAnalytics: ENV === 'production',
  enableDebugMode: ENV === 'development'
};

// Validation
if (!GOOGLE_MAPS_API_KEY) {
  console.warn('⚠️ GOOGLE_MAPS_API_KEY is not set. Map features may not work.');
}

export default ADMIN_API_CONFIG;
