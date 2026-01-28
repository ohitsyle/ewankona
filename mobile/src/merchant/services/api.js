// src/merchant/services/api.js
// Base API configuration for merchant portal
// Base URL is /api, endpoint paths should include /merchant
// Example: api.get('/merchant/transactions') => /api/merchant/transactions

import axios from 'axios';
import MERCHANT_API_CONFIG from '../config/api.config';

const api = axios.create({
  baseURL: MERCHANT_API_CONFIG.baseURL,
  headers: MERCHANT_API_CONFIG.headers,
  timeout: MERCHANT_API_CONFIG.timeout
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url}`, response.data);
    return response.data; // Return data directly
  },
  (error) => {
    console.error('❌ Response Error:', error.response || error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          console.error('Unauthorized - redirecting to login');
          break;
        case 403:
          console.error('Forbidden - insufficient permissions');
          break;
        case 404:
          console.error('Not found - check endpoint path');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('API Error:', data);
      }
    } else if (error.request) {
      console.error('No response received - server might be down');
    } else {
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Helper functions that return response.data directly
const apiHelpers = {
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),
  patch: (url, data, config) => api.patch(url, data, config)
};

export default apiHelpers;
