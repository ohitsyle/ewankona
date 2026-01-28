// src/admin/services/routeService.js
import api from './api';

export const routeService = {
  getAll: async () => api.get('/routes'),
  getById: async (id) => api.get(`/routes/${id}`),
  create: async (data) => api.post('/routes', data),
  update: async (id, data) => api.put(`/routes/${id}`, data),
  delete: async (id) => api.delete(`/routes/${id}`),
  getActive: async () => api.get('/routes?active=true'),
};

export default routeService;