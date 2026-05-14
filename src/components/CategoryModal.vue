<template>
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
    @wheel.prevent 
    @touchmove.prevent 
    @scroll.prevent
    @keydown.esc="handleEscape"
    role="dialog"
    aria-modal="true"
    aria-labelledby="category-modal-title"
  >
    <div 
      class="bg-white dark:bg-gray-800 rounded-2xl shadow-soft max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-gray-700" 
      @wheel.stop 
      @touchmove.stop 
      @scroll.stop
      role="document"
      ref="modalRef"
    >
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-slate-200 dark:border-gray-700">
        <h3 id="category-modal-title" class="text-lg font-semibold text-slate-900 dark:text-gray-100">
          {{ category ? 'Editar Categoría' : 'Nueva Categoría' }}
        </h3>
        <button
          @click="$emit('close')"
          class="text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:text-gray-400 transition-colors duration-200"
          aria-label="Cerrar modal"
          type="button"
        >
          <X class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="onSubmit" class="p-6 space-y-4" novalidate>
        <!-- Nombre -->
        <div>
          <label for="name" class="block text-sm font-medium text-slate-700 dark:text-gray-300">
            Nombre de la categoría
          </label>
          <input
            id="name"
            v-model="name"
            type="text"
            class="input-field mt-1"
            :class="{ 'border-danger-500': errors.name }"
            placeholder="Ej: Supermercado, Transporte, etc."
            aria-describedby="name-error"
            :aria-invalid="!!errors.name"
            v-bind="nameAttrs"
          />
          <p v-if="errors.name" id="name-error" class="mt-1 text-sm text-danger-600" role="alert">
            {{ errors.name }}
          </p>
        </div>

        <!-- Color -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div class="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Seleccionar color">
            <button
              v-for="color in availableColors"
              :key="color"
              type="button"
              @click="handleColorSelect(color)"
              :class="[
                'w-8 h-8 rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                colorValue === color ? 'border-slate-900 scale-110' : 'border-slate-300 dark:border-gray-600 hover:scale-105'
              ]"
              :style="{ backgroundColor: color }"
              :aria-label="`Seleccionar color ${color}`"
              :aria-pressed="colorValue === color"
            ></button>
          </div>
          <p v-if="errors.color" class="mt-1 text-sm text-danger-600" role="alert">
            {{ errors.color }}
          </p>
        </div>

        <!-- Vista previa -->
        <div v-if="name && colorValue" class="p-3 bg-slate-50 dark:bg-gray-700 rounded-lg" role="region" aria-label="Vista previa de la categoría">
          <p class="text-sm text-slate-600 dark:text-gray-400 mb-2">Vista previa:</p>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            :style="{ backgroundColor: colorValue + '20', color: colorValue }"
          >
            {{ name }}
          </span>
        </div>

        <!-- Subcategorías (solo para nuevas categorías) -->
        <div v-if="!category && form.name && form.color" class="border-t pt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-medium text-slate-700 dark:text-gray-300">Subcategorías (opcional)</h4>
            <button
              type="button"
              @click="showSubcategoryInput = true"
              class="text-sm text-primary-600 hover:text-primary-700 dark:hover:text-primary-400 font-medium"
            >
              + Agregar subcategoría
            </button>
          </div>
          
          <!-- Input para nueva subcategoría -->
          <div v-if="showSubcategoryInput" class="mb-3 p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center space-x-2">
              <input
                v-model="newSubcategoryName"
                type="text"
                placeholder="Nombre de la subcategoría"
                class="flex-1 input-field text-sm"
                @keyup.enter="addSubcategory"
              />
              <button
                type="button"
                @click="addSubcategory"
                :disabled="!newSubcategoryName.trim()"
                class="btn-primary text-xs !px-3 !py-1"
              >
                Agregar
              </button>
              <button
                type="button"
                @click="cancelSubcategoryInput"
                class="btn-secondary text-xs !px-3 !py-1"
              >
                Cancelar
              </button>
            </div>
          </div>
          
          <div v-if="subcategories.length === 0" class="text-sm text-slate-500 dark:text-gray-400 italic">
            Sin subcategorías
          </div>
          
          <div v-else class="space-y-2">
            <div
              v-for="(subcategory, index) in subcategories"
              :key="index"
              class="flex items-center space-x-2 p-2 bg-slate-50 dark:bg-gray-700 rounded"
            >
              <div
                class="w-4 h-4 rounded-full border border-slate-300 dark:border-gray-600"
                :style="{ backgroundColor: form.color }"
              ></div>
              <span class="text-sm flex-1">{{ subcategory.name }}</span>
              <button
                type="button"
                @click="removeSubcategory(index)"
                class="text-danger-500 hover:text-danger-700 text-sm"
              >
                Eliminar
              </button>
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
            class="btn-secondary"
            aria-label="Cancelar y cerrar modal"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading || isSubmitting"
            class="btn-primary"
            :aria-label="loading || isSubmitting ? 'Guardando categoría...' : (category ? 'Actualizar categoría' : 'Crear categoría')"
          >
            <div v-if="loading || isSubmitting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
            {{ loading || isSubmitting ? 'Guardando...' : (category ? 'Actualizar' : 'Crear') }}
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
  category: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const modalRef = ref(null)

