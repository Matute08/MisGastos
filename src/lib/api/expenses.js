import { apiClient } from './client.js';

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
