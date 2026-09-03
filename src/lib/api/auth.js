import { apiClient } from './client.js';

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
      if (apiClient.token) {
        try {
          await apiClient.post('/auth/logout');
        } catch (e) {
          // Si el token ya expiró o hay fallo de red, se continúa con la limpieza local
        }
      }
      apiClient.clearToken();
      return { success: true };
    } catch (error) {
      console.error('Error en signOut:', error);
      apiClient.clearToken();
      return { success: true };
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
      if (e.key !== 'token') return;
      const token = e.newValue;
      if (token) {
        callback('SIGNED_IN', null);
      } else {
        callback('SIGNED_OUT', null);
      }
    };

    window.addEventListener('storage', handler);

    return {
      data: {
        subscription: {
          unsubscribe: () => window.removeEventListener('storage', handler)
        }
      }
    };
  }
};
