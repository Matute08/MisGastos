<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Cuentas Disponibles</h1>
        <p class="text-sm sm:text-base text-gray-600">Administra las cuentas que los usuarios pueden vincular</p>
      </div>
      <button 
        v-if="isAdmin"
        @click="showModal = true"
        class="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-sm sm:text-base"
      >
        <Plus class="h-4 w-4 sm:h-5 sm:w-5" />
        <span>Nueva Cuenta</span>
      </button>
    </div>

    <!-- Error -->
    <div v-if="availableCardsStore.error" class="bg-danger-50 border border-danger-200 rounded-md p-3 sm:p-4">
      <div class="flex">
        <AlertCircle class="h-4 w-4 sm:h-5 sm:w-5 text-danger-400" />
        <div class="ml-2 sm:ml-3">
          <p class="text-xs sm:text-sm text-danger-700">{{ availableCardsStore.error }}</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="availableCardsStore.loading" class="flex justify-center py-6 sm:py-8">
      <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Lista de cuentas disponibles -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div
        v-for="card in availableCardsStore.availableCards"
        :key="card.id"
        class="card hover:shadow-md transition-shadow duration-200 p-4 sm:p-6"
      >
        <!-- Header de la cuenta -->
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-blue-100 rounded-lg">
              <CreditCard class="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ card.name }}</h3>
                             <span class="px-2 py-1 text-xs rounded-full" 
                     :class="{
                       'bg-green-100 text-green-800': card.type === 'Crédito',
                       'bg-blue-100 text-blue-800': card.type === 'Débito',
                       'bg-purple-100 text-purple-800': card.type === 'Transferencia',
                       'bg-gray-100 text-gray-800': card.type === 'Ninguna'
                     }">
                 {{ card.type }}
               </span>
            </div>
          </div>
          
          <!-- Menú de acciones -->
          <div class="relative flex-shrink-0">
            <button
              @click="toggleCardMenu(card.id)"
              class="p-1.5 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded"
            >
              <MoreVertical class="h-4 w-4" />
            </button>

            <!-- Menú desplegable -->
            <div
              v-if="activeCardMenu === card.id"
              class="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
            >
              <button
                @click="editCard(card)"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <Edit class="h-4 w-4 inline mr-2" />
                Editar
              </button>
              <button
                @click="deleteCard(card.id)"
                class="block w-full text-left px-4 py-2 text-sm text-danger-700 hover:bg-danger-50 transition-colors duration-200"
              >
                <Trash2 class="h-4 w-4 inline mr-2" />
                Eliminar
              </button>
            </div>
          </div>
        </div>

        <!-- Información de la cuenta -->
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-500 text-sm">Banco:</span>
            <span class="font-medium text-gray-700">{{ card.bank }}</span>
          </div>
          
          <div v-if="card.payment_day" class="flex justify-between items-center">
            <span class="text-gray-500 text-sm">Día de pago:</span>
            <span class="font-medium text-gray-700">Día {{ card.payment_day }}</span>
          </div>
          
          <div v-if="card.credit_limit" class="flex justify-between items-center">
            <span class="text-gray-500 text-sm">Límite de crédito:</span>
            <span class="font-medium text-gray-700">${{ formatNumber(card.credit_limit) }}</span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-gray-500 text-sm">Creada:</span>
            <span class="font-medium text-gray-700 text-xs">{{ formatDate(card.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div
      v-if="availableCardsStore.availableCards.length === 0"
      class="text-center py-8 sm:py-12"
    >
      <CreditCard class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-900">No hay cuentas disponibles</h3>
      <p class="mt-2 text-gray-600">Comienza creando la primera cuenta disponible</p>
      <button
        v-if="isAdmin"
        @click="showModal = true"
        class="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 mt-4 mx-auto text-sm sm:text-base"
      >
        <Plus class="h-4 w-4 sm:h-5 sm:w-5" />
        <span>Crear Primera Cuenta</span>
      </button>
    </div>

    <!-- Modal para agregar/editar cuenta -->
    <AvailableCardModal
      v-if="showModal"
      :card="editingCard"
      @close="closeModal"
      @save="saveCard"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAvailableCardsStore } from '@/stores/availableCards'
import { useAuthStore } from '@/stores/auth'
import AvailableCardModal from '@/components/AvailableCardModal.vue'
import Swal from 'sweetalert2'
import {
  CreditCard,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-vue-next'

const availableCardsStore = useAvailableCardsStore()
const authStore = useAuthStore()

const showModal = ref(false)
const editingCard = ref(null)
const activeCardMenu = ref(null)

const isAdmin = computed(() => authStore.isAdmin)

  onMounted(async () => {
    if (!authStore.isAuthReady || authStore.isInitializing) {
      return
    }
    
    if (isAdmin.value) {
      await availableCardsStore.loadAvailableCards()
    }
  })

  watch([() => authStore.isAuthReady, () => authStore.isInitializing, () => isAdmin.value], async ([isReady, isInitializing, isAdminUser]) => {
    if (isReady && !isInitializing && isAdminUser) {
      await availableCardsStore.loadAvailableCards()
    }
  }, { immediate: true })

const toggleCardMenu = (cardId) => {
  activeCardMenu.value = activeCardMenu.value === cardId ? null : cardId
}

const editCard = (card) => {
  editingCard.value = { ...card }
  showModal.value = true
  activeCardMenu.value = null
}

const deleteCard = async (cardId) => {
  const result = await Swal.fire({
    title: '¿Eliminar cuenta?',
    text: 'Esta acción no se puede deshacer. ¿Estás seguro?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      await availableCardsStore.deleteAvailableCard(cardId)
      
      Swal.fire({
        icon: 'success',
        title: 'Cuenta eliminada',
        text: 'La cuenta ha sido eliminada correctamente.',
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#10b981',
        timer: 2000,
        timerProgressBar: true
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: error.message || 'No se pudo eliminar la cuenta',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ef4444'
      })
    }
  }
  activeCardMenu.value = null
}

const closeModal = () => {
  showModal.value = false
  editingCard.value = null
}

const saveCard = async (cardData) => {
  try {
    if (editingCard.value) {
      await availableCardsStore.updateAvailableCard(editingCard.value.id, cardData)
    } else {
      await availableCardsStore.createAvailableCard(cardData)
    }
    
    Swal.fire({
      icon: 'success',
      title: editingCard.value ? '¡Cuenta actualizada!' : '¡Cuenta creada!',
      text: editingCard.value 
        ? 'La cuenta ha sido actualizada correctamente.'
        : 'La cuenta ha sido creada y ya está disponible para los usuarios.',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#10b981',
      timer: 3000,
      timerProgressBar: true
    })
    
    closeModal()
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'Ocurrió un error inesperado',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#ef4444'
    })
  }
}

const formatNumber = (number) => {
  return new Intl.NumberFormat('es-AR').format(number)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
      activeCardMenu.value = null
    }
  })
})
</script>
