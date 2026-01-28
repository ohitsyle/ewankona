// Unified API configuration for all apps
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
  headers: { 'Content-Type': 'application/json' }
});

// Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken') ||
                localStorage.getItem('merchantToken') ||
                localStorage.getItem('userToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || { message: error.message });
  }
);

export default api;
export { API_BASE_URL };
