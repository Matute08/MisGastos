import { defineStore } from 'pinia'
import { apiClient } from '@/lib/api'

export const useUserCardsStore = defineStore('userCards', {
  state: () => ({
    cards: [],
    loading: false,
    error: null
  }),

  getters: {
    // Obtener tarjetas ordenadas por nombre
    sortedCards: (state) => {
      return [...state.cards].sort((a, b) => a.name.localeCompare(b.name))
    },

    // Obtener tarjetas por tipo
    cardsByType: (state) => {
      return (type) => state.cards.filter(card => card.type === type)
    },

    // Nuevo: Obtener tarjetas ordenadas por banco
    sortedCardsByBank: (state) => {
      return [...state.cards].sort((a, b) => {
        const bankA = a.available_card?.bank || 'ZZZ' // 'ZZZ' para que 'Sin banco' vaya al final
        const bankB = b.available_card?.bank || 'ZZZ'
        return bankA.localeCompare(bankB)
      })
    }
  },

  actions: {
    // Cargar tarjetas del usuario (todas las vinculadas)
    async loadUserCards() {
      this.loading = true
      this.error = null
      
      try {
        const response = await apiClient.get('/user-cards')
        console.log('Respuesta del backend al cargar tarjetas:', response)
        
        if (response.success) {
          this.cards = response.data || []
          console.log('Tarjetas cargadas en el store:', this.cards)
        } else {
          this.error = response.error || 'Error al cargar tarjetas'
        }
      } catch (error) {
        console.error('Error cargando tarjetas del usuario:', error)
        this.error = error.response?.data?.error || 'Error de conexión'
      } finally {
        this.loading = false
      }
    },

    // Limpiar estado
    clearState() {
      this.cards = []
      this.loading = false
      this.error = null
    },

    // Vincular una tarjeta al usuario
    async linkCardToUser(availableCardId) {
      try {
        const response = await apiClient.post('/user-cards', {
          available_card_id: availableCardId
        })
        
        console.log('Respuesta del backend al vincular:', response)
        
        if (response.success) {
          // Recargar las tarjetas del usuario
          await this.loadUserCards()
          console.log('Tarjetas recargadas:', this.cards)
          return { success: true }
        } else {
          return { success: false, error: response.error || 'Error al vincular tarjeta' }
        }
      } catch (error) {
        console.error('Error vinculando tarjeta:', error)
        return { 
          success: false, 
          error: error.response?.data?.error || 'Error de conexión al vincular tarjeta' 
        }
      }
    },

    // Desvincular una tarjeta del usuario
    async unlinkCardFromUser(userCardId) {
      try {
        const response = await apiClient.delete(`/user-cards/${userCardId}`)
        
        if (response.success) {
          // Recargar las tarjetas del usuario
          await this.loadUserCards()
          return { success: true }
        } else {
          return { success: false, error: response.error || 'Error al desvincular tarjeta' }
        }
      } catch (error) {
        console.error('Error desvinculando tarjeta:', error)
        return { 
          success: false, 
          error: error.response?.data?.error || 'Error de conexión al desvincular tarjeta' 
        }
      }
    },

    // Cargar tarjetas del usuario que tienen gastos (para ExpensesView.vue)
    async loadUserCardsWithExpenses() {
      try {
        const response = await apiClient.get('/expenses/user-cards')
        
        if (response.success) {
          this.cards = response.cards || []
        } else {
          this.error = response.error || 'Error al cargar tarjetas'
        }
      } catch (error) {
        console.error('Error cargando tarjetas del usuario con gastos:', error)
        this.error = error.response?.data?.error || 'Error de conexión'
      }
    }
  }
})
