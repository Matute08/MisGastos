<template>
  <div class="space-y-6">
    <!-- Header (mobile) -->
    <div class="lg:hidden">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-gray-100">Dashboard</h1>
      <p class="text-slate-500 dark:text-gray-400">Resumen de tus finanzas</p>
    </div>

    <!-- Hero Balance Card -->
    <DashboardHeroCard
      :is-loading="isLoading"
      :is-annual="isAnnual"
      :balance-view="balanceView"
      :previous-period-balance="previousPeriodBalance"
      :saved-usd-view="savedUsdView"
      :saved-ars-view="savedArsView"
      :total-income-view="totalIncomeView"
      :total-expenses-view="totalExpensesView"
      :format-currency="formatCurrency"
      :format-usd="formatUsd"
      @update:is-annual="isAnnual = $event"
    />

    <!-- Stats Row (3 cards) -->
    <DashboardStatsCards
      :is-loading="isLoading"
      :is-annual="isAnnual"
      :total-income-view="totalIncomeView"
      :previous-period-income="previousPeriodIncome"
      :total-expenses-view="totalExpensesView"
      :previous-period-expenses="previousPeriodExpenses"
      :savings-percentage="savingsPercentage"
      :format-currency="formatCurrency"
    />

    <!-- Credit Cards & Account Summary -->
    <DashboardCardsSummary
      :is-loading="isLoading"
      :is-annual="isAnnual"
      :credit-cards-list="expensesStore.creditCardsSummary || []"
      :expenses-summary-by-type="expensesStore.expensesSummaryByType || []"
      :total-expenses-view="totalExpensesView"
      :format-currency="formatCurrency"
    />

    <!-- Charts Section (Desktop Grid & Mobile Carousel) -->
    <DashboardChartsSection
      :is-loading="isLoading"
      :is-annual="isAnnual"
      :chart-data="chartData"
      :evolution-chart-data="evolutionChartData"
      :top-expenses-chart-data="topExpensesChartData"
      :payment-type-chart-data="paymentTypeChartData"
      :doughnut-options="doughnutOptions"
      :bar-chart-options="barChartOptions"
      :evolution-chart-options="evolutionChartOptions"
      :top-expenses-chart-options="topExpensesChartOptions"
      :payment-type-doughnut-options="paymentTypeDoughnutOptions"
      :center-text-plugin="centerTextPlugin"
      :category-chart-export="categoryChartExport"
      :cards-chart-export="cardsChartExport"
      :evolution-chart-export="evolutionChartExport"
      :top-expenses-chart-export="topExpensesChartExport"
      :payment-type-chart-export="paymentTypeChartExport"
    />

    <!-- Upcoming Payments Table & Mobile Cards -->
    <DashboardInstallmentsTable
      :is-loading="isLoading"
      :upcoming-installments-list="upcomingInstallmentsList"
      :format-currency="formatCurrency"
      :format-date="formatDate"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useExpensesStore } from '@/stores/expenses'
import { useIncomesStore } from '@/stores/incomes'
import { useCardsStore } from '@/stores/cards'
import { useCategoriesStore } from '@/stores/categories'
import { useSavingsStore } from '@/stores/savings'
import { incomes as incomesApi, expenses as expensesApi, activity as activityApi } from '@/lib/api'

// Subcomponentes modulares
import DashboardHeroCard from '@/views/dashboard/components/DashboardHeroCard.vue'
import DashboardStatsCards from '@/views/dashboard/components/DashboardStatsCards.vue'
import DashboardCardsSummary from '@/views/dashboard/components/DashboardCardsSummary.vue'
import DashboardChartsSection from '@/views/dashboard/components/DashboardChartsSection.vue'
import DashboardInstallmentsTable from '@/views/dashboard/components/DashboardInstallmentsTable.vue'

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  directExpenseBelongsToPeriod,
  getMonthRange,
  getYearRange
} from '@/utils/expenseDirectInPeriod'


ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
  CategoryScale,
  LinearScale,
  BarElement
)

