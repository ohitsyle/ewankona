// nucash-server/utils/csvExporter.js
// CSV export utilities for various data types

import Driver from '../models/Driver.js';
import Shuttle from '../models/Shuttle.js';
import Route from '../models/Route.js';
import Phone from '../models/Phone.js';
import Trip from '../models/Trip.js';
import Transaction from '../models/Transaction.js';
import EventLog from '../models/EventLog.js';
import User from '../models/User.js';
import UserConcern from '../models/UserConcern.js';
import Merchant from '../models/Merchant.js';

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data, headers) {
  if (!data || data.length === 0) {
    return headers ? headers.join(',') + '\n' : '';
  }

  const csvHeaders = headers || Object.keys(data[0]);
  const csvRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header];
      // Escape commas and quotes
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  return [csvHeaders.join(','), ...csvRows].join('\n');
}

/**
 * Export drivers data to CSV
 */
export async function exportDrivers(dateFilter = {}) {
  const query = {};
  if (dateFilter.startDate && dateFilter.endDate) {
    query.createdAt = { $gte: new Date(dateFilter.startDate), $lte: new Date(dateFilter.endDate) };
  }

  const drivers = await Driver.find(query).lean();
  const headers = ['driverId', 'firstName', 'lastName', 'middleInitial', 'email', 'shuttleId', 'licenseNumber', 'licenseExpiry', 'createdAt'];

  const data = drivers.map(driver => ({
    driverId: driver.driverId,
    firstName: driver.firstName,
    lastName: driver.lastName,
    middleInitial: driver.middleInitial || '',
    email: driver.email,
    shuttleId: driver.shuttleId || '',
    licenseNumber: driver.licenseNumber || '',
    licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().split('T')[0] : '',
    createdAt: driver.createdAt ? new Date(driver.createdAt).toISOString() : ''
  }));

  return {
    csv: arrayToCSV(data, headers),
    count: data.length
  };
}

/**
 * Export shuttles data to CSV
 */
export async function exportShuttles(dateFilter = {}) {
  const query = {};
  if (dateFilter.startDate && dateFilter.endDate) {
    query.createdAt = { $gte: new Date(dateFilter.startDate), $lte: new Date(dateFilter.endDate) };
  }

  const shuttles = await Shuttle.find(query).lean();
  const headers = ['shuttleId', 'plateNumber', 'capacity', 'status', 'isActive', 'currentDriverId', 'totalTrips', 'fareCollected', 'createdAt'];

  const data = shuttles.map(shuttle => ({
    shuttleId: shuttle.shuttleId,
    plateNumber: shuttle.plateNumber,
    capacity: shuttle.capacity,
    status: shuttle.status,
    isActive: shuttle.isActive,
    currentDriverId: shuttle.currentDriverId || '',
    totalTrips: shuttle.totalTrips || 0,
    fareCollected: shuttle.fareCollected || 0,
    createdAt: shuttle.createdAt ? new Date(shuttle.createdAt).toISOString() : ''
  }));

  return {
    csv: arrayToCSV(data, headers),
    count: data.length
  };
}

/**
 * Export routes data to CSV
 */
export async function exportRoutes(dateFilter = {}) {
  const query = {};
  if (dateFilter.startDate && dateFilter.endDate) {
    query.createdAt = { $gte: new Date(dateFilter.startDate), $lte: new Date(dateFilter.endDate) };
  }

  const routes = await Route.find(query).lean();
  const headers = ['routeId', 'routeName', 'origin', 'destination', 'distance', 'estimatedTime', 'fare', 'isActive', 'createdAt'];

  const data = routes.map(route => ({
    routeId: route.routeId,
    routeName: route.routeName,
    origin: route.origin,
    destination: route.destination,
    distance: route.distance || '',
    estimatedTime: route.estimatedTime || '',
    fare: route.fare || 0,
    isActive: route.isActive,
    createdAt: route.createdAt ? new Date(route.createdAt).toISOString() : ''
  }));

  return {
    csv: arrayToCSV(data, headers),
    count: data.length
  };
}

/**
 * Export phones data to CSV
 */
