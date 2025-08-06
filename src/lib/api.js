// Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Clase para manejar las peticiones HTTP
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
    this.refreshPromise = null;
  }

  // Configurar headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Método genérico para peticiones HTTP con manejo de token expirado
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Si el token expiró, intentar renovarlo
      if (response.status === 401 && this.token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Reintentar la petición original con el nuevo token
          config.headers = this.getHeaders();
          const retryResponse = await fetch(url, config);
          const retryData = await retryResponse.json();
          
          if (!retryResponse.ok) {
            throw new Error(retryData.error || `Error ${retryResponse.status}: ${retryResponse.statusText}`);
          }
          return retryData;
        } else {
          // Si no se pudo renovar, limpiar token y redirigir a login
          this.clearToken();
          window.location.href = '/login';
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
      }

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error en petición API:', error);
      throw error;
    }
  }

  // Renovar token automáticamente
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

  // Validar token actual
  async validateToken() {
    if (!this.token) return false;
    
    try {
      const response = await this.get('/auth/validate');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  // Métodos HTTP
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
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

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Establecer token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
      // Establecer expiración del token (30 días por defecto)
      const expiresAt = new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
      localStorage.setItem('tokenExpiresAt', expiresAt.toString());
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiresAt');
    }
  }

  // Limpiar token
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiresAt');
  }

  // Verificar si el token está próximo a expirar
  isTokenExpiringSoon() {
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    if (!expiresAt) return false;
    
    const now = new Date().getTime();
    const expiresTime = parseInt(expiresAt);
    const timeUntilExpiry = expiresTime - now;
    
    // Renovar si expira en menos de 1 día
    return timeUntilExpiry < (24 * 60 * 60 * 1000);
  }
}

// Instancia global del cliente API
const apiClient = new ApiClient();

// Funciones de autenticación
export const auth = {
  // Registro de usuario
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

  // Inicio de sesión
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

  // Cerrar sesión
  async signOut() {
    apiClient.clearToken();
    return { success: true };
  },

  // Obtener perfil del usuario actual
  async getUser() {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      return null;
    }
  },

  // Validar token actual
  async validateToken() {
    return await apiClient.validateToken();
  },

  // Renovar token
  async refreshToken() {
    return await apiClient.refreshToken();
  },

  // Verificar si el token está próximo a expirar
  isTokenExpiringSoon() {
    return apiClient.isTokenExpiringSoon();
  },

  // Escuchar cambios de autenticación (simulado)
  onAuthStateChange(callback) {
    // En una implementación real, podrías usar WebSockets o polling
    // Por ahora, simulamos el comportamiento
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        callback('SIGNED_IN', { user: { token } });
      } else {
        callback('SIGNED_OUT', null);
      }
    };

    // Verificar estado inicial
    checkAuth();

    // Escuchar cambios en localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === 'token') {
        checkAuth();
      }
    });

    return { data: { subscription: { unsubscribe: () => {} } } };
  }
};

// Funciones para tarjetas
export const cards = {
  // Obtener todas las tarjetas del usuario
  async getCards() {
    try {
      const response = await apiClient.get('/cards');
      return response;
    } catch (error) {
      console.error('🔍 Debug API - Error en getCards:', error);
      return { error: error.message };
    }
  },

  // Crear nueva tarjeta
  async createCard(cardData) {
    try {
      const response = await apiClient.post('/cards', cardData);
      return response;
    } catch (error) {
      console.error('🔍 Debug API - Error en createCard:', error);
      return { error: error.message };
    }
  },

  // Actualizar tarjeta
  async updateCard(id, updates) {
    const response = await apiClient.put(`/cards/${id}`, updates);
    return response;
  },

  // Eliminar tarjeta
  async deleteCard(id) {
    const response = await apiClient.delete(`/cards/${id}`);
    return response;
  },

  // Obtener estadísticas de tarjeta
  async getCardStats(id) {
    const response = await apiClient.get(`/cards/${id}/stats`);
    return response;
  },

  // Obtener gastos de una tarjeta
  async getCardExpenses(id, filters = {}) {
    const response = await apiClient.get(`/cards/${id}/expenses`, filters);
    return response;
  }
};

