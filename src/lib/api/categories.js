import { apiClient } from './client.js';

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
