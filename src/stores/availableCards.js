import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { availableCards as availableCardsApi } from '@/lib/api'
import { useAuthStore } from './auth'

const CACHE_TTL_MS = 3 * 60 * 1000 // 3 minutes

export const useAvailableCardsStore = defineStore('availableCards', () => {
  const availableCards = ref([])
  const loading = ref(false)
  const error = ref(null)
  const lastFetchTime = ref(0)
  
  const authStore = useAuthStore()

  const creditCards = computed(() => 
    availableCards.value.filter(card => card.type === 'Crédito')
  )
  
  const debitCards = computed(() => 
    availableCards.value.filter(card => card.type === 'Débito')
  )

  // Obtener tarjetas disponibles ordenadas por banco
  const sortedAvailableCardsByBank = computed(() => {
    return [...availableCards.value].sort((a, b) => {
      const bankA = a.bank || 'ZZZ'
      const bankB = b.bank || 'ZZZ'
      return bankA.localeCompare(bankB)
    })
  })

  // Obtener lista única de bancos ordenados
  const uniqueBanks = computed(() => {
    const banks = [...new Set(availableCards.value.map(card => card.bank || 'Sin banco'))]
    return banks.sort((a, b) => {
      if (a === 'Sin banco') return 1
      if (b === 'Sin banco') return -1
      return a.localeCompare(b)
    })
  })

  // Cargar todas las tarjetas disponibles con caché TTL
  const loadAvailableCards = async (force = false) => {
    const now = Date.now()
    if (!force && availableCards.value.length > 0 && now - lastFetchTime.value < CACHE_TTL_MS) {
      return { success: true, data: availableCards.value, fromCache: true }
    }

    loading.value = true
    error.value = null
    
    try {
      const response = await availableCardsApi.getAllAvailableCards()
      
      if (response.error) {
        error.value = response.error
        return { success: false, error: response.error }
      }
      
      availableCards.value = response.data || []
      lastFetchTime.value = now
      return { success: true, data: response.data }
    } catch (err) {
      console.error('🔍 Debug - Error en loadAvailableCards:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Crear nueva tarjeta disponible (solo admin)
  const createAvailableCard = async (cardData) => {
    if (!authStore.isAdmin) {
      return { success: false, error: 'No tienes permisos para crear tarjetas disponibles' }
    }
    
    loading.value = true
    error.value = null
    
    try {
      const response = await availableCardsApi.createAvailableCard(cardData)
      
      if (response.error) {
        error.value = response.error
        return { success: false, error: response.error }
      }
      
      if (!response.data) {
        error.value = 'No se recibieron datos de la tarjeta creada'
        return { success: false, error: 'No se recibieron datos de la tarjeta creada' }
      }
      
      availableCards.value.unshift(response.data)
      lastFetchTime.value = Date.now()
      return { success: true, data: response.data }
    } catch (err) {
      console.error('🔍 Debug - Error en createAvailableCard:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Actualizar tarjeta disponible (solo admin)
  const updateAvailableCard = async (id, updates) => {
    if (!authStore.isAdmin) {
      return { success: false, error: 'No tienes permisos para actualizar tarjetas disponibles' }
    }
    
    loading.value = true
    error.value = null
    
    try {
      const { data, error: apiError } = await availableCardsApi.updateAvailableCard(id, updates)
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      const index = availableCards.value.findIndex(card => card.id === id)
      if (index !== -1) {
        availableCards.value[index] = data
      }
      lastFetchTime.value = Date.now()
      return { success: true, data: data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Eliminar tarjeta disponible (solo admin)
  const deleteAvailableCard = async (id) => {
    if (!authStore.isAdmin) {
      return { success: false, error: 'No tienes permisos para eliminar tarjetas disponibles' }
    }
    
    loading.value = true
    error.value = null
    
    try {
      const { error: apiError } = await availableCardsApi.deleteAvailableCard(id)
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      availableCards.value = availableCards.value.filter(card => card.id !== id)
      lastFetchTime.value = Date.now()
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Obtener tarjeta disponible por ID
  const getAvailableCardById = (id) => {
    return availableCards.value.find(card => card.id === id)
  }

  // Limpiar error
  const clearError = () => {
    error.value = null
  }

  return {
    availableCards,
    loading,
    error,
    creditCards,
    debitCards,
    sortedAvailableCardsByBank,
    uniqueBanks,
    loadAvailableCards,
    createAvailableCard,
    updateAvailableCard,
    deleteAvailableCard,
    getAvailableCardById,
    clearError
  }
})