// Funciones para gastos
export const expenses = {
  // Obtener todos los gastos del usuario
  async getExpenses(userId, filters = {}) {
    const response = await apiClient.get('/expenses', filters);
    return response;
  },

  // Crear nuevo gasto
  async createExpense(expenseData) {
    const response = await apiClient.post('/expenses', expenseData);
    return response;
  },

  // Actualizar gasto
  async updateExpense(id, updates) {
    const response = await apiClient.put(`/expenses/${id}`, updates);
    return response;
  },

  // Eliminar gasto
  async deleteExpense(id) {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response;
  },

  // Obtener gastos mensuales con cuotas
  async getMonthlyExpensesWithInstallments(userId, month, year, filters = {}) {
    const params = { month, year, ...filters };
    const response = await apiClient.get('/expenses/monthly', params);
    return response;
  },

  // Obtener total mensual con cuotas
  async getMonthlyTotalWithInstallments(userId, month, year) {
    const response = await apiClient.get('/expenses/monthly-total', { month, year });
    return response;
  },

  // Obtener cuotas de un gasto
  async getInstallments(expenseId) {
    const response = await apiClient.get(`/expenses/${expenseId}/installments`);
    return response;
  },

  // Obtener resumen de cuotas de un gasto
  async getExpenseInstallmentsSummary(expenseId) {
    const response = await apiClient.get(`/expenses/${expenseId}/installments-summary`);
    return response;
  },

  // Actualizar estado de una cuota
  async updateInstallmentStatus(installmentId, paymentStatusId) {
    const response = await apiClient.put(`/expenses/installments/${installmentId}/status`, {
      payment_status_id: paymentStatusId
    });
    return response;
  },

  // Obtener cuotas próximas a vencer
  async getUpcomingInstallments(userId, limit = 100) {
    const response = await apiClient.get('/expenses/upcoming-installments', { limit });
    return response;
  },

  // Crear cuotas para un gasto
  async createInstallments(installmentsData) {
    const response = await apiClient.post('/expenses/installments', installmentsData);
    return response;
  },

  // Obtener estado de pago por código
  async getPaymentStatusByCode(code) {
    const response = await apiClient.get('/expenses/payment-status', { code });
    return response;
  },

  // Marcar gasto como pagado
  async markAsPaid(id, payment_status_id) {
    const response = await apiClient.put(`/expenses/${id}/mark-as-paid`, {
      payment_status_id
    });
    return response;
  }
};

// Funciones para categorías
export const categories = {
  // Obtener todas las categorías
  async getCategories() {
    const response = await apiClient.get('/categories');
    return response;
  },

  // Crear nueva categoría
  async createCategory(categoryData) {
    const response = await apiClient.post('/categories', categoryData);
    return response;
  },

  // Actualizar categoría
  async updateCategory(id, updates) {
    const response = await apiClient.put(`/categories/${id}`, updates);
    return response;
  },

  // Eliminar categoría
  async deleteCategory(id) {
    const response = await apiClient.delete(`/categories/${id}`);
    return response;
  },

  // Obtener categorías con estadísticas
  async getCategoriesWithStats(month, year) {
    const response = await apiClient.get('/categories/with-stats', { month, year });
    return response;
  },

  // Obtener estadísticas de categoría
  async getCategoryStats(id) {
    const response = await apiClient.get(`/categories/${id}/stats`);
    return response;
  },

  // Obtener gastos de una categoría
  async getCategoryExpenses(id, filters = {}) {
    const response = await apiClient.get(`/categories/${id}/expenses`, filters);
    return response;
  }
};

// Funciones para subcategorías
export const subcategories = {
  // Obtener todas las subcategorías
  async getSubcategories() {
    const response = await apiClient.get('/subcategories');
    return response;
  },

  // Obtener subcategorías por categoría
  async getSubcategoriesByCategory(categoryId) {
    const response = await apiClient.get(`/subcategories/category/${categoryId}`);
    return response;
  },

  // Obtener categorías con sus subcategorías
  async getCategoriesWithSubcategories() {
    const response = await apiClient.get('/subcategories/with-categories');
    return response;
  },

  // Crear nueva subcategoría
  async createSubcategory(subcategoryData) {
    const response = await apiClient.post('/subcategories', subcategoryData);
    return response;
  },

  // Actualizar subcategoría
  async updateSubcategory(id, updates) {
    const response = await apiClient.put(`/subcategories/${id}`, updates);
    return response;
  },

  // Eliminar subcategoría
  async deleteSubcategory(id) {
    const response = await apiClient.delete(`/subcategories/${id}`);
    return response;
  },

  // Obtener subcategoría por ID
  async getSubcategoryById(id) {
    const response = await apiClient.get(`/subcategories/${id}`);
    return response;
  }
};

// Exportar el cliente API para uso directo si es necesario
export { apiClient }; 