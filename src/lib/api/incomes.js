import { apiClient } from './client.js';

export const incomes = {
  async getIncomes(filters = {}) {
    try {
      return await apiClient.get('/incomes', filters);
    } catch (error) {
      console.error('Error en getIncomes:', error);
      throw error;
    }
  },

  async createIncome(data) {
    try {
      return await apiClient.post('/incomes', data);
    } catch (error) {
      console.error('Error en createIncome:', error);
      throw error;
    }
  },

  async updateIncome(id, data) {
    try {
      return await apiClient.put(`/incomes/${id}`, data);
    } catch (error) {
      console.error('Error en updateIncome:', error);
      throw error;
    }
  },

  async deleteIncome(id) {
    try {
      return await apiClient.delete(`/incomes/${id}`);
    } catch (error) {
      console.error('Error en deleteIncome:', error);
      throw error;
    }
  },

  async getSummary(params = {}) {
    try {
      return await apiClient.get('/incomes/summary', params);
    } catch (error) {
      console.error('Error en getSummary:', error);
      throw error;
    }
  }
};
