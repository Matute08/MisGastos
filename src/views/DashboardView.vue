<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600">Resumen de tus gastos y finanzas</p>
      </div>
      
    </div>

    <!-- Switch anual/mensual -->
    <div class="flex justify-end mb-2">
      <div class="flex items-center gap-2 bg-white rounded-lg shadow px-3 py-1">
        <span :class="['text-sm font-medium', !isAnnual ? 'text-blue-600' : 'text-gray-500']">Mensual</span>
        <button @click="isAnnual = !isAnnual" class="relative w-12 h-6 bg-gray-200 rounded-full transition-colors duration-300 focus:outline-none">
          <span :class="['absolute left-1 top-1 w-4 h-4 rounded-full transition-transform duration-300', isAnnual ? 'translate-x-6 bg-blue-600' : 'bg-gray-400']"></span>
        </button>
        <span :class="['text-sm font-medium', isAnnual ? 'text-blue-600' : 'text-gray-500']">Anual</span>
      </div>
    </div>
            <!-- Cuentas de resumen (solo desktop) -->
    <div class="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-{{ 1 + creditCards.length }} gap-6">
      <!-- Total gastos (mes o año) -->
      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <DollarSign class="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">{{ isAnnual ? 'Total Año' : 'Total Mes' }}</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ formatCurrency(totalExpensesView) }}
            </p>
          </div>
        </div>
      </div>
      <!-- Resumen por tarjeta de crédito -->
      <div v-for="card in creditCards" :key="card.id" class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard class="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">{{ card.name }}</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ formatCurrency(cardTotal(card)) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Diseño compacto para móviles -->
    <div class="block md:hidden">
      <div class="bg-white rounded-lg shadow p-4">
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Resumen de Cuentas</h3>
        <div class="space-y-3">
          <!-- Total compacto -->
          <div class="flex items-center justify-between py-2 border-b border-gray-100">
            <div class="flex items-center">
              <div class="w-6 h-6 bg-primary-100 rounded-md flex items-center justify-center mr-3">
                <DollarSign class="h-4 w-4 text-primary-600" />
              </div>
              <span class="text-sm font-medium text-gray-600">{{ isAnnual ? 'Total Año' : 'Total Mes' }}</span>
            </div>
            <span class="text-lg font-bold text-gray-900">{{ formatCurrency(totalExpensesView) }}</span>
          </div>
          <!-- Cuentas compactas -->
          <div v-for="card in creditCards" :key="card.id" class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
            <div class="flex items-center">
              <div class="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                <CreditCard class="h-4 w-4 text-blue-600" />
              </div>
              <span class="text-sm font-medium text-gray-600">{{ card.name }}</span>
            </div>
            <span class="text-lg font-bold text-gray-900">{{ formatCurrency(cardTotal(card)) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráficos Desktop -->
    <div class="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Gráfico por categorías -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Gastos por Categoría</h3>
          <p class="card-subtitle">Distribución de gastos por categoría</p>
        </div>
        <div class="h-64">
          <Pie
            v-if="chartData.categories.labels.length > 0"
            :data="chartData.categories"
            :options="chartOptions"
          />
          <div v-else class="h-full flex items-center justify-center text-gray-500">
            No hay datos para mostrar
          </div>
        </div>
      </div>
              <!-- Gráfico por cuentas -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Gastos por Tarjeta</h3>
          <p class="card-subtitle">Distribución de gastos por tarjeta</p>
        </div>
        <div class="h-64">
          <Bar
            v-if="chartData.cards.labels.length > 0"
            :data="chartData.cards"
            :options="barChartOptions"
          />
          <div v-else class="h-full flex items-center justify-center text-gray-500">
            No hay datos para mostrar
          </div>
        </div>
      </div>
      <!-- Gráfico de evolución mensual solo si es anual -->
      <div v-if="isAnnual" class="card">
        <div class="card-header">
          <h3 class="card-title">Evolución de Gastos Mensuales</h3>
          <p class="card-subtitle">Gastos totales por mes</p>
        </div>
        <div class="h-64">
          <Bar
            v-if="evolutionChartData.labels.length > 0"
            :data="evolutionChartData"
            :options="evolutionChartOptions"
          />
          <div v-else class="h-full flex items-center justify-center text-gray-500">
            No hay datos para mostrar
          </div>
        </div>
      </div>
    </div>

    <!-- Carrusel de gráficos para móviles -->
    <div class="block lg:hidden">
      <div class="relative">
        <!-- Contenedor del carrusel -->
        <div class="overflow-hidden">
          <div 
            class="flex transition-transform duration-300 ease-in-out"
            :style="{ transform: `translateX(-${currentChartIndex * 100}%)` }"
            @touchstart="handleTouchStart"
            @touchend="handleTouchEnd"
          >
            <!-- Gráfico por categorías -->
            <div class="w-full flex-shrink-0">
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">Gastos por Categoría</h3>
                  <p class="card-subtitle">Distribución de gastos por categoría</p>
                </div>
                <div class="h-64">
                  <Pie
                    v-if="chartData.categories.labels.length > 0"
                    :data="chartData.categories"
                    :options="chartOptions"
                  />
                  <div v-else class="h-full flex items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Gráfico por cuentas -->
            <div class="w-full flex-shrink-0">
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">Gastos por Tarjeta</h3>
                  <p class="card-subtitle">Distribución de gastos por tarjeta</p>
                </div>
                <div class="h-64">
                  <Bar
                    v-if="chartData.cards.labels.length > 0"
                    :data="chartData.cards"
                    :options="barChartOptions"
                  />
                  <div v-else class="h-full flex items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Gráfico de evolución mensual solo si es anual -->
            <div v-if="isAnnual" class="w-full flex-shrink-0">
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">Evolución de Gastos Mensuales</h3>
                  <p class="card-subtitle">Gastos totales por mes</p>
                </div>
                <div class="h-64">
                  <Bar
                    v-if="evolutionChartData.labels.length > 0"
                    :data="evolutionChartData"
                    :options="evolutionChartOptions"
                  />
                  <div v-else class="h-full flex items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Indicadores de navegación -->
        <div class="flex justify-center mt-4 space-x-2">
          <button
            v-for="(chart, index) in availableCharts"
            :key="index"
            @click="currentChartIndex = index"
            :class="[
              'w-2 h-2 rounded-full transition-colors duration-200',
              currentChartIndex === index ? 'bg-blue-600' : 'bg-gray-300'
            ]"
            :aria-label="`Ir al gráfico ${index + 1}`"
          ></button>
        </div>
        
        <!-- Botones de navegación (opcionales) -->
        <button
          v-if="currentChartIndex > 0"
          @click="currentChartIndex--"
          class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg border border-gray-200"
          aria-label="Gráfico anterior"
        >
          <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        
        <button
          v-if="currentChartIndex < availableCharts.length - 1"
          @click="currentChartIndex++"
          class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg border border-gray-200"
          aria-label="Gráfico siguiente"
        >
          <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </div>
    <!-- Próximos vencimientos Desktop -->
    <div class="hidden lg:block card">
      <div class="card-header">
        <h3 class="card-title">Próximos Vencimientos</h3>
        <p class="card-subtitle">Pagos próximos a vencer</p>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarjeta</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="inst in paginatedUpcomingInstallments" :key="inst.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ inst.expenses?.description || 'Cuota' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ inst.expenses?.cards?.name || 'Sin tarjeta' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :style="{ backgroundColor: (inst.expenses?.categories?.color || '#888') + '20', color: inst.expenses?.categories?.color || '#888' }">
                  {{ inst.expenses?.categories?.name || 'Sin categoría' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ formatCurrency(inst.amount) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ formatDate(inst.due_date) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', inst.payment_status_id === 3 ? 'bg-danger-100 text-danger-800' : 'bg-warning-100 text-warning-800']">
                  {{ inst.payment_status_id === 3 ? 'En deuda' : 'Pendiente' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="totalVencimientosPages > 1" class="flex justify-center mt-4">
        <nav class="flex items-center space-x-2">
          <button
            @click="setVencimientosPage(vencimientosPage - 1)"
            :disabled="vencimientosPage === 1"
            class="px-3 py-1 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span class="px-3 py-1 rounded-md text-gray-600">
            Página {{ vencimientosPage }} de {{ totalVencimientosPages }}
          </span>
          <button
            @click="setVencimientosPage(vencimientosPage + 1)"
            :disabled="vencimientosPage === totalVencimientosPages"
            class="px-3 py-1 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </nav>
      </div>
    </div>

    <!-- Próximos vencimientos Móvil -->
    <div class="block lg:hidden">
      <div class="bg-white rounded-lg shadow">
        <div class="px-4 py-3 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Próximos Vencimientos</h3>
          <p class="text-sm text-gray-600">Pagos próximos a vencer</p>
        </div>
        
        <div class="divide-y divide-gray-100">
          <div v-for="inst in paginatedUpcomingInstallments" :key="inst.id" class="p-4">
            <!-- Header con estado -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 rounded-full" :class="inst.payment_status_id === 3 ? 'bg-red-500' : 'bg-yellow-500'"></div>
                <span class="text-xs font-medium" :class="inst.payment_status_id === 3 ? 'text-red-600' : 'text-yellow-600'">
                  {{ inst.payment_status_id === 3 ? 'En deuda' : 'Pendiente' }}
                </span>
              </div>
              <span class="text-sm text-gray-500">{{ formatDate(inst.due_date) }}</span>
            </div>
            
                         <!-- Información principal -->
             <div class="mb-3">
               <div class="flex items-center justify-between mb-1">
                 <h4 class="font-medium text-gray-900 text-sm">
                   {{ inst.expenses?.description || 'Cuota' }}
                 </h4>
                 <span class="text-lg font-bold text-gray-900">{{ formatCurrency(inst.amount) }}</span>
               </div>
               <div class="flex items-center space-x-2 text-xs text-gray-600">
                 <span>{{ inst.expenses?.cards?.name || 'Sin cuenta' }}</span>
                 <span>•</span>
                 <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" 
                       :style="{ backgroundColor: (inst.expenses?.categories?.color || '#888') + '20', color: inst.expenses?.categories?.color || '#888' }">
                   {{ inst.expenses?.categories?.name || 'Sin categoría' }}
                 </span>
               </div>
             </div>
          </div>
        </div>
        
        <!-- Paginación móvil -->
        <div v-if="totalVencimientosPages > 1" class="px-4 py-3 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <button
              @click="setVencimientosPage(vencimientosPage - 1)"
              :disabled="vencimientosPage === 1"
              class="flex items-center space-x-1 text-sm text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              <span>Anterior</span>
            </button>
            
            <span class="text-sm text-gray-600">
              {{ vencimientosPage }} de {{ totalVencimientosPages }}
            </span>
            
            <button
              @click="setVencimientosPage(vencimientosPage + 1)"
              :disabled="vencimientosPage === totalVencimientosPages"
              class="flex items-center space-x-1 text-sm text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Siguiente</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useExpensesStore } from '@/stores/expenses'
import { useCardsStore } from '@/stores/cards'
import { useCategoriesStore } from '@/stores/categories'
import { Pie, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js'
import {
  DollarSign,
  Calendar,
  CreditCard,
  Tag,
  Plus
} from 'lucide-vue-next'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

// Registrar componentes de Chart.js
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement
)

const expensesStore = useExpensesStore()
const cardsStore = useCardsStore()
const categoriesStore = useCategoriesStore()

const isAnnual = ref(false)

// Estado para el carrusel de gráficos móviles
const currentChartIndex = ref(0)
const touchStartX = ref(0)
const touchEndX = ref(0)

// Gráficos disponibles para el carrusel
const availableCharts = computed(() => {
  const charts = [
    { name: 'Categorías', type: 'categories' },
          { name: 'Cuentas', type: 'cards' }
  ]
  
  // Agregar gráfico de evolución solo si es vista anual
  if (isAnnual.value) {
    charts.push({ name: 'Evolución', type: 'evolution' })
  }
  
  return charts
})

// Funciones para gestos táctiles
const handleTouchStart = (event) => {
  touchStartX.value = event.touches[0].clientX
}

const handleTouchEnd = (event) => {
  touchEndX.value = event.changedTouches[0].clientX
  handleSwipe()
}

const handleSwipe = () => {
  const swipeThreshold = 50
  const diff = touchStartX.value - touchEndX.value
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0 && currentChartIndex.value < availableCharts.value.length - 1) {
      // Swipe izquierda - siguiente gráfico
      currentChartIndex.value++
    } else if (diff < 0 && currentChartIndex.value > 0) {
      // Swipe derecha - gráfico anterior
      currentChartIndex.value--
    }
  }
}

// Cargar próximos vencimientos al montar
// Próximos vencimientos: solo cuotas pendientes/en deuda y con due_date >= hoy
const upcomingInstallmentsList = computed(() => {
  const today = new Date()
  return expensesStore.upcomingInstallments.filter(inst => {
    const due = parseISO(inst.due_date)
    return due >= today && (inst.payment_status_id === 1 || inst.payment_status_id === 3)
  })
})
onMounted(async () => {
  await Promise.all([
    expensesStore.loadExpenses(),
    expensesStore.loadUpcomingInstallments(1000), // Traer todas las cuotas posibles
    cardsStore.loadCards(),
    categoriesStore.loadCategories()
  ])
  // upcomingInstallmentsList.value = expensesStore.filteredUpcomingInstallments // This line is no longer needed
})

// Resetear índice del carrusel cuando cambie la vista anual/mensual
watch(isAnnual, () => {
  currentChartIndex.value = 0
})

// Gastos del mes actual
const monthlyExpenses = computed(() => {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  
  return expensesStore.expenses
    .filter(expense => {
      const expenseDate = parseISO(expense.purchase_date)
      return expenseDate.getMonth() + 1 === currentMonth && 
             expenseDate.getFullYear() === currentYear
    })
    .reduce((total, expense) => total + expense.amount, 0)
})

// Gastos recientes (últimos 5)
const recentExpenses = computed(() => {
  return expensesStore.expenses.slice(0, 5)
})

// Utilidad para saber si un gasto es directo y en efectivo/transferencia
function isDirectCashOrTransfer(expense) {
  // Si no tiene installments_count o es 1, y la tarjeta es null o no es de crédito
  const isDirect = !expense.installments_count || expense.installments_count === 1
  const isCashOrTransfer = !expense.cards || expense.cards.type === 'Efectivo' || expense.cards.type === 'Transferencia' || expense.card_id === null
  return isDirect && isCashOrTransfer
}

// Total del mes/año: cuotas a pagar + todos los gastos
const totalExpensesView = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  
  if (isAnnual.value) {
    // Vista anual: solo todos los gastos del año (ya incluyen las cuotas)
    const annualExpenses = expensesStore.expenses.filter(expense => {
      const date = parseISO(expense.purchase_date)
      return date.getFullYear() === currentYear
    })
    const annualTotal = annualExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    
    return annualTotal
  } else {
    // Vista mensual: gastos del mes + cuotas que vencen en el mes
    const monthlyExpenses = expensesStore.expenses.filter(expense => {
      const date = parseISO(expense.purchase_date)
      return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear
    })
    const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    
    // Cuotas que vencen en el mes actual (incluyendo las ya pagadas)
    const monthlyInstallments = expensesStore.upcomingInstallments.filter(inst => {
      const due = parseISO(inst.due_date)
      return due.getMonth() + 1 === currentMonth && due.getFullYear() === currentYear
    })
    const monthlyInstallmentsTotal = monthlyInstallments.reduce((sum, inst) => sum + inst.amount, 0)
    
    return monthlyTotal + monthlyInstallmentsTotal
  }
})

// Datos para los gráficos (anual o mensual)
const chartData = computed(() => {
  let categories = {}
  let cards = {}
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  if (isAnnual.value) {
    // Cuotas a pagar de cualquier cuenta
    expensesStore.upcomingInstallments.forEach(inst => {
      const due = parseISO(inst.due_date)
      if (due.getFullYear() === currentYear && inst.payment_status_id !== 3 && inst.expenses && inst.expenses.cards) {
        const card = inst.expenses.cards.name || 'Sin cuenta'
        cards[card] = (cards[card] || 0) + inst.amount
      }
      if (due.getFullYear() === currentYear && inst.payment_status_id !== 3 && inst.expenses && inst.expenses.categories) {
        const cat = inst.expenses.categories.name || 'Sin categoría'
        categories[cat] = (categories[cat] || 0) + inst.amount
      }
    })
    // Gastos directos en efectivo/transferencia o cualquier cuenta
    expensesStore.expenses.forEach(expense => {
      const date = parseISO(expense.purchase_date)
      // Para ambos gráficos: cualquier gasto directo suma a la categoría
      const isPeriodo = isAnnual.value
        ? date.getFullYear() === currentYear
        : date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear
      if (isPeriodo && (!expense.installments_count || expense.installments_count === 1)) {
        const cat = expense.categories?.name || 'Sin categoría'
        categories[cat] = (categories[cat] || 0) + expense.amount
      }
      // Para cuentas, cualquier gasto directo con cuenta
      if (isPeriodo && (!expense.installments_count || expense.installments_count === 1) && expense.cards) {
        const card = expense.cards.name || 'Sin cuenta'
        cards[card] = (cards[card] || 0) + expense.amount
      }
    })
  } else {
    // Mensual: cuotas a pagar de cualquier cuenta en el mes
    expensesStore.upcomingInstallments.forEach(inst => {
      const due = parseISO(inst.due_date)
      if (due.getMonth() + 1 === currentMonth && due.getFullYear() === currentYear && inst.payment_status_id !== 3 && inst.expenses && inst.expenses.cards) {
        const card = inst.expenses.cards.name || 'Sin cuenta'
        cards[card] = (cards[card] || 0) + inst.amount
      }
      if (due.getMonth() + 1 === currentMonth && due.getFullYear() === currentYear && inst.payment_status_id !== 3 && inst.expenses && inst.expenses.categories) {
        const cat = inst.expenses.categories.name || 'Sin categoría'
        categories[cat] = (categories[cat] || 0) + inst.amount
      }
    })
    // Gastos directos en efectivo/transferencia o cualquier cuenta
    expensesStore.expenses.forEach(expense => {
      const date = parseISO(expense.purchase_date)
      // Para ambos gráficos: cualquier gasto directo suma a la categoría
      const isPeriodo = isAnnual.value
        ? date.getFullYear() === currentYear
        : date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear
      if (isPeriodo && (!expense.installments_count || expense.installments_count === 1)) {
        const cat = expense.categories?.name || 'Sin categoría'
        categories[cat] = (categories[cat] || 0) + expense.amount
      }
      // Para cuentas, cualquier gasto directo con cuenta
      if (isPeriodo && (!expense.installments_count || expense.installments_count === 1) && expense.cards) {
        const card = expense.cards.name || 'Sin cuenta'
        cards[card] = (cards[card] || 0) + expense.amount
      }
    })
  }
  // Filtrar solo categorías y cuentas con gasto > 0
  categories = Object.fromEntries(Object.entries(categories).filter(([_, v]) => v > 0))
  cards = Object.fromEntries(Object.entries(cards).filter(([_, v]) => v > 0))
  return {
    categories: {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
          '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
        ]
      }]
    },
    cards: {
      labels: Object.keys(cards),
      datasets: [{
        label: 'Gastos',
        data: Object.values(cards),
        backgroundColor: '#3B82F6'
      }]
    }
  }
})

