import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { categories as categoriesApi } from '@/lib/api'
import { useAuthStore } from './auth'

const CACHE_TTL_MS = 3 * 60 * 1000 // 3 minutes

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)
  const lastFetchTime = ref(0)
  
  const authStore = useAuthStore()

  // Budgeting state (per user)
  const budgets = ref({})

  const loadBudgetsFromStorage = () => {
    try {
      const userId = authStore.user?.id || 'guest'
      const key = `misgastos_budgets_${userId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        budgets.value = JSON.parse(stored)
      } else {
        budgets.value = {}
      }
    } catch (e) {
      budgets.value = {}
    }
  }

  const saveBudgetsToStorage = () => {
    try {
      const userId = authStore.user?.id || 'guest'
      const key = `misgastos_budgets_${userId}`
      localStorage.setItem(key, JSON.stringify(budgets.value))
    } catch (e) {
      // Storage full
    }
  }

  // Load budgets initially
  loadBudgetsFromStorage()

  // Cargar todas las categorías con caché TTL
  const loadCategories = async (force = false) => {
    const now = Date.now()
    if (!force && categories.value.length > 0 && now - lastFetchTime.value < CACHE_TTL_MS) {
      return { success: true, data: categories.value, fromCache: true }
    }

    loading.value = true
    error.value = null
    try {
      const { data, error: apiError } = await categoriesApi.getCategories()
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      categories.value = data || []
      lastFetchTime.value = now
      loadBudgetsFromStorage()
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Crear nueva categoría (solo admins)
  const createCategory = async (categoryData) => {
    if (!authStore.user) return { success: false, error: 'Usuario no autenticado' }
    if (!authStore.isAdmin) return { success: false, error: 'No tienes permisos para crear categorías' }
    loading.value = true
    error.value = null
    try {
      const { data, error: apiError } = await categoriesApi.createCategory(categoryData)
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      const newCategory = data[0]
      categories.value.push(newCategory)
      lastFetchTime.value = Date.now()
      
      return { success: true, data: newCategory }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Actualizar categoría (solo admins)
  const updateCategory = async (id, updates) => {
    if (!authStore.isAdmin) return { success: false, error: 'No tienes permisos para editar categorías' }
    
    loading.value = true
    error.value = null
    
    try {
      const { data, error: apiError } = await categoriesApi.updateCategory(id, updates)
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      const index = categories.value.findIndex(category => category.id === id)
      if (index !== -1) {
        categories.value[index] = data[0]
      }
      lastFetchTime.value = Date.now()
      
      return { success: true, data: data[0] }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Eliminar categoría (solo admins)
  const deleteCategory = async (id) => {
    if (!authStore.isAdmin) return { success: false, error: 'No tienes permisos para eliminar categorías' }
    
    loading.value = true
    error.value = null
    
    try {
      const { error: apiError } = await categoriesApi.deleteCategory(id)
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      categories.value = categories.value.filter(category => category.id !== id)
      lastFetchTime.value = Date.now()
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Budgeting functions
  const setCategoryBudget = (categoryId, amount) => {
    const numAmount = Number(amount) || 0
    if (numAmount > 0) {
      budgets.value[categoryId] = numAmount
    } else {
      delete budgets.value[categoryId]
    }
    saveBudgetsToStorage()
  }

  const getCategoryBudget = (categoryId) => {
    return budgets.value[categoryId] || 0
  }

  const getCategoryBudgetStatus = (categoryId, spentAmount = 0) => {
    const budget = getCategoryBudget(categoryId)
    if (!budget || budget <= 0) return null

    const spent = Number(spentAmount) || 0
    const percentage = (spent / budget) * 100
    const remaining = Math.max(0, budget - spent)
    const exceeded = Math.max(0, spent - budget)

    let status = 'safe' // 0 - 75%
    if (percentage >= 100) {
      status = 'danger' // >= 100%
    } else if (percentage >= 75) {
      status = 'warning' // 75 - 99%
    }

    return {
      budget,
      spent,
      percentage: Math.min(percentage, 100),
      rawPercentage: percentage,
      remaining,
      exceeded,
      status
    }
  }

  // Obtener categoría por ID
  const getCategoryById = (id) => {
    return categories.value.find(category => category.id === id)
  }

  // Verificar permisos
  const canCreateCategory = () => authStore.isAdmin
  const canEditCategory = () => authStore.isAdmin
  const canDeleteCategory = () => authStore.isAdmin

  // Limpiar error
  const clearError = () => {
    error.value = null
  }

  return {
    categories,
    loading,
    error,
    budgets,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    setCategoryBudget,
    getCategoryBudget,
    getCategoryBudgetStatus,
    canCreateCategory,
    canEditCategory,
    canDeleteCategory,
    clearError
  }
})