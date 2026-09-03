<template>
  <div v-if="hasVisibleExpenseRows" class="hidden md:block card !p-0 overflow-hidden">
    <div class="overflow-x-auto">
      <table :key="tableKey" class="min-w-full divide-y divide-slate-100 dark:divide-gray-700">
        <thead class="bg-slate-50 dark:bg-gray-700/80">
          <tr>
            <th
              v-if="isBulkMode"
              class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider"
            >
              <input
                type="checkbox"
                :checked="selectAllExpenses"
                @change="$emit('toggleSelectAllExpenses')"
                class="rounded text-primary-600 focus:ring-primary-500"
              />
            </th>
            <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Tipo
            </th>
            <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Descripción
            </th>
            <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Tarjeta
            </th>
            <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Categoría
            </th>
            <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Monto
            </th>
            <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Fecha
            </th>
            <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Estado
            </th>
            <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50 dark:divide-gray-700/50">
          <template v-if="paginatedExpensesDesktop.length > 0">
            <tr
              v-for="item in paginatedExpensesDesktop"
              :key="getExpenseRowKey(item)"
              class="hover:bg-slate-50 dark:hover:bg-gray-700/60 transition-colors duration-150"
            >
              <td v-if="isBulkMode" class="px-5 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  :checked="selectedExpenses.has(getExpenseRowKey(item))"
                  @change="$emit('toggleExpenseSelection', getExpenseRowKey(item))"
                  class="rounded text-primary-600 focus:ring-primary-500"
                />
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center"
                    :class="item.is_installment ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-slate-100 dark:bg-gray-700'"
                  >
                    <CreditCard
                      v-if="item.is_installment"
                      class="h-4 w-4 text-primary-500"
                    />
                    <component
                      v-else
                      :is="getCategoryIcon(item.categories?.name)"
                      class="h-4 w-4 text-slate-500 dark:text-gray-400"
                    />
                  </div>
                  <span
                    class="text-xs font-semibold"
                    :class="item.is_installment ? 'text-primary-600 dark:text-primary-400' : item.is_scheduled ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-gray-400'"
                  >
                    {{ item.is_installment ? "Cuota" : item.is_scheduled ? "Programado" : "Gasto" }}
                  </span>
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-gray-100">
                <div>
                  <div class="font-semibold text-slate-800 dark:text-gray-100">
                    {{ item.description }}
                  </div>
                  <!-- Regular Installment Progress Bar -->
                  <div
                    v-if="item.is_installment"
                    class="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-400 mt-1"
                  >
                    <span>Cuota {{ item.installment_number }} de {{ item.installments_count }}</span>
                    <div class="w-16 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full transition-all duration-300"
                        :style="{ width: `${Math.min(100, (item.installment_number / (item.installments_count || 1)) * 100)}%` }"
                      ></div>
                    </div>
                  </div>
                  <!-- Scheduled Expense Installment Progress Bar -->
                  <div
                    v-else-if="item.is_scheduled && getScheduledInstallmentInfo(item)"
                    class="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-400 mt-1"
                  >
                    <span>{{ getScheduledInstallmentInfo(item).label }}</span>
                    <div
                      v-if="getScheduledInstallmentInfo(item).percentage !== null"
                      class="w-16 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden"
                    >
                      <div
                        class="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-300"
                        :style="{ width: `${getScheduledInstallmentInfo(item).percentage}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-gray-400">
                {{ item.expenses?.available_cards?.name || item.available_cards?.name || "Sin cuenta" }}
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  :style="{
                    backgroundColor: item.categories?.color + '15',
                    color: item.categories?.color,
                  }"
                >
                  <component
                    :is="getCategoryIcon(item.categories?.name)"
                    class="h-3 w-3"
                  />
                  {{ item.categories?.name || "Sin categoría" }}
                </span>
              </td>
              <td
                class="px-5 py-4 whitespace-nowrap text-sm font-bold"
                :class="item.is_installment ? 'text-primary-600 dark:text-primary-400' : 'text-slate-900 dark:text-gray-100'"
              >
                {{ formatCurrency(item.is_installment ? item.installment_amount : item.amount) }}
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-gray-400">
                {{ formatDate(item.is_installment ? item.due_date : item.purchase_date) }}
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span :class="[getStatusBadgeClass(item)]">
                  {{ getStatusLabel(item) }}
                </span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-sm">
                <div class="flex items-center gap-1">
                  <button
                    @click="$emit('openPaymentStatusModal', item)"
                    class="p-1.5 rounded-lg text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors duration-200"
                    title="Cambiar estado"
                  >
                    <CheckCircle2 class="h-4 w-4" />
                  </button>
                  <button
                    @click="$emit('editExpense', item)"
                    class="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
                    title="Editar gasto"
                  >
                    <Edit class="h-4 w-4" />
                  </button>
                  <button
                    @click="$emit('deleteExpense', item.id, item)"
                    class="p-1.5 rounded-lg text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors duration-200"
                    title="Eliminar gasto"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </template>

          <template v-else-if="!filters || !filters.month || !filters.year">
            <tr
              v-for="expense in paginatedDirectExpensesDesktop"
              :key="expense.id"
              class="hover:bg-slate-50 dark:hover:bg-gray-700/60 transition-colors duration-150"
            >
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
                    <component
                      :is="getCategoryIcon(expense.categories?.name)"
                      class="h-4 w-4 text-slate-500 dark:text-gray-400"
                    />
                  </div>
                  <span class="text-xs font-semibold text-slate-500 dark:text-gray-400">Gasto</span>
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-gray-100">
                <div>{{ expense.description }}</div>
                <div
                  v-if="expense.is_scheduled && getScheduledInstallmentLabel(expense)"
                  class="text-xs text-slate-400 dark:text-gray-500 font-normal mt-0.5"
                >
                  {{ getScheduledInstallmentLabel(expense) }}
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-gray-400">
                {{ expense.expenses?.available_cards?.name || expense.available_cards?.name || "Sin cuenta" }}
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  :style="{
                    backgroundColor: expense.categories?.color + '15',
                    color: expense.categories?.color,
                  }"
                >
                  <component
                    :is="getCategoryIcon(expense.categories?.name)"
                    class="h-3 w-3"
                  />
                  {{ expense.categories?.name || "Sin categoría" }}
                </span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-gray-100">
                {{ formatCurrency(expense.amount) }}
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-gray-400">
                {{ formatDate(expense.purchase_date) }}
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span :class="[getStatusBadgeClass(expense)]">
                  {{ paymentStatusMap[expense.payment_status_id]?.label || "Sin estado" }}
                </span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-sm">
                <div class="flex items-center gap-1">
                  <button
                    @click="$emit('openPaymentStatusModal', expense)"
                    class="p-1.5 rounded-lg text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors duration-200"
                    title="Cambiar estado"
                  >
                    <CheckCircle2 class="h-4 w-4" />
                  </button>
                  <button
                    @click="$emit('editExpense', expense)"
                    class="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
                  >
                    <Edit class="h-4 w-4" />
                  </button>
                  <button
                    @click="$emit('deleteExpense', expense.id, expense)"
                    class="p-1.5 rounded-lg text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors duration-200"
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

    <!-- Paginación desktop -->
    <div v-if="totalPagesDesktop > 1" class="flex justify-center items-center gap-2 px-6 py-4 border-t border-slate-100 dark:border-gray-700">
      <button
        @click="$emit('previousPageDesktop')"
        :disabled="currentPageDesktop === 1"
        class="btn-secondary !py-2 !px-3 !text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Anterior
      </button>
      
      <div class="flex items-center gap-1">
        <span
          v-for="page in visiblePagesDesktop"
          :key="page"
          @click="$emit('goToPageDesktop', page)"
          :class="[
            'px-3 py-1.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200',
            page === currentPageDesktop
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 hover:text-slate-700 dark:hover:text-gray-300'
          ]"
        >
          {{ page }}
        </span>
      </div>
      
      <button
        @click="$emit('nextPageDesktop')"
        :disabled="currentPageDesktop === totalPagesDesktop"
        class="btn-secondary !py-2 !px-3 !text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Siguiente
      </button>
    </div>
  </div>
