<template>
  <div v-if="hasVisibleExpenseRows" class="block md:hidden space-y-3">
    <!-- Lista de cuotas o gastos del mes -->
    <template v-if="paginatedExpenses.length > 0">
      <div
        v-for="item in paginatedExpenses"
        :key="getExpenseRowKey(item)"
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-slate-100 dark:border-gray-700 overflow-hidden card-hover"
      >
        <!-- Category color accent -->
        <div
          class="h-1"
          :style="{ backgroundColor: item.categories?.color || '#94a3b8' }"
        ></div>
        
        <div class="p-4">
          <!-- Header de la tarjeta -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <!-- Checkbox para selección múltiple -->
              <div v-if="isBulkMode" class="flex-shrink-0">
                <input
                  type="checkbox"
                  :checked="selectedExpenses.has(getExpenseRowKey(item))"
                  @change="$emit('toggleExpenseSelection', getExpenseRowKey(item))"
                  class="rounded text-primary-600 focus:ring-primary-500"
                />
              </div>
              
              <!-- Icono de categoría -->
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center"
                :style="{
                  backgroundColor: (item.categories?.color || '#94a3b8') + '15',
                }"
              >
                <component
                  :is="getCategoryIcon(item.categories?.name)"
                  class="h-5 w-5"
                  :style="{ color: item.categories?.color || '#94a3b8' }"
                />
              </div>
              
              <!-- Información principal -->
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-slate-900 dark:text-gray-100 text-sm truncate">
                  {{ item.description }}
                </h3>
                <!-- Regular Installment Progress Bar -->
                <div
                  v-if="item.is_installment"
                  class="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-400 mt-0.5"
                >
                  <span>Cuota {{ item.installment_number }}/{{ item.installments_count }}</span>
                  <div class="w-14 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full"
                      :style="{ width: `${Math.min(100, (item.installment_number / (item.installments_count || 1)) * 100)}%` }"
                    ></div>
                  </div>
                </div>
                <!-- Scheduled Expense Progress Bar -->
                <div
                  v-else-if="item.is_scheduled && getScheduledInstallmentInfo(item)"
                  class="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-400 mt-0.5"
                >
                  <span>{{ getScheduledInstallmentInfo(item).label }}</span>
                  <div
                    v-if="getScheduledInstallmentInfo(item).percentage !== null"
                    class="w-14 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden"
                  >
                    <div
                      class="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
                      :style="{ width: `${getScheduledInstallmentInfo(item).percentage}%` }"
                    ></div>
                  </div>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold"
                    :style="{
                      backgroundColor: item.categories?.color + '15',
                      color: item.categories?.color,
                    }"
                  >
                    {{ item.categories?.name || "Sin categoría" }}
                  </span>
                  <span
                    class="text-xs font-medium"
                    :class="item.is_installment ? 'text-primary-500 dark:text-primary-400' : item.is_scheduled ? 'text-violet-500 dark:text-violet-400' : 'text-slate-400 dark:text-gray-500'"
                  >
                    {{ item.is_installment ? "Cuota" : item.is_scheduled ? "Programado" : "Gasto" }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Monto y menú de opciones -->
            <div class="text-right relative flex-shrink-0 ml-2">
              <div class="relative action-menu-container mb-1">
                <button
                  @click="toggleActionMenu(item.id)"
                  class="p-1.5 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  title="Más opciones"
                >
                  <MoreVertical class="h-4 w-4" />
                </button>
                
                <div
                  v-if="activeActionMenu === item.id"
                  class="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-100 dark:border-gray-700 py-1 z-10 min-w-[140px]"
                >
                  <button
                    @click="handleEdit(item)"
                    class="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center gap-2 font-medium"
                  >
                    <Edit class="h-4 w-4 text-primary-500" />
                    Editar
                  </button>
                  <button
                    @click="handleDelete(item.id, item)"
                    class="w-full px-4 py-2.5 text-left text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 flex items-center gap-2 font-medium"
                  >
                    <Trash2 class="h-4 w-4" />
                    Eliminar
                  </button>
                  <button
                    @click="handlePaymentStatus(item)"
                    class="w-full px-4 py-2.5 text-left text-sm text-success-700 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/20 flex items-center gap-2 font-medium"
                  >
                    <CheckCircle2 class="h-4 w-4" />
                    Cambiar estado
                  </button>
                </div>
              </div>
              
              <div
                class="text-base font-bold"
                :class="item.is_installment ? 'text-primary-600 dark:text-primary-400' : 'text-slate-900 dark:text-gray-100'"
              >
                {{ formatCurrency(item.is_installment ? item.installment_amount : item.amount) }}
              </div>
            </div>
          </div>

          <!-- Detalles adicionales -->
          <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-gray-700">
            <div
              v-if="item.is_installment"
              class="flex items-center justify-between text-xs"
            >
              <span class="text-slate-500 dark:text-gray-400">Cuota {{ item.installment_number }} de {{ item.installments_count }}</span>
              <span class="text-primary-600 dark:text-primary-400 font-semibold">Vence: {{ formatDate(item.due_date) }}</span>
            </div>

            <div
              v-else-if="item.is_scheduled && getScheduledInstallmentLabel(item)"
              class="flex items-center justify-between text-xs"
            >
              <span class="text-slate-500 dark:text-gray-400">{{ getScheduledInstallmentLabel(item) }}</span>
              <span class="text-violet-600 dark:text-violet-400 font-semibold">Mes: {{ formatDate(item.purchase_date) }}</span>
            </div>

            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-500 dark:text-gray-400">Tarjeta</span>
              <span class="text-slate-700 dark:text-gray-300 font-semibold">{{ item.expenses?.available_cards?.name || item.available_cards?.name || "Sin cuenta" }}</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500 dark:text-gray-400">Estado</span>
              <button
                @click="$emit('openPaymentStatusModal', item)"
                :class="[
                  'transition-colors duration-200',
                  getStatusBadgeClass(item)
                ]"
              >
                {{ getStatusLabel(item) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Gastos directos (cuando no hay filtros de mes) -->
    <template v-else-if="!filters || !filters.month || !filters.year">
      <div
        v-for="expense in paginatedDirectExpenses"
        :key="expense.id"
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-slate-100 dark:border-gray-700 overflow-hidden card-hover"
      >
        <!-- Category color accent -->
        <div
          class="h-1"
          :style="{ backgroundColor: expense.categories?.color || '#94a3b8' }"
        ></div>

        <div class="p-4">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div v-if="isBulkMode" class="flex-shrink-0">
                <input
                  type="checkbox"
                  :checked="selectedExpenses.has(getExpenseRowKey(expense))"
                  @change="$emit('toggleExpenseSelection', getExpenseRowKey(expense))"
                  class="rounded text-primary-600 focus:ring-primary-500"
                />
              </div>
              
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center"
                :style="{
                  backgroundColor: (expense.categories?.color || '#94a3b8') + '15',
                }"
              >
                <component
                  :is="getCategoryIcon(expense.categories?.name)"
                  class="h-5 w-5"
                  :style="{ color: expense.categories?.color || '#94a3b8' }"
                />
              </div>
              
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-slate-900 dark:text-gray-100 text-sm truncate">
                  {{ expense.description }}
                </h3>
                <p
                  v-if="expense.is_scheduled && getScheduledInstallmentLabel(expense)"
                  class="text-xs text-slate-400 dark:text-gray-500 mt-0.5"
                >
                  {{ getScheduledInstallmentLabel(expense) }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold"
                    :style="{
                      backgroundColor: expense.categories?.color + '15',
                      color: expense.categories?.color,
                    }"
                  >
                    {{ expense.categories?.name || "Sin categoría" }}
                  </span>
                  <span class="text-xs font-medium text-slate-400 dark:text-gray-500">
                    Gasto
                  </span>
                </div>
              </div>
            </div>
            
            <div class="text-right relative flex-shrink-0 ml-2">
              <div class="relative action-menu-container mb-1">
                <button
                  @click="toggleActionMenu(expense.id)"
                  class="p-1.5 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  title="Más opciones"
                >
                  <MoreVertical class="h-4 w-4" />
                </button>
                
                <div
                  v-if="activeActionMenu === expense.id"
                  class="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-100 dark:border-gray-700 py-1 z-10 min-w-[140px]"
                >
                  <button
                    @click="handleEdit(expense)"
                    class="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center gap-2 font-medium"
                  >
                    <Edit class="h-4 w-4 text-primary-500" />
                    Editar
                  </button>
                  <button
                    @click="handleDelete(expense.id, expense)"
                    class="w-full px-4 py-2.5 text-left text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 flex items-center gap-2 font-medium"
                  >
                    <Trash2 class="h-4 w-4" />
                    Eliminar
                  </button>
                  <button
                    @click="handlePaymentStatus(expense)"
                    class="w-full px-4 py-2.5 text-left text-sm text-success-700 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/20 flex items-center gap-2 font-medium"
                  >
                    <CheckCircle2 class="h-4 w-4" />
                    Cambiar estado
                  </button>
                </div>
              </div>
              
              <div class="text-base font-bold text-slate-900 dark:text-gray-100">
                {{ formatCurrency(expense.amount) }}
              </div>
            </div>
          </div>

          <!-- Detalles adicionales -->
          <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-gray-700">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-500 dark:text-gray-400">Fecha</span>
              <span class="text-slate-700 dark:text-gray-300 font-semibold">{{ formatDate(expense.purchase_date) }}</span>
            </div>

            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-500 dark:text-gray-400">Tarjeta</span>
              <span class="text-slate-700 dark:text-gray-300 font-semibold">{{ expense.expenses?.available_cards?.name || expense.available_cards?.name || "Sin cuenta" }}</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500 dark:text-gray-400">Estado</span>
              <button
                @click="$emit('openPaymentStatusModal', expense)"
                :class="[
                  'transition-colors duration-200',
                  getStatusBadgeClass(expense)
                ]"
              >
                {{ paymentStatusMap[expense.payment_status_id]?.label || "Sin estado" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Paginación móvil -->
    <div v-if="totalPagesMobile > 1" class="flex justify-center items-center gap-2 pt-2">
      <button
        @click="$emit('previousPageMobile')"
        :disabled="currentPageMobile === 1"
        class="btn-secondary !py-2 !px-3 !text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Anterior
      </button>
      
      <span class="text-xs text-slate-500 dark:text-gray-400 font-medium">
        Pág. {{ currentPageMobile }} de {{ totalPagesMobile }}
      </span>
      
      <button
        @click="$emit('nextPageMobile')"
        :disabled="currentPageMobile === totalPagesMobile"
        class="btn-secondary !py-2 !px-3 !text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Siguiente
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Edit, Trash2, CheckCircle2, MoreVertical } from 'lucide-vue-next';

defineProps({
  hasVisibleExpenseRows: { type: Boolean, default: false },
  isBulkMode: { type: Boolean, default: false },
  selectedExpenses: { type: Set, default: () => new Set() },
  paginatedExpenses: { type: Array, default: () => [] },
  paginatedDirectExpenses: { type: Array, default: () => [] },
  filters: { type: Object, default: () => ({}) },
  totalPagesMobile: { type: Number, default: 1 },
  currentPageMobile: { type: Number, default: 1 },
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

const emit = defineEmits([
  'toggleExpenseSelection',
  'openPaymentStatusModal',
  'editExpense',
  'deleteExpense',
  'previousPageMobile',
  'nextPageMobile'
]);

const activeActionMenu = ref(null);

const toggleActionMenu = (id) => {
  activeActionMenu.value = activeActionMenu.value === id ? null : id;
};

const handleEdit = (item) => {
  activeActionMenu.value = null;
  emit('editExpense', item);
};

const handleDelete = (id, item) => {
  activeActionMenu.value = null;
  emit('deleteExpense', id, item);
};

const handlePaymentStatus = (item) => {
  activeActionMenu.value = null;
  emit('openPaymentStatusModal', item);
};
</script>