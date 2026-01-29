import { config } from '../config/environment.js'
import { getUserFriendlyError } from '../utils/errorMessages.js'

const API_BASE_URL = config.API_BASE_URL;

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
    this.refreshPromise = null;
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (response.status === 401 && this.token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          config.headers = this.getHeaders();
          const retryResponse = await fetch(url, config);
          const retryData = await retryResponse.json();
          
          if (!retryResponse.ok) {
            const apiError = new Error(getUserFriendlyError({ 
              message: retryData.error, 
              statusCode: retryResponse.status 
            }));
            apiError.statusCode = retryResponse.status;
            throw apiError;
          }
          return retryData;
        } else {
          this.clearToken();
          window.location.href = '/login';
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
      }

      if (!response.ok) {
        const apiError = new Error(data.error || `Error ${response.status}: ${response.statusText}`);
        apiError.statusCode = response.status;
        apiError.code = response.status;
        throw apiError;
      }

      return data;
    } catch (error) {
      console.error('Error en petición API:', error);
      // Convertir error técnico a mensaje amigable
      const friendlyError = new Error(getUserFriendlyError(error));
      friendlyError.originalError = error;
      friendlyError.statusCode = error.statusCode || error.status;
      throw friendlyError;
    }
  }

  async refreshToken() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = new Promise(async (resolve) => {
      try {
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: this.token }),
        });

        const data = await response.json();

        if (response.ok && data.token) {
          this.setToken(data.token);
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (error) {
        console.error('Error al renovar token:', error);
        resolve(false);
      } finally {
        this.refreshPromise = null;
      }
    });

    return this.refreshPromise;
  }

  async validateToken() {
    if (!this.token) return false;
    
    try {
      const response = await this.get('/auth/validate');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  async get(endpoint, params = {}) {
    // Filtrar valores null/undefined y construir query string
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
    );
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, data = undefined) {
    const options = { method: 'DELETE' };
    // Algunos backends (como Express) no aceptan body vacío en DELETE; solo lo enviamos si existe
    if (data !== undefined) {
      options.body = JSON.stringify(data);
    }
    return this.request(endpoint, options);
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
      const expiresAt = new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
      localStorage.setItem('tokenExpiresAt', expiresAt.toString());
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiresAt');
    }
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiresAt');
  }

  isTokenExpiringSoon() {
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    if (!expiresAt) return false;
    
    const now = new Date().getTime();
    const expiresTime = parseInt(expiresAt);
    const timeUntilExpiry = expiresTime - now;
    
    return timeUntilExpiry < (24 * 60 * 60 * 1000);
  }
}

const apiClient = new ApiClient();

export const auth = {
  async signUp(email, password, nombre_perfil) {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      nombre_perfil
    });
    
    if (response.success && response.token) {
      apiClient.setToken(response.token);
    }
    
    return response;
  },

  async signIn(email, password) {
    const response = await apiClient.post('/auth/login', {
      email,
      password
    });
    
    if (response.success && response.token) {
      apiClient.setToken(response.token);
    }
    
    return response;
  },

  async signOut() {
    apiClient.clearToken();
    return { success: true };
  },

  async getUser() {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      // No retornar error aquí, getUser maneja el error internamente
      return null;
    }
  },

  async validateToken() {
    return await apiClient.validateToken();
  },

  async refreshToken() {
    return await apiClient.refreshToken();
  },

  isTokenExpiringSoon() {
    return apiClient.isTokenExpiringSoon();
  },

  onAuthStateChange(callback) {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        callback('SIGNED_IN', { user: { token } });
      } else {
        callback('SIGNED_OUT', null);
      }
    };

    checkAuth();

    window.addEventListener('storage', (e) => {
      if (e.key === 'token') {
        checkAuth();
      }
    });

    return { data: { subscription: { unsubscribe: () => {} } } };
  }
};

