<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Ingresos</h1>
        <p class="text-slate-500">Gestiona tus ingresos y fuentes de dinero</p>
      </div>
      <button @click="openCreateModal" class="btn-primary inline-flex items-center gap-2">
        <Plus class="h-4 w-4" />
        Nuevo Ingreso
      </button>
    </div>

    <!-- Resumen del mes -->
    <div class="space-y-4">
      <div class="text-center mb-2">
        <h2 class="text-xl font-semibold text-slate-800">{{ monthYearTitle }}</h2>
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
                <p class="text-sm text-slate-500">Total Ingresos</p>
                <p class="text-2xl font-bold text-success-600">{{ formatCurrency(incomesStore.totalIncome) }}</p>
              </div>
              <div>
                <p class="text-sm text-slate-500">Cantidad</p>
                <p class="text-2xl font-bold text-primary-600">{{ incomesStore.incomes.length }}</p>
              </div>
              <div>
                <p class="text-sm text-slate-500">Ingreso Promedio</p>
                <p class="text-2xl font-bold text-slate-700">{{ formatCurrency(averageIncome) }}</p>
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
            <div class="flex items-center justify-between py-1.5 border-l-4 border-success-500 pl-3 rounded-r-lg bg-success-50/40">
              <span class="text-xs text-slate-700 font-semibold">Total</span>
              <span class="text-base font-bold text-success-600 tabular-nums">{{ formatCurrency(incomesStore.totalIncome) }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-l-4 border-primary-500 pl-3 rounded-r-lg bg-primary-50/30">
              <span class="text-xs text-slate-600 font-medium">Cantidad</span>
              <span class="text-sm font-bold text-primary-600 tabular-nums">{{ incomesStore.incomes.length }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-l-4 border-slate-400 pl-3 rounded-r-lg bg-slate-50/50">
              <span class="text-xs text-slate-600 font-medium">Promedio</span>
              <span class="text-sm font-bold text-slate-700 tabular-nums">{{ formatCurrency(averageIncome) }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Error -->
    <div v-if="incomesStore.error" class="bg-danger-50 border border-danger-100 rounded-xl p-4">
      <div class="flex items-start gap-3">
        <RefreshCw class="h-5 w-5 text-danger-500 flex-shrink-0 mt-0.5" />
        <p class="text-sm text-danger-700">{{ incomesStore.error }}</p>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="incomesStore.loading" class="pb-20">
      <!-- Desktop skeleton table -->
      <div class="hidden md:block card">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-100">
            <thead class="bg-slate-50/80">
              <tr>
                <th v-for="i in 4" :key="i" class="px-6 py-3 text-left">
                  <div class="skeleton h-4 w-20"></div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-100">
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
      <!-- Empty state -->
      <div v-if="incomesStore.incomes.length === 0" class="card text-center py-12">
        <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wallet class="h-8 w-8 text-slate-400" />
        </div>
        <h3 class="text-lg font-semibold text-slate-900 mb-1">No hay ingresos registrados</h3>
        <p class="text-slate-500 mb-4">Comienza agregando tu primer ingreso del mes</p>
        <button @click="openCreateModal" class="btn-primary inline-flex items-center gap-2 mx-auto">
          <Plus class="h-4 w-4" />
          Nuevo Ingreso
        </button>
      </div>

      <!-- Desktop table -->
      <div v-else class="hidden md:block card !p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-100">
            <thead class="bg-slate-50/80">
              <tr>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-50">
              <tr v-for="income in incomesStore.incomes" :key="income.id" class="hover:bg-slate-50/60 transition-colors">
                <td class="px-6 py-4 text-sm text-slate-900 font-medium">{{ income.description }}</td>
                <td class="px-6 py-4 text-sm font-bold text-success-600">{{ formatCurrency(income.amount) }}</td>
                <td class="px-6 py-4 text-sm text-slate-500">
                  <div class="flex items-center gap-1.5">
                    <Calendar class="h-3.5 w-3.5 text-slate-400" />
                    {{ formatDate(income.income_date) }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <button
                      @click="openEditModal(income)"
                      class="text-slate-400 hover:text-primary-600 transition-colors p-1 rounded-lg hover:bg-primary-50"
                      title="Editar"
                    >
                      <Pencil class="h-4 w-4" />
                    </button>
                    <button
                      @click="confirmDelete(income)"
                      class="text-slate-400 hover:text-danger-600 transition-colors p-1 rounded-lg hover:bg-danger-50"
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
      <div v-if="incomesStore.incomes.length > 0" class="block md:hidden space-y-3">
        <div
          v-for="income in incomesStore.incomes"
          :key="income.id"
          class="card"
        >
          <div class="flex justify-between items-start mb-2">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 truncate">{{ income.description }}</p>
              <div class="flex items-center gap-1.5 mt-1">
                <Calendar class="h-3 w-3 text-slate-400" />
                <p class="text-xs text-slate-500">{{ formatDate(income.income_date) }}</p>
              </div>
            </div>
            <p class="text-sm font-bold text-success-600 ml-3">{{ formatCurrency(income.amount) }}</p>
          </div>
          <div class="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-slate-100">
            <button
              @click="openEditModal(income)"
              class="text-slate-400 hover:text-primary-600 transition-colors p-1.5 rounded-lg hover:bg-primary-50"
            >
              <Pencil class="h-4 w-4" />
            </button>
            <button
              @click="confirmDelete(income)"
              class="text-slate-400 hover:text-danger-600 transition-colors p-1.5 rounded-lg hover:bg-danger-50"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
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
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Wallet, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, RefreshCw, Calendar } from 'lucide-vue-next'
import Swal from 'sweetalert2'
import IncomeModal from '@/components/IncomeModal.vue'

const incomesStore = useIncomesStore()

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

const averageIncome = computed(() => {
  const count = incomesStore.incomes.length
  if (count === 0) return 0
  return incomesStore.totalIncome / count
})

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
  loadIncomes()
})
</script>
