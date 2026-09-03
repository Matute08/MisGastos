<template>
  <div class="space-y-3">
    <div class="flex justify-center">
      <button
        @click="$emit('toggleBulkMode')"
        :class="[
          'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200',
          isBulkMode
            ? 'bg-success-600 hover:bg-success-700 text-white shadow-sm'
            : 'bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 text-slate-700 dark:text-gray-300'
        ]"
      >
        <CheckCircle2 class="h-4 w-4" />
        <span>{{ isBulkMode ? 'Cancelar Selección' : 'Seleccionar Gastos' }}</span>
      </button>
    </div>

    <!-- Barra de acciones múltiples -->
    <div v-if="isBulkMode" class="card !bg-primary-50 dark:!bg-primary-900/30 !border-primary-200 dark:!border-primary-800">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              :checked="selectAllExpenses"
              @change="$emit('toggleSelectAllExpenses')"
              :disabled="isBulkActionLoading"
              class="rounded text-primary-600 focus:ring-primary-500"
            />
            <span class="text-sm font-medium text-slate-700 dark:text-gray-300">
              Seleccionar todos ({{ selectedExpensesCount }} seleccionados)
            </span>
          </label>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            @click="$emit('bulkChangeStatus', 2)"
            :disabled="selectedExpensesCount === 0 || isBulkActionLoading"
            class="btn-success !py-1.5 !px-3 !text-xs"
          >
            <span v-if="isBulkActionLoading" class="inline-flex items-center gap-1">
              <Loader2 class="h-3.5 w-3.5 animate-spin" />
              Procesando...
            </span>
            <span v-else>Pagado</span>
          </button>
          <button
            @click="$emit('bulkChangeStatus', 1)"
            :disabled="selectedExpensesCount === 0 || isBulkActionLoading"
            class="px-3 py-1.5 text-xs font-semibold bg-warning-500 text-white rounded-xl hover:bg-warning-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <span v-if="isBulkActionLoading" class="inline-flex items-center gap-1">
              <Loader2 class="h-3.5 w-3.5 animate-spin" />
              Procesando...
            </span>
            <span v-else>Pendiente</span>
          </button>
          <button
            @click="$emit('bulkDeleteExpenses')"
            :disabled="selectedExpensesCount === 0 || isBulkActionLoading"
            class="btn-danger !py-1.5 !px-3 !text-xs"
          >
            <span v-if="isBulkActionLoading" class="inline-flex items-center gap-1">
              <Loader2 class="h-3.5 w-3.5 animate-spin" />
              Procesando...
            </span>
            <span v-else>Eliminar Seleccionados</span>
          </button>
        </div>
      </div>
      <p v-if="isBulkActionLoading" class="text-xs text-slate-600 dark:text-gray-400 mt-2">
        Procesando cambios en los gastos seleccionados. Esto puede tardar unos segundos.
      </p>
    </div>
  </div>
</template>

<script setup>
import { CheckCircle2, Loader2 } from 'lucide-vue-next';

defineProps({
  isBulkMode: { type: Boolean, default: false },
  selectAllExpenses: { type: Boolean, default: false },
  selectedExpensesCount: { type: Number, default: 0 },
  isBulkActionLoading: { type: Boolean, default: false }
});

defineEmits(['toggleBulkMode', 'toggleSelectAllExpenses', 'bulkChangeStatus', 'bulkDeleteExpenses']);
</script>