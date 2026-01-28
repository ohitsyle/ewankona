// src/admin/services/analyticsService.js
// FIXED: Using correct endpoint paths /admin/analytics/dashboard

import api from './api';

export const analyticsService = {
  // FIXED: Changed from '/analytics' to '/admin/analytics/dashboard'
  getDashboardStats: async () => api.get('/admin/analytics/dashboard'),
  
  getActiveShuttles: async () => api.get('/admin/shuttles?status=taken'),
  
  // Get shuttle positions for map
  getShuttlePositions: async () => api.get('/admin/shuttle-positions'),
  
  // Get revenue data
  getRevenueData: async (period = 'week') => api.get(`/admin/analytics/revenue?period=${period}`),
  
  // Get route statistics
  getRouteStats: async () => api.get('/admin/analytics/routes'),
};

export default analyticsService;