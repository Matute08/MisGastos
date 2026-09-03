import { apiClient } from './client.js';

export const activity = {
  async getBalanceActivity(params = {}) {
    try {
      return await apiClient.get('/activity/balance', params);
    } catch (error) {
      console.error('Error en getBalanceActivity:', error);
      throw error;
    }
  }
};
