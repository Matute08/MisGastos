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

        <!-- Subcategoría -->
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

        <!-- Tipo de pago (solo para tarjetas de crédito) -->
        <div v-if="selectedCard && selectedCard.type === 'Crédito'">
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

        <!-- Fecha de cuota única (para tarjetas de crédito con pago único) -->
        <div v-if="selectedCard && selectedCard.type === 'Crédito' && form.payment_type === 'single'">
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

        <!-- Fecha de la primera cuota (obligatoria para cuotas) -->
        <div v-if="form.payment_type === 'installments'">
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
import { useSubcategoriesStore } from '@/stores/subcategories'
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
const subcategoriesStore = useSubcategoriesStore()

const form = ref({
  description: '',
  amount: null,
  card_id: '',
  category_id: '',
  subcategory_id: '',
  purchase_date: '',
  payment_type: 'single',
  installments_count: 1,
  payment_status_id: 1 // Por defecto, pendiente (id=1)
})

const loading = ref(false)
const error = ref('')

// Declarar las variables de fecha ANTES de resetForm
const firstInstallmentDateManual = ref('')
const singleInstallmentDate = ref('')

// Mover resetForm antes del watcher
const resetForm = () => {
  form.value = {
    description: '',
    amount: null,
    card_id: '',
    category_id: '',
    subcategory_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    payment_type: 'single',
    installments_count: 1,
    payment_status_id: 1 // Por defecto, pendiente (id=1)
  }
  firstInstallmentDateManual.value = '';
  singleInstallmentDate.value = '';
  error.value = ''
}

// Cambiar el checkbox para que maneje un booleano auxiliar y asigne el id correcto
// const isPaid = ref(false)

const selectedCard = computed(() => {
  return cardsStore.cards.find(card => card.id === form.value.card_id)
})

// Nuevo watcher para el tipo de tarjeta (debe ir después de selectedCard)
watch(selectedCard, (card) => {
  if (!card) return;
  if (card.type === 'Débito') {
    form.value.payment_type = 'single';
    form.value.payment_status_id = 2; // Pagada para débito
    // Limpiar fechas de cuotas
    firstInstallmentDateManual.value = '';
    singleInstallmentDate.value = '';
  } else if (card.type === 'Crédito') {
    form.value.payment_status_id = 1; // Pendiente para crédito
  }
});

