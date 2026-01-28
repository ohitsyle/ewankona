// client/src/services/userApi.js
// API service for User dashboard operations

const API_BASE = 'http://localhost:3000/api/user';

const getAuthHeaders = () => {
  const token = localStorage.getItem('userToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// User Profile
export const getUserProfile = async () => {
  try {
    const response = await fetch(`${API_BASE}/profile`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch profile');
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await fetch(`${API_BASE}/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};

// Balance
export const getBalance = async () => {
  try {
    const response = await fetch(`${API_BASE}/balance`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch balance');
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};

// Transactions
export const getUserTransactions = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
      ...(params.transactionType && { transactionType: params.transactionType })
    });

    const response = await fetch(`${API_BASE}/transactions?${queryParams}`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch transactions');
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};

export const getTransactionById = async (transactionId) => {
  try {
    const response = await fetch(`${API_BASE}/transactions/${transactionId}`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch transaction');
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};

// Request Transaction
export const requestTransaction = async (requestData) => {
  try {
    const response = await fetch(`${API_BASE}/transactions/request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to request transaction');
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};

// PIN Management
export const changePin = async (oldPin, newPin) => {
  try {
    const response = await fetch(`${API_BASE}/change-pin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ oldPin, newPin })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to change PIN');
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};

// Analytics (for dashboard)
export const getUserAnalytics = async () => {
  try {
    const response = await fetch(`${API_BASE}/analytics`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch analytics');
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};

// Request Transaction History Export
export const requestTransactionHistory = async (startDate, endDate) => {
  try {
    const response = await fetch(`${API_BASE}/request-transaction-history`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ startDate, endDate })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to request transaction history');
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};
