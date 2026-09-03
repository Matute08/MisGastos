import { apiClient } from './client.js';

export const savings = {
  async list() {
    try {
      return await apiClient.get('/savings');
    } catch (error) {
      console.error('Error en savings.list:', error);
      throw error;
    }
  },

  async create(data) {
    try {
      return await apiClient.post('/savings', data);
    } catch (error) {
      console.error('Error en savings.create:', error);
      throw error;
    }
  },

  async update(id, data) {
    try {
      return await apiClient.put(`/savings/${id}`, data);
    } catch (error) {
      console.error('Error en savings.update:', error);
      throw error;
    }
  },

  async remove(id) {
    try {
      return await apiClient.delete(`/savings/${id}`);
    } catch (error) {
      console.error('Error en savings.remove:', error);
      throw error;
    }
  }
};