export async function exportPhones(dateFilter = {}) {
  const query = {};
  if (dateFilter.startDate && dateFilter.endDate) {
    query.createdAt = { $gte: new Date(dateFilter.startDate), $lte: new Date(dateFilter.endDate) };
  }

  const phones = await Phone.find(query).lean();
  const headers = ['phoneId', 'phoneModel', 'phoneType', 'assignedDriverId', 'assignedDriverName', 'status', 'notes', 'createdAt'];

  const data = phones.map(phone => ({
    phoneId: phone.phoneId,
    phoneModel: phone.phoneModel,
    phoneType: phone.phoneType,
    assignedDriverId: phone.assignedDriverId || '',
    assignedDriverName: phone.assignedDriverName || '',
    status: phone.status,
    notes: phone.notes || '',
    createdAt: phone.createdAt ? new Date(phone.createdAt).toISOString() : ''
  }));

  return {
    csv: arrayToCSV(data, headers),
    count: data.length
  };
}

/**
 * Export trips data to CSV
 */
export async function exportTrips(dateFilter = {}) {
  const query = {};
  if (dateFilter.startDate && dateFilter.endDate) {
    query.createdAt = { $gte: new Date(dateFilter.startDate), $lte: new Date(dateFilter.endDate) };
  }

  const trips = await Trip.find(query).lean();
  const headers = ['tripId', 'shuttleId', 'driverId', 'driverName', 'routeId', 'routeName', 'startTime', 'endTime', 'status', 'totalPassengers', 'fareCollected', 'createdAt'];

  const data = trips.map(trip => ({
    tripId: trip.tripId,
    shuttleId: trip.shuttleId,
    driverId: trip.driverId,
    driverName: trip.driverName || '',
    routeId: trip.routeId || '',
    routeName: trip.routeName || '',
    startTime: trip.startTime ? new Date(trip.startTime).toISOString() : '',
    endTime: trip.endTime ? new Date(trip.endTime).toISOString() : '',
    status: trip.status,
    totalPassengers: trip.totalPassengers || 0,
    fareCollected: trip.fareCollected || 0,
    createdAt: trip.createdAt ? new Date(trip.createdAt).toISOString() : ''
  }));

  return {
    csv: arrayToCSV(data, headers),
    count: data.length
  };
}

/**
 * Export transactions data to CSV
 */
export async function exportTransactions(dateFilter = {}) {
  const query = {};
  if (dateFilter.startDate && dateFilter.endDate) {
    query.createdAt = { $gte: new Date(dateFilter.startDate), $lte: new Date(dateFilter.endDate) };
  }

  const transactions = await Transaction.find(query).lean();
  const headers = ['transactionId', 'userId', 'userSchoolId', 'userName', 'transactionType', 'amount', 'shuttleId', 'driverId', 'status', 'createdAt'];

  const data = transactions.map(tx => ({
    transactionId: tx.transactionId,
    userId: tx.userId || '',
    userSchoolId: tx.userSchoolId || '',
    userName: tx.userName || '',
    transactionType: tx.transactionType,
    amount: tx.amount,
    shuttleId: tx.shuttleId || '',
    driverId: tx.driverId || '',
    status: tx.status,
    createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : ''
  }));

  return {
    csv: arrayToCSV(data, headers),
    count: data.length
  };
}

/**
 * Export logs data to CSV
 */
export async function exportLogs(dateFilter = {}) {
  const query = {};
  if (dateFilter.startDate && dateFilter.endDate) {
    query.createdAt = { $gte: new Date(dateFilter.startDate), $lte: new Date(dateFilter.endDate) };
  }

  const logs = await EventLog.find(query).lean();
  const headers = ['action', 'description', 'userId', 'userName', 'adminId', 'driverId', 'shuttleId', 'status', 'createdAt'];

  const data = logs.map(log => ({
    action: log.action,
    description: log.description || '',
    userId: log.userId || '',
    userName: log.userName || '',
    adminId: log.adminId || '',
    driverId: log.driverId || '',
    shuttleId: log.shuttleId || '',
    status: log.status || '',
    createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : ''
  }));

  return {
    csv: arrayToCSV(data, headers),
    count: data.length
  };
}

