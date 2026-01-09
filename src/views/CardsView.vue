<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Mis Cuentas</h1>
        <p class="text-sm sm:text-base text-gray-600">Gestiona las cuentas vinculadas a tu perfil</p>
      </div>
    </div>

    <!-- Error -->
    <div v-if="userCardsStore.error" class="bg-danger-50 border border-danger-200 rounded-md p-3 sm:p-4">
      <div class="flex">
        <AlertCircle class="h-4 w-4 sm:h-5 sm:w-5 text-danger-400" />
        <div class="ml-2 sm:ml-3">
          <p class="text-xs sm:text-sm text-danger-700">{{ userCardsStore.error }}</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <SkeletonGrid
      v-if="userCardsStore.loading"
      :count="6"
      columns="grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    />

    <!-- Lista de cuentas vinculadas -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      <div
        v-for="userCard in (userCardsStore.sortedCardsByBank || [])"
        :key="userCard.id"
        class="card hover:shadow-md transition-shadow duration-200 p-2.5 sm:p-4"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
              <CreditCard class="h-3.5 w-3.5 sm:h-5 sm:w-5 text-primary-600 flex-shrink-0" />
              <h3 class="text-sm sm:text-lg font-semibold text-gray-900 truncate">{{ userCard.available_card.name }}</h3>
            </div>
            
            <!-- Información compacta para móvil -->
            <div class="space-y-0.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <div class="flex justify-between items-center">
                <span class="text-gray-500 text-xs">Tipo:</span>
                <span class="font-medium text-gray-700 text-xs">{{ userCard.available_card.type }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500 text-xs">Banco:</span>
                <span class="font-medium text-gray-700 truncate ml-1 text-xs">{{ userCard.available_card.bank || '-' }}</span>
              </div>
              <div v-if="userCard.available_card.payment_day" class="flex justify-between items-center">
                <span class="text-gray-500 text-xs">Pago:</span>
                <span class="font-medium text-gray-700 text-xs">Día {{ userCard.available_card.payment_day }}</span>
              </div>
              <div v-if="userCard.available_card.credit_limit" class="flex justify-between items-center">
                <span class="text-gray-500 text-xs">Límite:</span>
                <span class="font-medium text-gray-700 text-xs">${{ formatNumber(userCard.available_card.credit_limit) }}</span>
              </div>
             
            </div>
          </div>

          <!-- Botón para desvincular -->
          <div class="flex-shrink-0 ml-1 sm:ml-2">
            <button
              @click="unlinkCard(userCard.id)"
              class="p-1.5 sm:p-2 text-danger-400 hover:text-danger-600 hover:bg-danger-50 transition-colors duration-200 rounded"
              title="Desvincular cuenta"
            >
              <Unlink class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div
        v-if="!userCardsStore.cards || userCardsStore.cards.length === 0"
        class="col-span-full text-center py-8 sm:py-12"
      >
        <CreditCard class="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
        <h3 class="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-gray-900">No tienes cuentas vinculadas</h3>
        <p class="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Vincula cuentas disponibles para comenzar a usarlas</p>
        <button
          @click="showAvailableCardsModal = true"
          class="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 mt-3 sm:mt-4 mx-auto text-sm sm:text-base"
        >
          <Plus class="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Vincular Cuenta</span>
        </button>
      </div>
    </div>

    <!-- Modal para vincular cuentas disponibles -->
    <div v-if="showAvailableCardsModal" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 px-4">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[75vh] overflow-y-auto">
        <!-- Header -->
        <div class="relative flex justify-between items-start p-6 border-b border-gray-200">
          <div class="flex-1 pr-8">
            <h3 class="text-lg font-semibold text-gray-900">Vincular Cuentas Disponibles</h3>
            <p class="text-sm text-gray-600 mt-1">Selecciona las cuentas que quieres vincular a tu perfil</p>
          </div>
          <button
            @click="closeModal"
            class="modal-close-button absolute top-6 right-6 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 flex-shrink-0"
            title="Cerrar modal"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Lista de cuentas disponibles -->
        <div class="p-6 space-y-4">
          <!-- Buscador y Filtros -->
          <div class="space-y-4">
            <!-- Buscador -->
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar por nombre o banco (ignora tildes)..."
                class="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>

            <!-- Filtro por banco -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Filtrar por banco:</label>
              <select
                v-model="selectedBank"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Todos los bancos</option>
                <option
                  v-for="bank in availableCardsStore.uniqueBanks"
                  :key="bank"
                  :value="bank"
                >
                  {{ bank }}
                </option>
              </select>
            </div>

            <!-- Información de filtros -->
            <div class="flex items-center justify-between px-1">
              <div class="flex items-center space-x-2">
                <p class="text-xs text-gray-500">
                  {{ filteredCards.length }} de {{ availableCardsStore.sortedAvailableCardsByBank.length }} cuentas
                </p>
                <span class="text-xs text-gray-400">•</span>
                <p class="text-xs text-gray-400">Búsqueda sin tildes</p>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  v-if="selectedBank"
                  @click="selectedBank = ''"
                  class="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Limpiar banco
                </button>
                <button
                  v-if="searchQuery.trim()"
                  @click="searchQuery = ''"
                  class="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Limpiar búsqueda
                </button>
              </div>
            </div>
          </div>

          <div v-if="availableCardsStore.loading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
          
          <div v-else-if="availableCardsStore.error" class="bg-red-50 border border-red-200 rounded-lg p-6">
            <div class="flex">
              <AlertCircle class="h-6 w-6 text-red-400" />
              <div class="ml-3">
                <p class="text-sm text-red-700">{{ availableCardsStore.error }}</p>
              </div>
            </div>
          </div>
          
          <!-- Vista de escritorio: Lista vertical -->
          <div v-else class="hidden lg:block space-y-3">
            <div
              v-for="availableCard in paginatedCardsDesktop"
              :key="availableCard.id"
              class="available-card-item border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white"
            >
              <div class="flex justify-between items-start">
                <div class="flex items-center space-x-3">
                  <div class="p-2 bg-blue-50 rounded-lg">
                    <CreditCard class="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900 text-sm">{{ availableCard.name }}</h4>
                    <p class="text-xs text-gray-500">{{ availableCard.bank }}</p>
                  </div>
                </div>
                <span class="type-badge px-2 py-1 text-xs font-medium rounded-full" 
                      :class="{
                        'bg-green-100 text-green-800': availableCard.type === 'Crédito',
                        'bg-blue-100 text-blue-800': availableCard.type === 'Débito',
                        'bg-purple-100 text-purple-800': availableCard.type === 'Transferencia',
                        'bg-gray-100 text-gray-800': availableCard.type === 'Ninguna'
                      }">
                  {{ availableCard.type }}
                </span>
              </div>
              
              <button
                v-if="!isCardLinked(availableCard.id)"
                @click="linkCard(availableCard.id)"
                :disabled="linkingCard === availableCard.id"
                class="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
              >
                <div v-if="linkingCard === availableCard.id" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                <span v-else>Vincular Cuenta</span>
              </button>
              
              <div v-else class="w-full px-3 py-2 bg-green-50 border border-green-200 text-green-800 rounded-lg text-center text-sm font-medium">
                <div class="flex items-center justify-center space-x-2">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Ya vinculada</span>
                </div>
              </div>
            </div>
            
            <!-- Paginación desktop -->
            <div v-if="totalPagesDesktop > 1" class="flex justify-center items-center gap-2 mt-6 py-4 border-t border-gray-200">
              <button
                @click="goToPreviousPageDesktop"
                :disabled="currentPageDesktop === 1"
                class="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
              >
                Anterior
              </button>
              
              <div class="flex items-center gap-1">
                <span
                  v-for="page in visiblePagesDesktop"
                  :key="page"
                  @click="goToPageDesktop(page)"
                  :class="[
                    'px-3 py-1 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200',
                    page === currentPageDesktop
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  ]"
                >
                  {{ page }}
                </span>
              </div>
              
              <button
                @click="goToNextPageDesktop"
                :disabled="currentPageDesktop === totalPagesDesktop"
                class="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
              >
                Siguiente
              </button>
            </div>
          </div>
          
          <!-- Vista móvil y tablet: Lista con paginación -->
          <div v-if="!availableCardsStore.loading && !availableCardsStore.error" class="lg:hidden">
            <!-- Lista de tarjetas -->
            <div class="space-y-3">
              <div
                v-for="availableCard in paginatedCards"
                :key="availableCard.id"
                class="available-card-item bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-200 hover:shadow-sm transition-all duration-200"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2.5 flex-1 min-w-0">
                    <div class="p-1.5 bg-blue-50 rounded-lg flex-shrink-0">
                      <CreditCard class="h-4 w-4 text-blue-600" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <h4 class="font-semibold text-gray-900 text-sm truncate">{{ availableCard.name }}</h4>
                      <p class="text-xs text-gray-500 truncate">{{ availableCard.bank || 'Sin banco' }}</p>
                      <span class="inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1" 
                            :class="{
                              'bg-green-100 text-green-700': availableCard.type === 'Crédito',
                              'bg-blue-100 text-blue-700': availableCard.type === 'Débito',
                              'bg-purple-100 text-purple-700': availableCard.type === 'Transferencia',
                              'bg-gray-100 text-gray-700': availableCard.type === 'Ninguna'
                            }">
                        {{ availableCard.type }}
                      </span>
                    </div>
                  </div>
                  
                  <div class="ml-2 flex-shrink-0">
                    <button
                      v-if="!isCardLinked(availableCard.id)"
                      @click="linkCard(availableCard.id)"
                      :disabled="linkingCard === availableCard.id"
                      class="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs font-medium whitespace-nowrap"
                    >
                      <div v-if="linkingCard === availableCard.id" class="animate-spin rounded-full h-3 w-3 border-b-2 border-white mx-auto"></div>
                      <span v-else>Vincular</span>
                    </button>
                    
                    <div v-else class="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center font-medium text-xs">
                      <div class="flex items-center space-x-1">
                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>Vinculada</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Paginación móvil -->
            <div v-if="totalPages > 1" class="flex items-center justify-between mt-4 pt-4 pb-4 border-t border-gray-200">
              <button
                @click="goToPreviousPage"
                :disabled="currentPage === 1"
                class="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                <span>Anterior</span>
              </button>
              
              <div class="flex items-center space-x-1">
                <span class="text-sm text-gray-600 font-medium">{{ currentPage }} de {{ totalPages }}</span>
              </div>
              
              <button
                @click="goToNextPage"
                :disabled="currentPage === totalPages"
                class="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <span>Siguiente</span>
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Estado vacío: Sin cuentas disponibles o sin resultados de búsqueda -->
          <div v-if="!availableCardsStore.loading && !availableCardsStore.error && filteredCards.length === 0" class="text-center py-8">
            <div class="bg-white rounded-lg p-6 border border-gray-200">
              <CreditCard class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-3 text-lg font-medium text-gray-900">
                {{ availableCardsStore.sortedAvailableCardsByBank.length === 0 
                  ? 'No hay cuentas disponibles' 
                  : 'No se encontraron cuentas' 
                }}
              </h3>
              <p class="mt-2 text-sm text-gray-600">
                {{ availableCardsStore.sortedAvailableCardsByBank.length === 0 
                  ? 'Contacta al administrador para que agregue cuentas disponibles' 
                  : 'Intenta con otros términos de búsqueda' 
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Botón flotante para vincular cuenta -->
    <button 
      @click="showAvailableCardsModal = true"
      :class="[
        'fixed bottom-24 lg:bottom-6 right-6 z-50 flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 transform hover:scale-105 active:scale-95',
        showAvailableCardsModal ? 'hidden' : ''
      ]"
      title="Vincular nueva cuenta"
    >
      <Plus class="h-6 w-6" />
      <span class="hidden lg:inline">Vincular Cuenta</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useUserCardsStore } from '@/stores/userCards'
