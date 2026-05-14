<template>
  <div class="space-y-6 sm:space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-gray-100">Mis Cuentas</h1>
        <p class="text-sm sm:text-base text-slate-500 dark:text-gray-400 mt-1">Gestiona las cuentas vinculadas a tu perfil</p>
      </div>
    </div>

    <!-- Error -->
    <div v-if="userCardsStore.error" class="bg-danger-50 border border-danger-200 rounded-2xl p-4">
      <div class="flex items-start gap-3">
        <AlertCircle class="h-5 w-5 text-danger-500 flex-shrink-0 mt-0.5" />
        <p class="text-sm text-danger-700">{{ userCardsStore.error }}</p>
      </div>
    </div>

    <!-- Loading -->
    <SkeletonGrid v-if="isLoading" :count="6" />

    <!-- Lista de cuentas vinculadas -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
      <div
        v-for="userCard in (userCardsStore.sortedCardsByBank || [])"
        :key="userCard.id"
        class="group bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-slate-100 dark:border-gray-700 hover:shadow-soft-lg hover:border-slate-200 dark:hover:border-gray-600 dark:border-gray-700 transition-all duration-300 overflow-hidden"
      >
        <!-- Accent bar por tipo -->
        <div
          class="h-1.5 w-full"
          :class="getCardAccentClass(userCard.available_card?.type)"
        ></div>

        <div class="p-4 sm:p-5">
          <div class="flex justify-between items-start">
            <div class="flex-1 min-w-0">
              <!-- Icono + nombre -->
              <div class="flex items-center gap-2.5 mb-3">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  :class="getCardIconBgClass(userCard.available_card?.type)"
                >
                  <CreditCard class="h-5 w-5" :class="getCardIconClass(userCard.available_card?.type)" />
                </div>
                <div class="min-w-0">
                  <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-gray-100 truncate">
                    {{ userCard.available_card.name }}
                  </h3>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold mt-0.5"
                    :class="getCardTypeBadgeClass(userCard.available_card?.type)"
                  >
                    {{ userCard.available_card.type }}
                  </span>
                </div>
              </div>

              <!-- Info de la cuenta -->
              <div class="space-y-1.5 text-sm">
                <div class="flex justify-between items-center">
                  <span class="text-slate-400 dark:text-gray-500 text-xs">Banco</span>
                  <span class="font-medium text-slate-700 dark:text-gray-300 text-xs truncate ml-2">
                    {{ userCard.available_card.bank || '-' }}
                  </span>
                </div>
                <div v-if="userCard.available_card.payment_day" class="flex justify-between items-center">
                  <span class="text-slate-400 dark:text-gray-500 text-xs">Pago</span>
                  <span class="font-medium text-slate-700 dark:text-gray-300 text-xs">
                    Día {{ userCard.available_card.payment_day }}
                  </span>
                </div>
                <div v-if="userCard.available_card.credit_limit" class="flex justify-between items-center">
                  <span class="text-slate-400 dark:text-gray-500 text-xs">Límite</span>
                  <span class="font-medium text-slate-700 dark:text-gray-300 text-xs">
                    ${{ formatNumber(userCard.available_card.credit_limit) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Botón para desvincular -->
            <button
              @click="unlinkCard(userCard.id)"
              class="flex-shrink-0 ml-2 p-2 text-slate-400 dark:text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-all duration-200"
              title="Desvincular cuenta"
            >
              <Unlink class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="!userCardsStore.cards || userCardsStore.cards.length === 0"
        class="col-span-full"
      >
        <EmptyState
          icon="CreditCard"
          title="No tienes cuentas vinculadas"
          description="Vincula cuentas disponibles para comenzar a usarlas"
          actionLabel="Vincular Cuenta"
          @action="showAvailableCardsModal = true"
        />
      </div>
    </div>

    <!-- Modal para vincular cuentas disponibles -->
    <div
      v-if="showAvailableCardsModal"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      @click.self="closeModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg max-w-2xl w-full max-h-[80vh] overflow-hidden animate-fade-in">
        <!-- Header -->
        <div class="relative flex justify-between items-start p-5 sm:p-6 border-b border-slate-100 dark:border-gray-700">
          <div class="flex-1 pr-10">
            <h3 class="text-lg font-bold text-slate-900 dark:text-gray-100">Vincular Cuentas Disponibles</h3>
            <p class="text-sm text-slate-500 dark:text-gray-400 mt-1">Selecciona las cuentas que quieres vincular a tu perfil</p>
          </div>
          <button
            @click="closeModal"
            class="absolute top-5 right-5 p-2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-xl transition-all duration-200"
            title="Cerrar modal"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Contenido del modal -->
        <div class="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(80vh-100px)]">
          <!-- Buscador y Filtros -->
          <div class="space-y-3">
            <!-- Buscador -->
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar por nombre o banco..."
                class="input-field pl-10"
              />
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search class="h-4 w-4 text-slate-400 dark:text-gray-500" />
              </div>
            </div>

            <!-- Filtro por banco -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Filtrar por banco
              </label>
              <select
                v-model="selectedBank"
                class="input-field text-sm"
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

            <!-- Info de filtros -->
            <div class="flex items-center justify-between">
              <p class="text-xs text-slate-500 dark:text-gray-400">
                {{ filteredCards.length }} de {{ availableCardsStore.sortedAvailableCardsByBank.length }} cuentas
              </p>
              <div class="flex items-center gap-2">
                <button
                  v-if="selectedBank"
                  @click="selectedBank = ''"
                  class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Limpiar banco
                </button>
                <button
                  v-if="searchQuery.trim()"
                  @click="searchQuery = ''"
                  class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Limpiar búsqueda
                </button>
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="availableCardsStore.loading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>

          <!-- Error -->
          <div v-else-if="availableCardsStore.error" class="bg-danger-50 border border-danger-200 rounded-2xl p-5">
            <div class="flex items-start gap-3">
              <AlertCircle class="h-5 w-5 text-danger-500 flex-shrink-0 mt-0.5" />
              <p class="text-sm text-danger-700">{{ availableCardsStore.error }}</p>
            </div>
          </div>

          <!-- Vista de escritorio: Lista vertical -->
          <div v-else class="hidden lg:block space-y-3">
            <div
              v-for="availableCard in paginatedCardsDesktop"
              :key="availableCard.id"
              class="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-4 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-soft transition-all duration-300"
            >
              <div class="flex justify-between items-center mb-3">
                <div class="flex items-center gap-3">
                  <div
                    class="p-2 rounded-xl"
                    :class="getCardIconBgClass(availableCard.type)"
                  >
                    <CreditCard class="h-5 w-5" :class="getCardIconClass(availableCard.type)" />
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900 dark:text-gray-100 text-sm">{{ availableCard.name }}</h4>
                    <p class="text-xs text-slate-500 dark:text-gray-400">{{ availableCard.bank }}</p>
                  </div>
                </div>
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                  :class="getCardTypeBadgeClass(availableCard.type)"
                >
                  {{ availableCard.type }}
                </span>
              </div>

              <button
                v-if="!isCardLinked(availableCard.id)"
                @click="linkCard(availableCard.id)"
                :disabled="linkingCard === availableCard.id"
                class="btn-primary w-full text-sm py-2"
              >
                <div v-if="linkingCard === availableCard.id" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                <span v-else>Vincular Cuenta</span>
              </button>

              <div
                v-else
                class="w-full px-3 py-2 bg-success-50 border border-success-200 text-success-700 rounded-xl text-center text-sm font-semibold"
              >
                <div class="flex items-center justify-center gap-2">
                  <CheckCircle class="h-4 w-4" />
                  <span>Ya vinculada</span>
                </div>
              </div>
            </div>

            <!-- Paginación desktop -->
            <div v-if="totalPagesDesktop > 1" class="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-gray-700">
              <button
                @click="goToPreviousPageDesktop"
                :disabled="currentPageDesktop === 1"
                class="btn-ghost text-sm py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ChevronLeft class="h-4 w-4" />
                Anterior
              </button>

              <div class="flex items-center gap-1">
                <span
                  v-for="page in visiblePagesDesktop"
                  :key="page"
                  @click="typeof page === 'number' ? goToPageDesktop(page) : null"
                  :class="[
                    'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200',
                    page === currentPageDesktop
                      ? 'bg-primary-600 text-white shadow-sm'
                      : typeof page === 'number'
                        ? 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 dark:bg-gray-700 cursor-pointer'
                        : 'text-slate-400 dark:text-gray-500 cursor-default'
                  ]"
                >
                  {{ page }}
                </span>
              </div>

              <button
                @click="goToNextPageDesktop"
                :disabled="currentPageDesktop === totalPagesDesktop"
                class="btn-ghost text-sm py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                Siguiente
                <ChevronRight class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Vista móvil y tablet -->
          <div v-if="!availableCardsStore.loading && !availableCardsStore.error" class="lg:hidden">
            <div class="space-y-3">
              <div
                v-for="availableCard in paginatedCards"
                :key="availableCard.id"
                class="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-3.5 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-soft transition-all duration-300"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5 flex-1 min-w-0">
                    <div
                      class="p-1.5 rounded-xl flex-shrink-0"
                      :class="getCardIconBgClass(availableCard.type)"
                    >
                      <CreditCard class="h-4 w-4" :class="getCardIconClass(availableCard.type)" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <h4 class="font-bold text-slate-900 dark:text-gray-100 text-sm truncate">{{ availableCard.name }}</h4>
                      <p class="text-xs text-slate-500 dark:text-gray-400 truncate">{{ availableCard.bank || 'Sin banco' }}</p>
                      <span
                        class="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md mt-1"
                        :class="getCardTypeBadgeClass(availableCard.type)"
                      >
                        {{ availableCard.type }}
                      </span>
                    </div>
                  </div>

                  <div class="ml-2 flex-shrink-0">
                    <button
                      v-if="!isCardLinked(availableCard.id)"
                      @click="linkCard(availableCard.id)"
                      :disabled="linkingCard === availableCard.id"
                      class="btn-primary text-xs py-1.5 px-3"
                    >
                      <div v-if="linkingCard === availableCard.id" class="animate-spin rounded-full h-3 w-3 border-b-2 border-white mx-auto"></div>
                      <span v-else>Vincular</span>
                    </button>

                    <div
                      v-else
                      class="px-3 py-1.5 bg-success-50 border border-success-200 text-success-700 rounded-xl text-center font-semibold text-xs"
                    >
                      <div class="flex items-center gap-1">
                        <CheckCircle class="h-3 w-3" />
                        <span>Vinculada</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Paginación móvil -->
            <div v-if="totalPages > 1" class="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-gray-700">
              <button
                @click="goToPreviousPage"
                :disabled="currentPage === 1"
                class="flex items-center gap-1 text-sm text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-100 dark:text-gray-100 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                <ChevronLeft class="h-4 w-4" />
                <span>Anterior</span>
              </button>

              <span class="text-sm text-slate-500 dark:text-gray-400 font-semibold">
                {{ currentPage }} de {{ totalPages }}
              </span>

              <button
                @click="goToNextPage"
                :disabled="currentPage === totalPages"
                class="flex items-center gap-1 text-sm text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-100 dark:text-gray-100 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                <span>Siguiente</span>
                <ChevronRight class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Sin resultados -->
          <div
            v-if="!availableCardsStore.loading && !availableCardsStore.error && filteredCards.length === 0"
            class="text-center py-10"
          >
            <div class="w-14 h-14 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
              <CreditCard class="h-7 w-7 text-slate-400 dark:text-gray-500" />
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-gray-100">
              {{ availableCardsStore.sortedAvailableCardsByBank.length === 0
                ? 'No hay cuentas disponibles'
                : 'No se encontraron cuentas'
              }}
            </h3>
            <p class="mt-1.5 text-sm text-slate-500 dark:text-gray-400">
              {{ availableCardsStore.sortedAvailableCardsByBank.length === 0
                ? 'Contacta al administrador para que agregue cuentas disponibles'
                : 'Intenta con otros términos de búsqueda'
              }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Botón flotante para vincular cuenta -->
    <button
      @click="showAvailableCardsModal = true"
      :class="[
        'fixed bottom-24 lg:bottom-6 right-6 z-50 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg hover:shadow-glow transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-400/30 transform hover:scale-105 active:scale-95',
        showAvailableCardsModal ? 'hidden' : ''
      ]"
      title="Vincular nueva cuenta"
    >
      <Plus class="h-5 w-5" />
      <span class="hidden lg:inline">Vincular Cuenta</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useUserCardsStore } from '@/stores/userCards'
