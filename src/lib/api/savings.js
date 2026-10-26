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
  },

  // --- Frascos (Jars) ---
  async listJars() {
    try {
      return await apiClient.get('/savings/jars');
    } catch (error) {
      console.error('Error en savings.listJars:', error);
      throw error;
    }
  },

  async createJar(data) {
    try {
      return await apiClient.post('/savings/jars', data);
    } catch (error) {
      console.error('Error en savings.createJar:', error);
      throw error;
    }
  },

  async updateJar(id, data) {
    try {
      return await apiClient.put(`/savings/jars/${id}`, data);
    } catch (error) {
      console.error('Error en savings.updateJar:', error);
      throw error;
    }
  },

  async deleteJar(id) {
    try {
      return await apiClient.delete(`/savings/jars/${id}`);
    } catch (error) {
      console.error('Error en savings.deleteJar:', error);
      throw error;
    }
  },

  async depositToJar(id, data) {
    try {
      return await apiClient.post(`/savings/jars/${id}/deposit`, data);
    } catch (error) {
      console.error('Error en savings.depositToJar:', error);
      throw error;
    }
  },

  async withdrawFromJar(id, data) {
    try {
      return await apiClient.post(`/savings/jars/${id}/withdraw`, data);
    } catch (error) {
      console.error('Error en savings.withdrawFromJar:', error);
      throw error;
    }
  },

  async getJarMovements(id) {
    try {
      return await apiClient.get(`/savings/jars/${id}/movements`);
    } catch (error) {
      console.error('Error en savings.getJarMovements:', error);
      throw error;
    }
  }
};