const expensesStore = useExpensesStore()
const incomesStore = useIncomesStore()
const cardsStore = useCardsStore()
const categoriesStore = useCategoriesStore()
const savingsStore = useSavingsStore()

const isAnnual = ref(false)
const showAllCards = ref(false)
const showSavingsHelp = ref(false)
const savingsHelpRef = ref(null)
const isLoading = ref(true)
const previousMonthCarry = ref(0)
const monthlyActivitySummary = ref(null)

const currentChartIndex = ref(0)
const touchStartX = ref(0)

const currentMonth = new Date().getMonth() + 1
const currentYear = new Date().getFullYear()

const previousPeriodIncome = ref(0)
const previousPeriodExpenses = ref(0)
const previousPeriodBalance = ref(0)

// --- Utility ---
const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)

const formatUsd = (amount) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount || 0)

const formatDate = (date) =>
  format(parseISO(date), 'dd/MM/yyyy', { locale: es })

const isPaidExpenseRow = (row) => {
  const code = row.payment_status?.code
  if (code) return code === 'pagada'
  return row.payment_status_id === 2
}

const directExpenseCountsTowardBalance = (expense) => {
  if (expense.available_cards?.type === 'Crédito') return isPaidExpenseRow(expense)
  return true
}

const installmentCountsTowardBalance = (inst) => isPaidExpenseRow(inst)

// --- Center text plugin for Doughnut ---
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, chartArea } = chart
    if (!chartArea) return
    const dataset = chart.data.datasets[0]
    if (!dataset || !dataset.data || dataset.data.length === 0) return
    const total = dataset.data.reduce((sum, val) => sum + val, 0)
    const formatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(total)
    const centerX = (chartArea.left + chartArea.right) / 2
    const centerY = (chartArea.top + chartArea.bottom) / 2
    const innerRadius = chart._metasets?.[0]?.data?.[0]?.innerRadius || 0
    const maxWidth = innerRadius * 1.6
    let fontSize = 16
    ctx.save()
    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`
    while (ctx.measureText(formatted).width > maxWidth && fontSize > 9) {
      fontSize--
      ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`
    }
    ctx.fillStyle = '#1e293b'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(formatted, centerX, centerY)
    ctx.restore()
  }
}

// --- Credit Cards ---
const displayedCreditCards = computed(() => {
  const cards = expensesStore.creditCardsSummary || []
  return showAllCards.value ? cards : cards.slice(0, 4)
})

// --- Carousel ---
const availableCharts = computed(() => {
  return [
    { name: 'Categorías' },
    { name: 'Cuentas' },
    { name: 'Evolución' },
    { name: 'Top Gastos' },
    { name: 'Tipo de Pago' }
  ]
})

const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
}

const handleTouchEnd = (e) => {
  const diff = touchStartX.value - e.changedTouches[0].clientX
  if (Math.abs(diff) > 50) {
    if (diff > 0 && currentChartIndex.value < availableCharts.value.length - 1) {
      currentChartIndex.value++
    } else if (diff < 0 && currentChartIndex.value > 0) {
      currentChartIndex.value--
    }
  }
}

// --- Upcoming Installments ---
const upcomingInstallmentsList = computed(() => {
  const today = new Date()
  return expensesStore.upcomingInstallments.filter(inst => {
    const due = parseISO(inst.due_date)
    return due >= today && (inst.payment_status_id === 1 || inst.payment_status_id === 3)
  })
})

const vencimientosPage = ref(1)
const vencimientosPerPage = 5
const paginatedUpcomingInstallments = computed(() => {
  const start = (vencimientosPage.value - 1) * vencimientosPerPage
  return upcomingInstallmentsList.value.slice(start, start + vencimientosPerPage)
})
const totalVencimientosPages = computed(() =>
  Math.ceil(upcomingInstallmentsList.value.length / vencimientosPerPage)
)
function setVencimientosPage(page) {
  vencimientosPage.value = page
}

