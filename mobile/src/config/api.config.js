// src/config/api.config.js
// API Configuration - Dynamic server URL with persistence

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for server URL
const SERVER_URL_KEY = '@nucash_server_url';
const SERVER_PORT_KEY = '@nucash_server_port';

// Default port
const DEFAULT_PORT = 3000;

// Development/Production API URLs
const API_URLS = {
  development: null, // Will be set dynamically
  staging: 'https://staging-api.nucash.com/api',
  production: 'https://api.nucash.com/api'
};

// Get current environment
const ENV = __DEV__ ? 'development' : 'production';

// Mutable config that can be updated at runtime
let currentBaseURL = null;
let configListeners = [];

// ============================================================
// SERVER URL MANAGEMENT
// ============================================================

/**
 * Get the stored server URL from AsyncStorage
 */
export const getStoredServerURL = async () => {
  try {
    const storedIP = await AsyncStorage.getItem(SERVER_URL_KEY);
    const storedPort = await AsyncStorage.getItem(SERVER_PORT_KEY);

    if (storedIP) {
      const port = storedPort || DEFAULT_PORT;
      return `http://${storedIP}:${port}/api`;
    }
    return null;
  } catch (error) {
    console.error('Error reading stored server URL:', error);
    return null;
  }
};

/**
 * Save server URL to AsyncStorage
 * @param {string} ip - Server IP address (e.g., "192.168.1.100")
 * @param {number} port - Server port (default: 3000)
 */