// Al inicializar el formulario, setear el valor del checkbox según el estado
watch(() => props.expense, (newExpense) => {
  if (newExpense) {
    // isPaid.value = newExpense.payment_status_id === 2
    form.value = {
      description: newExpense.description,
      amount: newExpense.amount,
      card_id: newExpense.card_id,
      category_id: newExpense.category_id,
      subcategory_id: newExpense.subcategory_id || '',
      purchase_date: newExpense.purchase_date,
      payment_type: newExpense.installments_count > 1 ? 'installments' : 'single',
      installments_count: newExpense.installments_count || 1,
      payment_status_id: newExpense.payment_status_id
    }
    
    // Cargar fechas de cuotas si existen
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
    // isPaid.value = false
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
  
  // Por defecto, primera cuota en el mes siguiente
  firstDate.setMonth(firstDate.getMonth() + 1)
  
  return formatDate(firstDate)
})

const lastInstallmentDate = computed(() => {
  if (!form.value.purchase_date || !form.value.installments_count || !selectedCard.value) return ''
  
  const purchaseDate = new Date(form.value.purchase_date)
  let firstDate = new Date(purchaseDate)
  
  // Por defecto, primera cuota en el mes siguiente
  firstDate.setMonth(firstDate.getMonth() + 1)
  
  // Calcular la última cuota
  const lastDate = new Date(firstDate)
  lastDate.setMonth(lastDate.getMonth() + (form.value.installments_count - 1))
  
  return formatDate(lastDate)
})

// Computed para la fecha de la primera cuota (usada en la vista previa y como valor por defecto)
const firstInstallmentDatePreview = computed(() => {
  if (firstInstallmentDateManual.value) return firstInstallmentDateManual.value
  if (form.value.payment_type === 'installments' && form.value.purchase_date) {
    // Calcular fecha por defecto (mes siguiente)
    const purchaseDate = new Date(form.value.purchase_date)
    const defaultDate = new Date(purchaseDate)
    defaultDate.setMonth(defaultDate.getMonth() + 1)
    return defaultDate.toISOString().split('T')[0]
  }
  return ''
})

// Sincronizar el campo editable con la lógica por defecto si el usuario no lo cambia
watch(
  [() => form.value.purchase_date, () => form.value.payment_type],
  ([nuevaFecha, tipoPago]) => {
    if (tipoPago === 'installments' && nuevaFecha) {
      // SIEMPRE calcular fecha por defecto (mes siguiente)
      const purchaseDate = new Date(nuevaFecha)
      const defaultDate = new Date(purchaseDate)
      defaultDate.setMonth(defaultDate.getMonth() + 1)
      firstInstallmentDateManual.value = defaultDate.toISOString().split('T')[0]
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
  if (form.value.payment_type === 'installments' && !firstInstallmentDateManual.value) {
    error.value = 'La fecha de la primera cuota es obligatoria para cuotas'
    return
  }
  
  // Validar fecha de cuota única para tarjetas de crédito
  if (selectedCard.value && selectedCard.value.type === 'Crédito' && form.value.payment_type === 'single' && !singleInstallmentDate.value) {
    error.value = 'La fecha de la cuota es obligatoria para tarjetas de crédito'
    return
  }
  
  console.log('Fecha de compra:', form.value.purchase_date)
  console.log('Tipo de fecha:', typeof form.value.purchase_date)
  
  // Asegurar que la fecha esté en formato YYYY-MM-DD
  const formatDateForAPI = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }
  
  // Determinar la fecha de primera cuota según el tipo de pago y tarjeta
  let firstInstallmentDate = null;
  if (selectedCard.value && selectedCard.value.type === 'Crédito') {
    if (form.value.payment_type === 'single') {
      firstInstallmentDate = formatDateForAPI(singleInstallmentDate.value);
      console.log('🔍 Frontend - Pago único, fecha:', firstInstallmentDate);
    } else if (form.value.payment_type === 'installments') {
      // OBLIGATORIO: Usar la fecha manual
      if (!firstInstallmentDateManual.value) {
        error.value = 'Debes seleccionar la fecha de la primera cuota';
        return;
      }
      firstInstallmentDate = formatDateForAPI(firstInstallmentDateManual.value);
      console.log('🔍 Frontend - Cuotas, fecha manual:', firstInstallmentDateManual.value);
      console.log('🔍 Frontend - Cuotas, fecha formateada:', firstInstallmentDate);
    }
  }
  // Para tarjetas de débito, NO enviar first_installment_date (el backend lo manejará)
  
  // Debug: Verificar que la fecha se está enviando
  console.log('🔍 Frontend - firstInstallmentDate final:', firstInstallmentDate);
  console.log('🔍 Frontend - Tipo de firstInstallmentDate:', typeof firstInstallmentDate);
  
  // Preparar datos para enviar
  const expenseData = {
    description: form.value.description,
    amount: form.value.amount,
    card_id: form.value.card_id,
    category_id: form.value.category_id,
    subcategory_id: form.value.subcategory_id || null,
    purchase_date: formatDateForAPI(form.value.purchase_date),
    installments_count: form.value.payment_type === 'installments' ? form.value.installments_count : 1,
    payment_status_id: form.value.payment_status_id
  }
  
  // Solo incluir first_installment_date si se determinó (para tarjetas de crédito)
  if (firstInstallmentDate) {
    expenseData.first_installment_date = firstInstallmentDate;
  }
  
  console.log('🔍 Frontend - Datos a enviar:', expenseData)
  console.log('🔍 Frontend - firstInstallmentDateManual:', firstInstallmentDateManual.value)
  console.log('🔍 Frontend - firstInstallmentDate final:', firstInstallmentDate)
  console.log('🔍 Frontend - Tipo de tarjeta:', selectedCard.value?.type)
  console.log('🔍 Frontend - Tipo de pago:', form.value.payment_type)
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

// Obtener subcategorías para una categoría específica
const getSubcategoriesForCategory = (categoryId) => {
  return subcategoriesStore.subcategories.filter(subcategory => subcategory.category_id === categoryId)
}

onMounted(async () => {
  console.log('🔍 Debug - ExpenseModal montado');
  await Promise.all([
    cardsStore.loadCards(),
    categoriesStore.loadCategories(),
    subcategoriesStore.loadSubcategories()
  ])
})
</script> 