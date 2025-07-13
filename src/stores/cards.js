import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cards as cardsApi } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useCardsStore = defineStore('cards', () => {
  const cards = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  const authStore = useAuthStore()

  const creditCards = computed(() => 
    cards.value.filter(card => card.type === 'Crédito')
  )
  
  const debitCards = computed(() => 
    cards.value.filter(card => card.type === 'Débito')
  )

  // Cargar todas las tarjetas
  const loadCards = async () => {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      const { data, error: apiError } = await cardsApi.getCards(authStore.user.id)
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      cards.value = data || []
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Crear nueva tarjeta
  const createCard = async (cardData) => {
    if (!authStore.user) return { success: false, error: 'Usuario no autenticado' }
    
    loading.value = true
    error.value = null
    
    try {
      const cardWithUserId = {
        ...cardData,
        user_id: authStore.user.id
      }
      
      const { data, error: apiError } = await cardsApi.createCard(cardWithUserId)
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      cards.value.unshift(data[0])
      return { success: true, data: data[0] }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Actualizar tarjeta
  const updateCard = async (id, updates) => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: apiError } = await cardsApi.updateCard(id, updates)
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      const index = cards.value.findIndex(card => card.id === id)
      if (index !== -1) {
        cards.value[index] = data[0]
      }
      
      return { success: true, data: data[0] }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Eliminar tarjeta
  const deleteCard = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const { error: apiError } = await cardsApi.deleteCard(id)
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      cards.value = cards.value.filter(card => card.id !== id)
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Obtener tarjeta por ID
  const getCardById = (id) => {
    return cards.value.find(card => card.id === id)
  }

  // Limpiar error
  const clearError = () => {
    error.value = null
  }

  return {
    cards,
    loading,
    error,
    creditCards,
    debitCards,
    loadCards,
    createCard,
    updateCard,
    deleteCard,
    getCardById,
    clearError
  }
}) 