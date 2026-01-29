<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gastos Mensuales</h1>
        <p class="text-gray-600">Gestiona tus gastos y cuotas por mes</p>
      </div>
      <div class="flex space-x-2">
        <button @click="previousMonth" class="btn-secondary">
          <ChevronLeft class="h-4 w-4" />
        </button>
        <button @click="nextMonth" class="btn-secondary">
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Selector de mes -->
    <SkeletonSummary v-if="isLoading" :items="1" />
    <div v-else class="card">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            {{ formatMonthYear(selectedDate) }}
          </h3>
          <p class="text-sm text-gray-600">
            Total a pagar: {{ formatCurrency(monthlyTotal) }}
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="checkbox-container">
            <input
              v-model="showDirectExpenses"
              type="checkbox"
              id="showDirectExpenses"
            />
            <label for="showDirectExpenses" class="text-sm text-gray-700 font-medium cursor-pointer select-none">
              Ver gastos directos
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="expensesStore.error" class="bg-danger-50 border border-danger-200 rounded-md p-4">
      <div class="flex">
        <AlertCircle class="h-5 w-5 text-danger-400" />
        <div class="ml-3">
          <p class="text-sm text-danger-700">{{ expensesStore.error }}</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <SkeletonList v-if="isLoading" :count="6" />

    <!-- Lista de gastos del mes -->
    <div v-else class="space-y-4">
      <template v-if="showDirectExpenses">
        <!-- Gastos directos por tarjeta -->
        <div
          v-for="card in cardsWithDirectExpenses"
          :key="card.id"
          class="card"
        >
          <div class="card-header">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="card-title">{{ card.name }}</h3>
                <p class="card-subtitle">{{ card.type }} - {{ card.bank }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600">Total del mes</p>
                <p class="text-xl font-bold text-gray-900">
                  {{ formatCurrency(getCardDirectMonthlyTotal(card.id)) }}
                </p>
              </div>
            </div>
          </div>
          <div class="space-y-3">
            <div
              v-for="expense in getCardDirectExpenses(card.id)"
              :key="expense.id"
              class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :style="{ backgroundColor: expense.categories?.color + '20', color: expense.categories?.color }"
                    >
                      {{ expense.categories?.name || 'Sin categoría' }}
                    </span>
                  </div>
                  <p class="text-sm font-medium text-gray-900">{{ expense.description }}</p>
                  <p class="text-xs text-gray-600">{{ formatDate(expense.purchase_date) }}</p>
                </div>
                <div class="flex items-center space-x-4">
                  <div class="text-right">
                    <p class="text-sm font-medium text-gray-900">
                      {{ formatCurrency(expense.amount) }}
                    </p>
                  </div>
                  <span
                    :class="[
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200',
                      expense.payment_status_code === 'pagada'
                        ? 'bg-success-100 text-success-800'
                        : expense.payment_status_code === 'en_deuda'
                        ? 'bg-danger-100 text-danger-800'
                        : 'bg-warning-100 text-warning-800'
                    ]"
                  >
                    {{ expense.payment_status_label || 'Sin estado' }}
                  </span>
                </div>
              </div>
            </div>
            <div
              v-if="getCardDirectExpenses(card.id).length === 0"
              class="text-center py-8 text-gray-500"
            >
              <CreditCard class="mx-auto h-8 w-8 mb-2" />
              <p class="text-sm">No hay gastos directos para este mes</p>
            </div>
          </div>
        </div>
        <div
          v-if="cardsWithDirectExpenses.length === 0"
          class="text-center py-12"
        >
          <Calendar class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-4 text-lg font-medium text-gray-900">No hay gastos directos</h3>
          <p class="mt-2 text-gray-600">No hay gastos directos registrados para este mes</p>
          <router-link to="/expenses" class="mt-4 btn-primary inline-flex">
            <Plus class="h-4 w-4 mr-2" />
            Agregar Gasto
          </router-link>
        </div>
      </template>
      <template v-else>
        <!-- Gastos en cuotas (cuotas del mes) por tarjeta -->
        <div
          v-for="card in cardsWithInstallments"
          :key="card.id"
          class="card"
        >
          <div class="card-header">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="card-title">{{ card.name }}</h3>
                <p class="card-subtitle">{{ card.type }} - {{ card.bank }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600">Total cuotas del mes</p>
                <p class="text-xl font-bold text-gray-900">
                  {{ formatCurrency(getCardInstallmentsMonthlyTotal(card.id)) }}
                </p>
              </div>
            </div>
          </div>
          <div class="space-y-3">
            <div
              v-for="installment in getCardInstallments(card.id)"
              :key="installment.id"
              class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :style="{ backgroundColor: installment.category_color + '20', color: installment.category_color }"
                    >
                      {{ installment.category_name || 'Sin categoría' }}
                    </span>
                    <span class="text-xs text-blue-600">Cuota {{ installment.installment_number }} de {{ installment.installments_count }}</span>
                  </div>
                  <p class="text-sm font-medium text-gray-900">{{ installment.description }}</p>
                  <p class="text-xs text-gray-600">Vence: {{ formatDate(installment.due_date) }}</p>
                </div>
                <div class="flex items-center space-x-4">
                  <div class="text-right">
                    <p class="text-sm font-medium text-blue-600">
                      {{ formatCurrency(installment.installment_amount) }}
                    </p>
                  </div>
                  <span
                    :class="[
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200',
                      installment.payment_status_code === 'pagada'
                        ? 'bg-success-100 text-success-800'
                        : installment.payment_status_code === 'en_deuda'
                        ? 'bg-danger-100 text-danger-800'
                        : 'bg-warning-100 text-warning-800'
                    ]"
                  >
                    {{ installment.payment_status_label || 'Sin estado' }}
                  </span>
                </div>
              </div>
            </div>
            <div
              v-if="getCardInstallments(card.id).length === 0"
              class="text-center py-8 text-gray-500"
            >
              <CreditCard class="mx-auto h-8 w-8 mb-2" />
              <p class="text-sm">No hay cuotas para este mes</p>
            </div>
          </div>
        </div>
        <div
          v-if="cardsWithInstallments.length === 0"
          class="text-center py-12"
        >
          <Calendar class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-4 text-lg font-medium text-gray-900">No hay cuotas</h3>
          <p class="mt-2 text-gray-600">No hay cuotas registradas para este mes</p>
          <router-link to="/expenses" class="mt-4 btn-primary inline-flex">
            <Plus class="h-4 w-4 mr-2" />
            Agregar Gasto
          </router-link>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useExpensesStore } from '@/stores/expenses'
