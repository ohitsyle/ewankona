// src/admin/config/api.config.js
// Admin panel API configuration

// Determine environment
const ENV = import.meta.env.MODE || 'development';

// API URLs per environment
// In development, use relative path for Vite dev server proxy
// In production, use full URL
const API_URLS = {
  development: '/api',  // Relative path - Vite dev server will proxy to localhost:5000
  staging: 'https://staging-api.nucash.com/api',
  production: 'https://api.nucash.com/api'
};

// Admin API Configuration
export const ADMIN_API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || API_URLS[ENV],
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Google Maps Configuration
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

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
