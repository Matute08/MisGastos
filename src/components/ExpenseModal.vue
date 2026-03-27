<template>
  <Transition name="modal">
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overscroll-none"
    @click.self="$emit('close')"
    @keydown.esc="handleEscape"
    role="dialog"
    aria-modal="true"
    aria-labelledby="expense-modal-title"
  >
    <div 
      class="modal-content bg-white rounded-2xl shadow-soft-lg max-w-2xl w-full min-w-0 max-h-[90vh] overflow-y-auto overflow-x-hidden border border-slate-100" 
      @wheel.stop 
      @touchmove.stop 
      role="document"
      ref="modalRef"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-slate-100">
        <div>
          <h3 id="expense-modal-title" class="text-lg font-bold text-slate-900">
            {{ expense ? 'Editar Gasto' : 'Nuevo Gasto' }}
          </h3>
          <p class="text-sm text-slate-500 mt-0.5">{{ expense ? 'Modifica los datos del gasto' : 'Registra un nuevo gasto' }}</p>
        </div>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl p-2 transition-all duration-200"
          aria-label="Cerrar modal"
          type="button"
        >
          <X class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-5 min-w-0" novalidate>
        <!-- Descripcion -->
        <div>
          <label for="description" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Descripción
          </label>
          <div class="relative">
            <FileText class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="description"
              v-model="form.description"
              type="text"
              required
              class="input-field !pl-10"
              placeholder="Ej: Compras en el supermercado"
            />
          </div>
        </div>

        <!-- Monto -->
        <div>
          <label for="amount" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Monto
          </label>
          <div class="relative">
            <DollarSign class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="amount"
              v-model="form.amount"
              type="text"
              inputmode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              autocomplete="off"
              required
              class="input-field !pl-10"
              placeholder="0.00"
              @input="onAmountInput"
            />
          </div>
        </div>

        <!-- Tarjeta y Categoria en grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Tarjeta -->
          <div>
            <label for="card_id" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Cuenta
            </label>
            <select id="card_id" v-model="form.card_id" required class="input-field">
              <option value="">Seleccionar cuenta</option>
              <option
                v-for="card in userCardsStore.cards"
                :key="card.id"
                :value="card.id"
              >
                {{ card.available_card.name }} ({{ card.available_card.type }})
              </option>
            </select>
          </div>

          <!-- Categoria -->
          <div>
            <label for="category_id" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Categoría
            </label>
            <select
              id="category_id"
              v-model="form.category_id"
              required
              class="input-field"
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
        </div>

        <!-- Subcategoria -->
        <div v-if="form.category_id">
          <label for="subcategory_id" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Subcategoría <span class="text-slate-400 font-normal">(opcional)</span>
          </label>
          <select id="subcategory_id" v-model="form.subcategory_id" class="input-field">
            <option value="">Sin subcategoría</option>
            <option
              v-for="subcategory in getSubcategoriesForCategory(form.category_id)"
              :key="subcategory.id"
              :value="subcategory.id"
            >
              {{ subcategory.name }}
            </option>
          </select>
        </div>

        <!-- Estado de pago para gastos programados -->
        <div v-if="expense && expense.is_scheduled">
          <label for="payment_status_id" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Estado de pago
          </label>
          <select id="payment_status_id" v-model="form.payment_status_id" class="input-field">
            <option v-for="status in paymentStatuses" :key="status.id" :value="status.id">
              {{ status.label }}
            </option>
          </select>
          <p class="mt-1.5 text-xs text-slate-400">
            Solo se actualizará el estado de este gasto del mes seleccionado
          </p>
        </div>

        <!-- Fecha de compra -->
        <div v-if="!expense || !expense.is_scheduled">
          <label for="purchase_date" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Fecha de compra
          </label>
          <div class="relative min-w-0 w-full max-w-full">
            <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-[1]" />
            <input
              id="purchase_date"
              v-model="form.purchase_date"
              type="date"
              required
              class="input-field !pl-10"
            />
          </div>
        </div>

        <!-- Tipo de pago -->
        <div v-if="(!expense || !expense.is_scheduled) && selectedCard && selectedCard.type === 'Crédito'">
          <label class="block text-sm font-semibold text-slate-700 mb-2">
            Tipo de pago
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label
              :class="[
                'flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200',
                form.payment_type === 'single'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              ]"
            >
              <input v-model="form.payment_type" type="radio" value="single" class="hidden" />
              <CreditCard class="h-4 w-4" />
              <span class="text-sm font-medium">Un pago</span>
            </label>
            <label
              :class="[
                'flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200',
                form.payment_type === 'installments'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              ]"
            >
              <input v-model="form.payment_type" type="radio" value="installments" class="hidden" />
              <Layers class="h-4 w-4" />
              <span class="text-sm font-medium">En cuotas</span>
            </label>
          </div>
        </div>

        <!-- Numero de cuotas -->
        <div v-if="(!expense || !expense.is_scheduled) && form.payment_type === 'installments'">
          <label for="installments_count" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Número de cuotas
          </label>
          <input
            id="installments_count"
            v-model.number="form.installments_count"
            type="number"
            min="2"
            max="24"
            required
            class="input-field"
            placeholder="Ej: 3"
          />
          <p class="mt-1.5 text-sm text-primary-600 font-medium">
            Monto por cuota: {{ formatCurrency(installmentAmount) }}
          </p>
        </div>

        <!-- Fecha cuota unica -->
        <div v-if="(!expense || !expense.is_scheduled) && selectedCard && selectedCard.type === 'Crédito' && form.payment_type === 'single'">
          <label for="single_installment_date" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Fecha de la cuota <span class="text-danger-500">*</span>
          </label>
          <input id="single_installment_date" v-model="singleInstallmentDate" type="date" required class="input-field" />
        </div>

        <!-- Fecha primera cuota -->
        <div v-if="(!expense || !expense.is_scheduled) && form.payment_type === 'installments'">
          <label for="first_installment_date" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Fecha de la primera cuota <span class="text-danger-500">*</span>
          </label>
          <input id="first_installment_date" v-model="firstInstallmentDateManual" type="date" required class="input-field" />
        </div>

        <!-- Info de cuotas -->
        <div v-if="(!expense || !expense.is_scheduled) && form.payment_type === 'installments' && selectedCard" class="bg-primary-50 border border-primary-100 rounded-2xl p-4">
          <h4 class="text-sm font-semibold text-primary-900 mb-3">Resumen de cuotas</h4>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-primary-600">Cuenta</p>
              <p class="font-semibold text-primary-900">{{ selectedCard.name }}</p>
            </div>
            <div>
              <p class="text-primary-600">Primera cuota</p>
              <p class="font-semibold text-primary-900">{{ firstInstallmentDatePreview }}</p>
            </div>
            <div>
              <p class="text-primary-600">Última cuota</p>
              <p class="font-semibold text-primary-900">{{ lastInstallmentDatePreview }}</p>
            </div>
            <div>
              <p class="text-primary-600">Monto por cuota</p>
              <p class="font-semibold text-primary-900">{{ formatCurrency(installmentAmount) }}</p>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="bg-danger-50 border border-danger-100 rounded-xl p-4" role="alert">
          <div class="flex items-start gap-3">
            <AlertCircle class="h-5 w-5 text-danger-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-danger-700">{{ error }}</p>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary inline-flex items-center justify-center min-w-[130px]"
          >
            <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            <span>{{ loading ? 'Guardando...' : (expense ? 'Actualizar' : 'Crear Gasto') }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import { useBodyScrollLock } from '@/composables/useBodyScrollLock.js'
import { useUserCardsStore } from '@/stores/userCards'
import { useCategoriesStore } from '@/stores/categories'
import { useSubcategoriesStore } from '@/stores/subcategories'
import { useExpensesStore } from '@/stores/expenses'
import { X, AlertCircle, FileText, DollarSign, Calendar, CreditCard, Layers } from 'lucide-vue-next'

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
const modalRef = ref(null)
const { lock: lockBodyScroll, unlock: unlockBodyScroll } = useBodyScrollLock()

const handleEscape = (event) => {
  if (event.key === 'Escape') emit('close')
}

/** Validación en cliente antes de llamar a la API (el form usa novalidate). */
const getValidationError = () => {
  const isScheduledExpense = props.expense && props.expense.is_scheduled

  const desc = String(form.value.description ?? '').trim()
  if (!desc) return 'Completá la descripción del gasto.'

  const amountStr = String(form.value.amount ?? '').replace(/,/g, '.').trim()
  if (!amountStr) return 'Ingresá el monto.'
  const amount = parseFloat(amountStr)
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Ingresá un monto válido mayor a cero.'
  }

  if (!form.value.card_id) return 'Seleccioná una cuenta.'
  if (!form.value.category_id) return 'Seleccioná una categoría.'

  if (!isScheduledExpense) {
    if (!form.value.purchase_date) return 'Seleccioná la fecha de compra.'

    const card = selectedCard.value
    if (card && card.type === 'Crédito') {
      if (form.value.payment_type === 'installments') {
        const n = Number(form.value.installments_count)
        if (!Number.isFinite(n) || n < 2) {
          return 'Indicá el número de cuotas (entre 2 y 24).'
        }
        if (n > 24) return 'El número de cuotas no puede ser mayor a 24.'
        if (!String(firstInstallmentDateManual.value ?? '').trim()) {
          return 'Seleccioná la fecha de la primera cuota.'
        }
      } else if (!String(singleInstallmentDate.value ?? '').trim()) {
        return 'Seleccioná la fecha de la cuota.'
      }
    }
  }

  return null
}

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
  firstInstallmentDateManual.value = ''
  singleInstallmentDate.value = ''
  error.value = ''
}

