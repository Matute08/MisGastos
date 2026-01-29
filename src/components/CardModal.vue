<template>
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
    @wheel.prevent 
    @touchmove.prevent 
    @scroll.prevent
    @keydown.esc="handleEscape"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
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
        <h3 id="modal-title" class="text-lg font-semibold text-gray-900">
          {{ card ? 'Editar Tarjeta' : 'Nueva Tarjeta' }}
        </h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          aria-label="Cerrar modal"
          type="button"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="onSubmit" class="p-6 space-y-4" novalidate>
        <!-- Nombre -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">
            Nombre de la tarjeta
          </label>
          <input
            id="name"
            v-model="name"
            type="text"
            class="input-field mt-1"
            :class="{ 'border-red-500': errors.name }"
            placeholder="Ej: Visa Galicia"
            aria-describedby="name-error"
            aria-invalid="true"
            v-bind="nameAttrs"
          />
          <p v-if="errors.name" id="name-error" class="mt-1 text-sm text-red-600" role="alert">
            {{ errors.name }}
          </p>
        </div>

        <!-- Tipo -->
        <div>
          <label for="type" class="block text-sm font-medium text-gray-700">
            Tipo
          </label>
          <select
            id="type"
            v-model="type"
            class="input-field mt-1"
            :class="{ 'border-red-500': errors.type }"
            aria-describedby="type-error"
            aria-invalid="true"
            v-bind="typeAttrs"
          >
            <option value="">Seleccionar tipo</option>
            <option value="Crédito">Crédito</option>
            <option value="Débito">Débito</option>
          </select>
          <p v-if="errors.type" id="type-error" class="mt-1 text-sm text-red-600" role="alert">
            {{ errors.type }}
          </p>
        </div>

        <!-- Banco -->
        <div>
          <label for="bank" class="block text-sm font-medium text-gray-700">
            Banco
          </label>
          <input
            id="bank"
            v-model="bank"
            type="text"
            class="input-field mt-1"
            :class="{ 'border-red-500': errors.bank }"
            placeholder="Ej: Galicia, Santander, etc."
            aria-describedby="bank-error"
            aria-invalid="true"
            v-bind="bankAttrs"
          />
          <p v-if="errors.bank" id="bank-error" class="mt-1 text-sm text-red-600" role="alert">
            {{ errors.bank }}
          </p>
        </div>

        <!-- Error general -->
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
            class="btn-secondary"
            aria-label="Cancelar y cerrar modal"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading || isSubmitting"
            class="btn-primary"
            aria-label="Guardar tarjeta"
          >
            <div v-if="loading || isSubmitting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
            {{ loading || isSubmitting ? 'Guardando...' : (card ? 'Actualizar' : 'Crear') }}
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

// Esquema de validación
const schema = yup.object({
  name: yup
    .string()
    .required('El nombre de la tarjeta es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  type: yup
    .string()
    .required('Debes seleccionar un tipo de tarjeta')
    .oneOf(['Crédito', 'Débito'], 'El tipo debe ser Crédito o Débito'),
  bank: yup
    .string()
    .required('El banco es obligatorio')
    .min(2, 'El nombre del banco debe tener al menos 2 caracteres')
    .max(100, 'El nombre del banco no puede exceder 100 caracteres')
})

// Configurar formulario con vee-validate
const { handleSubmit, errors, isSubmitting, resetForm } = useForm({
  validationSchema: schema,
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
const modalRef = ref(null)

// Manejar tecla Escape
const handleEscape = (event) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

// Inicializar formulario cuando se edita una tarjeta
watch(() => props.card, (newCard) => {
  if (newCard) {
    resetForm({
      values: {
        name: newCard.name || '',
        type: newCard.type || '',
        bank: newCard.bank || ''
      }
    })
  } else {
    resetForm()
  }
  submitError.value = ''
}, { immediate: true })

// Manejar envío del formulario
const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  submitError.value = ''

  try {
    const cardData = {
      name: values.name.trim(),
      type: values.type,
      bank: values.bank.trim()
    }

    await emit('save', cardData)
  } catch (err) {
    submitError.value = getUserFriendlyError(err)
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