import { useAvailableCardsStore } from '@/stores/availableCards'
import Swal from 'sweetalert2'
import {
  CreditCard,
  Plus,
  Unlink,
  X,
  AlertCircle
} from 'lucide-vue-next'
import SkeletonGrid from '@/components/SkeletonGrid.vue'

const userCardsStore = useUserCardsStore()
const availableCardsStore = useAvailableCardsStore()

const showAvailableCardsModal = ref(false)
const linkingCard = ref(null)
const searchQuery = ref('')
const selectedBank = ref('')
const currentPage = ref(1)
const itemsPerPage = 5

// Paginación para desktop
const currentPageDesktop = ref(1)
const itemsPerPageDesktop = 8

// Función para normalizar texto (remover acentos)
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (acentos, tildes, etc.)
}

// Computed property para filtrar cuentas por búsqueda y banco
const filteredCards = computed(() => {
  let filtered = availableCardsStore.sortedAvailableCardsByBank

  // Filtrar por banco seleccionado
  if (selectedBank.value) {
    filtered = filtered.filter(card => {
      const cardBank = card.bank || 'Sin banco'
      return cardBank === selectedBank.value
    })
  }

  // Filtrar por búsqueda de texto
  if (searchQuery.value.trim()) {
    const normalizedQuery = normalizeText(searchQuery.value.trim())
    filtered = filtered.filter(card => {
      const normalizedName = normalizeText(card.name)
      const normalizedBank = normalizeText(card.bank)
      
      return normalizedName.includes(normalizedQuery) || 
             normalizedBank.includes(normalizedQuery)
    })
  }

  return filtered
})

