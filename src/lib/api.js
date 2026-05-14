import { config } from '../config/environment.js'
import { getUserFriendlyError } from '../utils/errorMessages.js'

const API_BASE_URL = config.API_BASE_URL;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
    this.refreshPromise = null;
  }

  isCredentialExchangeEndpoint(endpoint) {
    return (
      endpoint.startsWith('/auth/login') ||
      endpoint.startsWith('/auth/register') ||
      endpoint.startsWith('/auth/refresh')
    );
  }

  syncTokenFromStorage() {
    this.token = localStorage.getItem('token');
  }

  getRetryConfig(endpoint) {
    if (
      endpoint.startsWith('/auth/login') ||
      endpoint.startsWith('/auth/register')
    ) {
      return { attempts: 3, baseDelayMs: 1200, warmup: true };
    }
    return { attempts: 1, baseDelayMs: 0, warmup: false };
  }

  shouldRetryByStatus(status) {
    return [502, 503, 504, 520, 522, 524].includes(status);
  }

  isNetworkLikeError(error) {
    if (!error) return false;
    const msg = `${error.message || ''}`.toLowerCase();
    return (
      error.name === 'TypeError' ||
      msg.includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('load failed') ||
      msg.includes('fetch')
    );
  }

  async waitBeforeRetry(attempt, baseDelayMs) {
    const jitter = Math.floor(Math.random() * 300);
    const delay = (baseDelayMs * Math.pow(2, attempt)) + jitter;
    await sleep(delay);
  }

  async warmupServer() {
    try {
      await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
    } catch {
    }
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

  async parseJsonBody(response) {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { error: response.statusText || 'Respuesta inválida del servidor' };
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    this.syncTokenFromStorage();
    const retryConfig = this.getRetryConfig(endpoint);
    const fetchConfig = {
      headers: this.getHeaders(),
      ...options,
    };

    if (retryConfig.warmup) {
      await this.warmupServer();
    }

    let lastError = null;

    for (let attempt = 0; attempt < retryConfig.attempts; attempt++) {
      try {
        const response = await fetch(url, fetchConfig);
        const data = await this.parseJsonBody(response);

        if (
          response.status === 401 &&
          this.token &&
          !this.isCredentialExchangeEndpoint(endpoint)
        ) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            this.syncTokenFromStorage();
            fetchConfig.headers = this.getHeaders();
            const retryResponse = await fetch(url, fetchConfig);
            const retryData = await this.parseJsonBody(retryResponse);

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

          const canRetryStatus =
            attempt < retryConfig.attempts - 1 &&
            this.shouldRetryByStatus(response.status) &&
            this.isCredentialExchangeEndpoint(endpoint);

          if (canRetryStatus) {
            await this.waitBeforeRetry(attempt, retryConfig.baseDelayMs);
            continue;
          }

          throw apiError;
        }

        return data;
      } catch (error) {
        lastError = error;

        const canRetryNetwork =
          attempt < retryConfig.attempts - 1 &&
          this.isCredentialExchangeEndpoint(endpoint) &&
          this.isNetworkLikeError(error);

        if (canRetryNetwork) {
          await this.waitBeforeRetry(attempt, retryConfig.baseDelayMs);
          continue;
        }

        break;
      }
    }

    if (
      this.isCredentialExchangeEndpoint(endpoint) &&
      (this.isNetworkLikeError(lastError) ||
        this.shouldRetryByStatus(lastError?.statusCode || lastError?.status))
    ) {
      const wakeupError = new Error('El servidor se estaba activando. Espera unos segundos e intenta nuevamente.');
      wakeupError.code = 'SERVER_WAKING_UP';
      wakeupError.statusCode = lastError?.statusCode || lastError?.status;
      wakeupError.isUserFriendly = true;
      throw wakeupError;
    }

    if (lastError?.isUserFriendly) throw lastError;

    console.error('Error en petición API:', lastError);
    const friendlyError = new Error(getUserFriendlyError(lastError));
    friendlyError.originalError = lastError;
    friendlyError.statusCode = lastError?.statusCode || lastError?.status;
    throw friendlyError;
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
    try {
      apiClient.clearToken();
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        nombre_perfil
      });

      if (response.success && response.token) {
        apiClient.setToken(response.token);
      }

      return response;
    } catch (error) {
      console.error('Error en signUp:', error);
      throw error;
    }
  },

  async signIn(email, password) {
    try {
      apiClient.clearToken();
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });

      if (response.success && response.token) {
        apiClient.setToken(response.token);
      }

      return response;
    } catch (error) {
      console.error('Error en signIn:', error);
      throw error;
    }
  },

  async signOut() {
    try {
      apiClient.clearToken();
      return { success: true };
    } catch (error) {
      console.error('Error en signOut:', error);
      throw error;
    }
  },

  async getUser() {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      return null;
    }
  },

  async updateProfile(data) {
    try {
      const response = await apiClient.put('/auth/profile', data);
      return response;
    } catch (error) {
      console.error('Error en updateProfile:', error);
      throw error;
    }
  },

  async validateToken() {
    try {
      return await apiClient.validateToken();
    } catch (error) {
      console.error('Error en validateToken:', error);
      throw error;
    }
  },

  async refreshToken() {
    try {
      return await apiClient.refreshToken();
    } catch (error) {
      console.error('Error en refreshToken:', error);
      throw error;
    }
  },

  isTokenExpiringSoon() {
    return apiClient.isTokenExpiringSoon();
  },

  onAuthStateChange(callback) {
    const handler = (e) => {
      if (e.key !== 'token') return
      const token = e.newValue
      if (token) {
        callback('SIGNED_IN', null)
      } else {
        callback('SIGNED_OUT', null)
      }
    }

    window.addEventListener('storage', handler)

    return {
      data: {
        subscription: {
          unsubscribe: () => window.removeEventListener('storage', handler)
        }
      }
    }
  }
};

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

