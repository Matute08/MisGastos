<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ subcategory ? 'Editar Subcategoría' : 'Nueva Subcategoría' }}
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
        <!-- Categoría padre -->
        <div>
          <label for="category_id" class="block text-sm font-medium text-gray-700">
            Categoría padre
          </label>
          <select
            id="category_id"
            v-model="form.category_id"
            required
            class="input-field mt-1"
            :disabled="!!selectedCategory || !!subcategory"
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
            v-model="form.name"
            type="text"
            required
            class="input-field mt-1"
            placeholder="Ej: Ropa, Joyas, Salud, etc."
          />
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
            {{ loading ? 'Guardando...' : (subcategory ? 'Actualizar' : 'Crear') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { X, AlertCircle } from 'lucide-vue-next'
import { useCategoriesStore } from '@/stores/categories'

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

const form = ref({
  category_id: '',
  name: '',
  color: '#3B82F6'
})

const loading = ref(false)
const error = ref('')

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
  if (props.subcategory) {
    // Editando una subcategoría existente
    form.value = {
      category_id: props.subcategory.category_id,
      name: props.subcategory.name,
      color: props.subcategory.color
    }
  } else if (props.selectedCategory) {
    // Creando una nueva subcategoría con categoría padre seleccionada
    form.value = {
      category_id: props.selectedCategory.id,
      name: '',
      color: props.selectedCategory.color
    }
  } else {
    // Creando una nueva subcategoría sin categoría padre pre-seleccionada
    form.value = {
      category_id: '',
      name: '',
      color: '#3B82F6'
    }
  }
  error.value = ''
}

// Watcher para inicializar el formulario cuando cambien las props
watch([() => props.subcategory, () => props.selectedCategory], () => {
  initializeForm()
}, { immediate: true })

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    // Validaciones
    if (!form.value.category_id) {
      error.value = 'Debes seleccionar una categoría'
      return
    }

    if (!form.value.name.trim()) {
      error.value = 'El nombre de la subcategoría es obligatorio'
      return
    }

    // Usar el color de la categoría padre si está disponible
    const colorToUse = parentCategoryColor.value || form.value.color

    if (!colorToUse) {
      error.value = 'Debes seleccionar un color'
      return
    }

    emit('save', {
      category_id: form.value.category_id,
      name: form.value.name.trim(),
      color: colorToUse
    })
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // Cargar categorías si no están cargadas
  if (categories.value.length === 0) {
    await categoriesStore.loadCategories()
  }
  initializeForm()
})
</script> 