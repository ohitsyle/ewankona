// src/admin/utils/idGenerator.js
// Auto-generate unique IDs for different entities

/**
 * Generate a unique driver ID
 * Format: DRV + timestamp(6) + random(3)
 * Example: DRV123456789
 */
export function generateDriverId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `DRV${timestamp}${random}`;
}

/**
 * Generate a unique phone ID
 * Format: PHN + timestamp(6) + random(3)
 * Example: PHN123456789
 */
export function generatePhoneId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `PHN${timestamp}${random}`;
}

/**
 * Generate a unique shuttle ID
 * Format: SHT + timestamp(6) + random(3)
 * Example: SHT123456789
 */
export function generateShuttleId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `SHT${timestamp}${random}`;
}

/**
 * Generate a unique route ID
 * Format: RTE + timestamp(6) + random(3)
 * Example: RTE123456789
 */
export function generateRouteId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `RTE${timestamp}${random}`;
}

/**
 * Generate a generic unique ID with custom prefix
 * @param {string} prefix - Prefix for the ID (e.g., 'USR', 'TXN')
 */
export function generateId(prefix = 'ID') {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

export default {
  generateDriverId,
  generatePhoneId,
  generateShuttleId,
  generateRouteId,
  generateId,
};