<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @wheel.prevent @touchmove.prevent @scroll.prevent>
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" @wheel.stop @touchmove.stop @scroll.stop>
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ expense ? 'Editar Gasto' : 'Nuevo Gasto' }}
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
            placeholder="Ej: Compras en el supermercado"
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
              :value="card.id"
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
              v-for="subcategory in getSubcategoriesForCategory(form.category_id)"
              :key="subcategory.id"
              :value="subcategory.id"
            >
              {{ subcategory.name }}
            </option>
          </select>
        </div>

        <div v-if="expense && expense.is_scheduled">
          <label for="payment_status_id" class="block text-sm font-medium text-gray-700">
            Estado de pago
          </label>
          <select
            id="payment_status_id"
            v-model="form.payment_status_id"
            class="input-field mt-1"
          >
            <option
              v-for="status in paymentStatuses"
              :key="status.id"
              :value="status.id"
            >
              {{ status.label }}
            </option>
          </select>
          <p class="mt-1 text-xs text-gray-500">
            Solo se actualizará el estado de este gasto del mes seleccionado
          </p>
        </div>

        <div v-if="!expense || !expense.is_scheduled">
          <label for="purchase_date" class="block text-sm font-medium text-gray-700">
            Fecha de compra
          </label>
          <input
            id="purchase_date"
            v-model="form.purchase_date"
            type="date"
            required
            class="input-field mt-1"
          />
        </div>

        <div v-if="(!expense || !expense.is_scheduled) && selectedCard && selectedCard.type === 'Crédito'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tipo de pago
          </label>
          <div class="flex space-x-4">
            <label class="flex items-center">
              <input
                v-model="form.payment_type"
                type="radio"
                value="single"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span class="ml-2 text-sm text-gray-700">Un pago</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="form.payment_type"
                type="radio"
                value="installments"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span class="ml-2 text-sm text-gray-700">En cuotas</span>
            </label>
          </div>
        </div>

        <div v-if="(!expense || !expense.is_scheduled) && form.payment_type === 'installments'">
          <label for="installments_count" class="block text-sm font-medium text-gray-700">
            Número de cuotas
          </label>
          <input
            id="installments_count"
            v-model.number="form.installments_count"
            type="number"
            min="2"
            max="24"
            required
            class="input-field mt-1"
            placeholder="Ej: 3"
          />
          <p class="mt-1 text-xs text-gray-500">
            Monto por cuota: {{ formatCurrency(installmentAmount) }}
          </p>
        </div>

        <div v-if="(!expense || !expense.is_scheduled) && selectedCard && selectedCard.type === 'Crédito' && form.payment_type === 'single'">
          <label for="single_installment_date" class="block text-sm font-medium text-gray-700">
            Fecha de la cuota <span class="text-red-500">*</span>
          </label>
          <input 
            id="single_installment_date" 
            v-model="singleInstallmentDate" 
            type="date" 
            required
            class="input-field mt-1" 
          />
          <p class="mt-1 text-xs text-gray-500">
            Fecha en que vence la cuota
          </p>
        </div>

        <div v-if="(!expense || !expense.is_scheduled) && form.payment_type === 'installments'">
          <label for="first_installment_date" class="block text-sm font-medium text-gray-700">
            Fecha de la primera cuota <span class="text-red-500">*</span>
          </label>
          <input 
            id="first_installment_date" 
            v-model="firstInstallmentDateManual" 
            type="date" 
            required
            class="input-field mt-1" 
          />
          <p class="mt-1 text-xs text-gray-500">
            Fecha en que vence la primera cuota
          </p>
        </div>

        <div v-if="(!expense || !expense.is_scheduled) && form.payment_type === 'installments' && selectedCard" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="text-sm font-medium text-blue-900 mb-2">Información de cuotas</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-blue-700">Tarjeta seleccionada</p>
              <p class="font-medium text-blue-900">{{ selectedCard.name }}</p>
            </div>
            <div>
              <p class="text-blue-700">Primera cuota</p>
              <p class="font-medium text-blue-900">{{ firstInstallmentDatePreview }}</p>
            </div>
            <div>
              <p class="text-blue-700">Última cuota</p>
              <p class="font-medium text-blue-900">{{ lastInstallmentDatePreview }}</p>
            </div>
            <div>
              <p class="text-blue-700">Monto por cuota</p>
              <p class="font-medium text-blue-900">{{ formatCurrency(installmentAmount) }}</p>
            </div>
          </div>
        </div>

        <div v-if="error" class="bg-danger-50 border border-danger-200 rounded-md p-4">
          <div class="flex">
            <AlertCircle class="h-5 w-5 text-danger-400" />
            <div class="ml-3">
              <p class="text-sm text-danger-700">{{ error }}</p>
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
            class="btn-primary inline-flex items-center justify-center min-w-[120px]"
          >
            <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            <span>{{ loading ? 'Guardando...' : (expense ? 'Actualizar' : 'Crear') }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useUserCardsStore } from '@/stores/userCards'