import { useAvailableCardsStore } from '@/stores/availableCards'
import Swal from 'sweetalert2'
import SkeletonGrid from '@/components/SkeletonGrid.vue'
import EmptyState from '@/components/EmptyState.vue'
import {
  CreditCard,
  Plus,
  Unlink,
  X,
  AlertCircle,
  Search,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'

const userCardsStore = useUserCardsStore()
const availableCardsStore = useAvailableCardsStore()

const showAvailableCardsModal = ref(false)
const linkingCard = ref(null)
const searchQuery = ref('')
const selectedBank = ref('')
const currentPage = ref(1)
const isLoading = ref(true)
const itemsPerPage = 5

const currentPageDesktop = ref(1)
const itemsPerPageDesktop = 8

const getCardAccentClass = (type) => {
  switch (type) {
    case 'Crédito': return 'bg-gradient-to-r from-primary-400 to-primary-600'
    case 'Débito': return 'bg-gradient-to-r from-success-400 to-success-600'
    case 'Transferencia': return 'bg-gradient-to-r from-violet-400 to-violet-600'
    default: return 'bg-gradient-to-r from-slate-300 to-slate-400'
  }
}

const getCardIconBgClass = (type) => {
  switch (type) {
    case 'Crédito': return 'bg-primary-50'
    case 'Débito': return 'bg-success-50'
    case 'Transferencia': return 'bg-violet-50'
    default: return 'bg-slate-50'
  }
}

const getCardIconClass = (type) => {
  switch (type) {
    case 'Crédito': return 'text-primary-600'
    case 'Débito': return 'text-success-600'
    case 'Transferencia': return 'text-violet-600'
    default: return 'text-slate-500 dark:text-gray-400'
  }
}

const getCardTypeBadgeClass = (type) => {
  switch (type) {
    case 'Crédito': return 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200'
    case 'Débito': return 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-200'
    case 'Transferencia': return 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200'
    case 'Ninguna': return 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 ring-1 ring-inset ring-slate-200'
    default: return 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 ring-1 ring-inset ring-slate-200'
  }
}

const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const filteredCards = computed(() => {
  let filtered = availableCardsStore.sortedAvailableCardsByBank

  if (selectedBank.value) {
    filtered = filtered.filter(card => {
      const cardBank = card.bank || 'Sin banco'
      return cardBank === selectedBank.value
    })
  }

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

const paginatedCards = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  return filteredCards.value.slice(startIndex, endIndex)
})

const totalPages = computed(() => {
  return Math.ceil(filteredCards.value.length / itemsPerPage)
})

const paginatedCardsDesktop = computed(() => {
  const startIndex = (currentPageDesktop.value - 1) * itemsPerPageDesktop
  const endIndex = startIndex + itemsPerPageDesktop
  return filteredCards.value.slice(startIndex, endIndex)
})

const totalPagesDesktop = computed(() => {
  return Math.ceil(filteredCards.value.length / itemsPerPageDesktop)
})

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

const goToPage = (page) => {
  currentPage.value = page
}

const goToPreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

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

let _mounted = true
onMounted(async () => {
  isLoading.value = true
  const safetyTimer = setTimeout(() => {
    if (_mounted) isLoading.value = false
  }, 12000)
  try {
    await Promise.all([
      userCardsStore.loadUserCards(),
      availableCardsStore.loadAvailableCards()
    ])
  } catch {
    // Error ya manejado por los stores
  } finally {
    clearTimeout(safetyTimer)
    if (_mounted) isLoading.value = false
  }
})

onUnmounted(() => {
  _mounted = false
})

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

const closeModal = () => {
  showAvailableCardsModal.value = false
  searchQuery.value = ''
  selectedBank.value = ''
  currentPage.value = 1
  currentPageDesktop.value = 1
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
</script>

<style scoped>
@media (max-width: 1024px) {
  .fixed.bottom-24.right-6 {
    bottom: 6rem;
    right: 1rem;
  }
}
</style>