// Computed property para paginación móvil
const paginatedCards = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  return filteredCards.value.slice(startIndex, endIndex)
})

// Computed property para total de páginas móvil
const totalPages = computed(() => {
  return Math.ceil(filteredCards.value.length / itemsPerPage)
})

// Computed property para paginación desktop
const paginatedCardsDesktop = computed(() => {
  const startIndex = (currentPageDesktop.value - 1) * itemsPerPageDesktop
  const endIndex = startIndex + itemsPerPageDesktop
  return filteredCards.value.slice(startIndex, endIndex)
})

// Computed property para total de páginas desktop
const totalPagesDesktop = computed(() => {
  return Math.ceil(filteredCards.value.length / itemsPerPageDesktop)
})

// Páginas visibles para desktop
const visiblePagesDesktop = computed(() => {
  const pages = []
  const start = Math.max(1, currentPageDesktop.value - 2)
  const end = Math.min(totalPagesDesktop.value, currentPageDesktop.value + 2)

  if (start > 1) {
    pages.push(1)
    if (start > 2) {
      pages.push('...')
    }
  }
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  if (end < totalPagesDesktop.value) {
    if (end < totalPagesDesktop.value - 1) {
      pages.push('...')
    }
    pages.push(totalPagesDesktop.value)
  }
  return pages
})