// --- Expenses total ---
const totalExpensesView = computed(() => {
  const now = new Date()
  const cm = now.getMonth() + 1
  const cy = now.getFullYear()

  // Para la vista mensual usamos el total mensual de gastos, no el flujo de actividad.
  if (!isAnnual.value) {
    if (expensesStore.monthlyTotals?.total_expenses != null) {
      return expensesStore.monthlyTotals.total_expenses
    }

    if (monthlyActivitySummary.value) {
      return monthlyActivitySummary.value.outcome || 0
    }
  }

  // Fallback y vista anual: misma imputación que gráficos y backend (crédito → first_installment_date)
  if (isAnnual.value) {
    const { startDate, endDate } = getYearRange(cy)
    const direct = expensesStore.expenses
      .filter(e => !e.installments_count || e.installments_count === 1)
      .filter(e => directExpenseBelongsToPeriod(e, startDate, endDate))
      .filter(directExpenseCountsTowardBalance)
      .reduce((sum, e) => sum + e.amount, 0)
    const inst = expensesStore.upcomingInstallments
      .filter(inst => {
        if (!installmentCountsTowardBalance(inst)) return false
        const due = parseISO(inst.due_date)
        return due.getFullYear() === cy
      })
      .reduce((sum, i) => sum + i.amount, 0)
    return direct + inst
  }

  const { startDate, endDate } = getMonthRange(cm, cy)
  const monthlyDirect = expensesStore.expenses
    .filter(e => !e.installments_count || e.installments_count === 1)
    .filter(e => directExpenseBelongsToPeriod(e, startDate, endDate))
    .filter(directExpenseCountsTowardBalance)
    .reduce((sum, e) => sum + e.amount, 0)

  const monthlyInst = expensesStore.upcomingInstallments
    .filter(inst => {
      if (!installmentCountsTowardBalance(inst)) return false
      const due = parseISO(inst.due_date)
      return due.getMonth() + 1 === cm && due.getFullYear() === cy
    })
    .reduce((sum, inst) => sum + inst.amount, 0)

  return monthlyDirect + monthlyInst
})

// --- Income total ---
const totalIncomeView = computed(() => {
  if (!isAnnual.value && monthlyActivitySummary.value) {
    return monthlyActivitySummary.value.income || 0
  }

  return incomesStore.incomes
    .filter((inc) => inc.affects_cash_balance !== false)
    .reduce((sum, inc) => sum + parseFloat(inc.amount), 0)
})

// --- Balance & Savings ---
/** Ahorro neto del período (ARS): lo que sale del flujo disponible al mes/año. */
const savingsNetForBalance = computed(() =>
  isAnnual.value
    ? savingsStore.netSavedInYear(currentYear)
    : savingsStore.netSavedInMonth(currentMonth, currentYear)
)

const balanceView = computed(() => {
  if (!isAnnual.value && monthlyActivitySummary.value) {
    return monthlyActivitySummary.value.cash_balance ?? monthlyActivitySummary.value.net ?? 0
  }

  const monthlyExpensesForBalance =
    !isAnnual.value && expensesStore.monthlyTotals?.total_balance_expenses != null
      ? expensesStore.monthlyTotals.total_balance_expenses
      : totalExpensesView.value
  const net = totalIncomeView.value - monthlyExpensesForBalance
  const base = isAnnual.value ? net : previousMonthCarry.value + net
  return base - savingsNetForBalance.value
})

const savingsPercentage = computed(() => {
  if (totalIncomeView.value <= 0) return 0
  return (balanceView.value / totalIncomeView.value) * 100
})

const savedUsdView = computed(() => savingsStore.totalSavedUsd || 0)
const savedArsView = computed(() => savingsStore.totalSavedArs || 0)

const loadPreviousMonthCarry = async () => {
  try {
    const activityRes = await activityApi.getBalanceActivity({ month: currentMonth, year: currentYear })
    const summary = activityRes?.data?.summary || null
    monthlyActivitySummary.value = summary
    previousMonthCarry.value = summary?.opening_balance || 0
  } catch {
    monthlyActivitySummary.value = null
    previousMonthCarry.value = 0
  }
}

