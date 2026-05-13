<template>
  <div class="space-y-4">
    <!-- Header de cuotas -->
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-gray-100">Cuotas</h3>
      <div class="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
        <span>{{ summary.paid_installments || 0 }}/{{ summary.total_installments || 0 }} pagadas</span>
        <span class="text-success-600 font-medium">
          {{ formatCurrency(summary.paid_amount || 0) }}
        </span>
      </div>
    </div>

    <!-- Resumen de cuotas -->
    <div class="bg-slate-50 dark:bg-gray-700 rounded-lg p-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p class="text-slate-600 dark:text-gray-400">Total cuotas</p>
          <p class="font-semibold">{{ summary.total_installments || 0 }}</p>
        </div>
        <div>
          <p class="text-slate-600 dark:text-gray-400">Pagadas</p>
          <p class="font-semibold text-success-600">{{ summary.paid_installments || 0 }}</p>
        </div>
        <div>
          <p class="text-slate-600 dark:text-gray-400">Pendientes</p>
          <p class="font-semibold text-warning-600">{{ summary.pending_installments || 0 }}</p>
        </div>
        <div>
          <p class="text-slate-600 dark:text-gray-400">Pendiente</p>
          <p class="font-semibold text-danger-600">{{ formatCurrency(summary.pending_amount || 0) }}</p>
        </div>
      </div>
      
      <!-- Barra de progreso -->
      <div class="mt-3">
        <div class="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
          <span>Progreso</span>
          <span>{{ Math.round(((summary.paid_installments || 0) / (summary.total_installments || 1)) * 100) }}%</span>
        </div>
        <div class="w-full bg-slate-200 dark:bg-gray-600 rounded-full h-2">
          <div 
            class="bg-success-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${((summary.paid_installments || 0) / (summary.total_installments || 1)) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Lista de cuotas -->
    <div v-if="installments.length > 0" class="space-y-2">
      <div 
        v-for="installment in installments" 
        :key="installment.id"
        class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors"
        :class="{ 'border-success-200 bg-success-50': installment.payment_status_code === 'pagada' }"
      >
        <div class="flex items-center gap-3">
          <!-- Checkbox para marcar como pagada -->
          <button
            @click="toggleInstallmentPaid(installment)"
            class="flex items-center justify-center w-5 h-5 rounded border-2 transition-colors"
            :class="installment.payment_status_code === 'pagada' 
              ? 'bg-success-600 border-success-600 text-white' 
              : 'border-slate-300 hover:border-success-500'"
          >
            <Check v-if="installment.payment_status_code === 'pagada'" class="w-3 h-3" />
          </button>
          
          <!-- Información de la cuota -->
          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium text-slate-900 dark:text-gray-100">
                Cuota {{ installment.installment_number }}
              </span>
              <span class="text-sm text-slate-500 dark:text-gray-400">
                de {{ installment.expense?.installments_count || 0 }}
              </span>
            </div>
            <div class="text-sm text-slate-600 dark:text-gray-400">
              Vence: {{ formatDate(installment.due_date) }}
            </div>
          </div>
        </div>
        
        <!-- Monto y estado -->
        <div class="text-right">
          <div class="font-semibold text-slate-900 dark:text-gray-100">
            {{ formatCurrency(installment.amount) }}
          </div>
          <div class="text-xs">
            <span 
              :class="installment.payment_status_code === 'pagada' ? 'text-success-600' : (installment.payment_status_code === 'en_deuda' ? 'text-danger-600' : 'text-warning-600')"
              class="font-medium"
            >
              {{ installment.payment_status_label || 'Sin estado' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="text-center py-8 text-slate-500 dark:text-gray-400">
      <CreditCard class="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-gray-600" />
      <p>No hay cuotas para mostrar</p>
    </div>

    <!-- Próxima cuota a vencer -->
    <div v-if="summary.next_due_date && !summary.is_completed" class="bg-warning-50 border border-warning-200 rounded-lg p-4">
      <div class="flex items-center gap-2">
        <AlertCircle class="w-5 h-5 text-warning-500" />
        <div>
          <p class="text-sm font-medium text-warning-800">
            Próxima cuota a vencer
          </p>
          <p class="text-sm text-warning-600">
            {{ formatDate(summary.next_due_date) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Completado -->
    <div v-if="summary.is_completed" class="bg-success-50 border border-success-200 rounded-lg p-4">
      <div class="flex items-center gap-2">
        <CheckCircle class="w-5 h-5 text-success-500" />
        <div>
          <p class="text-sm font-medium text-success-800">
            Todas las cuotas pagadas
          </p>
          <p class="text-sm text-success-600">
            ¡Excelente! Has completado todos los pagos
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Check, CreditCard, AlertCircle, CheckCircle } from 'lucide-vue-next'
import { useExpensesStore } from '@/stores/expenses'
import { formatCurrency, formatDate } from '@/utils/formatters'
import Swal from 'sweetalert2'

const props = defineProps({
  expenseId: {
    type: String,
    required: true
  }
})

const expensesStore = useExpensesStore()
const installments = ref([])
const summary = ref({})
const loading = ref(false)

// Cargar cuotas y resumen
const loadInstallmentsData = async () => {
  if (!props.expenseId) return
  
  loading.value = true
  
  try {
    // Cargar cuotas
    const { data: installmentsData } = await expensesStore.loadInstallments(props.expenseId)
    installments.value = installmentsData || []
    
    // Cargar resumen
    const { data: summaryData } = await expensesStore.getExpenseInstallmentsSummary(props.expenseId)
    summary.value = summaryData?.[0] || {}
  } catch (error) {
    console.error('Error al cargar cuotas:', error)
  } finally {
    loading.value = false
  }
}

// Marcar/desmarcar cuota como pagada
const toggleInstallmentPaid = async (installment) => {
  try {
    const loadingToast = Swal.fire({
      title: `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
          <div class="spinner" style="width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);"></div>
          <div style="text-align: center;">
            <div style="font-size: 1.1em; font-weight: 600; color: #1f2937; margin-bottom: 4px;">
              Procesando...
            </div>
            <div style="font-size: 0.9em; color: #6b7280;">
              Actualizando estado de la cuota
            </div>
          </div>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      customClass: {
        popup: 'swal2-modal-custom'
      }
    });

    let newStatus = 'pagada';
    if (installment.payment_status_code === 'pagada') {
      newStatus = 'pendiente';
    }
    
    const result = await expensesStore.markInstallmentAsPaid(installment.id, newStatus);
    
    Swal.close();
    
    if (result && result.success) {
      await loadInstallmentsData();
      
      await Swal.fire({
        icon: 'success',
        title: `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
            <div style="width: 60px; height: 60px; background: ${newStatus === 'pagada' ? 'linear-gradient(135deg, #16a34a, #10b981)' : 'linear-gradient(135deg, #f59e0b, #f97316)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px rgba(${newStatus === 'pagada' ? '22, 163, 74' : '245, 158, 11'}, 0.3);">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
                <path d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 1.2em; font-weight: 700; color: #1f2937; margin-bottom: 4px;">
                ${newStatus === 'pagada' ? '¡Cuota pagada!' : 'Cuota pendiente'}
              </div>
              <div style="font-size: 0.9em; color: #6b7280; line-height: 1.4;">
                Estado actualizado a <span style="font-weight: 700; color: ${newStatus === 'pagada' ? '#16a34a' : '#f59e0b'}">${newStatus === 'pagada' ? 'PAGADA' : 'PENDIENTE'}</span>
              </div>
            </div>
          </div>
        `,
        timer: 2500,
        showConfirmButton: false,
        customClass: {
          popup: 'swal2-modal-custom'
        }
      });
    } else {
      await Swal.fire({
        icon: 'error',
        title: `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #dc2626, #ef4444); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3);">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 1.2em; font-weight: 700; color: #1f2937; margin-bottom: 4px;">
                Error al actualizar
              </div>
              <div style="font-size: 0.9em; color: #6b7280; line-height: 1.4;">
                ${result && result.error ? result.error : 'No se pudo actualizar el estado de la cuota'}
              </div>
            </div>
          </div>
        `,
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'swal2-modal-custom',
          confirmButton: 'swal2-confirm-custom'
        }
      });
    }
  } catch (error) {
    console.error('Error al actualizar cuota:', error);
    Swal.close();
    
    await Swal.fire({
      icon: 'error',
      title: `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #dc2626, #ef4444); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3);">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 1.2em; font-weight: 700; color: #1f2937; margin-bottom: 4px;">
              Error inesperado
            </div>
            <div style="font-size: 0.9em; color: #6b7280; line-height: 1.4;">
              Ocurrió un error al actualizar la cuota. Por favor, intenta nuevamente.
            </div>
          </div>
        </div>
      `,
      confirmButtonText: 'Entendido',
      customClass: {
        popup: 'swal2-modal-custom',
        confirmButton: 'swal2-confirm-custom'
      }
    });
  }
}

// Observar cambios en el expenseId
watch(() => props.expenseId, (newId) => {
  if (newId) {
    loadInstallmentsData()
  }
})

onMounted(() => {
  if (props.expenseId) {
    loadInstallmentsData()
  }
})
</script> 

<style scoped>
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

:deep(.swal2-modal-custom) {
  border-radius: 20px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
  padding: 32px !important;
  max-width: 480px !important;
}

:deep(.swal2-confirm-custom) {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  border-radius: 12px !important;
  padding: 12px 24px !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3) !important;
  transition: all 0.2s ease !important;
}

:deep(.swal2-confirm-custom:hover) {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4) !important;
}
</style>