import { defineStore } from 'pinia'
import { ref } from 'vue'
import { subcategories as subcategoriesApi } from '@/lib/api'
import { useAuthStore } from './auth'

export const useSubcategoriesStore = defineStore('subcategories', () => {
  const subcategories = ref([])
  const categoriesWithSubcategories = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  const authStore = useAuthStore()

  // Cargar todas las subcategorías
  const loadSubcategories = async () => {
    loading.value = true
    error.value = null
    try {
      const { data, error: apiError } = await subcategoriesApi.getSubcategories()
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      subcategories.value = data || []
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Cargar categorías con sus subcategorías
  const loadCategoriesWithSubcategories = async () => {
    loading.value = true
    error.value = null
    try {
      const { data, error: apiError } = await subcategoriesApi.getCategoriesWithSubcategories()
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      categoriesWithSubcategories.value = data || []
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Cargar subcategorías por categoría
  const loadSubcategoriesByCategory = async (categoryId) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: apiError } = await subcategoriesApi.getSubcategoriesByCategory(categoryId)
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      return { success: true, data: data || [] }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Crear nueva subcategoría (solo admins)
  const createSubcategory = async (subcategoryData) => {
    if (!authStore.user) return { success: false, error: 'Usuario no autenticado' }
    if (!authStore.isAdmin) return { success: false, error: 'No tienes permisos para crear subcategorías' }
    loading.value = true
    error.value = null
    try {
      const { data, error: apiError } = await subcategoriesApi.createSubcategory(subcategoryData)
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      subcategories.value.push(data[0])
      return { success: true, data: data[0] }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Actualizar subcategoría (solo admins)
  const updateSubcategory = async (id, updates) => {
    if (!authStore.isAdmin) return { success: false, error: 'No tienes permisos para editar subcategorías' }
    
    loading.value = true
    error.value = null
    
    try {
      const { data, error: apiError } = await subcategoriesApi.updateSubcategory(id, updates)
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      const index = subcategories.value.findIndex(subcategory => subcategory.id === id)
      if (index !== -1) {
        subcategories.value[index] = data[0]
      }
      
      return { success: true, data: data[0] }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Eliminar subcategoría (solo admins)
  const deleteSubcategory = async (id) => {
    if (!authStore.isAdmin) return { success: false, error: 'No tienes permisos para eliminar subcategorías' }
    
    loading.value = true
    error.value = null
    
    try {
      const { error: apiError } = await subcategoriesApi.deleteSubcategory(id)
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      subcategories.value = subcategories.value.filter(subcategory => subcategory.id !== id)
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Obtener subcategoría por ID
  const getSubcategoryById = (id) => {
    return subcategories.value.find(subcategory => subcategory.id === id)
  }

  // Obtener subcategorías por categoría
  const getSubcategoriesByCategory = (categoryId) => {
    return subcategories.value.filter(subcategory => subcategory.category_id === categoryId)
  }

  // Verificar si el usuario puede crear subcategorías
  const canCreateSubcategory = () => {
    return authStore.isAdmin
  }

  // Verificar si el usuario puede editar subcategorías
  const canEditSubcategory = () => {
    return authStore.isAdmin
  }

  // Verificar si el usuario puede eliminar subcategorías
  const canDeleteSubcategory = () => {
    return authStore.isAdmin
  }

  // Limpiar error
  const clearError = () => {
    error.value = null
  }

  return {
    subcategories,
    categoriesWithSubcategories,
    loading,
    error,
    loadSubcategories,
    loadCategoriesWithSubcategories,
    loadSubcategoriesByCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    getSubcategoryById,
    getSubcategoriesByCategory,
    canCreateSubcategory,
    canEditSubcategory,
    canDeleteSubcategory,
    clearError
  }
}) 