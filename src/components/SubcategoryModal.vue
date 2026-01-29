<template>
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
    @wheel.prevent 
    @touchmove.prevent 
    @scroll.prevent
    @keydown.esc="handleEscape"
    role="dialog"
    aria-modal="true"
    aria-labelledby="subcategory-modal-title"
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
        <h3 id="subcategory-modal-title" class="text-lg font-semibold text-gray-900">
          {{ subcategory ? 'Editar Subcategoría' : 'Nueva Subcategoría' }}
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
        <!-- Categoría padre -->
        <div>
          <label for="category_id" class="block text-sm font-medium text-gray-700">
            Categoría padre
          </label>
          <select
            id="category_id"
            v-model="categoryId"
            class="input-field mt-1"
            :class="{ 'border-red-500': errors.category_id }"
            :disabled="!!selectedCategory || !!subcategory"
            aria-describedby="category_id-error"
            :aria-invalid="!!errors.category_id"
            v-bind="categoryIdAttrs"
          >
            <option value="">Selecciona una categoría</option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
          <p v-if="errors.category_id" id="category_id-error" class="mt-1 text-sm text-red-600" role="alert">
            {{ errors.category_id }}
          </p>
          <p v-if="selectedCategory" class="text-sm text-gray-500 mt-1">
            Categoría seleccionada: <strong>{{ selectedCategory.name }}</strong>
          </p>
        </div>

        <!-- Nombre -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">
            Nombre de la subcategoría
          </label>
          <input
            id="name"
            v-model="name"
            type="text"
            class="input-field mt-1"
            :class="{ 'border-red-500': errors.name }"
            placeholder="Ej: Ropa, Joyas, Salud, etc."
            aria-describedby="name-error"
            :aria-invalid="!!errors.name"
            v-bind="nameAttrs"
          />
          <p v-if="errors.name" id="name-error" class="mt-1 text-sm text-red-600" role="alert">
            {{ errors.name }}
          </p>
        </div>

        <!-- Color (solo visible si no hay categoría padre seleccionada) -->
        <div v-if="!selectedCategory && !subcategory">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div class="grid grid-cols-6 gap-2">
            <button
              v-for="color in availableColors"
              :key="color"
              type="button"
              @click="form.color = color"
              :class="[
                'w-8 h-8 rounded-full border-2 transition-all duration-200',
                form.color === color ? 'border-gray-900 scale-110' : 'border-gray-300 hover:scale-105'
              ]"
              :style="{ backgroundColor: color }"
            ></button>
          </div>
        </div>

        <!-- Color heredado (cuando hay categoría padre) -->
        <div v-if="selectedCategory || (subcategory && parentCategoryColor)">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Color (heredado de la categoría padre)
          </label>
          <div class="flex items-center space-x-2">
            <div
              class="w-8 h-8 rounded-full border-2 border-gray-300"
              :style="{ backgroundColor: parentCategoryColor }"
            ></div>
            <span class="text-sm text-gray-600">
              Color de "{{ parentCategoryName }}"
            </span>
          </div>
        </div>

        <!-- Vista previa -->
        <div v-if="form.name && (form.color || parentCategoryColor) && form.category_id" class="p-3 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-600 mb-2">Vista previa:</p>
          <div class="flex items-center space-x-2">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :style="{ backgroundColor: (parentCategoryColor || form.color) + '20', color: parentCategoryColor || form.color }"
            >
              {{ form.name }}
            </span>
            <span class="text-xs text-gray-500">
              en {{ getCategoryName(form.category_id) }}
            </span>
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
            :aria-label="loading || isSubmitting ? 'Guardando subcategoría...' : (subcategory ? 'Actualizar subcategoría' : 'Crear subcategoría')"
          >
            <div v-if="loading || isSubmitting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
            {{ loading || isSubmitting ? 'Guardando...' : (subcategory ? 'Actualizar' : 'Crear') }}
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
import { useCategoriesStore } from '@/stores/categories'
import { getUserFriendlyError } from '@/utils/errorMessages.js'