// Esquema de validación
const schema = yup.object({
  name: yup
    .string()
    .required('El nombre de la categoría es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  color: yup
    .string()
    .required('Debes seleccionar un color')
})

// Configurar formulario con vee-validate
const { handleSubmit, errors, isSubmitting, resetForm: resetValidation } = useForm({
  validationSchema: schema,
  initialValues: {
    name: '',
    color: '#3B82F6'
  }
})

// Campos del formulario
const { value: name, handleBlur: nameBlur, handleChange: nameChange } = useField('name')
const { value: colorValue, handleChange: colorChange } = useField('color')

// Atributos para accesibilidad
const nameAttrs = computed(() => ({
  onBlur: nameBlur,
  onInput: nameChange
}))

const subcategories = ref([])
const showSubcategoryInput = ref(false)
const newSubcategoryName = ref('')
const loading = ref(false)
const submitError = ref('')

const availableColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#059669', // Emerald
  '#DC2626'  // Red
]

// Función para resetear formulario
const resetForm = () => {
  resetValidation({
    values: {
      name: '',
      color: '#3B82F6'
    }
  })
  subcategories.value = []
  showSubcategoryInput.value = false
  newSubcategoryName.value = ''
  submitError.value = ''
}

// Inicializar formulario cuando se edita una categoría
watch(() => props.category, (newCategory) => {
  if (newCategory) {
    resetValidation({
      values: {
        name: newCategory.name || '',
        color: newCategory.color || '#3B82F6'
      }
    })
    subcategories.value = [] // No mostrar subcategorías al editar
  } else {
    resetForm()
  }
  submitError.value = ''
}, { immediate: true })

// Manejar tecla Escape
const handleEscape = (event) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

// Enfocar el modal al montar
onMounted(async () => {
  document.body.style.overflow = 'hidden'
  await nextTick()
  if (modalRef.value) {
    modalRef.value.focus()
  }
  resetForm()
})

const addSubcategory = () => {
  if (newSubcategoryName.value.trim()) {
    subcategories.value.push({
      name: newSubcategoryName.value.trim(),
      color: form.value.color // Heredar el color de la categoría padre
    })
    newSubcategoryName.value = ''
    showSubcategoryInput.value = false
  }
}

const cancelSubcategoryInput = () => {
  showSubcategoryInput.value = false
  newSubcategoryName.value = ''
}

const removeSubcategory = (index) => {
  subcategories.value.splice(index, 1)
}

// Manejar selección de color
const handleColorSelect = (color) => {
  colorValue.value = color
  colorChange(color)
}

// Manejar envío del formulario
const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  submitError.value = ''

  try {
    // Preparar el payload según si es edición o creación
    const payload = {
      name: values.name.trim(),
      color: values.color
    }

    // Solo incluir subcategorías si es una nueva categoría
    if (!props.category && subcategories.value.length > 0) {
      payload.subcategories = subcategories.value
    }

    await emit('save', payload)
  } catch (err) {
    submitError.value = getUserFriendlyError(err)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>