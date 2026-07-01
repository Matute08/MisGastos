<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { activity as activityApi } from '@/lib/api'
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Calendar,
  CreditCard,
  Download,
  PiggyBank,
  RefreshCw,
  Search,
  Wallet
} from 'lucide-vue-next'

const now = new Date()
const selectedPeriod = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
const sourceFilter = ref('all')
const query = ref('')
const loading = ref(false)
const error = ref('')
const movements = ref([])
const summary = ref({ opening_balance: 0, income: 0, outcome: 0, net: 0, movements_count: 0 })

const formatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2
})

const monthLabelFormatter = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric'
})

const dateLabelFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long'
})

const periodParts = computed(() => {
  const [year, month] = selectedPeriod.value.split('-').map(Number)
  return { year, month }
})

const periodLabel = computed(() => {
  const { year, month } = periodParts.value
  return monthLabelFormatter.format(new Date(year, month - 1, 1))
})

const sourceOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'out', label: 'Salidas' },
  { value: 'card', label: 'Tarjetas' },
  { value: 'saving', label: 'Ahorros' },
  { value: 'neutral', label: 'Informativo' }
]

const filteredMovements = computed(() => {
  const text = query.value.trim().toLowerCase()
  return movements.value.filter((movement) => {
    const sourceMatch =
      sourceFilter.value === 'all' ||
      (sourceFilter.value === 'income' && movement.amount > 0 && movement.affects_balance) ||
      (sourceFilter.value === 'out' && movement.amount < 0 && movement.affects_balance) ||
      (sourceFilter.value === 'card' && String(movement.source).includes('card')) ||
      (sourceFilter.value === 'saving' && String(movement.source).includes('saving')) ||
      (sourceFilter.value === 'neutral' && !movement.affects_balance)

    if (!sourceMatch) return false
    if (!text) return true

    return [
      movement.title,
      movement.detail,
      movement.account,
      movement.method,
      movement.status
    ].some((value) => String(value || '').toLowerCase().includes(text))
  })
})

const groupedMovements = computed(() => {
  const groups = new Map()
  filteredMovements.value.forEach((movement) => {
    if (!groups.has(movement.date)) {
      groups.set(movement.date, [])
    }
    groups.get(movement.date).push(movement)
  })
  return Array.from(groups.entries()).map(([date, items]) => ({
    date,
    label: dateLabelFormatter.format(new Date(`${date}T12:00:00`)),
    items
  }))
})

const balanceMovementsCount = computed(() =>
  movements.value.filter((movement) => movement.affects_balance).length
)

function formatCurrency(value) {
  return formatter.format(Number(value || 0))
}

function signedAmount(movement) {
  if (!movement.affects_balance) {
    return formatCurrency(movement.reference_amount || 0)
  }
  const amount = Number(movement.amount || 0)
  const sign = amount > 0 ? '+ ' : amount < 0 ? '- ' : ''
  return `${sign}${formatCurrency(Math.abs(amount))}`
}

function amountClass(movement) {
  if (!movement.affects_balance) return 'text-slate-500 dark:text-gray-400'
  if (movement.amount > 0) return 'text-success-600 dark:text-success-400'
  if (movement.amount < 0) return 'text-slate-950 dark:text-gray-100'
  return 'text-slate-500 dark:text-gray-400'
}

function movementIcon(movement) {
  if (movement.source === 'income') return ArrowUpRight
  if (String(movement.source).includes('saving')) return PiggyBank
  if (String(movement.source).includes('card')) return CreditCard
  if (movement.amount < 0) return ArrowDownLeft
  return Wallet
}

function iconClass(movement) {
  if (!movement.affects_balance) return 'bg-slate-100 text-slate-500 dark:bg-gray-700 dark:text-gray-300'
  if (movement.amount > 0) return 'bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-300'
  if (String(movement.source).includes('card')) return 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
  if (String(movement.source).includes('saving')) return 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300'
  return 'bg-danger-50 text-danger-600 dark:bg-danger-900/30 dark:text-danger-300'
}

async function loadActivity() {
  loading.value = true
  error.value = ''
  try {
    const { month, year } = periodParts.value
    const response = await activityApi.getBalanceActivity({ month, year })
    if (!response?.success) throw new Error(response?.error || 'No se pudo cargar la actividad')
    movements.value = response.data?.movements || []
    summary.value = response.data?.summary || { opening_balance: 0, income: 0, outcome: 0, net: 0, movements_count: 0 }
  } catch (err) {
    error.value = err.message || 'No se pudo cargar la actividad'
    movements.value = []
  } finally {
    loading.value = false
  }
}

