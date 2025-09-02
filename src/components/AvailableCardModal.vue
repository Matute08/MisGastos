<template>
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @wheel.prevent @touchmove.prevent @scroll.prevent>
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" @wheel.stop @touchmove.stop @scroll.stop>
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ card ? 'Editar Cuenta Disponible' : 'Nueva Cuenta Disponible' }}
        </h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Nombre de la cuenta -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la cuenta *
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Visa Santander"
          />
        </div>

        <!-- Tipo de cuenta -->
        <div>
          <label for="type" class="block text-sm font-medium text-gray-700 mb-2">
            Tipo de cuenta *
          </label>
          <select
            id="type"
            v-model="form.type"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleccionar tipo</option>
            <option value="Crédito">Crédito</option>
            <option value="Débito">Débito</option>
            <option value="Ninguna">Ninguna (Efectivo/Transferencia)</option>
          </select>
        </div>

        <!-- Banco -->
        <div>
          <label for="bank" class="block text-sm font-medium text-gray-700 mb-2">
            Banco <span v-if="form.type !== 'Ninguna'" class="text-red-500">*</span>
            <span v-else class="text-gray-500">(No aplica)</span>
          </label>
          <input
            id="bank"
            v-model="form.bank"
            type="text"
            :required="form.type !== 'Ninguna'"
            :disabled="form.type === 'Ninguna'"
            :class="[
              'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200',
              form.type === 'Ninguna' 
                ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed focus:ring-gray-400' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
            ]"
            :placeholder="form.type === 'Ninguna' ? 'No aplica para efectivo/transferencia' : 'Ej: Santander'"
          />
          <p v-if="form.type === 'Ninguna'" class="text-xs text-gray-500 mt-1">
            Para pagos en efectivo o transferencias no se requiere especificar banco
          </p>
        </div>



        <!-- Información adicional para efectivo/transferencia -->
        <div v-if="form.type === 'Ninguna'" class="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-blue-700">
                <strong>Efectivo/Transferencia:</strong> Esta opción permite a los usuarios registrar gastos sin necesidad de vincular una cuenta específica.
              </p>
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
            <span v-else>{{ card ? 'Actualizar' : 'Crear' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  card: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const loading = ref(false)
const form = ref({
  name: '',
  type: '',
  bank: ''
})

// Inicializar formulario cuando se abre el modal
onMounted(() => {
  if (props.card) {
    form.value = {
      name: props.card.name,
      type: props.card.type,
      bank: props.card.bank
    }
  }
})

// Limpiar campos específicos cuando cambia el tipo
watch(() => form.value.type, (newType) => {
  // Si es "Ninguna", limpiar el banco
  if (newType === 'Ninguna') {
    form.value.bank = ''
  }
})

const handleSubmit = async () => {
  loading.value = true
  
  try {
    // Validar campos obligatorios
    if (!form.value.name || !form.value.type) {
      throw new Error('Por favor completa todos los campos obligatorios')
    }
    
    // Banco solo es obligatorio si no es "Ninguna"
    if (form.value.type !== 'Ninguna' && (!form.value.bank || form.value.bank.trim() === '')) {
      throw new Error('Por favor especifica el banco')
    }



    // Preparar datos para enviar
    const cardData = {
      name: form.value.name.trim(),
      type: form.value.type,
      bank: form.value.type === 'Ninguna' ? null : form.value.bank.trim()
    }

    // Emitir evento con los datos
    await emit('save', cardData)
    
  } catch (error) {
    console.error('Error en el formulario:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
}
</style>