// --- Chart Data: Categories & Cards ---
const chartColors = [
  '#6366F1', '#10B981', '#F59E0B', '#F43F5E',
  '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
  '#EC4899', '#14B8A6', '#EAB308', '#3B82F6'
]

const chartData = computed(() => {
  let categories = {}
  let cards = {}
  const cm = currentMonth
  const cy = currentYear

  const addInstallments = (monthFilter) => {
    expensesStore.upcomingInstallments.forEach(inst => {
      const due = parseISO(inst.due_date)
      const match = monthFilter
        ? due.getMonth() + 1 === cm && due.getFullYear() === cy
        : due.getFullYear() === cy
      if (!match || !installmentCountsTowardBalance(inst)) return

      if (inst.expenses?.categories) {
        const cat = inst.expenses.categories.name || 'Sin categoría'
        categories[cat] = (categories[cat] || 0) + inst.amount
      }
      if (inst.expenses?.available_cards) {
        const card = inst.expenses.available_cards.name || 'Sin cuenta'
        cards[card] = (cards[card] || 0) + inst.amount
      }
    })
  }

  const addDirectExpenses = (monthFilter) => {
    const { startDate, endDate } = monthFilter
      ? getMonthRange(cm, cy)
      : getYearRange(cy)
    expensesStore.expenses.forEach(expense => {
      if (expense.installments_count && expense.installments_count > 1) return
      if (!directExpenseBelongsToPeriod(expense, startDate, endDate)) return
      if (!directExpenseCountsTowardBalance(expense)) return

      const cat = expense.categories?.name || 'Sin categoría'
      categories[cat] = (categories[cat] || 0) + expense.amount
      if (expense.available_cards) {
        const card = expense.available_cards.name || 'Sin cuenta'
        cards[card] = (cards[card] || 0) + expense.amount
      }
    })
  }

  if (isAnnual.value) {
    addInstallments(false)
    addDirectExpenses(false)
  } else {
    addInstallments(true)
    addDirectExpenses(true)
  }

  categories = Object.fromEntries(Object.entries(categories).filter(([, v]) => v > 0))
  cards = Object.fromEntries(Object.entries(cards).filter(([, v]) => v > 0))

  const catLabels = Object.keys(categories)
  const cardLabels = Object.keys(cards)

  return {
    categories: {
      labels: catLabels,
      datasets: [{
        data: Object.values(categories),
        backgroundColor: catLabels.map((_, i) => chartColors[i % chartColors.length]),
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    cards: {
      labels: cardLabels,
      datasets: [{
        label: 'Gastos',
        data: Object.values(cards),
        backgroundColor: cardLabels.map((_, i) => chartColors[i % chartColors.length]),
        borderRadius: 8,
        borderSkipped: false
      }]
    }
  }
})

// --- Evolution Chart (income vs expenses per month) ---
const monthLabelsShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const evolutionChartData = computed(() => {
  const cy = currentYear
  const cm = currentMonth

  const getExpenseForMonth = (m, y) => {
    const inst = expensesStore.upcomingInstallments
      .filter(i => {
        if (!installmentCountsTowardBalance(i)) return false
        const due = parseISO(i.due_date)
        return due.getMonth() + 1 === m && due.getFullYear() === y
      })
      .reduce((sum, i) => sum + i.amount, 0)

    const { startDate, endDate } = getMonthRange(m, y)
    const direct = expensesStore.expenses
      .filter(e => {
        if (e.installments_count && e.installments_count > 1) return false
        return directExpenseBelongsToPeriod(e, startDate, endDate)
      })
      .filter(directExpenseCountsTowardBalance)
      .reduce((sum, e) => sum + e.amount, 0)

    return inst + direct
  }

  const getIncomeForMonth = (m, y) => {
    return incomesStore.incomesForChart
      .filter((inc) => inc.affects_cash_balance !== false)
      .filter(inc => {
        const d = parseISO(inc.income_date || inc.date || inc.created_at)
        return d.getMonth() + 1 === m && d.getFullYear() === y
      })
      .reduce((sum, inc) => sum + parseFloat(inc.amount), 0)
  }

  if (isAnnual.value) {
    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    return {
      labels: monthLabelsShort,
      datasets: [
        {
          label: 'Ingresos',
          data: months.map(m => getIncomeForMonth(m, cy)),
          backgroundColor: '#10B981',
          borderRadius: 8,
          borderSkipped: false
        },
        {
          label: 'Gastos',
          data: months.map(m => getExpenseForMonth(m, cy)),
          backgroundColor: '#F43F5E',
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    }
  }

  const periods = []
  for (let i = 5; i >= 0; i--) {
    let m = cm - i
    let y = cy
    if (m <= 0) { m += 12; y-- }
    periods.push({ m, y })
  }

  return {
    labels: periods.map(p => monthLabelsShort[p.m - 1]),
    datasets: [
      {
        label: 'Ingresos',
        data: periods.map(p => getIncomeForMonth(p.m, p.y)),
        backgroundColor: '#10B981',
        borderRadius: 8,
        borderSkipped: false
      },
      {
        label: 'Gastos',
        data: periods.map(p => getExpenseForMonth(p.m, p.y)),
        backgroundColor: '#F43F5E',
        borderRadius: 8,
        borderSkipped: false
      }
    ]
  }
})

// --- Top 5 Expenses Chart ---
const topExpensesChartData = computed(() => {
  const cm = currentMonth
  const cy = currentYear

  let allItems = []

  const directRange = isAnnual.value ? getYearRange(cy) : getMonthRange(cm, cy)
  expensesStore.expenses.forEach(e => {
    if (e.installments_count && e.installments_count > 1) return
    if (!directExpenseBelongsToPeriod(e, directRange.startDate, directRange.endDate)) return
    if (!directExpenseCountsTowardBalance(e)) return
    allItems.push({ description: e.description || 'Sin descripción', amount: e.amount })
  })

  expensesStore.upcomingInstallments.forEach(inst => {
    const due = parseISO(inst.due_date)
    const match = isAnnual.value
      ? due.getFullYear() === cy
      : due.getMonth() + 1 === cm && due.getFullYear() === cy
    if (!match || !installmentCountsTowardBalance(inst)) return
    allItems.push({
      description: (inst.expenses?.description || 'Cuota') + ` (${inst.installment_number}/${inst.expenses?.installments_count || '?'})`,
      amount: inst.amount
    })
  })

  allItems.sort((a, b) => b.amount - a.amount)
  const top5 = allItems.slice(0, 5)

  return {
    labels: top5.map(i => i.description.length > 25 ? i.description.slice(0, 22) + '...' : i.description),
    datasets: [{
      label: 'Monto',
      data: top5.map(i => i.amount),
      backgroundColor: ['#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'],
      borderRadius: 8,
      borderSkipped: false
    }]
  }
})

// --- Payment Type Distribution (Débito vs Crédito vs Transferencia) ---
const paymentTypeChartData = computed(() => {
  const cm = currentMonth
  const cy = currentYear
  const typeMap = {}

  const typeRange = isAnnual.value ? getYearRange(cy) : getMonthRange(cm, cy)
  expensesStore.expenses.forEach(e => {
    if (e.installments_count && e.installments_count > 1) return
    if (!directExpenseBelongsToPeriod(e, typeRange.startDate, typeRange.endDate)) return
    if (!directExpenseCountsTowardBalance(e)) return
    const type = e.available_cards?.type || 'Otro'
    typeMap[type] = (typeMap[type] || 0) + e.amount
  })

  expensesStore.upcomingInstallments.forEach(inst => {
    const due = parseISO(inst.due_date)
    const match = isAnnual.value
      ? due.getFullYear() === cy
      : due.getMonth() + 1 === cm && due.getFullYear() === cy
    if (!match || !installmentCountsTowardBalance(inst)) return
    const type = inst.expenses?.available_cards?.type || 'Otro'
    typeMap[type] = (typeMap[type] || 0) + inst.amount
  })

  const typeColors = {
    'Crédito': '#8B5CF6',
    'Débito': '#3B82F6',
    'Transferencia': '#10B981',
    'Efectivo': '#F59E0B',
    'Otro': '#94A3B8'
  }

  const labels = Object.keys(typeMap).filter(k => typeMap[k] > 0)
  return {
    labels,
    datasets: [{
      data: labels.map(l => typeMap[l]),
      backgroundColor: labels.map(l => typeColors[l] || '#94A3B8'),
      borderWidth: 0,
      hoverOffset: 6
    }]
  }
})

// --- Chart Options ---
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } } },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 13, weight: '600' },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ctx.parsed)}`
      }
    }
  }
}

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 13, weight: '600' },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        label: (ctx) => ` ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ctx.parsed.y)}`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { font: { size: 11 }, callback: (v) => '$' + (v / 1000).toFixed(0) + 'k' }
    },
    x: { grid: { display: false }, ticks: { font: { size: 11 } } }
  }
}

const evolutionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } } },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 13, weight: '600' },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ctx.parsed.y)}`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { font: { size: 11 }, callback: (v) => '$' + (v / 1000).toFixed(0) + 'k' }
    },
    x: { grid: { display: false }, ticks: { font: { size: 11 } } }
  }
}

const topExpensesChartOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 13, weight: '600' },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        label: (ctx) => ` ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ctx.parsed.x)}`
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { font: { size: 11 }, callback: (v) => '$' + (v / 1000).toFixed(0) + 'k' }
    },
    y: {
      grid: { display: false },
      ticks: { font: { size: 11 }, autoSkip: false }
    }
  }
}

const paymentTypeDoughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } } },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 13, weight: '600' },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        label: (ctx) => {
          const total = ctx.dataset.data.reduce((s, v) => s + v, 0)
          const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0
          return ` ${ctx.label}: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ctx.parsed)} (${pct}%)`
        }
      }
    }
  }
}

// --- Chart Export Data ---
const categoryChartExport = computed(() => {
  const labels = chartData.value.categories.labels
  const data = chartData.value.categories.datasets[0]?.data || []
  return {
    columns: [{ key: 'label', label: 'Categoría' }, { key: 'value', label: 'Monto' }],
    data: labels.map((label, i) => ({ label, value: data[i] || 0 }))
  }
})

const cardsChartExport = computed(() => {
  const labels = chartData.value.cards.labels
  const data = chartData.value.cards.datasets[0]?.data || []
  return {
    columns: [{ key: 'label', label: 'Cuenta' }, { key: 'value', label: 'Monto' }],
    data: labels.map((label, i) => ({ label, value: data[i] || 0 }))
  }
})