const props = defineProps({
  subcategory: {
    type: Object,
    default: null
  },
  selectedCategory: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const categoriesStore = useCategoriesStore()
const modalRef = ref(null)

// Esquema de validación
const schema = yup.object({
  category_id: yup
    .string()
    .required('Debes seleccionar una categoría'),
  name: yup
    .string()
    .required('El nombre de la subcategoría es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
})

// Configurar formulario con vee-validate
const { handleSubmit, errors, isSubmitting, resetForm: resetValidation } = useForm({
  validationSchema: schema,
  initialValues: {
    category_id: '',
    name: ''
  }
})

// Campos del formulario
const { value: categoryId, handleBlur: categoryIdBlur, handleChange: categoryIdChange } = useField('category_id')
const { value: name, handleBlur: nameBlur, handleChange: nameChange } = useField('name')

// Atributos para accesibilidad
const categoryIdAttrs = computed(() => ({
  onBlur: categoryIdBlur,
  onChange: categoryIdChange
}))

const nameAttrs = computed(() => ({
  onBlur: nameBlur,
  onInput: nameChange
}))

const loading = ref(false)
const submitError = ref('')
const colorValue = ref('#3B82F6')

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

// Obtener categorías
const categories = computed(() => categoriesStore.categories)

// Obtener nombre de categoría
const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : ''
}

// Obtener color de la categoría padre
const parentCategoryColor = computed(() => {
  if (props.selectedCategory) {
    return props.selectedCategory.color
  }
  if (props.subcategory) {
    const category = categories.value.find(c => c.id === props.subcategory.category_id)
    return category ? category.color : null
  }
  return null
})

// Obtener nombre de la categoría padre
const parentCategoryName = computed(() => {
  if (props.selectedCategory) {
    return props.selectedCategory.name
  }
  if (props.subcategory) {
    const category = categories.value.find(c => c.id === props.subcategory.category_id)
    return category ? category.name : ''
  }
  return ''
})

// Función para inicializar el formulario
const initializeForm = () => {
  if (props.subcategory && props.subcategory.id) {
    // Editando una subcategoría existente
    resetValidation({
      values: {
        category_id: props.subcategory.category_id || '',
        name: props.subcategory.name || ''
      }
    })
    colorValue.value = props.subcategory.color || '#3B82F6'
  } else if (props.selectedCategory && props.selectedCategory.id) {
    // Creando una nueva subcategoría con categoría padre seleccionada
    resetValidation({
      values: {
        category_id: props.selectedCategory.id,
        name: ''
      }
    })
    colorValue.value = props.selectedCategory.color || '#3B82F6'
  } else {
    // Creando una nueva subcategoría sin categoría padre pre-seleccionada
    resetValidation({
      values: {
        category_id: '',
        name: ''
      }
    })
    colorValue.value = '#3B82F6'
  }
  submitError.value = ''
}

// Watcher para inicializar el formulario cuando cambien las props
watch([() => props.subcategory, () => props.selectedCategory], () => {
  initializeForm()
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
    // Usar el color de la categoría padre si está disponible
    const colorToUse = parentCategoryColor.value || colorValue.value

    if (!colorToUse) {
      submitError.value = 'Debes seleccionar un color'
      loading.value = false
      return
    }

    await emit('save', {
      category_id: values.category_id,
      name: values.name.trim(),
      color: colorToUse
    })
  } catch (err) {
    submitError.value = getUserFriendlyError(err)
  } finally {
    loading.value = false
  }
})

onMounted(async () => {
  document.body.style.overflow = 'hidden'
  // Cargar categorías si no están cargadas
  if (categories.value.length === 0) {
    await categoriesStore.loadCategories()
  }
  await nextTick()
  if (modalRef.value) {
    modalRef.value.focus()
  }
  initializeForm()
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script> 