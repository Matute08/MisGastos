import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userCards as userCardsApi } from '@/lib/api'
import { useAuthStore } from './auth'

export const useUserCardsStore = defineStore('userCards', () => {
  const userCards = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  const authStore = useAuthStore()

  const creditCards = computed(() => 
    userCards.value.filter(uc => uc.available_card?.type === 'Crédito')
  )
  
  const debitCards = computed(() => 
    userCards.value.filter(uc => uc.available_card?.type === 'Débito')
  )

  // Cargar tarjetas vinculadas del usuario
  const loadUserCards = async () => {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      console.log('🔍 Debug - Cargando tarjetas vinculadas para usuario:', authStore.user.id)
      
      const response = await userCardsApi.getUserCards()
      console.log('🔍 Debug - Respuesta de getUserCards:', response)
      
      if (response.error) {
        error.value = response.error
        return { success: false, error: response.error }
      }
      
      userCards.value = response.data || []
      console.log('🔍 Debug - Tarjetas vinculadas cargadas:', userCards.value)
      return { success: true, data: response.data }
    } catch (err) {
      console.error('🔍 Debug - Error en loadUserCards:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Vincular tarjeta disponible al usuario
  const linkCardToUser = async (availableCardId) => {
    if (!authStore.user) return { success: false, error: 'Usuario no autenticado' }
    
    loading.value = true
    error.value = null
    
    try {
      console.log('🔍 Debug - Vinculando tarjeta:', availableCardId, 'al usuario:', authStore.user.id)
      
      const response = await userCardsApi.linkCardToUser(availableCardId)
      console.log('🔍 Debug - Respuesta del API:', response)
      
      if (response.error) {
        error.value = response.error
        return { success: false, error: response.error }
      }
      
      if (!response.data) {
        error.value = 'No se recibieron datos de la tarjeta vinculada'
        return { success: false, error: 'No se recibieron datos de la tarjeta vinculada' }
      }
      
      userCards.value.unshift(response.data)
      return { success: true, data: response.data }
    } catch (err) {
      console.error('🔍 Debug - Error en linkCardToUser:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Desvincular tarjeta del usuario
  const unlinkCardFromUser = async (userCardId) => {
    loading.value = true
    error.value = null
    
    try {
      const { error: apiError } = await userCardsApi.unlinkCardFromUser(userCardId)
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      userCards.value = userCards.value.filter(uc => uc.id !== userCardId)
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Verificar si una tarjeta está vinculada al usuario
  const isCardLinkedToUser = async (availableCardId) => {
    if (!authStore.user) return { success: false, isLinked: false }
    
    try {
      const response = await userCardsApi.isCardLinkedToUser(availableCardId)
      return response
    } catch (err) {
      console.error('🔍 Debug - Error en isCardLinkedToUser:', err)
      return { success: false, isLinked: false }
    }
  }

  // Obtener estadísticas de tarjetas del usuario
  const getUserCardStats = async () => {
    if (!authStore.user) return
    
    try {
      const response = await userCardsApi.getUserCardStats()
      return response
    } catch (err) {
      console.error('🔍 Debug - Error en getUserCardStats:', err)
      return { success: false, error: err.message }
    }
  }

  // Obtener tarjeta vinculada por ID
  const getUserCardById = (id) => {
    return userCards.value.find(uc => uc.id === id)
  }

  // Limpiar error
  const clearError = () => {
    error.value = null
  }

  return {
    userCards,
    loading,
    error,
    creditCards,
    debitCards,
    loadUserCards,
    linkCardToUser,
    unlinkCardFromUser,
    isCardLinkedToUser,
    getUserCardStats,
    getUserCardById,
    clearError
  }
})
