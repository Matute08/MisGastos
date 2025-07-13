<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
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

      <!-- Formulario -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Descripción -->
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

        <!-- Monto -->
        <div>
          <label for="amount" class="block text-sm font-medium text-gray-700">
            Monto
          </label>
          <input
            id="amount"
            v-model.number="form.amount"
            type="number"
            step="0.01"
            min="0"
            required
            class="input-field mt-1"
            placeholder="0.00"
          />
        </div>

        <!-- Tarjeta -->
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
              v-for="card in cardsStore.cards"
              :key="card.id"
              :value="card.id"
            >
              {{ card.name }} ({{ card.type }})
            </option>
          </select>
        </div>

        <!-- Categoría -->
        <div>
          <label for="category_id" class="block text-sm font-medium text-gray-700">
            Categoría
          </label>
          <select
            id="category_id"
            v-model="form.category_id"
            required
            class="input-field mt-1"
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

        <!-- Fecha de compra -->
        <div>
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

        <!-- Tipo de pago -->
        <div>
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

        <!-- Número de cuotas (solo si es en cuotas) -->
        <div v-if="form.payment_type === 'installments'">
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

        <!-- Fecha de la primera cuota (editable) -->
        <div v-if="form.payment_type === 'installments'">
          <label for="first_installment_date" class="block text-sm font-medium text-gray-700">Fecha de la primera cuota</label>
          <input id="first_installment_date" v-model="firstInstallmentDateManual" type="date" class="input-field mt-1" />
        </div>

        <!-- Estado de pago -->
        <!-- <div>
          <label class="flex items-center">
            <input
              v-model="isPaid"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">Marcar como pagado</span>
          </label>
        </div> -->

        <!-- Información de cuotas (solo si es en cuotas) -->
        <div v-if="form.payment_type === 'installments' && selectedCard" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="text-sm font-medium text-blue-900 mb-2">Información de cuotas</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-blue-700">Tarjeta seleccionada</p>
              <p class="font-medium text-blue-900">{{ selectedCard.name }}</p>
            </div>
            <div>
              <p class="text-blue-700">Día de cierre</p>
              <p class="font-medium text-blue-900">{{ selectedCard.closing_day || 'No definido' }}</p>
            </div>
            <div>
              <p class="text-blue-700">Primera cuota</p>
              <p class="font-medium text-blue-900">{{ firstInstallmentDatePreview }}</p>
            </div>
            <div>
              <p class="text-blue-700">Última cuota</p>
              <p class="font-medium text-blue-900">{{ lastInstallmentDatePreview }}</p>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="bg-danger-50 border border-danger-200 rounded-md p-4">
          <div class="flex">
            <AlertCircle class="h-5 w-5 text-danger-400" />
            <div class="ml-3">
              <p class="text-sm text-danger-700">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Botones -->
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
            class="btn-primary"
          >
            <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {{ loading ? 'Guardando...' : (expense ? 'Actualizar' : 'Crear') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCardsStore } from '@/stores/cards'
import { useCategoriesStore } from '@/stores/categories'
import { X, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  expense: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const cardsStore = useCardsStore()
const categoriesStore = useCategoriesStore()

const form = ref({
  description: '',
  amount: null,
  card_id: '',
  category_id: '',
  purchase_date: '',
  payment_type: 'single',
  installments_count: 1,
  payment_status_id: 1 // Por defecto, pendiente (id=1)
})

const loading = ref(false)
const error = ref('')

// Mover resetForm antes del watcher
const resetForm = () => {
  form.value = {
    description: '',
    amount: null,
    card_id: '',
    category_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    payment_type: 'single',
    installments_count: 1,
    payment_status_id: 1 // Por defecto, pendiente (id=1)
  }
  error.value = ''
}

// Cambiar el checkbox para que maneje un booleano auxiliar y asigne el id correcto
const isPaid = ref(false)

const selectedCard = computed(() => {
  return cardsStore.cards.find(card => card.id === form.value.card_id)
})

// Nuevo watcher para el tipo de tarjeta (debe ir después de selectedCard)
watch(selectedCard, (card) => {
  if (!card) return;
  if (card.type === 'Débito' || card.type === 'Transferencia') {
    form.value.payment_status_id = 2; // Pagada
    isPaid.value = true;
  } else if (card.type === 'Crédito') {
    // Solo cambiar a pendiente si el usuario no marcó manualmente como pagado
    if (!isPaid.value) {
      form.value.payment_status_id = 1;
    }
  }
});

watch(isPaid, (nuevoValor) => {
  form.value.payment_status_id = nuevoValor ? 2 : 1 // 2 = pagada, 1 = pendiente
})

// Al inicializar el formulario, setear el valor del checkbox según el estado
watch(() => props.expense, (newExpense) => {
  if (newExpense) {
    isPaid.value = newExpense.payment_status_id === 2
    form.value = {
      description: newExpense.description,
      amount: newExpense.amount,
      card_id: newExpense.card_id,
      category_id: newExpense.category_id,
      purchase_date: newExpense.purchase_date,
      payment_type: newExpense.installments_count > 1 ? 'installments' : 'single',
      installments_count: newExpense.installments_count || 1,
      payment_status_id: newExpense.payment_status_id
    }
  } else {
    resetForm()
    isPaid.value = false
  }
}, { immediate: true })

const installmentAmount = computed(() => {
  if (form.value.amount && form.value.installments_count > 1) {
    return form.value.amount / form.value.installments_count
  }
  return 0
})

const firstInstallmentDate = computed(() => {
  if (!form.value.purchase_date || !selectedCard.value) return ''
  
  const purchaseDate = new Date(form.value.purchase_date)
  let firstDate = new Date(purchaseDate)
  const purchaseDay = purchaseDate.getDate()
  const closingDay = selectedCard.value.closing_day
  
  // Calcular la primera fecha de cuota según las reglas correctas
  if (closingDay) {
    if (purchaseDay <= closingDay) {
      // Compra ANTES del día de cierre: primera cuota en el PRÓXIMO mes
      firstDate.setMonth(firstDate.getMonth() + 1)
    } else {
      // Compra DESPUÉS del día de cierre: primera cuota en DOS MESES
      firstDate.setMonth(firstDate.getMonth() + 2)
    }
  } else {
    // Si no hay día de cierre definido, usar el mes siguiente
    firstDate.setMonth(firstDate.getMonth() + 1)
  }
  
  return formatDate(firstDate)
})

const lastInstallmentDate = computed(() => {
  if (!form.value.purchase_date || !form.value.installments_count || !selectedCard.value) return ''
  
  const purchaseDate = new Date(form.value.purchase_date)
  let firstDate = new Date(purchaseDate)
  const purchaseDay = purchaseDate.getDate()
  const closingDay = selectedCard.value.closing_day
  
  // Calcular la primera fecha de cuota según las reglas correctas
  if (closingDay) {
    if (purchaseDay <= closingDay) {
      // Compra ANTES del día de cierre: primera cuota en el PRÓXIMO mes
      firstDate.setMonth(firstDate.getMonth() + 1)
    } else {
      // Compra DESPUÉS del día de cierre: primera cuota en DOS MESES
      firstDate.setMonth(firstDate.getMonth() + 2)
    }
  } else {
    // Si no hay día de cierre definido, usar el mes siguiente
    firstDate.setMonth(firstDate.getMonth() + 1)
  }
  
  // Calcular la última cuota
  const lastDate = new Date(firstDate)
  lastDate.setMonth(lastDate.getMonth() + (form.value.installments_count - 1))
  
  return formatDate(lastDate)
})

const firstInstallmentDateManual = ref('')

// Lógica para calcular la fecha de la primera cuota según el ciclo de facturación
function calcularFechaPrimeraCuota(purchaseDateStr, closingDay) {
  if (!purchaseDateStr || !closingDay) return ''
  const purchaseDate = new Date(purchaseDateStr)
  let cierre = new Date(purchaseDate)
  cierre.setDate(closingDay)
  if (purchaseDate.getDate() >= closingDay) {
    cierre.setMonth(cierre.getMonth() + 1)
  }
  // La primer cuota vence el mes siguiente al cierre
  let primerCuota = new Date(cierre)
  primerCuota.setMonth(primerCuota.getMonth() + 1)
  return primerCuota.toISOString().split('T')[0]
}

// Computed para la fecha de la primera cuota (usada en la vista previa y como valor por defecto)
const firstInstallmentDatePreview = computed(() => {
  if (firstInstallmentDateManual.value) return firstInstallmentDateManual.value
  if (form.value.payment_type === 'installments' && selectedCard.value && form.value.purchase_date) {
    return calcularFechaPrimeraCuota(form.value.purchase_date, selectedCard.value.closing_day)
  }
  return ''
})

// Sincronizar el campo editable con la lógica por defecto si el usuario no lo cambia
watch(
  [() => form.value.purchase_date, () => selectedCard.value?.closing_day, () => form.value.payment_type],
  ([nuevaFecha, nuevoCierre, tipoPago]) => {
    if (tipoPago === 'installments' && !firstInstallmentDateManual.value) {
      firstInstallmentDateManual.value = calcularFechaPrimeraCuota(nuevaFecha, nuevoCierre)
    }
  },
  { immediate: true }
)

// Recalcular fechas de cuotas a partir de la fecha manual
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

const handleSubmit = () => {
  // Validaciones
  if (form.value.payment_type === 'installments' && form.value.installments_count < 2) {
    error.value = 'El número de cuotas debe ser mayor a 1'
    return
  }
  if (form.value.payment_type === 'installments' && form.value.installments_count > 24) {
    error.value = 'El número de cuotas no puede ser mayor a 24'
    return
  }
  const expenseData = {
    description: form.value.description,
    amount: form.value.amount,
    card_id: form.value.card_id,
    category_id: form.value.category_id,
    purchase_date: form.value.purchase_date,
    installments_count: form.value.payment_type === 'installments' ? form.value.installments_count : 1,
    payment_status_id: form.value.payment_status_id,
    first_installment_date: form.value.payment_type === 'installments' ? firstInstallmentDateManual.value : null
  }
  emit('save', expenseData)
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

// Calcular la fecha de la primera cuota (preview en panel)
const lastInstallmentDatePreview = computed(() => {
  if (form.value.payment_type !== 'installments') return ''
  if (!firstInstallmentDateManual.value || !form.value.installments_count) return ''
  const first = new Date(firstInstallmentDateManual.value)
  const last = new Date(first)
  last.setMonth(last.getMonth() + (form.value.installments_count - 1))
  return formatDate(last)
})

onMounted(async () => {
  await Promise.all([
    cardsStore.loadCards(),
    categoriesStore.loadCategories()
  ])
})
</script> 