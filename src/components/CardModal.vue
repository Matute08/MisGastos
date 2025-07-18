<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ card ? 'Editar Tarjeta' : 'Nueva Tarjeta' }}
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
        <!-- Nombre -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">
            Nombre de la tarjeta
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="input-field mt-1"
            placeholder="Ej: Visa Galicia"
          />
        </div>

        <!-- Tipo -->
        <div>
          <label for="type" class="block text-sm font-medium text-gray-700">
            Tipo
          </label>
          <select
            id="type"
            v-model="form.type"
            required
            class="input-field mt-1"
          >
            <option value="">Seleccionar tipo</option>
            <option value="Crédito">Crédito</option>
            <option value="Débito">Débito</option>
          </select>
        </div>

        <!-- Banco -->
        <div>
          <label for="bank" class="block text-sm font-medium text-gray-700">
            Banco
          </label>
          <input
            id="bank"
            v-model="form.bank"
            type="text"
            required
            class="input-field mt-1"
            placeholder="Ej: Galicia, Santander, etc."
          />
        </div>

        <!-- Día de cierre (solo para crédito) -->
        <div v-if="form.type === 'Crédito'">
          <label for="closing_day" class="block text-sm font-medium text-gray-700">
            Día de cierre
          </label>
          <input
            id="closing_day"
            v-model.number="form.closing_day"
            type="number"
            min="1"
            max="31"
            required
            class="input-field mt-1"
            placeholder="Ej: 28"
          />
          <p class="mt-1 text-xs text-gray-500">
            Día del mes en que cierra el resumen
          </p>
        </div>

        <!-- Error -->
        <div v-if="error" class="bg-danger-50 border border-danger-200 rounded-md p-4">
          <div class="flex">
            <AlertCircle class="h-5 w-5 text-danger-400" />
            <div class="ml-3">
              <p class="text-sm text-danger-700">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary"
          >
            <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {{ loading ? 'Guardando...' : (card ? 'Actualizar' : 'Crear') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { X, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  card: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  name: '',
  type: '',
  bank: '',
  closing_day: null
})

const loading = ref(false)
const error = ref('')

// Mover resetForm antes del watcher
const resetForm = () => {
  form.value = {
    name: '',
    type: '',
    bank: '',
    closing_day: null
  }
  error.value = ''
}

// Inicializar formulario cuando se edita una tarjeta
watch(() => props.card, (newCard) => {
  if (newCard) {
    form.value = {
      name: newCard.name,
      type: newCard.type,
      bank: newCard.bank,
      closing_day: newCard.closing_day
    }
  } else {
    resetForm()
  }
}, { immediate: true })

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    // Validaciones
    if (form.value.type === 'Crédito' && !form.value.closing_day) {
      error.value = 'El día de cierre es obligatorio para tarjetas de crédito'
      return
    }

    if (form.value.closing_day && (form.value.closing_day < 1 || form.value.closing_day > 31)) {
      error.value = 'El día de cierre debe estar entre 1 y 31'
      return
    }

    // Preparar datos
    const cardData = {
      name: form.value.name,
      type: form.value.type,
      bank: form.value.bank
    }

    if (form.value.type === 'Crédito') {
      cardData.closing_day = form.value.closing_day
    }

    emit('save', cardData)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  resetForm()
})
</script> 