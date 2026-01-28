// src/admin/services/driverService.js - UPDATED for admin API
import api from './api';

export const driverService = {
  // Get all drivers
  getAll: async () => {
    return await api.get('/drivers');
  },

  // Get single driver
  getById: async (id) => {
    return await api.get(`/drivers/${id}`);
  },

  // Create driver
  create: async (driverData) => {
    return await api.post('/drivers', driverData);
  },

  // Update driver
  update: async (id, driverData) => {
    return await api.put(`/drivers/${id}`, driverData);
  },

  // Delete driver
  delete: async (id) => {
    return await api.delete(`/drivers/${id}`);
  },

  // Search drivers
  search: async (query) => {
    return await api.get(`/drivers?search=${query}`);
  },

  // Filter by status
  filterByStatus: async (isActive) => {
    return await api.get(`/drivers?isActive=${isActive}`);
  }
};

export default driverService;