// Función para cambiar de página
const goToPage = (page) => {
  currentPage.value = page
}

// Función para ir a la página anterior
const goToPreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// Función para ir a la página siguiente
const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Funciones para paginación desktop
const goToPageDesktop = (page) => {
  if (page >= 1 && page <= totalPagesDesktop.value) {
    currentPageDesktop.value = page
  }
}

const goToPreviousPageDesktop = () => {
  if (currentPageDesktop.value > 1) {
    currentPageDesktop.value--
  }
}

const goToNextPageDesktop = () => {
  if (currentPageDesktop.value < totalPagesDesktop.value) {
    currentPageDesktop.value++
  }
}

onMounted(async () => {
  await Promise.all([
    userCardsStore.loadUserCards(),
    availableCardsStore.loadAvailableCards()
  ])
})

// Watcher para resetear la página cuando cambie la búsqueda o el filtro de banco
watch([searchQuery, selectedBank], () => {
  currentPage.value = 1
  currentPageDesktop.value = 1
})

const linkCard = async (availableCardId) => {
  linkingCard.value = availableCardId
  
  try {
    const result = await userCardsStore.linkCardToUser(availableCardId)
    
    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: '¡Cuenta vinculada exitosamente!',
        text: 'Ya puedes usar esta cuenta para registrar gastos.',
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#10b981',
        timer: 3000,
        timerProgressBar: true
      })
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error al vincular cuenta',
        text: result.error || 'No se pudo vincular la cuenta',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ef4444'
      })
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
              title: 'Error al vincular cuenta',
        text: error.message || 'Ocurrió un error inesperado',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#ef4444'
    })
  } finally {
    linkingCard.value = null
  }
}

const unlinkCard = async (userCardId) => {
  const result = await Swal.fire({
    title: '¿Desvincular cuenta?',
    text: 'Esta acción no se puede deshacer. ¿Estás seguro?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, desvincular',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      await userCardsStore.unlinkCardFromUser(userCardId)
      
      Swal.fire({
        icon: 'success',
        title: 'Cuenta desvinculada',
        text: 'La cuenta ha sido desvinculada de tu perfil.',
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#10b981',
        timer: 2000,
        timerProgressBar: true
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al desvincular',
        text: error.message || 'No se pudo desvincular la cuenta',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ef4444'
      })
    }
  }
}

const isCardLinked = (availableCardId) => {
      return userCardsStore.cards && userCardsStore.cards.some(uc => uc.available_card_id === availableCardId)
}

// Limpiar búsqueda cuando se cierre el modal
const closeModal = () => {
  showAvailableCardsModal.value = false
  searchQuery.value = ''
  selectedBank.value = ''
  currentPage.value = 1 // Resetear a la primera página
  currentPageDesktop.value = 1 // Resetear también la página de desktop
}

// Función para formatear números
const formatNumber = (number) => {
  return new Intl.NumberFormat('es-AR').format(number)
}

// Función para formatear fechas
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}


</script>

<style scoped>
/* Estilos para el botón flotante */
@media (max-width: 1024px) {
  .fixed.bottom-24.right-6 {
    bottom: 6rem; /* Evitar que se superponga con la navegación móvil/tablet */
    right: 1rem;
  }
}

/* Animación de pulso para llamar la atención */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
}

/* Aplicar animación solo en desktop */
@media (min-width: 1025px) {
  .fixed.bottom-6.right-6:hover {
    animation: pulse-glow 2s infinite;
  }
}

/* Estilos personalizados para el modal */
:deep(.modal-content) {
  border-radius: 12px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12) !important;
}

/* Estilos para el botón de cerrar del modal */
.modal-close-button {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10;
  background: white;
  border-radius: 50%;
  padding: 0.5rem;
  transition: all 0.2s ease;
}

.modal-close-button:hover {
  background: #f3f4f6;
  transform: scale(1.1);
}

/* Mejoras para las tarjetas del modal */
.available-card-item {
  transition: all 0.2s ease;
}

.available-card-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Estilos para los badges de tipo */
.type-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

/* Estilos para los botones de acción */
.action-button {
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  font-weight: 600;
  font-size: 0.875rem;
}

.action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-button:active {
  transform: translateY(0);
}
</style>
