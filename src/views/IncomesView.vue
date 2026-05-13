<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-gray-100">Ingresos</h1>
        <p class="text-slate-500 dark:text-gray-400">Gestiona tus ingresos y fuentes de dinero</p>
      </div>
      <div class="flex items-center gap-2">
        <ExportButton
          :data="exportableIncomes"
          filename="ingresos.csv"
          :columns="incomeCsvColumns"
          label="Exportar CSV"
        />
        <button @click="openCreateModal" class="btn-primary inline-flex items-center gap-2">
        <Plus class="h-4 w-4" />
        Nuevo Ingreso
      </button>
    </div>
    </div>

    <!-- Resumen del mes -->
    <div class="space-y-4">
      <div class="text-center mb-2">
        <h2 class="text-xl font-semibold text-slate-800 dark:text-gray-200">{{ monthYearTitle }}</h2>
      </div>

      <!-- Loading skeleton -->
      <div v-if="incomesStore.loading" class="card">
        <div class="grid grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="text-center">
            <div class="skeleton h-4 w-24 mx-auto mb-2"></div>
            <div class="skeleton h-8 w-32 mx-auto"></div>
          </div>
        </div>
      </div>
      <template v-else>
        <!-- Desktop -->
        <div class="hidden lg:flex card items-center justify-between">
          <button @click="previousMonth" class="btn-secondary px-2 py-1 flex items-center justify-center">
            <ChevronLeft class="h-4 w-4" />
          </button>
          <div class="flex-1">
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-sm text-slate-500 dark:text-gray-400">Total al balance</p>
                <p class="text-2xl font-bold text-success-600">{{ formatCurrency(incomesStore.totalIncome) }}</p>
                <p
                  v-if="incomesStore.totalCardCreditIncome > 0"
                  class="text-xs text-slate-500 dark:text-gray-400 mt-2 max-w-[14rem] mx-auto leading-snug"
                >
                  Créditos en tarjeta (no suman al balance):
                  <span class="font-semibold text-violet-700 dark:text-violet-400">{{ formatCurrency(incomesStore.totalCardCreditIncome) }}</span>
                </p>
              </div>
              <div>
                <p class="text-sm text-slate-500 dark:text-gray-400">Cantidad</p>
                <p class="text-2xl font-bold text-primary-600">{{ incomesStore.incomes.length }}</p>
              </div>
              <div>
                <p class="text-sm text-slate-500 dark:text-gray-400">Promedio (efectivo)</p>
                <p class="text-2xl font-bold text-slate-700 dark:text-gray-300">{{ formatCurrency(averageIncome) }}</p>
              </div>
            </div>
          </div>
          <button @click="nextMonth" class="btn-secondary px-2 py-1 flex items-center justify-center">
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>

        <!-- Mobile -->
        <div class="block lg:hidden card !p-4">
          <div class="flex items-center justify-between mb-3">
            <button @click="previousMonth" class="btn-secondary px-2 py-1 flex items-center justify-center">
              <ChevronLeft class="h-4 w-4" />
            </button>
            <button @click="nextMonth" class="btn-secondary px-2 py-1 flex items-center justify-center">
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>
          <div class="space-y-2.5">
            <div class="flex items-center justify-between py-1.5 border-l-4 border-success-500 pl-3 rounded-r-lg bg-success-50/40 dark:bg-success-900/20">
              <span class="text-xs text-slate-700 dark:text-gray-300 font-semibold">Total al balance</span>
              <span class="text-base font-bold text-success-600 tabular-nums">{{ formatCurrency(incomesStore.totalIncome) }}</span>
            </div>
            <div
              v-if="incomesStore.totalCardCreditIncome > 0"
              class="flex items-start justify-between gap-2 py-1.5 border-l-4 border-violet-400 pl-3 rounded-r-lg bg-violet-50/50 dark:bg-violet-900/20"
            >
              <span class="text-xs text-slate-600 dark:text-gray-400">Créditos en tarjeta</span>
              <span class="text-sm font-semibold text-violet-800 dark:text-violet-300 tabular-nums text-right">{{ formatCurrency(incomesStore.totalCardCreditIncome) }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-l-4 border-primary-500 pl-3 rounded-r-lg bg-primary-50/30 dark:bg-primary-900/20">
              <span class="text-xs text-slate-600 dark:text-gray-400 font-medium">Cantidad</span>
              <span class="text-sm font-bold text-primary-600 tabular-nums">{{ incomesStore.incomes.length }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-l-4 border-slate-400 pl-3 rounded-r-lg bg-slate-50/50 dark:bg-gray-700/50">
              <span class="text-xs text-slate-600 dark:text-gray-400 font-medium">Promedio</span>
              <span class="text-sm font-bold text-slate-700 dark:text-gray-300 tabular-nums">{{ formatCurrency(averageIncome) }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Error -->
    <div v-if="incomesStore.error" class="bg-danger-50 dark:bg-danger-900/20 border border-danger-100 dark:border-danger-800 rounded-xl p-4">
      <div class="flex items-start gap-3">
        <RefreshCw class="h-5 w-5 text-danger-500 flex-shrink-0 mt-0.5" />
        <p class="text-sm text-danger-700 dark:text-danger-300">{{ incomesStore.error }}</p>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="incomesStore.loading" class="pb-20">
      <!-- Desktop skeleton table -->
      <div class="hidden md:block card">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-100 dark:divide-gray-700">
            <thead class="bg-slate-50/80 dark:bg-gray-700/80">
              <tr>
                <th v-for="i in 5" :key="i" class="px-6 py-3 text-left">
                  <div class="skeleton h-4 w-20"></div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-slate-100 dark:divide-gray-700">
              <tr v-for="i in 5" :key="i">
                <td class="px-6 py-4"><div class="skeleton h-4 w-32"></div></td>
                <td class="px-6 py-4"><div class="skeleton h-4 w-24"></div></td>
                <td class="px-6 py-4"><div class="skeleton h-4 w-20"></div></td>
                <td class="px-6 py-4">
                  <div class="flex gap-2">
                    <div class="skeleton h-4 w-4"></div>
                    <div class="skeleton h-4 w-4"></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile skeleton cards -->
      <div class="block md:hidden space-y-3">
        <div v-for="i in 5" :key="i" class="card">
          <div class="flex justify-between items-start">
            <div class="space-y-2 flex-1">
              <div class="skeleton h-4 w-40"></div>
              <div class="skeleton h-3 w-24"></div>
            </div>
            <div class="skeleton h-5 w-24"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Income list -->
    <div v-else class="space-y-4 pb-20">
      <EmptyState
        v-if="incomesStore.incomes.length === 0"
        icon="Wallet"
        title="No hay ingresos registrados"
        description="Comienza agregando tu primer ingreso del mes"
        actionLabel="Nuevo Ingreso"
        @action="openCreateModal"
      />

      <!-- Desktop table -->
      <div v-if="incomesStore.incomes.length > 0" class="hidden md:block card !p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-100 dark:divide-gray-700">
            <thead class="bg-slate-50/80 dark:bg-gray-700/80">
              <tr>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Origen</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-slate-50 dark:divide-gray-700">
              <tr v-for="income in incomesStore.incomes" :key="income.id" class="hover:bg-slate-50/60 dark:hover:bg-gray-700/60 transition-colors">
                <td class="px-6 py-4 text-sm text-slate-900 dark:text-gray-100 font-medium">{{ income.description }}</td>
                <td class="px-6 py-4">
                  <span
                    v-if="income.affects_cash_balance !== false"
                    class="inline-flex text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 px-2 py-0.5 rounded-md"
                  >
                    Balance
                  </span>
                  <span
                    v-else
                    class="inline-flex text-xs font-medium text-violet-800 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 px-2 py-0.5 rounded-md"
                  >
                    Tarjeta · {{ cardLabel(income) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm font-bold" :class="income.affects_cash_balance !== false ? 'text-success-600' : 'text-violet-700'">
                  {{ formatCurrency(income.amount) }}
                </td>
                <td class="px-6 py-4 text-sm text-slate-500 dark:text-gray-400">
                  <div class="flex items-center gap-1.5">
                    <Calendar class="h-3.5 w-3.5 text-slate-400 dark:text-gray-500" />
                    {{ formatDate(income.income_date) }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <button
                      @click="openEditModal(income)"
                      class="text-slate-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30"
                      title="Editar"
                    >
                      <Pencil class="h-4 w-4" />
                    </button>
                    <button
                      @click="confirmDelete(income)"
                      class="text-slate-400 dark:text-gray-500 hover:text-danger-600 dark:hover:text-danger-400 transition-colors p-1 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/30"
                      title="Eliminar"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile cards -->
      <TransitionGroup v-if="incomesStore.incomes.length > 0" name="list" tag="div" class="block md:hidden space-y-3">
        <div
          v-for="income in incomesStore.incomes"
          :key="income.id"
          class="card"
        >
          <div class="flex justify-between items-start mb-2">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 dark:text-gray-100 truncate">{{ income.description }}</p>
              <div class="flex flex-wrap items-center gap-1.5 mt-1">
                <Calendar class="h-3 w-3 text-slate-400 dark:text-gray-500 shrink-0" />
                <p class="text-xs text-slate-500 dark:text-gray-400">{{ formatDate(income.income_date) }}</p>
                <span
                  v-if="income.affects_cash_balance !== false"
                  class="text-[10px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded"
                >
                  Balance
                </span>
                <span
                  v-else
                  class="text-[10px] font-medium text-violet-800 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 px-1.5 py-0.5 rounded"
                >
                  Tarjeta · {{ cardLabel(income) }}
                </span>
              </div>
            </div>
            <p
              class="text-sm font-bold ml-3 shrink-0"
              :class="income.affects_cash_balance !== false ? 'text-success-600' : 'text-violet-700'"
            >
              {{ formatCurrency(income.amount) }}
            </p>
          </div>
          <div class="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-gray-700">
            <button
              @click="openEditModal(income)"
              class="text-slate-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30"
            >
              <Pencil class="h-4 w-4" />
            </button>
            <button
              @click="confirmDelete(income)"
              class="text-slate-400 dark:text-gray-500 hover:text-danger-600 dark:hover:text-danger-400 transition-colors p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/30"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Modal -->
    <IncomeModal
      v-if="showModal"
      :income="selectedIncome"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useIncomesStore } from '@/stores/incomes'
import { useExpensesStore } from '@/stores/expenses'
import { useUserCardsStore } from '@/stores/userCards'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Wallet, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, RefreshCw, Calendar } from 'lucide-vue-next'
import Swal from 'sweetalert2'
import IncomeModal from '@/components/IncomeModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import ExportButton from '@/components/ExportButton.vue'

const incomesStore = useIncomesStore()
const expensesStore = useExpensesStore()
const userCardsStore = useUserCardsStore()

const now = new Date()
const currentMonth = ref(now.getMonth() + 1)
const currentYear = ref(now.getFullYear())
const showModal = ref(false)
const selectedIncome = ref(null)

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const monthYearTitle = computed(() => {
  return `${monthNames[currentMonth.value - 1]} ${currentYear.value}`
})

const cashIncomesCount = computed(
  () => incomesStore.incomes.filter((i) => i.affects_cash_balance !== false).length
)

const averageIncome = computed(() => {
  const count = cashIncomesCount.value
  if (count === 0) return 0
  return incomesStore.totalIncome / count
})

const incomeCsvColumns = [
  { key: 'description', label: 'Descripción' },
  { key: 'amount', label: 'Monto' },
  { key: 'date', label: 'Fecha' },
  { key: 'type', label: 'Tipo' }
]

const exportableIncomes = computed(() => {
  return incomesStore.incomes.map(i => ({
    description: i.description || '',
    amount: i.amount ?? 0,
    date: i.income_date || '',
    type: i.affects_cash_balance !== false ? 'Balance' : 'Tarjeta'
  }))
})

const cardLabel = (income) => {
  if (income.affects_cash_balance !== false) return null
  const id = income.card_id
  const uc = userCardsStore.cards.find((c) => c.available_card_id === id)
  return uc?.available_card?.name || 'Tarjeta'
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return format(date, 'dd/MM/yyyy', { locale: es })
  } catch {
    return dateStr
  }
}

const loadIncomes = async () => {
  await incomesStore.loadIncomes({
    month: currentMonth.value,
    year: currentYear.value
  })
}

const previousMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
  loadIncomes()
}

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
  loadIncomes()
}

const openCreateModal = () => {
  selectedIncome.value = null
  showModal.value = true
}

const openEditModal = (income) => {
  selectedIncome.value = income
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedIncome.value = null
}

const handleSave = async (formData) => {
  try {
    if (selectedIncome.value) {
      await incomesStore.updateIncome(selectedIncome.value.id, formData)
      Swal.fire({
        icon: 'success',
        title: 'Ingreso actualizado',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      })
    } else {
      await incomesStore.createIncome(formData)
      Swal.fire({
        icon: 'success',
        title: 'Ingreso creado',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      })
    }
    closeModal()
    await loadIncomes()
    await expensesStore.loadCreditCardsSummary(false)
  } catch {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo guardar el ingreso'
    })
  }
}

const confirmDelete = async (income) => {
  const result = await Swal.fire({
    title: '¿Eliminar ingreso?',
    text: `Se eliminará "${income.description}" por ${formatCurrency(income.amount)}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E11D48',
    cancelButtonColor: '#64748B',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      await incomesStore.deleteIncome(income.id)
      Swal.fire({
        icon: 'success',
        title: 'Ingreso eliminado',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      })
      await loadIncomes()
      await expensesStore.loadCreditCardsSummary(false)
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el ingreso'
      })
    }
  }
}

onMounted(() => {
  userCardsStore.loadUserCards()
  loadIncomes()
})
</script>
