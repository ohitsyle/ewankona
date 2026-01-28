// src/utils/errorHandler.js
// Shared error message mapping utility for consistent error handling across the app

/**
 * Maps error objects to user-friendly error messages
 * @param {Error|Object} error - The error object from API call or exception
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  // Handle null/undefined errors
  if (!error) {
    return 'An unknown error occurred';
  }

  // HTTP Status Code Based Errors
  if (error.response?.status) {
    const status = error.response.status;
    const serverMessage = error.response?.data?.error || error.response?.data?.message;

    switch (status) {
      case 400:
        return serverMessage || 'Invalid request. Please check your input.';
      case 401:
        return 'Unauthorized. Please log in again.';
      case 403:
        return 'Access denied. You don\'t have permission to perform this action.';
      case 404:
        return serverMessage || 'Resource not found.';
      case 409:
        return serverMessage || 'Conflict. This resource already exists.';
      case 422:
        return serverMessage || 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';
      case 503:
        return 'Service unavailable. Please try again later.';
      case 504:
        return 'Request timeout. Please check your connection and try again.';
      default:
        return serverMessage || `Error: ${status}`;
    }
  }

  // Network Errors
  if (error.message) {
    if (error.message.toLowerCase().includes('network')) {
      return 'Network error. Please check your internet connection.';
    }
    if (error.message.toLowerCase().includes('timeout')) {
      return 'Request timeout. Please try again.';
    }
    if (error.message.toLowerCase().includes('abort')) {
      return 'Request cancelled.';
    }
  }

  // Fallback to error message or generic message
  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Maps specific error types to user-friendly messages with context
 * @param {Error|Object} error - The error object
 * @param {string} context - Context of the operation (e.g., 'login', 'payment', 'save driver')
 * @returns {string} Contextual error message
 */
export const getContextualErrorMessage = (error, context) => {
  const baseMessage = getErrorMessage(error);

  // Add context-specific prefixes
  const contextMap = {
    login: 'Login failed: ',
    payment: 'Payment failed: ',
    refund: 'Refund failed: ',
    'save driver': 'Failed to save driver: ',
    'load data': 'Failed to load data: ',
    upload: 'Upload failed: ',
    delete: 'Delete failed: ',
  };

  const prefix = contextMap[context.toLowerCase()] || '';
  return prefix + baseMessage;
};

/**
 * Error codes for specific app errors
 */
export const ErrorCodes = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or PIN',
  EMAIL_NOT_FOUND: 'Email not found. Please check and try again.',
  INCORRECT_PIN: 'Incorrect PIN. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',

  // Payment
  INSUFFICIENT_BALANCE: 'Insufficient balance. Please load your card.',
  CARD_NOT_FOUND: 'Card not found. Please check your NFC card.',
  TRANSACTION_DECLINED: 'Transaction declined. Please try again.',
  PAYMENT_PROCESSING: 'Payment is being processed. Please wait.',

  // Validation
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PIN_FORMAT: 'PIN must be exactly 6 digits.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_AMOUNT: 'Please enter a valid amount.',

  // Network
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT: 'Request timeout. Please try again.',

  // Generic
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
};

/**
 * Check if error is a specific type
 * @param {Error|Object} error - The error object
 * @param {string} type - Error type to check ('network', 'auth', 'validation', 'server')
 * @returns {boolean}
 */
export const isErrorType = (error, type) => {
  if (!error) return false;

  switch (type.toLowerCase()) {
    case 'network':
      return (
        error.message?.toLowerCase().includes('network') ||
        error.message?.toLowerCase().includes('timeout') ||
        !error.response
      );
    case 'auth':
      return error.response?.status === 401 || error.response?.status === 403;
    case 'validation':
      return error.response?.status === 400 || error.response?.status === 422;
    case 'server':
      return error.response?.status >= 500;
    default:
      return false;
  }
};

export default {
  getErrorMessage,
  getContextualErrorMessage,
  ErrorCodes,
  isErrorType,
};