</template>

<script setup>
import { CreditCard, Edit, Trash2, CheckCircle2 } from 'lucide-vue-next';

defineProps({
  hasVisibleExpenseRows: { type: Boolean, default: false },
  isBulkMode: { type: Boolean, default: false },
  selectAllExpenses: { type: Boolean, default: false },
  selectedExpenses: { type: Set, default: () => new Set() },
  paginatedExpensesDesktop: { type: Array, default: () => [] },
  paginatedDirectExpensesDesktop: { type: Array, default: () => [] },
  filters: { type: Object, default: () => ({}) },
  tableKey: { type: Number, default: 0 },
  totalPagesDesktop: { type: Number, default: 1 },
  currentPageDesktop: { type: Number, default: 1 },
  visiblePagesDesktop: { type: Array, default: () => [] },
  getExpenseRowKey: { type: Function, required: true },
  getCategoryIcon: { type: Function, required: true },
  formatCurrency: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  getStatusBadgeClass: { type: Function, required: true },
  getStatusLabel: { type: Function, required: true },
  paymentStatusMap: { type: Object, required: true },
  getScheduledInstallmentLabel: { type: Function, required: true },
  getScheduledInstallmentInfo: { type: Function, required: true }
});

defineEmits([
  'toggleSelectAllExpenses',
  'toggleExpenseSelection',
  'openPaymentStatusModal',
  'editExpense',
  'deleteExpense',
  'previousPageDesktop',
  'nextPageDesktop',
  'goToPageDesktop'
]);
</script>