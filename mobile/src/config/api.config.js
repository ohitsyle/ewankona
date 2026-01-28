// src/config/api.config.js
// API Configuration - uses environment variables

import { Platform } from 'react-native';

// Development/Production API URLs
const API_URLS = {
  development: 'http://192.168.18.30:3000/api',
  staging: 'https://staging-api.nucash.com/api',
  production: 'https://api.nucash.com/api'
};

// Get current environment
const ENV = __DEV__ ? 'development' : 'production';

// API Configuration
export const API_CONFIG = {
  // Base URL from environment or fallback
  baseURL: process.env.API_BASE_URL || API_URLS[ENV],

  // Request timeout (30 seconds)
  timeout: 30000,

  // Retry configuration
  retryAttempts: 3,
  retryDelay: 1000, // 1 second

  // Headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Google Maps API Key
export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
  'AIzaSyBOFPwkdS8TKEe3I2QUDBFWq_q3On5kDBI'; // Fallback for dev

// App Configuration
export const APP_CONFIG = {
  // Refresh intervals (in milliseconds)
  SHUTTLE_REFRESH_INTERVAL: 5000,  // 5 seconds
  ROUTE_REFRESH_INTERVAL: 5000,    // 5 seconds
  GPS_UPDATE_INTERVAL: 10000,      // 10 seconds

  // GPS Configuration
  GPS_TIMEOUT: 60000,              // 60 seconds (increased from 30s)
  GPS_MAX_AGE: 10000,              // 10 seconds
  GPS_ENABLE_HIGH_ACCURACY: true,

  // Background sync
  SYNC_INTERVAL: 300000,           // 5 minutes

  // Transaction limits
  MAX_OFFLINE_TRANSACTIONS: 100,

  // NFC Configuration
  NFC_TIMEOUT: 10000,              // 10 seconds
};

// Feature Flags
export const FEATURES = {
  OFFLINE_MODE: true,
  BACKGROUND_SYNC: true,
  GPS_TRACKING: true,
  PUSH_NOTIFICATIONS: false,       // Not yet implemented
  ANALYTICS: false,                // Not yet implemented
};

// Environment info
export const getEnvironmentInfo = () => ({
  environment: ENV,
  isDevelopment: __DEV__,
  platform: Platform.OS,
  baseURL: API_CONFIG.baseURL
});

// Validate configuration
export const validateConfig = () => {
  const errors = [];

  if (!API_CONFIG.baseURL) {
    errors.push('API_BASE_URL is not configured');
  }

  if (!GOOGLE_MAPS_API_KEY) {
    errors.push('GOOGLE_MAPS_API_KEY is not configured');
  }

  if (errors.length > 0) {
    console.error('⚠️ Configuration errors:', errors);
    return false;
  }

  console.log('✅ Configuration validated:', getEnvironmentInfo());
  return true;
};

export default API_CONFIG;
