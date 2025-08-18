<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Mis Cuentas</h1>
        <p class="text-sm sm:text-base text-gray-600">Gestiona las cuentas vinculadas a tu perfil</p>
      </div>
             <button @click="showAvailableCardsModal = true"
         class="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-sm sm:text-base">
         <Plus class="h-4 w-4 sm:h-5 sm:w-5" />
         <span>Vincular Cuenta</span>
       </button>
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
    <div v-if="userCardsStore.loading" class="flex justify-center py-6 sm:py-8">
      <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-600"></div>
    </div>

         <!-- Lista de cuentas vinculadas -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      <div
        v-for="userCard in userCardsStore.userCards"
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
              <div class="flex justify-between items-center">
                <span class="text-gray-500 text-xs">Vinculada:</span>
                <span class="font-medium text-gray-700 text-xs">{{ formatDate(userCard.created_at) }}</span>
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
        v-if="userCardsStore.userCards.length === 0"
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
     <div v-if="showAvailableCardsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
       <div class="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
         <!-- Header -->
         <div class="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
           <div>
                           <h3 class="text-xl font-semibold text-gray-900">Vincular Cuentas Disponibles</h3>
              <p class="text-sm text-gray-600 mt-1">Selecciona las cuentas que quieres vincular a tu perfil</p>
           </div>
                        <button
               @click="closeModal"
               class="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
             >
             <X class="h-6 w-6" />
           </button>
         </div>

                                   <!-- Lista de cuentas disponibles -->
         <div class="p-4 sm:p-6 bg-gray-50">
           <!-- Buscador -->
           <div class="mb-6 px-2">
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
                           <div class="flex items-center justify-between mt-2 px-1">
                <div class="flex items-center space-x-2">
                                     <p class="text-xs text-gray-500">
                     {{ filteredCards.length }} de {{ availableCardsStore.availableCards.length }} cuentas
                   </p>
                  <span class="text-xs text-gray-400">•</span>
                  <p class="text-xs text-gray-400">Búsqueda sin tildes</p>
                </div>
                <button
                  v-if="searchQuery.trim()"
                  @click="searchQuery = ''"
                  class="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Limpiar búsqueda
                </button>
              </div>
           </div>

           <div v-if="availableCardsStore.loading" class="flex justify-center py-12">
             <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
           </div>
           
           <div v-else-if="availableCardsStore.error" class="bg-red-50 border border-red-200 rounded-lg p-6 mx-2">
             <div class="flex">
               <AlertCircle class="h-6 w-6 text-red-400" />
               <div class="ml-3">
                 <p class="text-sm text-red-700">{{ availableCardsStore.error }}</p>
               </div>
             </div>
           </div>
           
           <!-- Vista de escritorio: Grid -->
           <div v-else class="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
                         <div
               v-for="availableCard in filteredCards"
               :key="availableCard.id"
               class="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white"
             >
               <div class="flex justify-between items-start mb-4">
                 <div class="flex items-center space-x-3">
                   <div class="p-2 bg-blue-50 rounded-lg">
                     <CreditCard class="h-5 w-5 text-blue-600" />
                   </div>
                   <div>
                     <h4 class="font-semibold text-gray-900 text-base">{{ availableCard.name }}</h4>
                     <p class="text-sm text-gray-500">{{ availableCard.bank }}</p>
                   </div>
                 </div>
                 <span class="px-3 py-1 text-xs font-medium rounded-full" 
                       :class="{
                         'bg-green-100 text-green-800': availableCard.type === 'Crédito',
                         'bg-blue-100 text-blue-800': availableCard.type === 'Débito',
                         'bg-gray-100 text-gray-800': availableCard.type === 'Ninguna'
                       }">
                   {{ availableCard.type }}
                 </span>
               </div>
              
                                            <button
                 v-if="!isCardLinked(availableCard.id)"
                 @click="linkCard(availableCard.id)"
                 :disabled="linkingCard === availableCard.id"
                 class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
               >
                 <div v-if="linkingCard === availableCard.id" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                                   <span v-else>Vincular Cuenta</span>
               </button>
              
                             <div v-else class="w-full px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-center font-medium">
                 <div class="flex items-center justify-center space-x-2">
                   <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                   </svg>
                   <span>Ya vinculada</span>
                 </div>
                              </div>
             </div>
           </div>
           
           <!-- Vista móvil: Lista -->
           <div v-if="!availableCardsStore.loading && !availableCardsStore.error" class="md:hidden space-y-3 p-2">
             <div
               v-for="availableCard in filteredCards"
               :key="availableCard.id"
               class="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all duration-200"
             >
               <div class="flex items-center justify-between">
                 <div class="flex items-center space-x-3 flex-1 min-w-0">
                   <div class="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                     <CreditCard class="h-5 w-5 text-blue-600" />
                   </div>
                   <div class="min-w-0 flex-1">
                     <h4 class="font-semibold text-gray-900 text-sm truncate">{{ availableCard.name }}</h4>
                     <p class="text-xs text-gray-500 truncate">{{ availableCard.bank }}</p>
                     <span class="inline-block px-2 py-1 text-xs font-medium rounded-full mt-1" 
                           :class="{
                             'bg-green-100 text-green-800': availableCard.type === 'Crédito',
                             'bg-blue-100 text-blue-800': availableCard.type === 'Débito',
                             'bg-gray-100 text-gray-800': availableCard.type === 'Ninguna'
                           }">
                       {{ availableCard.type }}
                     </span>
                   </div>
                 </div>
                 
                 <div class="ml-3 flex-shrink-0">
                   <button
                     v-if="!isCardLinked(availableCard.id)"
                     @click="linkCard(availableCard.id)"
                     :disabled="linkingCard === availableCard.id"
                     class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium whitespace-nowrap"
                   >
                     <div v-if="linkingCard === availableCard.id" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                     <span v-else>Vincular</span>
                   </button>
                   
                   <div v-else class="px-4 py-2 bg-green-50 border border-green-200 text-green-800 rounded-lg text-center font-medium text-sm">
                     <div class="flex items-center space-x-1">
                       <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                       </svg>
                       <span>Vinculada</span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
           
                                               <!-- Estado vacío: Sin cuentas disponibles o sin resultados de búsqueda -->
            <div v-if="!availableCardsStore.loading && !availableCardsStore.error && filteredCards.length === 0" class="text-center py-12 mx-2">
              <div class="bg-white rounded-lg p-8 border border-gray-200">
                <CreditCard class="mx-auto h-16 w-16 text-gray-400" />
                <h3 class="mt-4 text-xl font-medium text-gray-900">
                  {{ availableCardsStore.availableCards.length === 0 
                    ? 'No hay cuentas disponibles' 
                    : 'No se encontraron cuentas' 
                  }}
                </h3>
                <p class="mt-2 text-gray-600">
                  {{ availableCardsStore.availableCards.length === 0 
                    ? 'Contacta al administrador para que agregue cuentas disponibles' 
                    : 'Intenta con otros términos de búsqueda' 
                  }}
                </p>
              </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
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

const userCardsStore = useUserCardsStore()
const availableCardsStore = useAvailableCardsStore()

const showAvailableCardsModal = ref(false)
const linkingCard = ref(null)
const searchQuery = ref('')

// Función para normalizar texto (remover acentos)
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (acentos, tildes, etc.)
}

// Computed property para filtrar cuentas por búsqueda
const filteredCards = computed(() => {
  if (!searchQuery.value.trim()) {
    return availableCardsStore.availableCards
  }
  
  const normalizedQuery = normalizeText(searchQuery.value.trim())
  return availableCardsStore.availableCards.filter(card => {
    const normalizedName = normalizeText(card.name)
    const normalizedBank = normalizeText(card.bank)
    
    return normalizedName.includes(normalizedQuery) || 
           normalizedBank.includes(normalizedQuery)
  })
})

onMounted(async () => {
  await Promise.all([
    userCardsStore.loadUserCards(),
    availableCardsStore.loadAvailableCards()
  ])
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
  return userCardsStore.userCards.some(uc => uc.available_card_id === availableCardId)
}

// Limpiar búsqueda cuando se cierre el modal
const closeModal = () => {
  showAvailableCardsModal.value = false
  searchQuery.value = ''
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
