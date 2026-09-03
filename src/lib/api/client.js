import { config } from '../../config/environment.js'
import { getUserFriendlyError } from '../../utils/errorMessages.js'

const API_BASE_URL = config.API_BASE_URL;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class ApiClient {
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

export const apiClient = new ApiClient();