const evolutionChartExport = computed(() => {
  const labels = evolutionChartData.value.labels
  const datasets = evolutionChartData.value.datasets || []
  const columns = [
    { key: 'periodo', label: 'Período' },
    ...datasets.map(ds => ({ key: ds.label, label: ds.label }))
  ]
  const data = labels.map((label, i) => {
    const row = { periodo: label }
    datasets.forEach(ds => { row[ds.label] = ds.data[i] || 0 })
    return row
  })
  return { columns, data }
})

const topExpensesChartExport = computed(() => {
  const labels = topExpensesChartData.value.labels
  const data = topExpensesChartData.value.datasets[0]?.data || []
  return {
    columns: [{ key: 'label', label: 'Gasto' }, { key: 'value', label: 'Monto' }],
    data: labels.map((label, i) => ({ label, value: data[i] || 0 }))
  }
})

const paymentTypeChartExport = computed(() => {
  const labels = paymentTypeChartData.value.labels
  const data = paymentTypeChartData.value.datasets[0]?.data || []
  return {
    columns: [{ key: 'label', label: 'Tipo' }, { key: 'value', label: 'Monto' }],
    data: labels.map((label, i) => ({ label, value: data[i] || 0 }))
  }
})

// --- Period Comparison ---
const loadPeriodComparison = async () => {
  if (isAnnual.value) {
    const prevYear = currentYear - 1
    try {
      const [incomeRes, expenseRes] = await Promise.all([
        incomesApi.getSummary({ year: prevYear }),
        expensesApi.getMonthlyTotalWithInstallments(null, null, prevYear, {})
      ])
      previousPeriodIncome.value = incomeRes?.data?.total || 0
      previousPeriodExpenses.value =
        expenseRes?.data?.[0]?.total_balance_expenses ??
        expenseRes?.data?.[0]?.total_expenses ??
        0
    } catch {
      previousPeriodIncome.value = 0
      previousPeriodExpenses.value = 0
    }
  } else {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
    try {
      const [incomeRes, expenseRes, activityRes] = await Promise.all([
        incomesApi.getSummary({ month: prevMonth, year: prevYear }),
        expensesApi.getMonthlyTotalWithInstallments(null, prevMonth, prevYear, {}),
        activityApi.getBalanceActivity({ month: prevMonth, year: prevYear })
      ])
      previousPeriodIncome.value = incomeRes?.data?.total || 0
      previousPeriodExpenses.value =
        expenseRes?.data?.[0]?.total_balance_expenses ??
        expenseRes?.data?.[0]?.total_expenses ??
        0
      previousPeriodBalance.value =
        activityRes?.data?.summary?.cash_balance ??
        activityRes?.data?.summary?.net ??
        0
    } catch {
      previousPeriodIncome.value = 0
      previousPeriodExpenses.value = 0
      previousPeriodBalance.value = 0
    }
  }
  if (isAnnual.value) {
    previousPeriodBalance.value = previousPeriodIncome.value - previousPeriodExpenses.value
  }
}