export const availableCards = {
  async getAllAvailableCards() {
    try {
      const response = await apiClient.get('/available-cards');
      return response;
    } catch (error) {
      console.error('Error en getAllAvailableCards:', error);
      return { error: getUserFriendlyError(error) };
    }
  },

  async createAvailableCard(cardData) {
    try {
      const response = await apiClient.post('/available-cards', cardData);
      return response;
    } catch (error) {
      console.error('Error en createAvailableCard:', error);
      return { error: getUserFriendlyError(error) };
    }
  },

  async updateAvailableCard(id, updates) {
    try {
      const response = await apiClient.put(`/available-cards/${id}`, updates);
      return response;
    } catch (error) {
      console.error('Error en updateAvailableCard:', error);
      return { error: getUserFriendlyError(error) };
    }
  },

  async deleteAvailableCard(id) {
    try {
      const response = await apiClient.delete(`/available-cards/${id}`);
      return response;
    } catch (error) {
      console.error('Error en deleteAvailableCard:', error);
      return { error: getUserFriendlyError(error) };
    }
  },

  async getAvailableCardById(id) {
    try {
      const response = await apiClient.get(`/available-cards/${id}`);
      return response;
    } catch (error) {
      console.error('Error en getAvailableCardById:', error);
      return { error: getUserFriendlyError(error) };
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
      return { error: getUserFriendlyError(error) };
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
      return { error: getUserFriendlyError(error) };
    }
  },

  async unlinkCardFromUser(userCardId) {
    try {
      const response = await apiClient.delete(`/user-cards/${userCardId}`);
      return response;
    } catch (error) {
      console.error('Error en unlinkCardFromUser:', error);
      return { error: getUserFriendlyError(error) };
    }
  },

  async isCardLinkedToUser(availableCardId) {
    try {
      const response = await apiClient.get(`/user-cards/check/${availableCardId}`);
      return response;
    } catch (error) {
      console.error('Error en isCardLinkedToUser:', error);
      return { error: getUserFriendlyError(error) };
    }
  },

  async getUserCardStats() {
    try {
      const response = await apiClient.get('/user-cards/stats');
      return response;
    } catch (error) {
      console.error('Error en getUserCardStats:', error);
      return { error: getUserFriendlyError(error) };
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
      return { error: getUserFriendlyError(error) };
    }
  },

  async createCard(cardData) {
    try {
      const response = await apiClient.post('/cards', cardData);
      return response;
    } catch (error) {
      console.error('Error en createCard:', error);
      return { error: getUserFriendlyError(error) };
    }
  },

  async updateCard(id, updates) {
    const response = await apiClient.put(`/cards/${id}`, updates);
    return response;
  },

  async deleteCard(id) {
    const response = await apiClient.delete(`/cards/${id}`);
    return response;
  },

  async getCardStats(id) {
    const response = await apiClient.get(`/cards/${id}/stats`);
    return response;
  },

  async getCardExpenses(id, filters = {}) {
    const response = await apiClient.get(`/cards/${id}/expenses`, filters);
    return response;
  }
};