// Gráfico de evolución de gastos mensuales
const evolutionChartData = computed(() => {
  const currentYear = new Date().getFullYear()
  const months = Array.from({ length: 12 }, (_, i) => i)
  // Sumar cuotas a pagar de cada mes
  const monthlyInstallments = months.map(m => {
    return expensesStore.upcomingInstallments
      .filter(inst => {
        const due = parseISO(inst.due_date)
        return due.getMonth() === m && due.getFullYear() === currentYear && inst.payment_status_id !== 3
      })
      .reduce((total, inst) => total + inst.amount, 0)
  })
  // Sumar gastos directos de cada mes
  const monthlyDirect = months.map(m => {
    return expensesStore.expenses
      .filter(e => {
        const d = parseISO(e.purchase_date)
        return d.getMonth() === m && d.getFullYear() === currentYear && (!e.installments_count || e.installments_count === 1)
      })
      .reduce((total, e) => total + e.amount, 0)
  })
  // Sumar ambos para el total mensual
  const monthlyTotals = months.map((m, i) => monthlyInstallments[i] + monthlyDirect[i])
  return {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [{
      label: 'Gastos',
      data: monthlyTotals,
      backgroundColor: '#6366F1',
      borderColor: '#6366F1',
      fill: false,
      tension: 0.3
    }]
  }
})
const evolutionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true } }
}

