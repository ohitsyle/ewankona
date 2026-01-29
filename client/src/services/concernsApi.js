// client/src/services/concernsApi.js
// API service for user concerns matching treasury concerns logic

const API_BASE = 'http://localhost:3000/api/admin';

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const getConcerns = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 1000,
      ...(params.status && { status: params.status }),
      ...(params.priority && { priority: params.priority }),
      ...(params.submissionType && { submissionType: params.submissionType }),
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
      ...(params.search && { search: params.search })
    });

    const response = await fetch(`${API_BASE}/user-concerns?${queryParams}`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to fetch concerns');
    }

    // Handle both old format (array) and new format ({ success, concerns })
    if (Array.isArray(data)) {
      return { success: true, concerns: data };
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};

export const getConcernDetails = async (concernId) => {
  try {
    const response = await fetch(`${API_BASE}/user-concerns/${concernId}`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch concern details');
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};

export const updateConcernStatus = async (concernId, payload) => {
  try {
    const response = await fetch(`${API_BASE}/user-concerns/${concernId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update concern status');
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};

export const assignConcern = async (concernId, assignedTo) => {
  try {
    const response = await fetch(`${API_BASE}/user-concerns/${concernId}/assign`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ assignedTo })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to assign concern');
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};

// User-facing functions for UserDashboard components
export const submitAssistanceReport = async (reportData) => {
  try {
    const token = localStorage.getItem('userToken');
    const response = await fetch(`${API_BASE}/user-concerns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...reportData,
        submissionType: 'assistance'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit assistance report');
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};

export const submitFeedback = async (feedbackData) => {
  try {
    const token = localStorage.getItem('userToken');
    const response = await fetch(`${API_BASE}/user-concerns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...feedbackData,
        submissionType: 'feedback'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit feedback');
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};

export const getUserConcerns = async () => {
  try {
    const token = localStorage.getItem('userToken');
    const response = await fetch('http://localhost:3000/api/user/concerns/my-concerns', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user concerns');
    }

    return data;
  } catch (error) {
    // Silently handle error
    throw error;
  }
};

export const getReportToOptions = async () => {
  // Return predefined options for reporting concerns
  return {
    success: true,
    options: [
      { value: 'motorpool', label: 'Motorpool Office' },
      { value: 'merchant', label: 'Merchant Services' },
      { value: 'treasury', label: 'Treasury Office' },
      { value: 'accounting', label: 'Accounting Office' },
      { value: 'technical', label: 'Technical Support' }
    ]
  };
};
