<template>
  <div class="space-y-4">
    <!-- Header de cuotas -->
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-semibold text-gray-900">Cuotas</h3>
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <span>{{ summary.paid_installments || 0 }}/{{ summary.total_installments || 0 }} pagadas</span>
        <span class="text-green-600 font-medium">
          {{ formatCurrency(summary.paid_amount || 0) }}
        </span>
      </div>
    </div>

    <!-- Resumen de cuotas -->
    <div class="bg-gray-50 rounded-lg p-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p class="text-gray-600">Total cuotas</p>
          <p class="font-semibold">{{ summary.total_installments || 0 }}</p>
        </div>
        <div>
          <p class="text-gray-600">Pagadas</p>
          <p class="font-semibold text-green-600">{{ summary.paid_installments || 0 }}</p>
        </div>
        <div>
          <p class="text-gray-600">Pendientes</p>
          <p class="font-semibold text-orange-600">{{ summary.pending_installments || 0 }}</p>
        </div>
        <div>
          <p class="text-gray-600">Pendiente</p>
          <p class="font-semibold text-red-600">{{ formatCurrency(summary.pending_amount || 0) }}</p>
        </div>
      </div>
      
      <!-- Barra de progreso -->
      <div class="mt-3">
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progreso</span>
          <span>{{ Math.round(((summary.paid_installments || 0) / (summary.total_installments || 1)) * 100) }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-green-600 h-2 rounded-full transition-all duration-300"
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
        class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        :class="{ 'border-green-200 bg-green-50': installment.payment_status_code === 'pagada' }"
      >
        <div class="flex items-center gap-3">
          <!-- Checkbox para marcar como pagada -->
          <button
            @click="toggleInstallmentPaid(installment)"
            class="flex items-center justify-center w-5 h-5 rounded border-2 transition-colors"
            :class="installment.payment_status_code === 'pagada' 
              ? 'bg-green-600 border-green-600 text-white' 
              : 'border-gray-300 hover:border-green-500'"
          >
            <Check v-if="installment.payment_status_code === 'pagada'" class="w-3 h-3" />
          </button>
          
          <!-- Información de la cuota -->
          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900">
                Cuota {{ installment.installment_number }}
              </span>
              <span class="text-sm text-gray-500">
                de {{ installment.expense?.installments_count || 0 }}
              </span>
            </div>
            <div class="text-sm text-gray-600">
              Vence: {{ formatDate(installment.due_date) }}
            </div>
          </div>
        </div>
        
        <!-- Monto y estado -->
        <div class="text-right">
          <div class="font-semibold text-gray-900">
            {{ formatCurrency(installment.amount) }}
          </div>
          <div class="text-xs">
            <span 
              :class="installment.payment_status_code === 'pagada' ? 'text-green-600' : (installment.payment_status_code === 'en_deuda' ? 'text-red-600' : 'text-orange-600')"
              class="font-medium"
            >
              {{ installment.payment_status_label || 'Sin estado' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="text-center py-8 text-gray-500">
      <CreditCard class="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p>No hay cuotas para mostrar</p>
    </div>

    <!-- Próxima cuota a vencer -->
    <div v-if="summary.next_due_date && !summary.is_completed" class="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div class="flex items-center gap-2">
        <AlertCircle class="w-5 h-5 text-orange-500" />
        <div>
          <p class="text-sm font-medium text-orange-800">
            Próxima cuota a vencer
          </p>
          <p class="text-sm text-orange-600">
            {{ formatDate(summary.next_due_date) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Completado -->
    <div v-if="summary.is_completed" class="bg-green-50 border border-green-200 rounded-lg p-4">
      <div class="flex items-center gap-2">
        <CheckCircle class="w-5 h-5 text-green-500" />
        <div>
          <p class="text-sm font-medium text-green-800">
            Todas las cuotas pagadas
          </p>
          <p class="text-sm text-green-600">
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
    // Mostrar loading con diseño mejorado
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
      
      // Mostrar éxito con diseño mejorado
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
      // Mostrar error con diseño mejorado
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
    
    // Mostrar error inesperado con diseño mejorado
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
/* Estilos para el spinner */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Estilos para SweetAlert */
:deep(.swal2-modal-custom) {
  border-radius: 20px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
  padding: 32px !important;
  max-width: 480px !important;
}

:deep(.swal2-confirm-custom) {
  background: linear-gradient(135deg, #3b82f6, #6366f1) !important;
  border-radius: 12px !important;
  padding: 12px 24px !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
  transition: all 0.2s ease !important;
}

:deep(.swal2-confirm-custom:hover) {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4) !important;
}

:deep(.swal2-cancel-custom) {
  background: #f3f4f6 !important;
  color: #374151 !important;
  border-radius: 12px !important;
  padding: 12px 24px !important;
  font-weight: 600 !important;
  transition: all 0.2s ease !important;
}

:deep(.swal2-cancel-custom:hover) {
  background: #e5e7eb !important;
  transform: translateY(-1px) !important;
}

/* Estilos para la lista de cuotas */
.installments-container {
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
}

.installments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f1f5f9;
}

.installments-title {
  font-size: 1.3em;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 12px;
}

.installments-title-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.installments-count {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.installments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.installment-item {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.installment-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #6366f1);
  border-radius: 16px 16px 0 0;
}

.installment-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #e2e8f0;
}

.installment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.installment-number {
  display: flex;
  align-items: center;
  gap: 12px;
}

.installment-number-badge {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9em;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.installment-number-text {
  font-weight: 600;
  color: #374151;
  font-size: 1.1em;
}

.installment-status {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.installment-status.pagada {
  background: linear-gradient(135deg, #16a34a, #10b981);
  color: white;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
}

.installment-status.pendiente {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.installment-status.en_deuda {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: white;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

.installment-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.installment-detail {
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
}

.installment-detail.amount {
  border-left-color: #3b82f6;
}

.installment-detail.due-date {
  border-left-color: #6366f1;
}

.detail-label {
  font-size: 0.85em;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 1.1em;
  font-weight: 700;
  color: #374151;
}

.detail-value.amount {
  color: #3b82f6;
}

.detail-value.due-date {
  color: #6366f1;
}

.installment-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toggle-button {
  background: linear-gradient(135deg, #10b981, #16a34a);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9em;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.toggle-button.unpaid {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.toggle-button.unpaid:hover {
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
}

.toggle-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.toggle-button:disabled:hover {
  transform: none;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* Estilos para el resumen */
.summary-section {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 16px;
  padding: 24px;
  margin-top: 24px;
  border: 1px solid #e2e8f0;
}

.summary-title {
  font-size: 1.2em;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-title-icon {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f5f9;
  text-align: center;
  transition: all 0.3s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.summary-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.summary-card-icon.total {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
}

.summary-card-icon.paid {
  background: linear-gradient(135deg, #16a34a, #10b981);
}

.summary-card-icon.pending {
  background: linear-gradient(135deg, #f59e0b, #f97316);
}

.summary-card-icon.overdue {
  background: linear-gradient(135deg, #dc2626, #ef4444);
}

.summary-card-label {
  font-size: 0.85em;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-card-value {
  font-size: 1.4em;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 4px;
}

.summary-card-subtitle {
  font-size: 0.8em;
  color: #6b7280;
  font-weight: 500;
}

/* Responsive design */
@media (max-width: 768px) {
  .installments-container {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .installment-item {
    padding: 16px;
  }
  
  .installment-details {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .installment-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toggle-button {
    width: 100%;
    justify-content: center;
  }
  
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .summary-card {
    padding: 16px;
  }
  
  .summary-card-value {
    font-size: 1.2em;
  }
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .installments-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .installment-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style> 