function exportCsv() {
  const headers = ['fecha', 'hora', 'titulo', 'detalle', 'cuenta', 'metodo', 'estado', 'impacta_balance', 'monto', 'saldo_periodo']
  const rows = filteredMovements.value.map((movement) => [
    movement.date,
    movement.time || '',
    movement.title,
    movement.detail,
    movement.account,
    movement.method,
    movement.status,
    movement.affects_balance ? 'si' : 'no',
    movement.amount,
    movement.balance_after
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `actividad-${selectedPeriod.value}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

watch(selectedPeriod, loadActivity)
onMounted(loadActivity)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm font-medium text-primary-600 dark:text-primary-400">Balance auditable</p>
        <h1 class="text-2xl font-bold text-slate-950 dark:text-gray-100">Actividad del dinero</h1>
        <p class="text-sm text-slate-500 dark:text-gray-400">
          Movimientos que explican el balance de {{ periodLabel }}.
        </p>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row">
        <label class="relative">
          <Calendar class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            v-model="selectedPeriod"
            type="month"
            class="input-field h-11 pl-9"
          />
        </label>
        <button
          type="button"
          class="btn-secondary inline-flex items-center justify-center gap-2"
          @click="loadActivity"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          Actualizar
        </button>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Saldo anterior</p>
        <p
          class="mt-1 text-xl font-bold"
          :class="summary.opening_balance >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-danger-600 dark:text-danger-400'"
        >
          {{ formatCurrency(summary.opening_balance) }}
        </p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Entradas</p>
        <p class="mt-1 text-xl font-bold text-success-600 dark:text-success-400">{{ formatCurrency(summary.income) }}</p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Salidas</p>
        <p class="mt-1 text-xl font-bold text-slate-950 dark:text-gray-100">{{ formatCurrency(summary.outcome) }}</p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Saldo calculado</p>
        <p
          class="mt-1 text-xl font-bold"
          :class="summary.net >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
        >
          {{ formatCurrency(summary.net) }}
        </p>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-gray-700 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-1 flex-col gap-3 sm:flex-row">
          <label class="relative flex-1">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              v-model="query"
              type="search"
              class="input-field h-11 pl-9"
              placeholder="Buscar movimiento"
            />
          </label>
          <select v-model="sourceFilter" class="input-field h-11 sm:w-44">
            <option v-for="option in sourceOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <button
          type="button"
          class="btn-secondary inline-flex items-center justify-center gap-2"
          :disabled="filteredMovements.length === 0"
          @click="exportCsv"
        >
          <Download class="h-4 w-4" />
          CSV
        </button>
      </div>

      <div v-if="loading" class="space-y-3 p-4">
        <div v-for="i in 5" :key="i" class="skeleton h-16 w-full"></div>
      </div>

      <div v-else-if="error" class="p-8 text-center">
        <p class="font-semibold text-danger-600 dark:text-danger-400">{{ error }}</p>
      </div>

      <div v-else-if="groupedMovements.length === 0" class="p-10 text-center">
        <Wallet class="mx-auto h-10 w-10 text-slate-300 dark:text-gray-600" />
        <p class="mt-3 font-semibold text-slate-800 dark:text-gray-200">No hay movimientos</p>
        <p class="text-sm text-slate-500 dark:text-gray-400">Probá otro mes o quitá filtros.</p>
      </div>

      <div v-else class="divide-y divide-slate-100 dark:divide-gray-700">
        <section v-for="group in groupedMovements" :key="group.date" class="p-4">
          <h2 class="mb-3 text-sm font-bold text-slate-900 dark:text-gray-100">{{ group.label }}</h2>
          <div class="space-y-1">
            <article
              v-for="movement in group.items"
              :key="movement.id"
              class="grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-lg px-1 py-3 hover:bg-slate-50 dark:hover:bg-gray-700/40 sm:grid-cols-[56px_44px_1fr_160px_120px_150px]"
            >
              <span class="text-sm tabular-nums text-slate-500 dark:text-gray-400">{{ movement.time || '--:--' }}</span>
              <span
                class="hidden h-10 w-10 items-center justify-center rounded-full sm:inline-flex"
                :class="iconClass(movement)"
              >
                <component :is="movementIcon(movement)" class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex h-9 w-9 items-center justify-center rounded-full sm:hidden"
                    :class="iconClass(movement)"
                  >
                    <component :is="movementIcon(movement)" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-950 dark:text-gray-100">{{ movement.title }}</p>
                    <p class="truncate text-sm text-slate-500 dark:text-gray-400">{{ movement.detail }}</p>
                  </div>
                </div>
              </div>
              <p class="hidden truncate text-sm text-slate-500 dark:text-gray-400 sm:block">{{ movement.method || movement.account }}</p>
              <p class="hidden items-center gap-1 text-sm font-semibold text-success-700 dark:text-success-400 sm:flex">
                <BadgeCheck class="h-4 w-4" />
                {{ movement.status }}
              </p>
              <div class="text-right">
                <p class="text-sm font-bold tabular-nums" :class="amountClass(movement)">
                  {{ signedAmount(movement) }}
                </p>
                <p v-if="movement.affects_balance" class="text-xs text-slate-400 dark:text-gray-500">
                  saldo {{ formatCurrency(movement.balance_after) }}
                </p>
                <p v-else class="text-xs text-slate-400 dark:text-gray-500">no impacta balance</p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <p class="text-xs text-slate-500 dark:text-gray-400">
      {{ balanceMovementsCount }} movimientos impactan el balance. Los informativos explican créditos o usos internos sin cambiar dinero disponible.
    </p>
  </div>
</template>