// --- Data Loading ---
let _mounted = true

onMounted(async () => {
  isLoading.value = true
  expensesStore.clearFilters()

  const safetyTimer = setTimeout(() => {
    if (_mounted) isLoading.value = false
  }, 12000)

  try {
    await Promise.all([
      expensesStore.loadExpenses(),
      expensesStore.loadUpcomingInstallments(1000),
      expensesStore.loadMonthlyTotals(currentMonth, currentYear),
      expensesStore.loadCreditCardsSummary(isAnnual.value),
      expensesStore.loadExpensesSummaryByType(isAnnual.value),
      incomesStore.loadIncomes({ month: currentMonth, year: currentYear }),
      incomesStore.loadIncomesForChart([currentYear, currentYear - 1]),
      savingsStore.load(),
      cardsStore.loadCards(),
      categoriesStore.loadCategories(),
      loadPreviousMonthCarry(),
      loadPeriodComparison()
    ])
  } catch (err) {
    console.error('Error cargando dashboard:', err)
  } finally {
    clearTimeout(safetyTimer)
    if (_mounted) isLoading.value = false
  }
})

const closeSavingsHelpOnClickOutside = (e) => {
  if (savingsHelpRef.value && !savingsHelpRef.value.contains(e.target)) {
    showSavingsHelp.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeSavingsHelpOnClickOutside)
})

onUnmounted(() => {
  _mounted = false
  document.removeEventListener('click', closeSavingsHelpOnClickOutside)
})

watch(isAnnual, async (annual) => {
  if (!_mounted) return
  currentChartIndex.value = 0
  isLoading.value = true
  try {
    const incomeFilters = annual
      ? { year: currentYear }
      : { month: currentMonth, year: currentYear }
    await Promise.all([
      expensesStore.loadCreditCardsSummary(annual),
      expensesStore.loadExpensesSummaryByType(annual),
      expensesStore.loadMonthlyTotals(currentMonth, currentYear),
      incomesStore.loadIncomes(incomeFilters),
      incomesStore.loadIncomesForChart([currentYear, currentYear - 1]),
      savingsStore.load(),
      loadPreviousMonthCarry(),
      loadPeriodComparison()
    ])
  } catch (err) {
    console.error('Error toggling annual view:', err)
  } finally {
    if (_mounted) isLoading.value = false
  }
})
</script>
