import { apiClient } from './client.js';

export const availableCards = {
  async getAllAvailableCards() {
    try {
      const response = await apiClient.get('/available-cards');
      return response;
    } catch (error) {
      console.error('Error en getAllAvailableCards:', error);
      throw error;
    }
  },

  async createAvailableCard(cardData) {
    try {
      const response = await apiClient.post('/available-cards', cardData);
      return response;
    } catch (error) {
      console.error('Error en createAvailableCard:', error);
      throw error;
    }
  },

  async updateAvailableCard(id, updates) {
    try {
      const response = await apiClient.put(`/available-cards/${id}`, updates);
      return response;
    } catch (error) {
      console.error('Error en updateAvailableCard:', error);
      throw error;
    }
  },

  async deleteAvailableCard(id) {
    try {
      const response = await apiClient.delete(`/available-cards/${id}`);
      return response;
    } catch (error) {
      console.error('Error en deleteAvailableCard:', error);
      throw error;
    }
  },

  async getAvailableCardById(id) {
    try {
      const response = await apiClient.get(`/available-cards/${id}`);
      return response;
    } catch (error) {
      console.error('Error en getAvailableCardById:', error);
      throw error;
    }
  }
};

export const userCards = {
  async getUserCards() {
    try {
      const response = await apiClient.get('/user-cards');
      return response;
    } catch (error) {
      console.error('Error en getUserCards:', error);
      throw error;
    }
  },

  async linkCardToUser(availableCardId) {
    try {
      const response = await apiClient.post('/user-cards', {
        available_card_id: availableCardId
      });
      return response;
    } catch (error) {
      console.error('Error en linkCardToUser:', error);
      throw error;
    }
  },

  async unlinkCardFromUser(userCardId) {
    try {
      const response = await apiClient.delete(`/user-cards/${userCardId}`);
      return response;
    } catch (error) {
      console.error('Error en unlinkCardFromUser:', error);
      throw error;
    }
  },

  async isCardLinkedToUser(availableCardId) {
    try {
      const response = await apiClient.get(`/user-cards/check/${availableCardId}`);
      return response;
    } catch (error) {
      console.error('Error en isCardLinkedToUser:', error);
      throw error;
    }
  },

  async getUserCardStats() {
    try {
      const response = await apiClient.get('/user-cards/stats');
      return response;
    } catch (error) {
      console.error('Error en getUserCardStats:', error);
      throw error;
    }
  }
};

export const cards = {
  async getCards() {
    try {
      const response = await apiClient.get('/cards');
      return response;
    } catch (error) {
      console.error('Error en getCards:', error);
      throw error;
    }
  },

  async createCard(cardData) {
    try {
      const response = await apiClient.post('/cards', cardData);
      return response;
    } catch (error) {
      console.error('Error en createCard:', error);
      throw error;
    }
  },

  async updateCard(id, updates) {
    try {
      const response = await apiClient.put(`/cards/${id}`, updates);
      return response;
    } catch (error) {
      console.error('Error en updateCard:', error);
      throw error;
    }
  },

  async deleteCard(id) {
    try {
      const response = await apiClient.delete(`/cards/${id}`);
      return response;
    } catch (error) {
      console.error('Error en deleteCard:', error);
      throw error;
    }
  },

  async getCardStats(id) {
    try {
      const response = await apiClient.get(`/cards/${id}/stats`);
      return response;
    } catch (error) {
      console.error('Error en getCardStats:', error);
      throw error;
    }
  },

  async getCardExpenses(id, filters = {}) {
    try {
      const response = await apiClient.get(`/cards/${id}/expenses`, filters);
      return response;
    } catch (error) {
      console.error('Error en getCardExpenses:', error);
      throw error;
    }
  }
};