export const saveServerURL = async (ip, port = DEFAULT_PORT) => {
  try {
    // Clean the IP - remove http://, /api, etc.
    let cleanIP = ip.trim();
    cleanIP = cleanIP.replace(/^https?:\/\//, ''); // Remove protocol
    cleanIP = cleanIP.replace(/:\d+.*$/, ''); // Remove port and path
    cleanIP = cleanIP.replace(/\/.*$/, ''); // Remove any paths

    await AsyncStorage.setItem(SERVER_URL_KEY, cleanIP);
    await AsyncStorage.setItem(SERVER_PORT_KEY, port.toString());

    // Update the current base URL
    currentBaseURL = `http://${cleanIP}:${port}/api`;

    // Notify listeners
    notifyConfigListeners();

    console.log(`✅ Server URL saved: ${currentBaseURL}`);
    return true;
  } catch (error) {
    console.error('Error saving server URL:', error);
    return false;
  }
};

/**
 * Clear stored server URL
 */
export const clearServerURL = async () => {
  try {
    await AsyncStorage.removeItem(SERVER_URL_KEY);
    await AsyncStorage.removeItem(SERVER_PORT_KEY);
    currentBaseURL = null;
    notifyConfigListeners();
    console.log('🗑️ Server URL cleared');
    return true;
  } catch (error) {
    console.error('Error clearing server URL:', error);
    return false;
  }
};

/**
 * Get the stored IP address only (without protocol/port)
 */
export const getStoredIP = async () => {
  try {
    return await AsyncStorage.getItem(SERVER_URL_KEY);
  } catch (error) {
    return null;
  }
};

/**
 * Get the stored port
 */
export const getStoredPort = async () => {
  try {
    const port = await AsyncStorage.getItem(SERVER_PORT_KEY);
    return port ? parseInt(port, 10) : DEFAULT_PORT;
  } catch (error) {
    return DEFAULT_PORT;
  }
};

// ============================================================
// CONNECTION TESTING
// ============================================================

/**
 * Test connection to a server URL
 * @param {string} ip - IP address to test
 * @param {number} port - Port to test (default: 3000)
 * @param {number} timeout - Timeout in ms (default: 5000)
 */
export const testServerConnection = async (ip, port = DEFAULT_PORT, timeout = 5000) => {
  try {
    // Clean the IP
    let cleanIP = ip.trim();
    cleanIP = cleanIP.replace(/^https?:\/\//, '');
    cleanIP = cleanIP.replace(/:\d+.*$/, '');
    cleanIP = cleanIP.replace(/\/.*$/, '');

    const testURL = `http://${cleanIP}:${port}/api/system/config`;
    console.log(`🔍 Testing connection to: ${testURL}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(testURL, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      console.log(`✅ Connection successful to ${cleanIP}:${port}`);
      return { success: true, ip: cleanIP, port };
    } else {
      console.log(`❌ Server responded with status: ${response.status}`);
      return { success: false, error: `Server responded with status ${response.status}` };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('❌ Connection timeout');
      return { success: false, error: 'Connection timeout' };
    }
    console.log(`❌ Connection failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Scan local network for the server (tries common IPs)
 * @param {number} port - Port to scan (default: 3000)
 */
export const scanForServer = async (port = DEFAULT_PORT) => {
  console.log('🔍 Scanning local network for server...');

  // Common local network ranges to try
  const commonPrefixes = ['192.168.1', '192.168.0', '192.168.18', '192.168.100', '10.0.0', '10.0.1'];
  const promises = [];

  // Test each prefix with common host IPs (1-20, 100, 101, 200, etc.)
  const hostNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 30, 50, 100, 101, 200];

  for (const prefix of commonPrefixes) {
    for (const host of hostNumbers) {
      const ip = `${prefix}.${host}`;
      promises.push(
        testServerConnection(ip, port, 2000).then(result =>
          result.success ? { ...result, found: true } : null
        ).catch(() => null)
      );
    }
  }

  // Race to find the first successful connection
  try {
    const results = await Promise.all(promises);
    const found = results.find(r => r && r.found);

    if (found) {
      console.log(`✅ Server found at ${found.ip}:${found.port}`);
      return found;
    }

    console.log('❌ No server found on local network');
    return null;
  } catch (error) {
    console.error('Error scanning network:', error);
    return null;
  }
};

// ============================================================
// CONFIG LISTENERS
// ============================================================

/**
 * Add a listener for config changes
 */
export const addConfigListener = (callback) => {
  configListeners.push(callback);
  return () => {
    configListeners = configListeners.filter(cb => cb !== callback);
  };
};

/**
 * Notify all config listeners
 */
const notifyConfigListeners = () => {
  configListeners.forEach(callback => {
    try {
      callback(currentBaseURL);
    } catch (error) {
      console.error('Config listener error:', error);
    }
  });
};

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize the API config - load stored URL
 */
export const initializeAPIConfig = async () => {
  try {
    const storedURL = await getStoredServerURL();

    if (storedURL) {
      currentBaseURL = storedURL;
      console.log(`✅ API Config initialized with stored URL: ${currentBaseURL}`);
    } else if (ENV !== 'development') {
      // Use production/staging URL
      currentBaseURL = API_URLS[ENV];
      console.log(`✅ API Config initialized with ${ENV} URL: ${currentBaseURL}`);
    } else {
      console.log('⚠️ No server URL configured. Please configure in settings.');
    }

    return currentBaseURL;
  } catch (error) {
    console.error('Error initializing API config:', error);
    return null;
  }
};

// ============================================================
// API CONFIG OBJECT
// ============================================================

// API Configuration getter (dynamic)
export const getAPIConfig = () => ({
  baseURL: currentBaseURL,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// For backward compatibility - this will be updated when initializeAPIConfig is called
export const API_CONFIG = {
  get baseURL() {
    return currentBaseURL;
  },
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
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
  GPS_TIMEOUT: 60000,              // 60 seconds
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
  PUSH_NOTIFICATIONS: false,
  ANALYTICS: false,
};

// Environment info
export const getEnvironmentInfo = () => ({
  environment: ENV,
  isDevelopment: __DEV__,
  platform: Platform.OS,
  baseURL: currentBaseURL,
  isConfigured: !!currentBaseURL
});

// Validate configuration
export const validateConfig = () => {
  const errors = [];

  if (!currentBaseURL) {
    errors.push('Server URL is not configured');
  }

  if (!GOOGLE_MAPS_API_KEY) {
    errors.push('GOOGLE_MAPS_API_KEY is not configured');
  }

  if (errors.length > 0) {
    console.warn('⚠️ Configuration warnings:', errors);
    return false;
  }

  console.log('✅ Configuration validated:', getEnvironmentInfo());
  return true;
};

// Check if server is configured
export const isServerConfigured = () => !!currentBaseURL;

export default API_CONFIG;