export const expenses = {
  async getExpenses(userId, filters = {}) {
    try {
      const response = await apiClient.get('/expenses', filters);
      return response;
    } catch (error) {
      console.error('Error en getExpenses:', error);
      throw error;
    }
  },

  async createExpense(expenseData) {
    try {
      const response = await apiClient.post('/expenses', expenseData);
      return response;
    } catch (error) {
      console.error('Error en createExpense:', error);
      throw error;
    }
  },

  async updateExpense(id, updates) {
    try {
      const response = await apiClient.put(`/expenses/${id}`, updates);
      return response;
    } catch (error) {
      console.error('Error en updateExpense:', error);
      throw error;
    }
  },

  async deleteExpense(id, deleteOption = null) {
    try {
      const payload = deleteOption ? { deleteOption } : undefined;
      const response = await apiClient.delete(`/expenses/${id}`, payload);
      return response;
    } catch (error) {
      console.error('Error en deleteExpense:', error);
      throw error;
    }
  },

  async getMonthlyExpensesWithInstallments(userId, month, year, filters = {}) {
    try {
      const params = { month, year, ...filters };
      const response = await apiClient.get('/expenses/monthly', params);
      return response;
    } catch (error) {
      console.error('Error en getMonthlyExpensesWithInstallments:', error);
      throw error;
    }
  },

  async getMonthlyTotalWithInstallments(userId, month, year, filters = {}) {
    try {
      const params = { month, year, ...filters };
      const response = await apiClient.get('/expenses/monthly-total', params);
      return response;
    } catch (error) {
      console.error('Error en getMonthlyTotalWithInstallments:', error);
      throw error;
    }
  },

  async getInstallments(expenseId) {
    try {
      const response = await apiClient.get(`/expenses/${expenseId}/installments`);
      return response;
    } catch (error) {
      console.error('Error en getInstallments:', error);
      throw error;
    }
  },

  async getExpenseInstallmentsSummary(expenseId) {
    try {
      const response = await apiClient.get(`/expenses/${expenseId}/installments-summary`);
      return response;
    } catch (error) {
      console.error('Error en getExpenseInstallmentsSummary:', error);
      throw error;
    }
  },

  async updateInstallmentStatus(installmentId, paymentStatusId) {
    try {
      const response = await apiClient.put(`/expenses/installments/${installmentId}/status`, {
        payment_status_id: paymentStatusId
      });
      return response;
    } catch (error) {
      console.error('Error en updateInstallmentStatus:', error);
      throw error;
    }
  },

  async getUpcomingInstallments(userId, limit = 100) {
    try {
      const response = await apiClient.get('/expenses/upcoming-installments', { limit });
      return response;
    } catch (error) {
      console.error('Error en getUpcomingInstallments:', error);
      throw error;
    }
  },

  async getCreditCardsSummary(isAnnual = false) {
    try {
      const response = await apiClient.get('/expenses/credit-cards-summary', { period: isAnnual ? 'annual' : 'monthly' });
      return response;
    } catch (error) {
      console.error('Error en getCreditCardsSummary:', error);
      throw error;
    }
  },

  async getExpensesSummaryByType(isAnnual = false) {
    try {
      const response = await apiClient.get('/expenses/summary-by-type', { period: isAnnual ? 'annual' : 'monthly' });
      return response;
    } catch (error) {
      console.error('Error en getExpensesSummaryByType:', error);
      throw error;
    }
  },

  async createInstallments(installmentsData) {
    try {
      const response = await apiClient.post('/expenses/installments', installmentsData);
      return response;
    } catch (error) {
      console.error('Error en createInstallments:', error);
      throw error;
    }
  },

  async getPaymentStatusByCode(code) {
    try {
      const response = await apiClient.get('/expenses/payment-status', { code });
      return response;
    } catch (error) {
      console.error('Error en getPaymentStatusByCode:', error);
      throw error;
    }
  },

  async getAllPaymentStatuses() {
    try {
      const response = await apiClient.get('/expenses/payment-statuses');
      return response;
    } catch (error) {
      console.error('Error en getAllPaymentStatuses:', error);
      throw error;
    }
  },

  async markAsPaid(id, payment_status_id) {
    try {
      const response = await apiClient.put(`/expenses/${id}/mark-as-paid`, {
        payment_status_id
      });
      return response;
    } catch (error) {
      console.error('Error en markAsPaid:', error);
      throw error;
    }
  },

  async markInstallmentAsPaid(id, payment_status_id) {
    try {
      const normalizedId = String(id).startsWith('installment-')
        ? String(id).replace('installment-', '')
        : id;
      const response = await apiClient.put(`/expenses/installment-${normalizedId}/mark-as-paid`, {
        payment_status_id
      });
      return response;
    } catch (error) {
      console.error('Error en markInstallmentAsPaid:', error);
      throw error;
    }
  },

  async getScheduledExpenses() {
    try {
      const response = await apiClient.get('/expenses/scheduled');
      return response;
    } catch (error) {
      console.error('Error en getScheduledExpenses:', error);
      throw error;
    }
  },

  async createScheduledExpense(expenseData) {
    try {
      const response = await apiClient.post('/expenses/scheduled', expenseData);
      return response;
    } catch (error) {
      console.error('Error en createScheduledExpense:', error);
      throw error;
    }
  },

  async updateScheduledExpense(scheduledExpenseId, expenseData) {
    try {
      const response = await apiClient.put(`/expenses/scheduled/${scheduledExpenseId}`, expenseData);
      return response;
    } catch (error) {
      console.error('Error en updateScheduledExpense:', error);
      throw error;
    }
  },

  async cancelScheduledExpense(scheduledExpenseId) {
    try {
      const response = await apiClient.delete(`/expenses/scheduled/${scheduledExpenseId}`);
      return response;
    } catch (error) {
      console.error('Error en cancelScheduledExpense:', error);
      throw error;
    }
  },

  async getMonthlyInstallments(userId, month, year) {
    try {
      const response = await apiClient.get('/expenses/monthly-installments', { month, year });
      return response;
    } catch (error) {
      console.error('Error en getMonthlyInstallments:', error);
      throw error;
    }
  }
};