/**
 * Export users data to CSV
 */
export async function exportUsers(dateFilter = {}) {
  const query = {};
  if (dateFilter.startDate && dateFilter.endDate) {
    query.createdAt = { $gte: new Date(dateFilter.startDate), $lte: new Date(dateFilter.endDate) };
  }

  const users = await User.find(query).lean();
  const headers = ['schoolUId', 'fullName', 'email', 'userType', 'balance', 'totalTrips', 'createdAt'];

  const data = users.map(user => ({
    schoolUId: user.schoolUId,
    fullName: user.fullName,
    email: user.email,
    userType: user.userType,
    balance: user.balance || 0,
    totalTrips: user.totalTrips || 0,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : ''
  }));

  return {
    csv: arrayToCSV(data, headers),
    count: data.length
  };
}

/**
 * Export concerns data to CSV
 */
export async function exportConcerns(dateFilter = {}) {
  const query = {};
  if (dateFilter.startDate && dateFilter.endDate) {
    query.submittedAt = { $gte: new Date(dateFilter.startDate), $lte: new Date(dateFilter.endDate) };
  }

  const concerns = await UserConcern.find(query).lean();
  const headers = ['concernId', 'submissionType', 'userName', 'userEmail', 'subject', 'selectedConcerns', 'feedbackText', 'rating', 'reportTo', 'priority', 'status', 'submittedAt'];

  const data = concerns.map(concern => ({
    concernId: concern.concernId,
    submissionType: concern.submissionType,
    userName: concern.userName,
    userEmail: concern.userEmail,
    subject: concern.subject || '',
    selectedConcerns: (concern.selectedConcerns || []).join('; '),
    feedbackText: concern.feedbackText || '',
    rating: concern.rating || '',
    reportTo: concern.reportTo || '',
    priority: concern.priority || '',
    status: concern.status || '',
    submittedAt: concern.submittedAt ? new Date(concern.submittedAt).toISOString() : ''
  }));

  return {
    csv: arrayToCSV(data, headers),
    count: data.length
  };
}

/**
 * Export merchants data to CSV
 */
export async function exportMerchants(dateFilter = {}) {
  const query = {};
  if (dateFilter.startDate && dateFilter.endDate) {
    query.createdAt = { $gte: new Date(dateFilter.startDate), $lte: new Date(dateFilter.endDate) };
  }

  const merchants = await Merchant.find(query).select('-password').lean();
  const headers = ['merchantId', 'businessName', 'contactPerson', 'email', 'phone', 'address', 'isActive', 'totalTransactions', 'totalRevenue', 'createdAt'];

  const data = merchants.map(merchant => ({
    merchantId: merchant.merchantId || merchant._id,
    businessName: merchant.businessName,
    contactPerson: merchant.contactPerson || '',
    email: merchant.email,
    phone: merchant.phone || '',
    address: merchant.address || '',
    isActive: merchant.isActive !== false,
    totalTransactions: merchant.totalTransactions || 0,
    totalRevenue: merchant.totalRevenue || 0,
    createdAt: merchant.createdAt ? new Date(merchant.createdAt).toISOString() : ''
  }));

  return {
    csv: arrayToCSV(data, headers),
    count: data.length
  };
}

/**
 * Export data by type with optional date filtering
 */
export async function exportByType(exportType, dateFilter = {}) {
  // Normalize export type to lowercase for function mapping
  const normalizedType = exportType.toLowerCase();

  switch (normalizedType) {
    case 'drivers':
      return await exportDrivers(dateFilter);
    case 'shuttles':
      return await exportShuttles(dateFilter);
    case 'routes':
      return await exportRoutes(dateFilter);
    case 'phones':
      return await exportPhones(dateFilter);
    case 'trips':
      return await exportTrips(dateFilter);
    case 'transactions':
      return await exportTransactions(dateFilter);
    case 'logs':
      return await exportLogs(dateFilter);
    case 'users':
      return await exportUsers(dateFilter);
    case 'concerns':
      return await exportConcerns(dateFilter);
    case 'merchants':
      return await exportMerchants(dateFilter);
    default:
      throw new Error(`Unknown export type: ${exportType}`);
  }
}