const selectedCard = computed(() => {
  const userCard = userCardsStore.cards.find(card => card.id === form.value.card_id)
  return userCard ? userCard.available_card : null
})

watch(selectedCard, (card) => {
  if (!card) return
  if (!props.expense) {
    if (card.type === 'Débito' || card.type === 'Transferencia') {
      form.value.payment_type = 'single'
      form.value.payment_status_id = 2
      firstInstallmentDateManual.value = ''
      singleInstallmentDate.value = ''
    } else if (card.type === 'Crédito') {
      form.value.payment_status_id = 1
    }
  } else {
    if (card.type === 'Débito' || card.type === 'Transferencia') {
      form.value.payment_type = 'single'
      firstInstallmentDateManual.value = ''
      singleInstallmentDate.value = ''
    }
  }
})

watch(() => props.expense, async (newExpense) => {
  if (newExpense) {
    let selectedCardId = newExpense.card_id
    if (newExpense.card_id) {
      const userCard = userCardsStore.cards.find(card => 
        card.available_card_id === newExpense.card_id
      )
      if (userCard) selectedCardId = userCard.id
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
        firstInstallmentDateManual.value = newExpense.first_installment_date
      } else {
        singleInstallmentDate.value = newExpense.first_installment_date
      }
    }
  } else {
    resetForm()
  }
}, { immediate: true })

