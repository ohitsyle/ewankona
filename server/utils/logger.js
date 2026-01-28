// nucash-server/utils/logger.js
// Centralized logging utility for comprehensive event tracking

import EventLog from '../models/EventLog.js';
import { nanoid } from 'nanoid';

/**
 * Log an event to the database
 * @param {Object} eventData - Event data to log
 * @returns {Promise<Object>} - Created event log
 */
export async function logEvent(eventData) {
  try {
    const event = await EventLog.create({
      eventId: `EVT-${nanoid(10)}`,
      timestamp: new Date(),
      ...eventData
    });
    return event;
  } catch (error) {
    console.error('Failed to create event log:', error);
    return null;
  }
}

/**
 * Log a payment transaction
 */
export async function logPayment(data) {
  return await logEvent({
    eventType: 'payment',
    title: data.success ? 'Payment Successful' : 'Payment Failed',
    description: `${data.userName || 'User'} ${data.success ? 'paid' : 'attempted to pay'} ₱${data.amount} ${data.shuttleId ? `on shuttle ${data.shuttleId}` : ''}`,
    severity: data.success ? 'info' : 'warning',
    userId: data.userId,
    shuttleId: data.shuttleId,
    driverId: data.driverId,
    metadata: {
      amount: data.amount,
      balance: data.balance,
      transactionId: data.transactionId,
      success: data.success,
      errorMessage: data.errorMessage
    }
  });
}

/**
 * Log a login event
 */
export async function logLogin(data) {
  return await logEvent({
    eventType: 'login',
    title: `${data.userType || 'User'} Login`,
    description: `${data.userName || data.userId} logged in successfully`,
    severity: 'info',
    userId: data.userId,
    driverId: data.driverId,
    ipAddress: data.ipAddress,
    metadata: {
      userType: data.userType,
      deviceInfo: data.deviceInfo
    }
  });
}

/**
 * Log a logout event
 */
export async function logLogout(data) {
  return await logEvent({
    eventType: 'logout',
    title: `${data.userType || 'User'} Logout`,
    description: `${data.userName || data.userId} logged out`,
    severity: 'info',
    userId: data.userId,
    driverId: data.driverId,
    metadata: {
      userType: data.userType,
      sessionDuration: data.sessionDuration
    }
  });
}

/**
 * Log a trip start
 */
export async function logTripStart(data) {
  return await logEvent({
    eventType: 'route_start',
    title: 'Trip Started',
    description: `Driver ${data.driverId} started trip on shuttle ${data.shuttleId} for route ${data.routeId}`,
    severity: 'info',
    driverId: data.driverId,
    shuttleId: data.shuttleId,
    routeId: data.routeId,
    tripId: data.tripId,
    location: {
      latitude: data.startLatitude,
      longitude: data.startLongitude
    },
    metadata: {
      startLocationName: data.startLocationName,
      endLocationName: data.endLocationName,
      departureTime: data.departureTime
    }
  });
}

/**
 * Log a trip end
 */
export async function logTripEnd(data) {
  return await logEvent({
    eventType: 'route_end',
    title: 'Trip Completed',
    description: `Trip ${data.tripId} completed - ${data.passengerCount} passengers, ₱${data.totalCollections} collected`,
    severity: 'info',
    driverId: data.driverId,
    shuttleId: data.shuttleId,
    routeId: data.routeId,
    tripId: data.tripId,
    metadata: {
      passengerCount: data.passengerCount,
      totalCollections: data.totalCollections,
      distanceTraveledKm: data.distanceTraveledKm,
      durationMinutes: data.durationMinutes,
      arrivalTime: data.arrivalTime
    }
  });
}

/**
 * Log a driver assignment
 */
export async function logDriverAssignment(data) {
  return await logEvent({
    eventType: 'driver_assignment',
    title: 'Driver Assigned to Shuttle',
    description: `Driver ${data.driverId} (${data.driverName}) assigned to shuttle ${data.shuttleId}`,
    severity: 'info',
    driverId: data.driverId,
    shuttleId: data.shuttleId,
    metadata: {
      driverName: data.driverName,
      assignedBy: data.assignedBy,
      previousShuttle: data.previousShuttle
    }
  });
}

/**
 * Log an admin action
 */
export async function logAdminAction(data) {
  return await logEvent({
    eventType: 'admin_action',
    title: data.action,
    description: `Admin ${data.adminName || data.adminId} ${data.description}`,
    severity: data.severity || 'info',
    metadata: {
      adminId: data.adminId,
      adminName: data.adminName,
      action: data.action,
      targetEntity: data.targetEntity,
      targetId: data.targetId,
      changes: data.changes,
      ipAddress: data.ipAddress
    }
  });
}

/**
 * Log a user action
 */
export async function logUserAction(data) {
  return await logEvent({
    eventType: 'user_action',
    title: data.action,
    description: `User ${data.userName || data.userId} ${data.description}`,
    severity: 'info',
    userId: data.userId,
    metadata: {
      action: data.action,
      details: data.details
    }
  });
}

/**
 * Log a system error
 */
export async function logError(data) {
  return await logEvent({
    eventType: 'error',
    title: data.title || 'System Error',
    description: data.description || data.error?.message || 'An error occurred',
    severity: data.severity || 'error',
    userId: data.userId,
    driverId: data.driverId,
    shuttleId: data.shuttleId,
    metadata: {
      errorType: data.errorType,
      errorMessage: data.error?.message,
      errorStack: data.error?.stack,
      context: data.context,
      endpoint: data.endpoint,
      method: data.method
    }
  });
}

/**
 * Log a security event
 */
export async function logSecurity(data) {
  return await logEvent({
    eventType: 'security',
    title: data.title,
    description: data.description,
    severity: data.severity || 'warning',
    userId: data.userId,
    ipAddress: data.ipAddress,
    metadata: {
      action: data.action,
      reason: data.reason,
      blocked: data.blocked,
      attempts: data.attempts
    }
  });
}

/**
 * Log a system event
 */
export async function logSystem(data) {
  return await logEvent({
    eventType: 'system',
    title: data.title,
    description: data.description,
    severity: data.severity || 'info',
    metadata: {
      component: data.component,
      status: data.status,
      details: data.details
    }
  });
}

export default {
  logEvent,
  logPayment,
  logLogin,
  logLogout,
  logTripStart,
  logTripEnd,
  logDriverAssignment,
  logAdminAction,
  logUserAction,
  logError,
  logSecurity,
  logSystem
};
