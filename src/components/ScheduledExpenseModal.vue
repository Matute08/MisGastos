<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @wheel.prevent @touchmove.prevent @scroll.prevent>
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" @wheel.stop @touchmove.stop @scroll.stop>
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ scheduledExpense ? 'Editar Gasto Programado' : 'Nuevo Gasto Programado' }}
        </h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <input
            id="description"
            v-model="form.description"
            type="text"
            required
            class="input-field mt-1"
            placeholder="Ej: Gasto Compartido"
          />
        </div>

        <div>
          <label for="amount" class="block text-sm font-medium text-gray-700">
            Monto
          </label>
          <input
            id="amount"
            v-model="form.amount"
            type="text"
            inputmode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            required
            class="input-field mt-1"
            placeholder="0.00"
            @input="onAmountInput"
          />
        </div>

        <div>
          <label for="card_id" class="block text-sm font-medium text-gray-700">
            Tarjeta
          </label>
          <select
            id="card_id"
            v-model="form.card_id"
            required
            class="input-field mt-1"
          >
            <option value="">Seleccionar tarjeta</option>
            <option
              v-for="card in userCardsStore.cards"
              :key="card.id"
              :value="card.available_card_id"
            >
              {{ card.available_card.name }} ({{ card.available_card.type }})
            </option>
          </select>
        </div>

        <div>
          <label for="category_id" class="block text-sm font-medium text-gray-700">
            Categoría
          </label>
          <select
            id="category_id"
            v-model="form.category_id"
            required
            class="input-field mt-1"
            @change="form.subcategory_id = ''"
          >
            <option value="">Seleccionar categoría</option>
            <option
              v-for="category in categoriesStore.categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>

        <div v-if="form.category_id">
          <label for="subcategory_id" class="block text-sm font-medium text-gray-700">
            Subcategoría
          </label>
          <select
            id="subcategory_id"
            v-model="form.subcategory_id"
            class="input-field mt-1"
          >
            <option value="">Seleccionar subcategoría (opcional)</option>
            <option
              v-for="subcategory in availableSubcategories"
              :key="subcategory.id"
              :value="subcategory.id"
            >
              {{ subcategory.name }}
            </option>
          </select>
        </div>

        <div v-if="scheduledExpense">
          <label for="payment_status_id" class="block text-sm font-medium text-gray-700">
            Estado de pago
          </label>
          <select
            id="payment_status_id"
            v-model="form.payment_status_id"
            class="input-field mt-1"
          >
            <option
              v-for="status in expensesStore.paymentStatuses"
              :key="status.id"
              :value="status.id"
            >
              {{ status.label }}
            </option>
          </select>
          <p class="mt-1 text-xs text-gray-500">
            Este estado se aplicará a los gastos generados a partir de ahora
          </p>
        </div>

        <div>
          <label for="scheduled_start_month" class="block text-sm font-medium text-gray-700">
            Mes de inicio
          </label>
          <input
            id="scheduled_start_month"
            v-model="form.scheduled_start_month"
            type="month"
            required
            class="input-field mt-1"
          />
        </div>

        <div class="space-y-3">
          <label class="block text-sm font-medium text-gray-700">
            Duración del gasto programado
          </label>
          
          <div class="flex items-center space-x-4">
            <label class="flex items-center">
              <input
                type="radio"
                v-model="durationType"
                value="limited"
                class="mr-2"
              />
              <span class="text-sm text-gray-700">Por un número específico de meses</span>
            </label>
          </div>

          <div v-if="durationType === 'limited'" class="ml-6">
            <label for="scheduled_months" class="block text-sm font-medium text-gray-700">
              Número de meses
            </label>
            <input
              id="scheduled_months"
              v-model.number="form.scheduled_months"
              type="number"
              min="1"
              max="60"
              class="input-field mt-1"
              placeholder="Ej: 12"
            />
          </div>

          <div class="flex items-center space-x-4">
            <label class="flex items-center">
              <input
                type="radio"
                v-model="durationType"
                value="unlimited"
                class="mr-2"
              />
              <span class="text-sm text-gray-700">Indefinido (hasta que lo canceles)</span>
            </label>
          </div>
        </div>


        <!-- Información adicional -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">
                ¿Cómo funcionan los gastos programados?
              </h3>
              <div class="mt-2 text-sm text-blue-700">
                <ul class="list-disc list-inside space-y-1">
                  <li>Se creará un gasto automáticamente cada mes</li>
                  <li>Puedes cancelar el gasto programado en cualquier momento</li>
                  <li>Los gastos pasados no se eliminan al cancelar</li>
                  <li>Perfecto para servicios como Netflix, Spotify, etc.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary inline-flex items-center justify-center min-w-[180px]"
          >
            <span v-if="loading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </span>
            <span v-else>
              {{ scheduledExpense ? 'Actualizar' : 'Crear Gasto Programado' }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { X } from 'lucide-vue-next'
import { useExpensesStore } from '@/stores/expenses'
import { useUserCardsStore } from '@/stores/userCards'
import { useCategoriesStore } from '@/stores/categories'
import { useSubcategoriesStore } from '@/stores/subcategories'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

const props = defineProps({
  scheduledExpense: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const expensesStore = useExpensesStore()
const userCardsStore = useUserCardsStore()
const categoriesStore = useCategoriesStore()
const subcategoriesStore = useSubcategoriesStore()

const sanitizeAmount = (rawValue) => {
  const value = String(rawValue ?? '')
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '')

  const [intPart, ...rest] = value.split('.')
  const decimals = rest.join('')
  if (!rest.length) return intPart
  const safeInt = intPart === '' ? '0' : intPart
  return `${safeInt}.${decimals.slice(0, 2)}`
}

const onAmountInput = (event) => {
  const input = event?.target
  if (!input) return
  const next = sanitizeAmount(input.value)
  if (next !== input.value) input.value = next
  form.value.amount = next
}

const loading = ref(false)
const durationType = ref('limited')

const form = ref({
  description: '',
  amount: '',
  card_id: '',
  category_id: '',
  subcategory_id: '',
  scheduled_start_month: '',
  scheduled_months: 12,
  payment_status_id: 1
})

// Computed para subcategorías disponibles
const availableSubcategories = computed(() => {
  if (!form.value.category_id) return []
  return subcategoriesStore.subcategories.filter(
    sub => sub.category_id === form.value.category_id
  )
})

// Watcher para limpiar subcategoría cuando cambia la categoría
watch(() => form.value.category_id, () => {
  form.value.subcategory_id = ''
})

// Watcher para manejar el tipo de duración
watch(durationType, (newType) => {
  if (newType === 'unlimited') {
    form.value.scheduled_months = null
  } else if (newType === 'limited' && !form.value.scheduled_months) {
    form.value.scheduled_months = 12
  }
})

// Función para cargar datos del gasto programado
const loadScheduledExpenseData = async () => {
  if (!props.scheduledExpense) return
  
  // Asegurar que las tarjetas estén cargadas
  if (!userCardsStore.cards || userCardsStore.cards.length === 0) {
    await userCardsStore.loadUserCards()
  }
  
  // Esperar múltiples ticks para asegurar que todo esté cargado
  await nextTick()
  await nextTick()
  
  // Buscar la tarjeta del usuario que corresponde al card_id del gasto programado
  let selectedCardId = ''
  if (props.scheduledExpense.card_id) {
    // Intentar encontrar la tarjeta
    const userCard = userCardsStore.cards.find(card => 
      card.available_card_id === props.scheduledExpense.card_id
    )
    if (userCard) {
      selectedCardId = userCard.available_card_id
    } else {
      // Si no se encuentra, usar el card_id directamente
      selectedCardId = props.scheduledExpense.card_id
    }
  }
  
  // Formatear el mes de inicio (puede venir como YYYY-MM-DD o YYYY-MM)
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  let startMonth = props.scheduledExpense.scheduled_start_month || currentMonth
  if (startMonth && startMonth.length > 7) {
    startMonth = startMonth.substring(0, 7) // Extraer solo YYYY-MM
  }
  
  // Obtener el estado de pago
  const paymentStatusId = props.scheduledExpense.payment_status?.id || 
                          props.scheduledExpense.payment_status_id || 
                          1
  
  // Actualizar el formulario
  form.value.description = props.scheduledExpense.description || ''
  form.value.amount = String(props.scheduledExpense.amount || '')
  form.value.category_id = props.scheduledExpense.category_id || ''
  form.value.subcategory_id = props.scheduledExpense.subcategory_id || ''
  form.value.scheduled_start_month = startMonth
  form.value.scheduled_months = props.scheduledExpense.scheduled_months || 12
  form.value.payment_status_id = paymentStatusId
  
  // Asignar card_id después de asegurar que las tarjetas estén disponibles
  // Usar setTimeout para dar tiempo a que el select se renderice
  setTimeout(() => {
    form.value.card_id = selectedCardId
  }, 100)

  // Determinar tipo de duración
  if (props.scheduledExpense.scheduled_months === null) {
    durationType.value = 'unlimited'
  } else {
    durationType.value = 'limited'
  }
  
  // Forzar actualización del select después de otro tick
  await nextTick()
}

// Watcher para cuando cambia el scheduledExpense prop
watch(() => props.scheduledExpense, async (newExpense) => {
  if (newExpense) {
    await loadScheduledExpenseData()
  }
}, { immediate: true })

// Inicializar formulario
onMounted(async () => {
  // Cargar tarjetas del usuario primero
  if (!userCardsStore.cards || userCardsStore.cards.length === 0) {
    await userCardsStore.loadUserCards()
  }
  
  // Cargar categorías y subcategorías si no están cargadas
  if (!categoriesStore.categories || categoriesStore.categories.length === 0) {
    await categoriesStore.loadCategories()
  }
  
  if (!subcategoriesStore.subcategories || subcategoriesStore.subcategories.length === 0) {
    await subcategoriesStore.loadSubcategories()
  }
  
  // Cargar estados de pago si no están cargados
  if (!expensesStore.paymentStatuses || expensesStore.paymentStatuses.length === 0) {
    await expensesStore.loadPaymentStatuses()
  }
  
  // Establecer mes actual como predeterminado
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  form.value.scheduled_start_month = currentMonth

  // Si estamos editando, cargar datos existentes
  if (props.scheduledExpense) {
    await loadScheduledExpenseData()
  }
})

const handleSubmit = async () => {
  try {
    loading.value = true

    // Validar formulario
    if (!form.value.description || !form.value.amount || !form.value.card_id || !form.value.category_id || !form.value.scheduled_start_month) {
      await Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor completa todos los campos requeridos.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#f59e0b'
      })
      return
    }

    if (durationType.value === 'limited' && (!form.value.scheduled_months || form.value.scheduled_months < 1)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Duración inválida',
        text: 'El número de meses debe ser mayor a 0.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#f59e0b'
      })
      return
    }

    // Preparar datos para envío
    const expenseData = {
      description: form.value.description,
      amount: parseFloat(form.value.amount),
      card_id: form.value.card_id,
      category_id: form.value.category_id,
      subcategory_id: form.value.subcategory_id || null,
      scheduled_start_month: form.value.scheduled_start_month + '-01', // Agregar día para formato completo
      scheduled_months: durationType.value === 'unlimited' ? null : form.value.scheduled_months,
      payment_status_id: form.value.payment_status_id || 1
    }

    let result
    // Si estamos editando, actualizar el gasto programado existente
    if (props.scheduledExpense) {
      result = await expensesStore.updateScheduledExpense(props.scheduledExpense.id, expenseData)
    } else {
      // Crear nuevo gasto programado
      result = await expensesStore.createScheduledExpense(expenseData)
    }

    if (result.success) {
      emit('save', result)
    } else {
      throw new Error(result.error || 'Error al crear el gasto programado')
    }

  } catch (error) {
    console.error('Error al crear gasto programado:', error)
    
    await Swal.fire({
      icon: 'error',
      title: 'Error al crear gasto programado',
      text: error.message || 'Ocurrió un error inesperado al crear el gasto programado.',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc2626'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors duration-200;
}
</style>
