// src/admin/services/shuttleService.js
import api from './api';

export const shuttleService = {
  getAll: async () => api.get('/shuttles'),
  getById: async (id) => api.get(`/shuttles/${id}`),
  create: async (data) => api.post('/shuttles', data),
  update: async (id, data) => api.put(`/shuttles/${id}`, data),
  delete: async (id) => api.delete(`/shuttles/${id}`),
  getAvailable: async () => api.get('/shuttles?status=available'),
};

export default shuttleService;