<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Categorías</h1>
        <p class="text-gray-600">
          {{ authStore.isAdmin ? 'Administra las categorías del sistema' : 'Categorías disponibles para tus gastos' }}
        </p>
      </div>
      <button 
        v-if="categoriesStore.canCreateCategory()"
        @click="showModal = true"
        class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
        <Plus class="h-5 w-5" />
        <span>Nueva Categoría</span>
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="categoriesStore.error && !isPermisoError(categoriesStore.error) && categoriesStore.categories.length > 0"
      class="bg-danger-50 border border-danger-200 rounded-md p-4"
    >
      <div class="flex">
        <AlertCircle class="h-5 w-5 text-danger-400" />
        <div class="ml-3">
          <p class="text-sm text-danger-700">
            {{
              categoriesStore.error.includes('Cannot read properties')
                ? 'Ocurrió un error al cargar las categorías. Intenta recargar la página.'
                : categoriesStore.error
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="categoriesStore.loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Lista de categorías -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="category in categoriesStore.categories"
        :key="category.id"
        class="card hover:shadow-md transition-shadow duration-200"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <div
                class="w-4 h-4 rounded-full"
                :style="{ backgroundColor: category.color }"
              ></div>
              <h3 class="text-lg font-semibold text-gray-900">{{ category.name }}</h3>
              <!-- Indicador de categoría del sistema -->
              <span 
                v-if="!authStore.isAdmin && category.user_id !== authStore.user?.id"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                Sistema
              </span>
            </div>
            
            <div class="text-sm text-gray-600">
              <p>Total gastos: ${{ formatCurrency(getCategoryTotal(category.id)) }}</p>
              <p>Cantidad: {{ getCategoryCount(category.id) }} gastos</p>
            </div>
          </div>

          <!-- Menú de acciones (solo para admins) -->
          <div v-if="categoriesStore.canEditCategory() || categoriesStore.canDeleteCategory()" class="relative">
            <button
              @click="toggleCategoryMenu(category.id)"
              class="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <MoreVertical class="h-4 w-4" />
            </button>

            <!-- Menú desplegable -->
            <div
              v-if="activeCategoryMenu === category.id"
              class="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
            >
              <button
                v-if="categoriesStore.canEditCategory()"
                @click="editCategory(category)"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <Edit class="h-4 w-4 inline mr-2" />
                Editar
              </button>
              <button
                v-if="categoriesStore.canDeleteCategory()"
                @click="deleteCategory(category.id)"
                class="block w-full text-left px-4 py-2 text-sm text-danger-700 hover:bg-danger-50 transition-colors duration-200"
              >
                <Trash2 class="h-4 w-4 inline mr-2" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div
        v-if="categoriesStore.categories.length === 0"
        class="col-span-full text-center py-12"
      >
        <Tag class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-4 text-lg font-medium text-gray-900">
          {{ authStore.isAdmin ? 'No hay categorías' : 'No hay categorías disponibles' }}
        </h3>
        <p class="mt-2 text-gray-600">
          {{ authStore.isAdmin ? 'Comienza agregando tu primera categoría' : 'Contacta al administrador para que agregue categorías' }}
        </p>
        <button
          v-if="categoriesStore.canCreateCategory()"
          @click="showModal = true"
          class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 mt-4 mx-auto"
        >
          <Plus class="h-5 w-5" />
          <span>Agregar Categoría</span>
        </button>
      </div>
    </div>

    <!-- Modal para agregar/editar categoría -->
    <CategoryModal
      v-if="showModal"
      :category="editingCategory"
      @close="closeModal"
      @save="saveCategory"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import { useExpensesStore } from '@/stores/expenses'
import { useAuthStore } from '@/stores/auth'
import CategoryModal from '@/components/CategoryModal.vue'
import {
  Tag,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-vue-next'

const categoriesStore = useCategoriesStore()
const expensesStore = useExpensesStore()
const authStore = useAuthStore()

const showModal = ref(false)
const editingCategory = ref(null)
const activeCategoryMenu = ref(null)

onMounted(async () => {
  console.log('Llamando a loadCategories...')
  await Promise.all([
    categoriesStore.loadCategories(),
    expensesStore.loadExpenses()
  ])
})

const toggleCategoryMenu = (categoryId) => {
  activeCategoryMenu.value = activeCategoryMenu.value === categoryId ? null : categoryId
}

const editCategory = (category) => {
  editingCategory.value = { ...category }
  showModal.value = true
  activeCategoryMenu.value = null
}

const deleteCategory = async (categoryId) => {
  if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
    await categoriesStore.deleteCategory(categoryId)
    activeCategoryMenu.value = null
  }
}

const closeModal = () => {
  showModal.value = false
  editingCategory.value = null
}

const saveCategory = async (categoryData) => {
  if (editingCategory.value) {
    await categoriesStore.updateCategory(editingCategory.value.id, categoryData)
  } else {
    await categoriesStore.createCategory(categoryData)
  }
  await categoriesStore.loadCategories() // Recarga la lista después de crear/editar
  closeModal()
}

// Funciones de utilidad
const getCategoryTotal = (categoryId) => {
  return expensesStore.expenses
    .filter(expense => expense.category_id === categoryId)
    .reduce((total, expense) => total + expense.amount, 0)
}

const getCategoryCount = (categoryId) => {
  return expensesStore.expenses
    .filter(expense => expense.category_id === categoryId)
    .length
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount)
}

// Cerrar menús al hacer clic fuera
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
      activeCategoryMenu.value = null
    }
  })
})

// Ocultar errores de permisos o RLS
function isPermisoError(error) {
  if (!error) return false;
  const msg = error.toLowerCase();
  return (
    msg.includes('permission denied') ||
    msg.includes('row-level security') ||
    msg.includes('forbidden') ||
    msg.includes('rls')
  );
}
</script> 