import { useCardsStore } from '@/stores/cards'
import { useCategoriesStore } from '@/stores/categories'
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CreditCard,
  Calendar,
  Plus
} from 'lucide-vue-next'
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import SkeletonSummary from '@/components/SkeletonSummary.vue'
import SkeletonList from '@/components/SkeletonList.vue'

const expensesStore = useExpensesStore()
const cardsStore = useCardsStore()
const categoriesStore = useCategoriesStore()

const selectedDate = ref(new Date())
const showPaid = ref(true)
const showDirectExpenses = ref(true)
const isLoading = ref(true) // Estado de loading local para evitar doble carga

// Computed properties
const currentMonth = computed(() => selectedDate.value.getMonth() + 1)
const currentYear = computed(() => selectedDate.value.getFullYear())

const monthlyExpenses = computed(() => {
  return expensesStore.expenses.filter(expense => {
    const expenseDate = parseISO(expense.purchase_date)
    return expenseDate.getMonth() + 1 === currentMonth.value &&
           expenseDate.getFullYear() === currentYear.value
  })
})

const monthlyTotal = computed(() => {
  return monthlyExpenses.value.reduce((total, expense) => total + expense.amount, 0)
})

const cardsWithExpenses = computed(() => {
  return cardsStore.cards.filter(card => {
    return monthlyExpenses.value.some(expense => expense.card_id === card.id)
  })
})

// Computed para gastos directos del mes
const directMonthlyExpenses = computed(() => {
  return expensesStore.expenses.filter(expense => {
    const expenseDate = parseISO(expense.purchase_date)
    return (
      expenseDate.getMonth() + 1 === currentMonth.value &&
      expenseDate.getFullYear() === currentYear.value &&
      (!expense.installments_count || expense.installments_count === 1)
    )
  })
})

