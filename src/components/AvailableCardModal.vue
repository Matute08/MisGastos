<template>
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      @wheel.prevent 
      @touchmove.prevent 
      @scroll.prevent
      @keydown.esc="handleEscape"
      role="dialog"
      aria-modal="true"
      aria-labelledby="available-card-modal-title"
    >
      <div 
        class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" 
        @wheel.stop 
        @touchmove.stop 
        @scroll.stop
        role="document"
        ref="modalRef"
        tabindex="-1"
      >
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <h3 id="available-card-modal-title" class="text-lg font-semibold text-gray-900">
          {{ card ? 'Editar Cuenta Disponible' : 'Nueva Cuenta Disponible' }}
        </h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          aria-label="Cerrar modal"
          type="button"
        >
          <X class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="onSubmit" class="p-6 space-y-4" novalidate>
        <!-- Nombre de la cuenta -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la cuenta *
          </label>
          <input
            id="name"
            v-model="name"
            type="text"
            class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-500': errors.name }"
            placeholder="Ej: Visa Santander"
            aria-describedby="name-error"
            :aria-invalid="!!errors.name"
            v-bind="nameAttrs"
          />
          <p v-if="errors.name" id="name-error" class="mt-1 text-sm text-red-600" role="alert">
            {{ errors.name }}
          </p>
        </div>

        <!-- Tipo de cuenta -->
        <div>
          <label for="type" class="block text-sm font-medium text-gray-700 mb-2">
            Tipo de cuenta *
          </label>
          <select
            id="type"
            v-model="type"
            class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-500': errors.type }"
            aria-describedby="type-error"
            :aria-invalid="!!errors.type"
            v-bind="typeAttrs"
          >
            <option value="">Seleccionar tipo</option>
            <option value="Crédito">Crédito</option>
            <option value="Débito">Débito</option>
            <option value="Ninguna">Ninguna (Efectivo/Transferencia)</option>
          </select>
          <p v-if="errors.type" id="type-error" class="mt-1 text-sm text-red-600" role="alert">
            {{ errors.type }}
          </p>
        </div>

        <!-- Banco -->
        <div>
          <label for="bank" class="block text-sm font-medium text-gray-700 mb-2">
            Banco <span v-if="type !== 'Ninguna'" class="text-red-500">*</span>
            <span v-else class="text-gray-500">(No aplica)</span>
          </label>
          <input
            id="bank"
            v-model="bank"
            type="text"
            :disabled="type === 'Ninguna'"
            :class="[
              'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200',
              type === 'Ninguna' 
                ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed focus:ring-gray-400' 
                : errors.bank 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
            ]"
            :placeholder="type === 'Ninguna' ? 'No aplica para efectivo/transferencia' : 'Ej: Santander'"
            aria-describedby="bank-error"
            :aria-invalid="!!errors.bank"
            :aria-disabled="type === 'Ninguna'"
            v-bind="bankAttrs"
          />
          <p v-if="errors.bank" id="bank-error" class="mt-1 text-sm text-red-600" role="alert">
            {{ errors.bank }}
          </p>
          <p v-if="type === 'Ninguna'" class="text-xs text-gray-500 mt-1">
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

        <!-- Error -->
        <div v-if="submitError" class="bg-danger-50 border border-danger-200 rounded-md p-4" role="alert">
          <div class="flex">
            <AlertCircle class="h-5 w-5 text-danger-400" aria-hidden="true" />
            <div class="ml-3">
              <p class="text-sm text-danger-700">{{ submitError }}</p>
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Cancelar y cerrar modal"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading || isSubmitting"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            :aria-label="loading || isSubmitting ? 'Guardando cuenta...' : (card ? 'Actualizar cuenta' : 'Crear cuenta')"
          >
            <div v-if="loading || isSubmitting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto" aria-hidden="true"></div>
            <span v-else>{{ card ? 'Actualizar' : 'Crear' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import { X, AlertCircle } from 'lucide-vue-next'
import { getUserFriendlyError } from '@/utils/errorMessages.js'

const props = defineProps({
  card: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const modalRef = ref(null)

// Esquema de validación dinámico
const getSchema = () => {
  return yup.object({
    name: yup
      .string()
      .required('El nombre de la cuenta es obligatorio')
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    type: yup
      .string()
      .required('Debes seleccionar un tipo de cuenta')
      .oneOf(['Crédito', 'Débito', 'Ninguna'], 'Tipo de cuenta inválido'),
    bank: yup
      .string()
      .when('type', {
        is: (type) => type !== 'Ninguna',
        then: (schema) => schema.required('El banco es obligatorio para tarjetas de Crédito o Débito').min(2, 'El nombre del banco debe tener al menos 2 caracteres'),
        otherwise: (schema) => schema.nullable()
      })
  })
}

// Configurar formulario con vee-validate
const { handleSubmit, errors, isSubmitting, resetForm: resetValidation } = useForm({
  validationSchema: getSchema(),
  initialValues: {
    name: '',
    type: '',
    bank: ''
  }
})

// Campos del formulario
const { value: name, handleBlur: nameBlur, handleChange: nameChange } = useField('name')
const { value: type, handleBlur: typeBlur, handleChange: typeChange } = useField('type')
const { value: bank, handleBlur: bankBlur, handleChange: bankChange } = useField('bank')

// Atributos para accesibilidad
const nameAttrs = computed(() => ({
  onBlur: nameBlur,
  onInput: nameChange
}))

const typeAttrs = computed(() => ({
  onBlur: typeBlur,
  onChange: typeChange
}))

const bankAttrs = computed(() => ({
  onBlur: bankBlur,
  onInput: bankChange
}))

const loading = ref(false)
const submitError = ref('')

// Limpiar campos específicos cuando cambia el tipo
watch(() => type.value, (newType) => {
  // Si es "Ninguna", limpiar el banco
  if (newType === 'Ninguna') {
    bank.value = ''
  }
})

// Inicializar formulario cuando se abre el modal
watch(() => props.card, (newCard) => {
  if (newCard) {
    resetValidation({
      values: {
        name: newCard.name || '',
        type: newCard.type || '',
        bank: newCard.bank || ''
      }
    })
  } else {
    resetValidation()
  }
  submitError.value = ''
}, { immediate: true })

// Manejar tecla Escape
const handleEscape = (event) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

// Manejar envío del formulario
const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  submitError.value = ''
  
  try {
    // Preparar datos para enviar
    const cardData = {
      name: values.name.trim(),
      type: values.type,
      bank: values.type === 'Ninguna' ? null : values.bank.trim()
    }

    // Emitir evento con los datos
    await emit('save', cardData)
    
  } catch (error) {
    submitError.value = getUserFriendlyError(error)
  } finally {
    loading.value = false
  }
})

onMounted(async () => {
  document.body.style.overflow = 'hidden'
  await nextTick()
  if (modalRef.value) {
    modalRef.value.focus()
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
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