// Opciones para el gráfico de pie
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
}

// Opciones para el gráfico de barras
const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

// Funciones de utilidad
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount)
}

const formatDate = (date) => {
  return format(parseISO(date), 'dd/MM/yyyy', { locale: es })
}

const creditCards = computed(() => cardsStore.creditCards)

// Total por tarjeta de crédito (cuotas a pagar + gastos directos de esa tarjeta en el mes/año)
function cardTotal(card) {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  
  if (isAnnual.value) {
    // Vista anual: solo todos los gastos del año (ya incluyen las cuotas)
    const annualExpenses = expensesStore.expenses.filter(expense => {
      const expenseDate = parseISO(expense.purchase_date)
      const isCard = expense.card_id === card.id
      return isCard && expenseDate.getFullYear() === currentYear
    })
    const annualTotal = annualExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    
    return annualTotal
  } else {
    // Vista mensual: gastos del mes + cuotas que vencen en el mes
    const monthlyExpenses = expensesStore.expenses.filter(expense => {
      const expenseDate = parseISO(expense.purchase_date)
      const isCard = expense.card_id === card.id
      return isCard && expenseDate.getMonth() + 1 === currentMonth && expenseDate.getFullYear() === currentYear
    })
    const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    
    // Cuotas que vencen en el mes actual (incluyendo las ya pagadas)
    const monthlyInstallments = expensesStore.upcomingInstallments.filter(inst => {
      const due = parseISO(inst.due_date)
      // Buscar el gasto original para obtener la tarjeta
      const originalExpense = expensesStore.expenses.find(exp => exp.id === inst.expense_id)
      const isCard = originalExpense && originalExpense.card_id === card.id
      return isCard && due.getMonth() + 1 === currentMonth && due.getFullYear() === currentYear
    })
    const monthlyInstallmentsTotal = monthlyInstallments.reduce((sum, inst) => sum + inst.amount, 0)
    
    return monthlyTotal + monthlyInstallmentsTotal
  }
}

// Estado para paginación de próximos vencimientos
const vencimientosPage = ref(1)
const vencimientosPerPage = 5
const paginatedUpcomingInstallments = computed(() => {
  const start = (vencimientosPage.value - 1) * vencimientosPerPage
  const end = start + vencimientosPerPage
  return upcomingInstallmentsList.value.slice(start, end)
})
const totalVencimientosPages = computed(() => Math.ceil(upcomingInstallmentsList.value.length / vencimientosPerPage))
function setVencimientosPage(page) {
  vencimientosPage.value = page
}
</script> 