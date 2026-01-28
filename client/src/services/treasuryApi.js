// client/src/services/treasuryApi.js
// API service for Treasury module operations

const API_BASE = 'http://localhost:3000/api/admin';

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Analytics
export const getTodayAnalytics = async () => {
  try {
    const response = await fetch(`${API_BASE}/treasury/analytics/today`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch analytics');
    }

    return data;
  } catch (error) {
    console.error('Get analytics error:', error);
    throw error;
  }
};

// Transactions
export const getTreasuryTransactions = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
      ...(params.search && { search: params.search }),
      ...(params.transactionType && { transactionType: params.transactionType })
    });

    const response = await fetch(`${API_BASE}/treasury/transactions?${queryParams}`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch transactions');
    }

    return data;
  } catch (error) {
    console.error('Get transactions error:', error);
    throw error;
  }
};

export const getTransactionById = async (transactionId) => {
  try {
    const response = await fetch(`${API_BASE}/treasury/transactions/${transactionId}`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch transaction');
    }

    return data;
  } catch (error) {
    console.error('Get transaction error:', error);
    throw error;
  }
};

// Cash-in
export const searchUserByRFID = async (rfidUId) => {
  try {
    const response = await fetch(`${API_BASE}/treasury/users/search-rfid?rfidUId=${rfidUId}`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'User not found');
    }

    return data;
  } catch (error) {
    console.error('Search user error:', error);
    throw error;
  }
};

export const processCashIn = async (cashInData) => {
  try {
    const response = await fetch(`${API_BASE}/treasury/cash-in`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cashInData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to process cash-in');
    }

    return data;
  } catch (error) {
    console.error('Process cash-in error:', error);
    throw error;
  }
};

// User Registration
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE}/treasury/users/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to register user');
    }

    return data;
  } catch (error) {
    console.error('Register user error:', error);
    throw error;
  }
};

export const checkRFIDAvailability = async (rfidUId) => {
  try {
    const response = await fetch(`${API_BASE}/treasury/users/check-rfid?rfidUId=${rfidUId}`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to check RFID');
    }

    return data;
  } catch (error) {
    console.error('Check RFID error:', error);
    throw error;
  }
};

export const checkSchoolIdAvailability = async (schoolUId) => {
  try {
    const response = await fetch(`${API_BASE}/treasury/users/check-schoolid?schoolUId=${schoolUId}`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to check School ID');
    }

    return data;
  } catch (error) {
    console.error('Check School ID error:', error);
    throw error;
  }
};

// Merchants
export const getMerchants = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      ...(params.search && { search: params.search }),
      ...(params.isActive !== undefined && { isActive: params.isActive })
    });

    const response = await fetch(`${API_BASE}/treasury/merchants?${queryParams}`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch merchants');
    }

    return data;
  } catch (error) {
    console.error('Get merchants error:', error);
    throw error;
  }
};

export const getMerchantById = async (merchantId) => {
  try {
    const response = await fetch(`${API_BASE}/treasury/merchants/${merchantId}`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch merchant');
    }

    return data;
  } catch (error) {
    console.error('Get merchant error:', error);
    throw error;
  }
};

export const updateMerchantStatus = async (merchantId, isActive) => {
  try {
    const response = await fetch(`${API_BASE}/treasury/merchants/${merchantId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update merchant status');
    }

    return data;
  } catch (error) {
    console.error('Update merchant status error:', error);
    throw error;
  }
};

// Export data
export const exportTransactions = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
      ...(params.transactionType && { transactionType: params.transactionType })
    });

    const response = await fetch(`${API_BASE}/treasury/export/transactions?${queryParams}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to export transactions');
    }

    // Return blob for CSV download
    return await response.blob();
  } catch (error) {
    console.error('Export transactions error:', error);
    throw error;
  }
};
