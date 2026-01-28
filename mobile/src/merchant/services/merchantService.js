// src/merchant/services/merchantService.js
// Service for merchant-specific API calls

import api from './api';

/**
 * Merchant Service
 * Handles all merchant portal API calls
 */
const merchantService = {
  // ========== Authentication ==========

  /**
   * Login merchant
   * @param {string} email - Merchant email
   * @param {string} pin - Merchant PIN
   * @returns {Promise<Object>} { token, merchantData }
   */
  login: async (email, pin) => {
    return api.post('/admin/auth/login', { email, pin });
  },

  /**
   * Change merchant password/PIN
   * @param {string} email - Merchant email
   * @param {string} oldPin - Old PIN
   * @param {string} newPin - New PIN
   * @param {string} otp - OTP code
   * @returns {Promise<Object>}
   */
  changePassword: async (email, oldPin, newPin, otp) => {
    return api.post('/merchant/auth/change-password', { email, oldPin, newPin, otp });
  },

  /**
   * Request OTP for password change
   * @param {string} email - Merchant email
   * @returns {Promise<Object>}
   */
  requestOTP: async (email) => {
    return api.post('/admin/auth/forgot-password', { email });
  },

  // ========== Dashboard & Analytics ==========

  /**
   * Get merchant dashboard data
   * @param {string} range - Date range ('today', 'week', 'month', 'year')
   * @returns {Promise<Object>} Dashboard statistics
   */
  getDashboardData: async (range = 'today') => {
    return api.get(`/merchant/reports?range=${range}`);
  },

  /**
   * Get merchant analytics
   * @returns {Promise<Object>} Analytics data
   */
  getAnalytics: async () => {
    return api.get('/merchant/analytics');
  },

  // ========== Transactions ==========

  /**
   * Get merchant transactions
   * @param {Object} filters - { search, status, startDate, endDate }
   * @returns {Promise<Array>} List of transactions
   */
  getTransactions: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    return api.get(`/merchant/transactions${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get single transaction details
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  getTransaction: async (transactionId) => {
    return api.get(`/merchant/transactions/${transactionId}`);
  },

  // ========== Merchants Management (if applicable) ==========

  /**
   * Get all merchants (if user is admin)
   * @returns {Promise<Array>} List of merchants
   */
  getMerchants: async () => {
    return api.get('/merchant/merchants');
  },

  /**
   * Create new merchant
   * @param {Object} merchantData - Merchant information
   * @returns {Promise<Object>} Created merchant
   */
  createMerchant: async (merchantData) => {
    return api.post('/merchant/merchants', merchantData);
  },

  /**
   * Update merchant
   * @param {string} merchantId - Merchant ID
   * @param {Object} merchantData - Updated merchant information
   * @returns {Promise<Object>} Updated merchant
   */
  updateMerchant: async (merchantId, merchantData) => {
    return api.put(`/merchant/merchants/${merchantId}`, merchantData);
  },

  /**
   * Delete merchant
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>}
   */
  deleteMerchant: async (merchantId) => {
    return api.delete(`/merchant/merchants/${merchantId}`);
  },

  // ========== Logs ==========

  /**
   * Get merchant event logs
   * @param {Object} filters - { severity, startDate, endDate }
   * @returns {Promise<Array>} List of logs
   */
  getLogs: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.severity) params.append('severity', filters.severity);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    return api.get(`/merchant/logs${queryString ? `?${queryString}` : ''}`);
  },

  // ========== Configurations ==========

  /**
   * Get merchant configurations
   * @returns {Promise<Object>} Configuration settings
   */
  getConfigurations: async () => {
    return api.get('/merchant/configurations');
  },

  /**
   * Update merchant configurations
   * @param {Object} configData - Configuration settings
   * @returns {Promise<Object>} Updated configurations
   */
  updateConfigurations: async (configData) => {
    return api.put('/merchant/configurations', configData);
  },

  // ========== Profile ==========

  /**
   * Get merchant profile
   * @returns {Promise<Object>} Merchant profile data
   */
  getProfile: async () => {
    return api.get('/merchant/profile');
  },

  /**
   * Update merchant profile
   * @param {Object} profileData - Updated profile information
   * @returns {Promise<Object>} Updated profile
   */
  updateProfile: async (profileData) => {
    return api.put('/merchant/profile', profileData);
  },

  // ========== Reports & Export ==========

  /**
   * Export transactions to CSV
   * @param {Object} filters - Export filters
   * @returns {Promise<Blob>} CSV file blob
   */
  exportTransactions: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);

    const queryString = params.toString();
    return api.get(`/merchant/export/transactions${queryString ? `?${queryString}` : ''}`, {
      responseType: 'blob'
    });
  }
};

export default merchantService;