const installmentAmount = computed(() => {
  const amount = parseFloat(form.value.amount)
  if (Number.isFinite(amount) && form.value.installments_count > 1) {
    return amount / form.value.installments_count
  }
  return 0
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

const handleSubmit = async () => {
  const isScheduledExpense = props.expense && props.expense.is_scheduled

  const validationError = getValidationError()
  if (validationError) {
    error.value = validationError
    return
  }

  const formatDateForAPI = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }
  
  let firstInstallmentDate = null
  if (!isScheduledExpense && selectedCard.value && selectedCard.value.type === 'Crédito') {
    if (form.value.payment_type === 'single') {
      firstInstallmentDate = formatDateForAPI(singleInstallmentDate.value)
    } else if (form.value.payment_type === 'installments') {
      firstInstallmentDate = formatDateForAPI(firstInstallmentDateManual.value)
    }
  } else if (isScheduledExpense && props.expense && props.expense.first_installment_date) {
    firstInstallmentDate = formatDateForAPI(props.expense.first_installment_date)
  }
  
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
  
  if (!isScheduledExpense) {
    expenseData.purchase_date = formatDateForAPI(form.value.purchase_date)
    expenseData.installments_count = form.value.payment_type === 'installments' ? form.value.installments_count : 1
  } else {
    if (props.expense) {
      expenseData.purchase_date = formatDateForAPI(props.expense.purchase_date)
      expenseData.installments_count = props.expense.installments_count || 1
    }
  }
  
  if (firstInstallmentDate) {
    expenseData.first_installment_date = firstInstallmentDate
  }
  
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
  lockBodyScroll()
  await Promise.all([
    userCardsStore.loadUserCards(),
    categoriesStore.loadCategories(),
    subcategoriesStore.loadSubcategories(),
    expensesStore.loadPaymentStatuses()
  ])
  await nextTick()
  if (modalRef.value) modalRef.value.focus()
})

onBeforeUnmount(() => {
  unlockBodyScroll()
  loading.value = false
})
</script>
