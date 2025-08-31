import { defineStore } from 'pinia'
import { apiClient } from '@/lib/api'

export const useUserCategoriesStore = defineStore('userCategories', {
  state: () => ({
    categories: [],
    loading: false,
    error: null
  }),

  getters: {
    // Obtener categorías ordenadas por nombre
    sortedCategories: (state) => {
      return [...state.categories].sort((a, b) => a.name.localeCompare(b.name))
    }
  },

  actions: {
    // Cargar categorías del usuario (solo las que tiene gastos)
    async loadUserCategories() {
      this.loading = true
      this.error = null
      
      try {
        const response = await apiClient.get('/expenses/user-categories')
        
        if (response.success) {
          this.categories = response.categories
        } else {
          this.error = response.error || 'Error al cargar categorías'
        }
      } catch (error) {
        console.error('Error cargando categorías del usuario:', error)
        this.error = error.response?.data?.error || 'Error de conexión'
      } finally {
        this.loading = false
      }
    },

    // Limpiar estado
    clearState() {
      this.categories = []
      this.loading = false
      this.error = null
    }
  }
})
