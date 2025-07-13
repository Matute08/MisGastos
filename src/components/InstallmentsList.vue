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
    // Cambiar el estado de pago: si está pagada, pasar a pendiente; si está pendiente o en deuda, pasar a pagada
    let newStatus = 'pagada';
    if (installment.payment_status_code === 'pagada') {
      newStatus = 'pendiente';
    }
    await expensesStore.markInstallmentAsPaid(installment.id, newStatus);
    // Recargar cuotas y resumen
    await loadInstallmentsData();
  } catch (error) {
    console.error('Error al actualizar cuota:', error)
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