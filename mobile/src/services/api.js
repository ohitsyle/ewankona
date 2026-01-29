// src/services/api.js
// API Service with dynamic URL support

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG, {
  initializeAPIConfig,
  addConfigListener,
  isServerConfigured,
  getAPIConfig
} from '../config/api.config';

// Create axios instance - will be reconfigured when URL changes
let api = null;
let isInitialized = false;

/**
 * Create or recreate the axios instance with current config
 */
const createAPIInstance = () => {
  const config = getAPIConfig();

  if (!config.baseURL) {
    console.warn('⚠️ API instance created without baseURL - requests will fail');
  }

  api = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout,
    headers: config.headers
  });

  // Request interceptor - add auth token
  api.interceptors.request.use(
    async (config) => {
      // Check if we have a baseURL
      if (!config.baseURL) {
        const currentConfig = getAPIConfig();
        if (currentConfig.baseURL) {
          config.baseURL = currentConfig.baseURL;
        }
      }

      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle common errors
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Log error for debugging (skip user-friendly errors)
      if (__DEV__) {
        const errorMessage = error.response?.data?.error || error.message || '';
        const isUserFriendlyError =
          errorMessage.toLowerCase().includes('insufficient balance') ||
          errorMessage.toLowerCase().includes('incorrect pin') ||
          errorMessage.toLowerCase().includes('network error');

        // Only log technical errors
        if (!isUserFriendlyError) {
          console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data
          });
        }
      }

      // Handle 401 Unauthorized - token expired
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user_role');
        await AsyncStorage.removeItem('driver_id');
        await AsyncStorage.removeItem('merchant_id');
      }

      return Promise.reject(error);
    }
  );

  console.log(`✅ API instance created with baseURL: ${config.baseURL || 'NOT SET'}`);
  return api;
};

/**
 * Initialize the API service
 * Call this at app startup before making any API calls
 */
export const initializeAPI = async () => {
  if (isInitialized) {
    console.log('ℹ️ API already initialized');
    return api;
  }

  // Initialize the API config (loads stored URL)
  await initializeAPIConfig();

  // Create the axios instance
  createAPIInstance();

  // Listen for config changes and recreate instance
  addConfigListener((newBaseURL) => {
    console.log('🔄 API config changed, recreating instance...');
    createAPIInstance();
  });

  isInitialized = true;
  return api;
};

/**
 * Get the current API instance
 * Creates one if it doesn't exist
 */
export const getAPI = () => {
  if (!api) {
    createAPIInstance();
  }
  return api;
};

/**
 * Update the base URL and recreate the instance
 */
export const updateBaseURL = (newURL) => {
  if (api) {
    api.defaults.baseURL = newURL;
    console.log(`✅ API baseURL updated to: ${newURL}`);
  }
};

/**
 * Check if the API is properly configured
 */
export const isAPIConfigured = () => {
  return isServerConfigured() && api !== null;
};

// Export base URL for backward compatibility
export const API_BASE = API_CONFIG.baseURL;

// Create initial instance
createAPIInstance();

export default {
  // Proxy all methods to the current api instance
  get: (...args) => getAPI().get(...args),
  post: (...args) => getAPI().post(...args),
  put: (...args) => getAPI().put(...args),
  patch: (...args) => getAPI().patch(...args),
  delete: (...args) => getAPI().delete(...args),
  request: (...args) => getAPI().request(...args),

  // Expose the raw instance for advanced use
  getInstance: getAPI,

  // Initialization
  initialize: initializeAPI,
  isConfigured: isAPIConfigured
};