export const categories = {
  async getCategories() {
    try {
      const response = await apiClient.get('/categories');
      return response;
    } catch (error) {
      console.error('Error en getCategories:', error);
      throw error;
    }
  },

  async createCategory(categoryData) {
    try {
      const response = await apiClient.post('/categories', categoryData);
      return response;
    } catch (error) {
      console.error('Error en createCategory:', error);
      throw error;
    }
  },

  async updateCategory(id, updates) {
    try {
      const response = await apiClient.put(`/categories/${id}`, updates);
      return response;
    } catch (error) {
      console.error('Error en updateCategory:', error);
      throw error;
    }
  },

  async deleteCategory(id) {
    try {
      const response = await apiClient.delete(`/categories/${id}`);
      return response;
    } catch (error) {
      console.error('Error en deleteCategory:', error);
      throw error;
    }
  },

  async getCategoriesWithStats(month, year) {
    try {
      const response = await apiClient.get('/categories/with-stats', { month, year });
      return response;
    } catch (error) {
      console.error('Error en getCategoriesWithStats:', error);
      throw error;
    }
  },

  async getCategoryStats(id) {
    try {
      const response = await apiClient.get(`/categories/${id}/stats`);
      return response;
    } catch (error) {
      console.error('Error en getCategoryStats:', error);
      throw error;
    }
  },

  async getCategoryExpenses(id, filters = {}) {
    try {
      const response = await apiClient.get(`/categories/${id}/expenses`, filters);
      return response;
    } catch (error) {
      console.error('Error en getCategoryExpenses:', error);
      throw error;
    }
  }
};

export const subcategories = {
  async getSubcategories() {
    try {
      const response = await apiClient.get('/subcategories');
      return response;
    } catch (error) {
      console.error('Error en getSubcategories:', error);
      throw error;
    }
  },

  async getSubcategoriesByCategory(categoryId) {
    try {
      const response = await apiClient.get(`/subcategories/category/${categoryId}`);
      return response;
    } catch (error) {
      console.error('Error en getSubcategoriesByCategory:', error);
      throw error;
    }
  },

  async getCategoriesWithSubcategories() {
    try {
      const response = await apiClient.get('/subcategories/with-categories');
      return response;
    } catch (error) {
      console.error('Error en getCategoriesWithSubcategories:', error);
      throw error;
    }
  },

  async createSubcategory(subcategoryData) {
    try {
      const response = await apiClient.post('/subcategories', subcategoryData);
      return response;
    } catch (error) {
      console.error('Error en createSubcategory:', error);
      throw error;
    }
  },

  async updateSubcategory(id, updates) {
    try {
      const response = await apiClient.put(`/subcategories/${id}`, updates);
      return response;
    } catch (error) {
      console.error('Error en updateSubcategory:', error);
      throw error;
    }
  },

  async deleteSubcategory(id) {
    try {
      const response = await apiClient.delete(`/subcategories/${id}`);
      return response;
    } catch (error) {
      console.error('Error en deleteSubcategory:', error);
      throw error;
    }
  },

  async getSubcategoryById(id) {
    try {
      const response = await apiClient.get(`/subcategories/${id}`);
      return response;
    } catch (error) {
      console.error('Error en getSubcategoryById:', error);
      throw error;
    }
  }
};

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

export { apiClient };
