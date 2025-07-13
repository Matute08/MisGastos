<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gastos</h1>
        <p class="text-gray-600">Gestiona todos tus gastos y compras</p>
      </div>
      <button 
        @click="showModal = true" 
        class="btn-primary flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-center"
      >
        <Plus class="h-4 w-4" />
        Nuevo Gasto
      </button>
    </div>

    <!-- Filtros -->
    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <!-- Filtro por tarjeta -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tarjeta</label>
          <select
            v-model="filters.card_id"
            @change="updateFilters"
            class="input-field"
          >
            <option value="">Todas las tarjetas</option>
            <option
              v-for="card in cardsStore.cards"
              :key="card.id"
              :value="card.id"
            >
              {{ card.name }}
            </option>
          </select>
        </div>

        <!-- Filtro por categoría -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            v-model="filters.category_id"
            @change="updateFilters"
            class="input-field"
          >
            <option value="">Todas las categorías</option>
            <option
              v-for="category in categoriesStore.categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>

        <!-- Filtro por mes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mes</label>
          <select
            v-model="filters.month"
            @change="updateFilters"
            class="input-field"
          >
            <option v-for="(name, idx) in monthNames" :key="idx" :value="idx + 1">
              {{ name }}
            </option>
          </select>
        </div>

        <!-- Filtro por año (activo) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Año</label>
          <select
            v-model="filters.year"
            @change="updateFilters"
            class="input-field"
          >
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>
      </div>

      <!-- Botón limpiar filtros mejorado -->
      <div class="mt-4 flex justify-end">
        <button
          @click="clearFilters"
          class="btn-secondary flex items-center gap-2"
        >
          <RotateCcw class="h-4 w-4" />
          Limpiar Filtros
        </button>
      </div>
    </div>

    <!-- Checkbox para alternar entre gastos directos y cuotas -->
    <!-- <div class="flex justify-end mt-2">
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
    </div> -->

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
    <div v-if="expensesStore.loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Lista de gastos -->
    <div v-else class="space-y-4">
      <!-- Título del mes actual -->
      <div class="text-center mb-2">
        <h2 class="text-xl font-semibold text-gray-800">
          {{ monthYearTitle }}
        </h2>
      </div>
      <!-- Resumen con cuotas y flechas de mes -->
      <div class="card flex items-center justify-between">
        <button @click="previousMonth" class="btn-secondary px-2 py-1 flex items-center justify-center"><ChevronLeft class="h-4 w-4" /></button>
        <div class="flex-1">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p class="text-sm text-gray-600">Total gastos débito/transferencia</p>
              <p class="text-2xl font-bold text-blue-700">
                {{ formatCurrency(totalDebitTransferExpenses) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Total gastos de un pago </p>
              <p class="text-2xl font-bold text-gray-900">
                {{ formatCurrency(totalSinglePaymentExpenses) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Total cuotas del mes</p>
              <p class="text-2xl font-bold text-blue-600">
                {{ formatCurrency(expensesStore.totalInstallmentsOnly) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Total combinado</p>
              <p class="text-2xl font-bold text-green-600">
                {{ formatCurrency(totalCombinedCustom) }}
              </p>
            </div>
          </div>
        </div>
        <button @click="nextMonth" class="btn-secondary px-2 py-1 flex items-center justify-center"><ChevronRight class="h-4 w-4" /></button>
      </div>

              <!-- Tabla de gastos -->
        <div class="card">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarjeta
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <!-- Gastos directos y cuotas -->
                <template v-if="filters.year">
                  <tr v-for="item in filteredExpensesToShow" :key="item.is_installment ? `installment-${item.installment_id}` : `expense-${item.id}`">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center gap-2">
                        <CreditCard v-if="item.is_installment" class="h-4 w-4 text-blue-500" />
                        <Receipt v-else class="h-4 w-4 text-gray-500" />
                        <span class="text-xs font-medium" :class="item.is_installment ? 'text-blue-600' : 'text-gray-600'">
                          {{ item.is_installment ? 'Cuota' : 'Gasto' }}
                        </span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div class="font-medium">{{ item.description }}</div>
                        <div v-if="item.is_installment" class="text-xs text-gray-500">
                          Cuota {{ item.installment_number }} de {{ item.installments_count }}
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {{ item.card_name || 'Sin tarjeta' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :style="{ backgroundColor: item.category_color + '20', color: item.category_color }"
                      >
                        {{ item.category_name || 'Sin categoría' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" :class="item.is_installment ? 'text-blue-600' : 'text-gray-900'">
                      {{ formatCurrency(item.is_installment ? item.installment_amount : item.amount) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {{ formatDate(item.is_installment ? item.due_date : item.purchase_date) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        :class="[
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getStatusColor(item)
                        ]"
                      >
                        {{ getStatusLabel(item) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div class="flex space-x-2">
                        <button
                          v-if="!item.is_installment"
                          @click="editExpense(item)"
                          class="text-primary-600 hover:text-primary-900 transition-colors duration-200"
                        >
                          <Edit class="h-4 w-4" />
                        </button>
                        <button
                          v-if="!item.is_installment"
                          @click="deleteExpense(item.id)"
                          class="text-danger-600 hover:text-danger-900 transition-colors duration-200"
                        >
                          <Trash2 class="h-4 w-4" />
                        </button>
                        <button
                          v-if="item.is_installment"
                          @click="showInstallments(item.expense_id, item.installment_number)"
                          class="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          title="Ver cuota"
                        >
                          <CreditCard class="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
                
                <!-- Gastos normales (cuando no hay filtros de mes) -->
                <template v-else>
                  <tr v-for="expense in directExpenses" :key="expense.id">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center gap-2">
                        <Receipt class="h-4 w-4 text-gray-500" />
                        <span class="text-xs font-medium text-gray-600">Gasto</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ expense.description }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {{ expense.cards?.name || 'Sin tarjeta' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :style="{ backgroundColor: expense.categories?.color + '20', color: expense.categories?.color }"
                      >
                        {{ expense.categories?.name || 'Sin categoría' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ formatCurrency(expense.amount) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {{ formatDate(expense.purchase_date) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <button
                        @click="togglePaidStatus(expense)"
                        :class="[
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-200',
                          paymentStatusMap[expense.payment_status_id]?.code === 'pagada'
                            ? 'bg-success-100 text-success-800 hover:bg-success-200'
                            : paymentStatusMap[expense.payment_status_id]?.code === 'en_deuda'
                            ? 'bg-danger-100 text-danger-800 hover:bg-danger-200'
                            : 'bg-warning-100 text-warning-800 hover:bg-warning-200'
                        ]"
                      >
                        {{ paymentStatusMap[expense.payment_status_id]?.label || 'Sin estado' }}
                      </button>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div class="flex space-x-2">
                        <button
                          @click="editExpense(expense)"
                          class="text-primary-600 hover:text-primary-900 transition-colors duration-200"
                        >
                          <Edit class="h-4 w-4" />
                        </button>
                        <button
                          @click="deleteExpense(expense.id)"
                          class="text-danger-600 hover:text-danger-900 transition-colors duration-200"
                        >
                          <Trash2 class="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

        <!-- Estado vacío -->
        <div
          v-if="filteredExpensesToShow.length === 0"
          class="text-center py-12"
        >
          <Receipt class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-4 text-lg font-medium text-gray-900">No hay gastos</h3>
          <p class="mt-2 text-gray-600">Comienza agregando tu primer gasto</p>
          <button
            @click="showModal = true"
            class="mt-4 btn-primary flex items-center gap-2"
          >
            <Plus class="h-4 w-4" />
            Agregar Gasto
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para agregar/editar gasto -->
    <ExpenseModal
      v-if="showModal"
      :expense="editingExpense"
      @close="closeModal"
      @save="saveExpense"
    />

    <!-- Modal para ver cuotas -->
    <InstallmentsList
      v-if="showInstallmentsModal && selectedExpenseId"
      :expense-id="selectedExpenseId"
      @close="closeInstallmentsModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, watchEffect } from 'vue'
import { useExpensesStore } from '@/stores/expenses'
import { useCardsStore } from '@/stores/cards'
import { useCategoriesStore } from '@/stores/categories'
import ExpenseModal from '@/components/ExpenseModal.vue'
import InstallmentsList from '@/components/InstallmentsList.vue'
import {
  Plus,
  Receipt,
  Edit,
  Trash2,
  AlertCircle,
  RotateCcw,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
// Importar SweetAlert2
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

// Mapeo manual de estados de pago
const paymentStatusMap = {
  1: { code: 'pendiente', label: 'Pendiente' },
  2: { code: 'pagada', label: 'Pagada' },
  3: { code: 'en_deuda', label: 'En deuda' }
}

const expensesStore = useExpensesStore()
const cardsStore = useCardsStore()
const categoriesStore = useCategoriesStore()

const showModal = ref(false)
const editingExpense = ref(null)
const now = new Date()
const filters = ref({
  card_id: '',
  category_id: '',
  month: now.getMonth() + 1, // Mes actual (1-12)
  year: now.getFullYear(),   // Año actual
})

// Años disponibles: desde 2025 hasta el año máximo de las cuotas existentes (o año actual si no hay cuotas)
const availableYears = computed(() => {
  const startYear = 2025
  // Buscar el año máximo entre todas las cuotas (installments) cargadas
  let maxYear = new Date().getFullYear()
  const allInstallments = expensesStore.filteredExpensesWithInstallments
  if (allInstallments.length > 0) {
    const years = allInstallments
      .map(inst => {
        // Puede ser gasto directo o cuota
        if (inst.is_installment && inst.due_date) {
          return new Date(inst.due_date).getFullYear()
        } else if (inst.purchase_date) {
          return new Date(inst.purchase_date).getFullYear()
        }
        return null
      })
      .filter(y => y !== null)
    if (years.length > 0) {
      maxYear = Math.max(...years, maxYear)
    }
  }
  // Generar el array de años
  const yearsArr = []
  for (let y = startYear; y <= maxYear; y++) {
    yearsArr.push(y)
  }
  return yearsArr
})

const directExpenses = computed(() =>
  expensesStore.filteredExpenses.filter(e => e.installments_count === 1)
)

onMounted(async () => {
  await Promise.all([
    expensesStore.loadExpenses(),
    cardsStore.loadCards(),
    categoriesStore.loadCategories()
  ])
  // Si hay mes y año seleccionados, cargar los datos mensuales automáticamente
  if (filters.value.year) {
    loadMonthlyData()
  }
})

const updateFilters = () => {
  const filterData = {}
  Object.keys(filters.value).forEach(key => {
    if (filters.value[key] !== '') {
      filterData[key] = filters.value[key]
    }
  })
  expensesStore.updateFilters(filterData)
  loadMonthlyData()
}

const loadMonthlyData = async () => {
  if (filters.value.month && filters.value.year) {
    await Promise.all([
      expensesStore.loadMonthlyExpensesWithInstallments(
        parseInt(filters.value.month),
        parseInt(filters.value.year)
      ),
      expensesStore.loadMonthlyTotals(
        parseInt(filters.value.month),
        parseInt(filters.value.year)
      )
    ])
  }
}

// Computed para el nombre del mes y año actual
const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const monthYearTitle = computed(() => {
  const month = parseInt(filters.value.month)
  const year = filters.value.year
  if (!month || !year) return ''
  return `${monthNames[month - 1]} ${year}`
})

// Modificar clearFilters para que solo limpie tarjeta y categoría
const clearFilters = () => {
  const now = new Date()
  filters.value.card_id = ''
  filters.value.category_id = ''
  filters.value.month = now.getMonth() + 1
  filters.value.year = now.getFullYear()
  expensesStore.clearFilters()
  updateFilters()
}

const editExpense = (expense) => {
  editingExpense.value = { ...expense }
  showModal.value = true
}

const deleteExpense = async (expenseId) => {
  const { value: confirmed } = await Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (confirmed) {
    try {
      const result = await expensesStore.deleteExpense(expenseId)
      
      if (result.success) {
        // Recargar datos según el contexto actual
        if (filters.value.year) {
          await loadMonthlyData()
        } else {
          await expensesStore.loadExpenses()
        }
        
        await Swal.fire({
          icon: 'success',
          title: '¡Gasto eliminado!',
          text: 'El gasto se eliminó correctamente.',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: result.error || 'No se pudo eliminar el gasto.'
        })
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error inesperado',
        text: error.message || 'Ocurrió un error al eliminar el gasto.'
      })
    }
  }
}

const togglePaidStatus = async (expense) => {
  const currentStatus = paymentStatusMap[expense.payment_status_id]?.code
  const newStatus = currentStatus === 'pagada' ? 'pendiente' : 'pagada'
  const newStatusId = newStatus === 'pagada' ? 2 : 1
  await expensesStore.markAsPaid(expense.id, newStatusId)
}

const closeModal = () => {
  showModal.value = false
  editingExpense.value = null
}

const saveExpense = async (expenseData) => {

  // Separar el campo auxiliar first_installment_date
  const { first_installment_date, ...expenseToSave } = expenseData
  try {
    let result
    if (editingExpense.value) {
      result = await expensesStore.updateExpense(editingExpense.value.id, expenseToSave)
      if (!result.success) {
        Swal.fire({
          icon: 'error',
          title: 'Error al actualizar gasto',
          text: result.error || 'Ocurrió un error inesperado.'
        })
        return
      }
    } else {
      result = await expensesStore.createExpense(expenseToSave)
      if (!result.success) {
        Swal.fire({
          icon: 'error',
          title: 'Error al crear gasto',
          text: result.error || 'Ocurrió un error inesperado.'
        })
        return
      }
      // Crear cuotas si corresponde
      if (expenseToSave.installments_count > 1) {
        await expensesStore.createInstallmentsForExpense(result.data, { ...expenseToSave, first_installment_date })
      }
    }
    Swal.fire({
      icon: 'success',
      title: '¡Gasto guardado!',
      text: 'El gasto se guardó correctamente.'
    })
    closeModal()
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error inesperado',
      text: error.message || 'Ocurrió un error inesperado.'
    })
  }
}

const toggleInstallmentPaid = async (item) => {
  await expensesStore.markInstallmentAsPaid(item.installment_id, item.payment_status_code === 'pendiente')
  // Recargar datos si estamos en vista mensual
  if (filters.value.year) {
    loadMonthlyData()
  }
}

// Modal para ver cuotas
const showInstallmentsModal = ref(false)
const selectedExpenseId = ref(null)

// Reemplazar el método showInstallments para mostrar el modal de una sola cuota
const showInstallments = async (expenseId, installmentNumber = null) => {
  // Buscar la cuota específica en filteredExpensesToShow
  let cuota = null
  if (installmentNumber) {
    cuota = expensesStore.filteredExpensesWithInstallments.find(e => e.is_installment && e.expense_id === expenseId && e.installment_number === installmentNumber)
  } else {
    cuota = expensesStore.filteredExpensesWithInstallments.find(e => e.is_installment && e.expense_id === expenseId)
  }
  if (!cuota) return

  const { value: isPaid } = await Swal.fire({
    title: `<div style='display:flex;align-items:center;gap:10px;'>
      <svg width='32' height='32' fill='none' viewBox='0 0 24 24'><rect width='24' height='24' rx='12' fill='#3b82f6' opacity='0.15'/><path d='M2 7h20M2 12h20M2 17h20' stroke='#3b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>
      Cuota ${cuota.installment_number} de ${cuota.installments_count}
    </div>`,
    html: `
      <div style='text-align:left;font-size:1.1em;'>
        <div style='margin-bottom:8px;'><b>Monto:</b> <span style='color:#3b82f6;'>${formatCurrency(cuota.installment_amount)}</span></div>
        <div style='margin-bottom:8px;'><b>Vencimiento:</b> <span style='color:#6366f1;'>${formatDate(cuota.due_date)}</span></div>
        <div style='margin-bottom:8px;'><b>Estado actual:</b> <span style='color:${paymentStatusMap[cuota.payment_status_id]?.code === 'pagada' ? '#16a34a' : (paymentStatusMap[cuota.payment_status_id]?.code === 'en_deuda' ? '#dc2626' : '#f59e42')};font-weight:bold;'>${paymentStatusMap[cuota.payment_status_id]?.label || 'Sin estado'}</span></div>
        <label style='margin-top:10px;display:block;font-size:1em;'>
          <input type='checkbox' id='swal-paid-checkbox' ${paymentStatusMap[cuota.payment_status_id]?.code === 'pagada' ? 'checked' : ''} style='margin-right:8px;transform:scale(1.2);' />
          Marcar como pagada
        </label>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
    focusConfirm: false,
    customClass: {
      popup: 'swal2-modal-custom',
      confirmButton: 'swal2-confirm-custom',
      cancelButton: 'swal2-cancel-custom'
    },
    preConfirm: () => {
      const checked = document.getElementById('swal-paid-checkbox').checked
      return checked
    }
  })

  if (isPaid !== undefined && (isPaid !== (paymentStatusMap[cuota.payment_status_id]?.code === 'pagada'))) {
    const newStatus = isPaid ? 'pagada' : 'pendiente';
    const result = await expensesStore.markInstallmentAsPaid(cuota.installment_id, newStatus);
    if (result && result.success) {
      await loadMonthlyData();
      await Swal.fire({
        icon: isPaid ? 'success' : 'info',
        title: isPaid ? '¡Cuota pagada!' : 'Cuota pendiente',
        html: `<div style='display:flex;flex-direction:column;align-items:center;'>
          <svg width='48' height='48' fill='none' viewBox='0 0 24 24'><rect width='24' height='24' rx='12' fill='${isPaid ? '#16a34a' : '#f59e42'}' opacity='0.15'/><path d='M7 13l3 3 7-7' stroke='${isPaid ? '#16a34a' : '#f59e42'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>
          <p style='margin-top:10px;font-size:1.1em;'>La cuota fue marcada como <b style='color:${isPaid ? '#16a34a' : '#f59e42'}'>${isPaid ? 'PAGADA' : 'PENDIENTE'}</b>.</p>
        </div>`,
        timer: 1800,
        showConfirmButton: false
      })
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: result && result.error ? result.error : 'No se pudo actualizar el estado de la cuota.'
      })
    }
  }
}
const closeInstallmentsModal = () => {
  showInstallmentsModal.value = false
  selectedExpenseId.value = null
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

// Checkbox para alternar entre gastos directos y cuotas
const showDirectExpenses = ref(false)

// Computed para filtrar lo que se muestra en la tabla según el checkbox
const filteredExpensesToShow = computed(() => {
  const month = parseInt(filters.value.month)
  const year = parseInt(filters.value.year)
  return expensesStore.filteredExpensesWithInstallments.filter(e => {
    if (e.is_installment) {
      // Mostrar solo cuotas del mes/año actual
      const due = new Date(e.due_date)
      return due.getMonth() + 1 === month && due.getFullYear() === year
    } else {
      // Mostrar solo gastos directos del mes/año actual
      const purchase = new Date(e.purchase_date)
      return (e.installments_count === 1) &&
        purchase.getMonth() + 1 === month &&
        purchase.getFullYear() === year
    }
  }).sort((a, b) => {
    const dateA = a.is_installment ? a.due_date : a.purchase_date
    const dateB = b.is_installment ? b.due_date : b.purchase_date
    return new Date(dateA) - new Date(dateB)
  })
})


// Funciones para cambiar de mes con las flechas
function previousMonth() {
  let month = parseInt(filters.value.month)
  let year = filters.value.year
  if (month === 1) {
    month = 12
    year = year - 1
  } else {
    month = month - 1
  }
  filters.value.month = month
  filters.value.year = year
  updateFilters()
}

function nextMonth() {
  let month = parseInt(filters.value.month)
  let year = filters.value.year
  if (month === 12) {
    month = 1
    year = year + 1
  } else {
    month = month + 1
  }
  filters.value.month = month
  filters.value.year = year
  updateFilters()
}

// Total de gastos de un pago (efectivo o débito)
const totalSinglePaymentExpenses = computed(() => {
  const month = parseInt(filters.value.month)
  const year = parseInt(filters.value.year)
  return expensesStore.filteredExpensesWithInstallments
    .filter(e => {
      const isSingle = (e.installments_count === 1 || e.payment_type === 'single')
      const isCash = !e.card_id
      const isDebit = e.cards?.type === 'Débito'
      const purchase = new Date(e.purchase_date)
      return isSingle && (isCash || isDebit) &&
        purchase.getMonth() + 1 === month &&
        purchase.getFullYear() === year
    })
    .reduce((total, e) => total + (e.amount || 0), 0)
})

// Computed para total de gastos débito/transferencia del mes
const totalDebitTransferExpenses = computed(() => {
  const month = parseInt(filters.value.month)
  const year = parseInt(filters.value.year)
  return expensesStore.filteredExpensesWithInstallments
    .filter(e => {
      const isSingle = (e.installments_count === 1 || e.payment_type === 'single')
      const isDebit = e.card_type === 'Débito'
      const isTransfer = e.card_type === 'Transferencia'
      const purchase = new Date(e.purchase_date)
      return isSingle && (isDebit || isTransfer) &&
        purchase.getMonth() + 1 === month &&
        purchase.getFullYear() === year
    })
    .reduce((total, e) => total + (e.amount || 0), 0)
})

// Definir totalCombinedCustom correctamente
const totalCombinedCustom = computed(() => {
  const totalInstallments = expensesStore.totalInstallmentsOnly || 0
  const totalSingle = totalSinglePaymentExpenses.value || 0
  return totalInstallments + totalSingle
})

// Funciones para mostrar el estado correctamente
function getStatusLabel(item) {
  if (item.payment_status_label) return item.payment_status_label;
  if (item.payment_status_id) return paymentStatusMap[item.payment_status_id]?.label || 'Sin estado';
  return 'Sin estado';
}

function getStatusColor(item) {
  const code = item.payment_status_code
    || (item.payment_status_id ? paymentStatusMap[item.payment_status_id]?.code : null);
  if (code === 'pagada') return 'bg-success-100 text-success-800';
  if (code === 'en_deuda') return 'bg-danger-100 text-danger-800';
  if (code === 'pendiente') return 'bg-warning-100 text-warning-800';
  return 'bg-warning-100 text-warning-800';
}
</script> 