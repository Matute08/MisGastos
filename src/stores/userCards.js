import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/lib/api'

export const useUserCardsStore = defineStore('userCards', () => {
  const cards = ref([])
  const loading = ref(false)
  const error = ref(null)

  const sortedCards = computed(() =>
    [...cards.value].sort((a, b) => a.name?.localeCompare(b.name))
  )

  const cardsByType = computed(() =>
    (type) => cards.value.filter(card => card.type === type)
  )

  const sortedCardsByBank = computed(() =>
    [...cards.value].sort((a, b) => {
      const bankA = a.available_card?.bank || 'ZZZ'
      const bankB = b.available_card?.bank || 'ZZZ'
      return bankA.localeCompare(bankB)
    })
  )

  async function loadUserCards() {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get('/user-cards')
      if (response.success) {
        cards.value = response.data || []
      } else {
        error.value = response.error || 'Error al cargar tarjetas'
      }
    } catch (err) {
      error.value = err.response?.data?.error || 'Error de conexión'
    } finally {
      loading.value = false
    }
  }

  function clearState() {
    cards.value = []
    loading.value = false
    error.value = null
  }

  async function linkCardToUser(availableCardId) {
    try {
      const response = await apiClient.post('/user-cards', { available_card_id: availableCardId })
      if (response.success) {
        await loadUserCards()
        return { success: true }
      }
      return { success: false, error: response.error || 'Error al vincular tarjeta' }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Error de conexión' }
    }
  }

  async function unlinkCardFromUser(userCardId) {
    try {
      const response = await apiClient.delete(`/user-cards/${userCardId}`)
      if (response.success) {
        await loadUserCards()
        return { success: true }
      }
      return { success: false, error: response.error || 'Error al desvincular tarjeta' }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Error de conexión' }
    }
  }

  async function loadUserCardsWithExpenses() {
    try {
      const response = await apiClient.get('/expenses/user-cards')
      if (response.success) {
        cards.value = response.cards || []
      } else {
        error.value = response.error || 'Error al cargar tarjetas'
      }
    } catch (err) {
      error.value = err.response?.data?.error || 'Error de conexión'
    }
  }

  return {
    cards,
    loading,
    error,
    sortedCards,
    cardsByType,
    sortedCardsByBank,
    loadUserCards,
    clearState,
    linkCardToUser,
    unlinkCardFromUser,
    loadUserCardsWithExpenses,
  }
})
