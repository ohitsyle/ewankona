// src/admin/services/phoneService.js
import api from './api';

export const phoneService = {
  getAll: async () => api.get('/phones'),
  getById: async (id) => api.get(`/phones/${id}`),
  create: async (data) => api.post('/phones', data),
  update: async (id, data) => api.put(`/phones/${id}`, data),
  delete: async (id) => api.delete(`/phones/${id}`),
};

export default phoneService;