export const expenses = {
  async getExpenses(userId, filters = {}) {
    const response = await apiClient.get('/expenses', filters);
    return response;
  },

  async createExpense(expenseData) {
    const response = await apiClient.post('/expenses', expenseData);
    return response;
  },

  async updateExpense(id, updates) {
    const response = await apiClient.put(`/expenses/${id}`, updates);
    return response;
  },

  async deleteExpense(id, deleteOption = null) {
    const response = await apiClient.delete(`/expenses/${id}`, { deleteOption });
    return response;
  },

  async getMonthlyExpensesWithInstallments(userId, month, year, filters = {}) {
    const params = { month, year, ...filters };
    const response = await apiClient.get('/expenses/monthly', params);
    return response;
  },

  async getMonthlyTotalWithInstallments(userId, month, year, filters = {}) {
    const params = { month, year, ...filters };
    const response = await apiClient.get('/expenses/monthly-total', params);
    return response;
  },

  async getInstallments(expenseId) {
    const response = await apiClient.get(`/expenses/${expenseId}/installments`);
    return response;
  },

  async getExpenseInstallmentsSummary(expenseId) {
    const response = await apiClient.get(`/expenses/${expenseId}/installments-summary`);
    return response;
  },

  async updateInstallmentStatus(installmentId, paymentStatusId) {
    const response = await apiClient.put(`/expenses/installments/${installmentId}/status`, {
      payment_status_id: paymentStatusId
    });
    return response;
  },

  async getUpcomingInstallments(userId, limit = 100) {
    const response = await apiClient.get('/expenses/upcoming-installments', { limit });
    return response;
  },

  async getCreditCardsSummary(isAnnual = false) {
    const response = await apiClient.get('/expenses/credit-cards-summary', { period: isAnnual ? 'annual' : 'monthly' });
    return response;
  },

  async getExpensesSummaryByType(isAnnual = false) {
    const response = await apiClient.get('/expenses/summary-by-type', { period: isAnnual ? 'annual' : 'monthly' });
    return response;
  },

  async createInstallments(installmentsData) {
    const response = await apiClient.post('/expenses/installments', installmentsData);
    return response;
  },

  async getPaymentStatusByCode(code) {
    const response = await apiClient.get('/expenses/payment-status', { code });
    return response;
  },

  async getAllPaymentStatuses() {
    const response = await apiClient.get('/expenses/payment-statuses');
    return response;
  },

  async markAsPaid(id, payment_status_id) {
    const response = await apiClient.put(`/expenses/${id}/mark-as-paid`, {
      payment_status_id
    });
    return response;
  },

  async markInstallmentAsPaid(id, payment_status_id) {
    const response = await apiClient.put(`/expenses/installment-${id}/mark-as-paid`, {
      payment_status_id
    });
    return response;
  },

  // ===== FUNCIONES PARA GASTOS PROGRAMADOS =====

  async getScheduledExpenses() {
    const response = await apiClient.get('/expenses/scheduled');
    return response;
  },

  async createScheduledExpense(expenseData) {
    const response = await apiClient.post('/expenses/scheduled', expenseData);
    return response;
  },

  async updateScheduledExpense(scheduledExpenseId, expenseData) {
    const response = await apiClient.put(`/expenses/scheduled/${scheduledExpenseId}`, expenseData);
    return response;
  },

  async cancelScheduledExpense(scheduledExpenseId) {
    const response = await apiClient.delete(`/expenses/scheduled/${scheduledExpenseId}`);
    return response;
  },

};

export const categories = {
  async getCategories() {
    const response = await apiClient.get('/categories');
    return response;
  },

  async createCategory(categoryData) {
    const response = await apiClient.post('/categories', categoryData);
    return response;
  },

  async updateCategory(id, updates) {
    const response = await apiClient.put(`/categories/${id}`, updates);
    return response;
  },

  async deleteCategory(id) {
    const response = await apiClient.delete(`/categories/${id}`);
    return response;
  },

  async getCategoriesWithStats(month, year) {
    const response = await apiClient.get('/categories/with-stats', { month, year });
    return response;
  },

  async getCategoryStats(id) {
    const response = await apiClient.get(`/categories/${id}/stats`);
    return response;
  },

  async getCategoryExpenses(id, filters = {}) {
    const response = await apiClient.get(`/categories/${id}/expenses`, filters);
    return response;
  }
};

export const subcategories = {
  async getSubcategories() {
    const response = await apiClient.get('/subcategories');
    return response;
  },

  async getSubcategoriesByCategory(categoryId) {
    const response = await apiClient.get(`/subcategories/category/${categoryId}`);
    return response;
  },

  async getCategoriesWithSubcategories() {
    const response = await apiClient.get('/subcategories/with-categories');
    return response;
  },

  async createSubcategory(subcategoryData) {
    const response = await apiClient.post('/subcategories', subcategoryData);
    return response;
  },

  async updateSubcategory(id, updates) {
    const response = await apiClient.put(`/subcategories/${id}`, updates);
    return response;
  },

  async deleteSubcategory(id) {
    const response = await apiClient.delete(`/subcategories/${id}`);
    return response;
  },

  async getSubcategoryById(id) {
    const response = await apiClient.get(`/subcategories/${id}`);
    return response;
  }
};

export { apiClient }; 