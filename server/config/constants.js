// server/config/constants.js
// Application constants

export const PORT = process.env.PORT || 5000;

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'nucash-secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};

export const USER_ROLES = {
  ADMIN: 'admin',
  MOTORPOOL_ADMIN: 'motorpool-admin',
  MERCHANT: 'merchant',
  USER: 'user',
  DRIVER: 'driver'
};

export const ROUTE_STATUS = {
  ACTIVE: true,
  INACTIVE: false
};

export const SHUTTLE_STATUS = {
  AVAILABLE: 'available',
  IN_TRANSIT: 'in-transit',
  MAINTENANCE: 'maintenance',
  OFFLINE: 'offline'
};

export const TRIP_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const TRANSACTION_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  PENDING: 'pending',
  REFUNDED: 'refunded'
};

export const PAYMENT_METHODS = {
  NFC: 'nfc',
  QR_CODE: 'qr-code',
  CASH: 'cash'
};