import { useCategoriesStore } from '@/stores/categories'
import { useSubcategoriesStore } from '@/stores/subcategories'
import { useExpensesStore } from '@/stores/expenses'
import { X, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  expense: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const userCardsStore = useUserCardsStore()
const categoriesStore = useCategoriesStore()
const subcategoriesStore = useSubcategoriesStore()
const expensesStore = useExpensesStore()

const paymentStatuses = computed(() => expensesStore.paymentStatuses || [])

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

const form = ref({
  description: '',
  amount: '',
  card_id: '',
  category_id: '',
  subcategory_id: '',
  purchase_date: '',
  payment_type: 'single',
  installments_count: 1,
  payment_status_id: 1
})

const loading = ref(false)
const error = ref('')
const firstInstallmentDateManual = ref('')
const singleInstallmentDate = ref('')

const resetForm = () => {
  form.value = {
    description: '',
    amount: '',
    card_id: '',
    category_id: '',
    subcategory_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    payment_type: 'single',
    installments_count: 1,
    payment_status_id: 1
  }
  firstInstallmentDateManual.value = '';
  singleInstallmentDate.value = '';
  error.value = ''
}

const selectedCard = computed(() => {
  const userCard = userCardsStore.cards.find(card => card.id === form.value.card_id)
  return userCard ? userCard.available_card : null
})

watch(selectedCard, (card) => {
  if (!card) return;
  // Solo actualizar payment_status_id si no estamos editando un gasto existente
  // para evitar sobrescribir el estado actual del gasto
  if (!props.expense) {
    if (card.type === 'Débito' || card.type === 'Transferencia') {
      form.value.payment_type = 'single';
      form.value.payment_status_id = 2;
      firstInstallmentDateManual.value = '';
      singleInstallmentDate.value = '';
    } else if (card.type === 'Crédito') {
      form.value.payment_status_id = 1;
    }
  } else {
    // Si estamos editando, solo actualizar payment_type si es necesario
    if (card.type === 'Débito' || card.type === 'Transferencia') {
      form.value.payment_type = 'single';
      firstInstallmentDateManual.value = '';
      singleInstallmentDate.value = '';
    }
  }
});

watch(() => props.expense, async (newExpense) => {
  if (newExpense) {
    // Buscar la tarjeta del usuario que corresponde al card_id del gasto
    // El card_id del gasto es el available_card_id, necesitamos encontrar el user_card.id
    let selectedCardId = newExpense.card_id
    if (newExpense.card_id) {
      const userCard = userCardsStore.cards.find(card => 
        card.available_card_id === newExpense.card_id
      )
      if (userCard) {
        selectedCardId = userCard.id
      }
    }
    
    form.value = {
      description: newExpense.description,
      amount: String(newExpense.amount ?? ''),
      card_id: selectedCardId,
      category_id: newExpense.category_id,
      subcategory_id: newExpense.subcategory_id || '',
      purchase_date: newExpense.purchase_date,
      payment_type: newExpense.installments_count > 1 ? 'installments' : 'single',
      installments_count: newExpense.installments_count || 1,
      payment_status_id: newExpense.payment_status_id || 1
    }
    
    if (newExpense.first_installment_date) {
      if (newExpense.installments_count > 1) {
        firstInstallmentDateManual.value = newExpense.first_installment_date;
      } else {
        singleInstallmentDate.value = newExpense.first_installment_date;
      }
    }
  } else {
    resetForm()
    firstInstallmentDateManual.value = '';
    singleInstallmentDate.value = '';
  }
}, { immediate: true })

const installmentAmount = computed(() => {
  const amount = parseFloat(form.value.amount)
  if (Number.isFinite(amount) && form.value.installments_count > 1) {
    return amount / form.value.installments_count
  }
  return 0
})

const firstInstallmentDate = computed(() => {
  if (!form.value.purchase_date || !selectedCard.value) return ''
  
  const purchaseDate = new Date(form.value.purchase_date)
  let firstDate = new Date(purchaseDate)
  
  firstDate.setMonth(firstDate.getMonth() + 1)
  
  return formatDate(firstDate)
})

const lastInstallmentDate = computed(() => {
  if (!form.value.purchase_date || !form.value.installments_count || !selectedCard.value) return ''
  
  const purchaseDate = new Date(form.value.purchase_date)
  let firstDate = new Date(purchaseDate)
  
  firstDate.setMonth(firstDate.getMonth() + 1)
  
  const lastDate = new Date(firstDate)
  lastDate.setMonth(lastDate.getMonth() + (form.value.installments_count - 1))
  
  return formatDate(lastDate)
})

const firstInstallmentDatePreview = computed(() => {
  if (firstInstallmentDateManual.value) return firstInstallmentDateManual.value
  if (form.value.payment_type === 'installments' && form.value.purchase_date) {
    const purchaseDate = new Date(form.value.purchase_date)
    const defaultDate = new Date(purchaseDate)
    defaultDate.setMonth(defaultDate.getMonth() + 1)
    return defaultDate.toISOString().split('T')[0]
  }
  return ''
})

watch(
  [() => form.value.purchase_date, () => form.value.payment_type],
  ([nuevaFecha, tipoPago]) => {
    if (tipoPago === 'installments' && nuevaFecha) {
      const purchaseDate = new Date(nuevaFecha)
      const defaultDate = new Date(purchaseDate)
      defaultDate.setMonth(defaultDate.getMonth() + 1)
      firstInstallmentDateManual.value = defaultDate.toISOString().split('T')[0]
    }
  },
  { immediate: true }
)

const getInstallmentDates = () => {
  const dates = []
  if (!firstInstallmentDateManual.value || !form.value.installments_count) return dates
  let date = new Date(firstInstallmentDateManual.value)
  for (let i = 0; i < form.value.installments_count; i++) {
    const cuotaDate = new Date(date)
    cuotaDate.setMonth(cuotaDate.getMonth() + i)
    dates.push(cuotaDate.toISOString().split('T')[0])
  }
  return dates
}

const handleSubmit = async () => {
  // Si estamos editando un gasto programado individual, solo validar campos básicos
  const isScheduledExpense = props.expense && props.expense.is_scheduled;
  
  if (!isScheduledExpense) {
    // Validaciones solo para gastos normales (no programados)
    if (form.value.payment_type === 'installments' && form.value.installments_count < 2) {
      error.value = 'El número de cuotas debe ser mayor a 1'
      return
    }
    if (form.value.payment_type === 'installments' && form.value.installments_count > 24) {
      error.value = 'El número de cuotas no puede ser mayor a 24'
      return
    }
    if (form.value.payment_type === 'installments' && !firstInstallmentDateManual.value) {
      error.value = 'La fecha de la primera cuota es obligatoria para cuotas'
      return
    }
    
    if (selectedCard.value && selectedCard.value.type === 'Crédito' && form.value.payment_type === 'single' && !singleInstallmentDate.value) {
      error.value = 'La fecha de la cuota es obligatoria para tarjetas de crédito'
      return
    }
  }
  
  const formatDateForAPI = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }
  
  let firstInstallmentDate = null;
  // Solo procesar fechas de cuotas si NO es un gasto programado individual
  if (!isScheduledExpense && selectedCard.value && selectedCard.value.type === 'Crédito') {
    if (form.value.payment_type === 'single') {
      firstInstallmentDate = formatDateForAPI(singleInstallmentDate.value);
    } else if (form.value.payment_type === 'installments') {
      if (!firstInstallmentDateManual.value) {
        error.value = 'Debes seleccionar la fecha de la primera cuota';
        return;
      }
      firstInstallmentDate = formatDateForAPI(firstInstallmentDateManual.value);
    }
  } else if (isScheduledExpense && props.expense && props.expense.first_installment_date) {
    // Si es un gasto programado, mantener la fecha de cuota original si existe
    firstInstallmentDate = formatDateForAPI(props.expense.first_installment_date);
  }
  
  // Obtener el card_id real de la tarjeta seleccionada
  const selectedUserCard = userCardsStore.cards.find(card => card.id === form.value.card_id)
  const realCardId = selectedUserCard ? selectedUserCard.available_card_id : form.value.card_id

  const expenseData = {
    description: form.value.description,
    amount: parseFloat(form.value.amount),
    card_id: realCardId,
    category_id: form.value.category_id,
    subcategory_id: form.value.subcategory_id || null,
    payment_status_id: form.value.payment_status_id
  }
  
  // Solo incluir purchase_date y installments_count si NO es un gasto programado
  if (!isScheduledExpense) {
    expenseData.purchase_date = formatDateForAPI(form.value.purchase_date);
    expenseData.installments_count = form.value.payment_type === 'installments' ? form.value.installments_count : 1;
  } else {
    // Para gastos programados, mantener los valores originales
    if (props.expense) {
      expenseData.purchase_date = formatDateForAPI(props.expense.purchase_date);
      expenseData.installments_count = props.expense.installments_count || 1;
    }
  }
  
  if (firstInstallmentDate) {
    expenseData.first_installment_date = firstInstallmentDate;
  }
  
  // Activar loading
  loading.value = true
  error.value = ''
  
  try {
    emit('save', expenseData)
  } catch (err) {
    error.value = 'Error al guardar el gasto'
    loading.value = false
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount)
}

const formatDate = (date) => {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

const lastInstallmentDatePreview = computed(() => {
  if (form.value.payment_type !== 'installments') return ''
  if (!firstInstallmentDateManual.value || !form.value.installments_count) return ''
  const first = new Date(firstInstallmentDateManual.value)
  const last = new Date(first)
  last.setMonth(last.getMonth() + (form.value.installments_count - 1))
  return formatDate(last)
})

const getSubcategoriesForCategory = (categoryId) => {
  return subcategoriesStore.subcategories.filter(subcategory => subcategory.category_id === categoryId)
}

onMounted(async () => {
  // Bloquear scroll del body mientras el modal esté abierto
  document.body.style.overflow = 'hidden'
  await Promise.all([
    userCardsStore.loadUserCards(),
    categoriesStore.loadCategories(),
    subcategoriesStore.loadSubcategories(),
    expensesStore.loadPaymentStatuses()
  ])
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  // Desactivar loading al cerrar el modal
  loading.value = false
})
</script> 