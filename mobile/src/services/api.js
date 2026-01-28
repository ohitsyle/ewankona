// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../config/api.config';

// Export base URL for backward compatibility
export const API_BASE = API_CONFIG.baseURL;

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');  // FIXED: Changed from 'driver_token' to 'auth_token'
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
    // Log error for debugging (skip user-friendly errors like insufficient balance)
    if (__DEV__) {
      const errorMessage = error.response?.data?.error || '';
      const isUserFriendlyError =
        errorMessage.toLowerCase().includes('insufficient balance') ||
        errorMessage.toLowerCase().includes('incorrect pin');

      // Only log technical errors, not user-friendly ones
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
      await AsyncStorage.removeItem('auth_token');  // FIXED: Changed from 'driver_token' to 'auth_token'
      await AsyncStorage.removeItem('user_role');
      await AsyncStorage.removeItem('driver_id');
      await AsyncStorage.removeItem('merchant_id');
      // You could emit an event here to redirect to login
    }

    return Promise.reject(error);
  }
);

export default api;