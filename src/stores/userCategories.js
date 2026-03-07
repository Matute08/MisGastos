import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/lib/api'

export const useUserCategoriesStore = defineStore('userCategories', () => {
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)

  const sortedCategories = computed(() =>
    [...categories.value].sort((a, b) => a.name.localeCompare(b.name))
  )

  async function loadUserCategories() {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get('/expenses/user-categories')
      if (response.success) {
        categories.value = response.categories
      } else {
        error.value = response.error || 'Error al cargar categorías'
      }
    } catch (err) {
      error.value = err.response?.data?.error || 'Error de conexión'
    } finally {
      loading.value = false
    }
  }

  function clearState() {
    categories.value = []
    loading.value = false
    error.value = null
  }

  return {
    categories,
    loading,
    error,
    sortedCategories,
    loadUserCategories,
    clearState,
  }
})
