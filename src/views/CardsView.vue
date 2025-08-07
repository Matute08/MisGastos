<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Tarjetas</h1>
        <p class="text-sm sm:text-base text-gray-600">Gestiona tus tarjetas de crédito y débito</p>
      </div>
      <button @click="showModal = true"
        class="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-sm sm:text-base">
        <Plus class="h-4 w-4 sm:h-5 sm:w-5" />
        <span>Nueva Tarjeta</span>
      </button>
    </div>

    <!-- Error -->
    <div v-if="cardsStore.error" class="bg-danger-50 border border-danger-200 rounded-md p-3 sm:p-4">
      <div class="flex">
        <AlertCircle class="h-4 w-4 sm:h-5 sm:w-5 text-danger-400" />
        <div class="ml-2 sm:ml-3">
          <p class="text-xs sm:text-sm text-danger-700">{{ cardsStore.error }}</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="cardsStore.loading" class="flex justify-center py-6 sm:py-8">
      <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Lista de tarjetas -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      <div
        v-for="card in cardsStore.cards"
        :key="card.id"
        class="card hover:shadow-md transition-shadow duration-200 p-2.5 sm:p-4"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
              <CreditCard class="h-3.5 w-3.5 sm:h-5 sm:w-5 text-primary-600 flex-shrink-0" />
              <h3 class="text-sm sm:text-lg font-semibold text-gray-900 truncate">{{ card.name }}</h3>
            </div>
            
            <!-- Información compacta para móvil -->
            <div class="space-y-0.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <div class="flex justify-between items-center">
                <span class="text-gray-500 text-xs">Tipo:</span>
                <span class="font-medium text-gray-700 text-xs">{{ card.type }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500 text-xs">Banco:</span>
                <span class="font-medium text-gray-700 truncate ml-1 text-xs">{{ card.bank || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Menú de acciones -->
          <div class="relative flex-shrink-0 ml-1 sm:ml-2">
            <button
              @click="toggleCardMenu(card.id)"
              class="p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded"
            >
              <MoreVertical class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            <!-- Menú desplegable -->
            <div
              v-if="activeCardMenu === card.id"
              class="absolute right-0 mt-1 sm:mt-2 w-24 sm:w-32 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
            >
              <button
                @click="editCard(card)"
                class="block w-full text-left px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <Edit class="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                Editar
              </button>
              <button
                @click="deleteCard(card.id)"
                class="block w-full text-left px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-danger-700 hover:bg-danger-50 transition-colors duration-200"
              >
                <Trash2 class="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div
        v-if="cardsStore.cards.length === 0"
        class="col-span-full text-center py-8 sm:py-12"
      >
        <CreditCard class="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
        <h3 class="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-gray-900">No hay tarjetas</h3>
        <p class="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Comienza agregando tu primera tarjeta</p>
        <button
          @click="showModal = true"
          class="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 mt-3 sm:mt-4 mx-auto text-sm sm:text-base"
        >
          <Plus class="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Agregar Tarjeta</span>
        </button>
      </div>
    </div>

    <!-- Modal para agregar/editar tarjeta -->
    <CardModal
      v-if="showModal"
      :card="editingCard"
      @close="closeModal"
      @save="saveCard"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCardsStore } from '@/stores/cards'
import CardModal from '@/components/CardModal.vue'
import Swal from 'sweetalert2'
import {
  CreditCard,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-vue-next'

const cardsStore = useCardsStore()

const showModal = ref(false)
const editingCard = ref(null)
const activeCardMenu = ref(null)

onMounted(async () => {
  await cardsStore.loadCards()
})

const toggleCardMenu = (cardId) => {
  activeCardMenu.value = activeCardMenu.value === cardId ? null : cardId
}

const editCard = (card) => {
  editingCard.value = { ...card }
  showModal.value = true
  activeCardMenu.value = null
}

const deleteCard = async (cardId) => {
  if (confirm('¿Estás seguro de que quieres eliminar esta tarjeta?')) {
    await cardsStore.deleteCard(cardId)
    activeCardMenu.value = null
  }
}

const closeModal = () => {
  showModal.value = false
  editingCard.value = null
}

const saveCard = async (cardData) => {
  if (editingCard.value) {
    await cardsStore.updateCard(editingCard.value.id, cardData)
  } else {
    const result = await cardsStore.createCard(cardData)
    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: '¡Tarjeta creada exitosamente!',
        text: 'Tu tarjeta ha sido agregada correctamente y ya puedes comenzar a usarla.',
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#10b981',
        timer: 3000,
        timerProgressBar: true
      })
    }
  }
  closeModal()
}

// Cerrar menús al hacer clic fuera
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
      activeCardMenu.value = null
    }
  })
})
</script> 