const cardsWithDirectExpenses = computed(() => {
  return cardsStore.cards.filter(card => {
    return directMonthlyExpenses.value.some(expense => expense.card_id === card.id)
  })
})

const getCardDirectExpenses = (cardId) => {
  let expenses = directMonthlyExpenses.value.filter(expense => expense.card_id === cardId)
  if (!showPaid.value) {
    expenses = expenses.filter(expense => expense.payment_status_code !== 'pagada')
  }
  return expenses
}

const getCardDirectMonthlyTotal = (cardId) => {
  return directMonthlyExpenses.value
    .filter(expense => expense.card_id === cardId)
    .reduce((total, expense) => total + expense.amount, 0)
}

// Computed para cuotas del mes
const monthlyInstallments = computed(() => {
  return expensesStore.installments.filter(installment => {
    const installmentDate = parseISO(installment.due_date)
    return (
      installmentDate.getMonth() + 1 === currentMonth.value &&
      installmentDate.getFullYear() === currentYear.value
    )
  })
})

const cardsWithInstallments = computed(() => {
  return cardsStore.cards.filter(card => {
    return monthlyInstallments.value.some(installment => installment.card_id === card.id)
  })
})

const getCardInstallments = (cardId) => {
  let installments = monthlyInstallments.value.filter(installment => installment.card_id === cardId)
  if (!showPaid.value) {
    installments = installments.filter(installment => installment.payment_status_code !== 'pagada')
  }
  return installments
}

const getCardInstallmentsMonthlyTotal = (cardId) => {
  return monthlyInstallments.value
    .filter(installment => installment.card_id === cardId)
    .reduce((total, installment) => total + installment.installment_amount, 0)
}

// Funciones
const formatMonthYear = (date) => {
  return format(date, 'MMMM yyyy', { locale: es })
}

const formatDate = (date) => {
  return format(parseISO(date), 'dd/MM/yyyy', { locale: es })
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount)
}

const getCardMonthlyTotal = (cardId) => {
  return monthlyExpenses.value
    .filter(expense => expense.card_id === cardId)
    .reduce((total, expense) => total + expense.amount, 0)
}

const getCardExpenses = (cardId) => {
  let expenses = monthlyExpenses.value.filter(expense => expense.card_id === cardId)
  
  if (!showPaid.value) {
    expenses = expenses.filter(expense => expense.payment_status_code !== 'pagada')
  }
  
  return expenses
}

const getMonthlyInstallments = (expenseId) => {
  return expensesStore.installments.filter(installment => {
    const installmentDate = parseISO(installment.due_date)
    return installment.expense_id === expenseId &&
           installmentDate.getMonth() + 1 === currentMonth.value &&
           installmentDate.getFullYear() === currentYear.value
  })
}

const previousMonth = () => {
  selectedDate.value = subMonths(selectedDate.value, 1)
}

const nextMonth = () => {
  selectedDate.value = addMonths(selectedDate.value, 1)
}

const togglePaidStatus = async (expense) => {
  const currentStatus = expense.payment_status_code;
  const newStatusId = currentStatus === 'pagada' ? 1 : 2; // 1 = pendiente, 2 = pagada
  await expensesStore.markAsPaid(expense.id, newStatusId)
}

const toggleInstallmentPaid = async (installment) => {
  const currentStatus = installment.payment_status_code;
  const newStatusCode = currentStatus === 'pagada' ? 'pendiente' : 'pagada';
  await expensesStore.markInstallmentAsPaid(installment.id, newStatusCode)
}

// Cargar datos
const loadData = async () => {
  isLoading.value = true
  try {
    await Promise.all([
      expensesStore.loadExpenses(),
      cardsStore.loadCards(),
      categoriesStore.loadCategories()
    ])
  } finally {
    isLoading.value = false
  }
}

// Observar cambios en el mes seleccionado
watch([currentMonth, currentYear], async () => {
  isLoading.value = true
  try {
    await expensesStore.updateFilters({
      month: currentMonth.value,
      year: currentYear.value
    })
    await expensesStore.loadExpenses()
  } finally {
    isLoading.value = false
  }
})

onMounted(async () => {
  await loadData()
})
</script> 