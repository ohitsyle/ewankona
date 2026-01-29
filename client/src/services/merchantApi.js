// client/src/services/merchantApi.js
// API service for merchant operations (used by Treasury for viewing merchant transactions)

const API_BASE = 'http://localhost:3000/api/admin';

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Fetch transactions for a specific merchant
 * @param {string} merchantId - The merchant ID
 * @param {object} options - Query options (limit, page, etc.)
 * @returns {Promise<object>} Response with transactions array
 */
export const fetchMerchantTransactions = async (merchantId, options = {}) => {
  try {
    const queryParams = new URLSearchParams({
      limit: options.limit || 100,
      page: options.page || 1,
      ...(options.startDate && { startDate: options.startDate }),
      ...(options.endDate && { endDate: options.endDate })
    });

    const response = await fetch(
      `${API_BASE}/treasury/merchants/${merchantId}/transactions?${queryParams}`,
      { headers: getAuthHeaders() }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch merchant transactions');
    }

    return data;
  } catch (error) {
    console.error('Fetch merchant transactions error:', error);
    throw error;
  }
};

/**
 * Get merchant details by ID
 * @param {string} merchantId - The merchant ID
 * @returns {Promise<object>} Response with merchant data
 */
export const getMerchantDetails = async (merchantId) => {
  try {
    const response = await fetch(
      `${API_BASE}/treasury/merchants/${merchantId}`,
      { headers: getAuthHeaders() }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch merchant details');
    }

    return data;
  } catch (error) {
    console.error('Get merchant details error:', error);
    throw error;
  }
};

/**
 * Process cash-out for a merchant (Treasury only)
 * @param {string} merchantId - The merchant ID
 * @param {number} amount - Amount to cash out
 * @returns {Promise<object>} Response with transaction details
 */
export const processMerchantCashOut = async (merchantId, amount) => {
  try {
    const response = await fetch(
      `${API_BASE}/treasury/merchants/${merchantId}/cashout`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to process cash-out');
    }

    return data;
  } catch (error) {
    console.error('Process merchant cash-out error:', error);
    throw error;
  }
};

/**
 * Get all merchants with optional filters
 * @param {object} params - Query parameters
 * @returns {Promise<object>} Response with merchants array
 */
export const getAllMerchants = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      ...(params.search && { search: params.search }),
      ...(params.isActive !== undefined && { isActive: params.isActive })
    });

    const response = await fetch(
      `${API_BASE}/treasury/merchants?${queryParams}`,
      { headers: getAuthHeaders() }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch merchants');
    }

    return data;
  } catch (error) {
    console.error('Get all merchants error:', error);
    throw error;
  }
};

/**
 * Get merchant analytics/statistics
 * @param {string} merchantId - The merchant ID
 * @returns {Promise<object>} Response with analytics data
 */
export const getMerchantAnalytics = async (merchantId) => {
  try {
    const response = await fetch(
      `${API_BASE}/treasury/merchants/${merchantId}/analytics`,
      { headers: getAuthHeaders() }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch merchant analytics');
    }

    return data;
  } catch (error) {
    console.error('Get merchant analytics error:', error);
    throw error;
  }
};
