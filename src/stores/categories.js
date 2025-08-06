import { defineStore } from 'pinia'
import { ref } from 'vue'
import { categories as categoriesApi, subcategories as subcategoriesApi } from '@/lib/api'
import { useAuthStore } from './auth'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  const authStore = useAuthStore()

  // Cargar todas las categorías
  const loadCategories = async () => {
    loading.value = true
    error.value = null
    try {
      const { data, error: apiError } = await categoriesApi.getCategories()
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      categories.value = data || []
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
      
      // Si hay subcategorías, mostrar mensaje de éxito
      if (categoryData.subcategories && categoryData.subcategories.length > 0) {
        console.log(`Categoría "${newCategory.name}" creada con ${categoryData.subcategories.length} subcategorías`)
      }
      
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
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Obtener categoría por ID
  const getCategoryById = (id) => {
    return categories.value.find(category => category.id === id)
  }

  // Verificar si el usuario puede crear categorías
  const canCreateCategory = () => {
    return authStore.isAdmin
  }

  // Verificar si el usuario puede editar categorías
  const canEditCategory = () => {
    return authStore.isAdmin
  }

  // Verificar si el usuario puede eliminar categorías
  const canDeleteCategory = () => {
    return authStore.isAdmin
  }

  // Limpiar error
  const clearError = () => {
    error.value = null
  }

  return {
    categories,
    loading,
    error,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    canCreateCategory,
    canEditCategory,
    canDeleteCategory,
    clearError
  }
}) 