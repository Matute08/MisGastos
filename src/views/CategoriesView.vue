<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Categorías</h1>
        <p class="text-sm sm:text-base text-gray-600">
          {{ authStore.isAdmin ? 'Administra las categorías del sistema' : 'Categorías disponibles para tus gastos' }}
        </p>
      </div>
      <button 
        v-if="categoriesStore.canCreateCategory()"
        @click="showModal = true"
        class="flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
        <Plus class="h-4 w-4 sm:h-5 sm:w-5" />
        <span>Nueva Categoría</span>
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="categoriesStore.error && !isPermisoError(categoriesStore.error) && categoriesStore.categories.length > 0"
      class="bg-danger-50 border border-danger-200 rounded-md p-3 sm:p-4"
    >
      <div class="flex">
        <AlertCircle class="h-4 w-4 sm:h-5 sm:w-5 text-danger-400 flex-shrink-0" />
        <div class="ml-2 sm:ml-3">
          <p class="text-xs sm:text-sm text-danger-700">
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
    <div v-if="categoriesStore.loading" class="flex justify-center py-6 sm:py-8">
      <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Lista de categorías compacta -->
    <div v-else class="space-y-3 sm:space-y-4">
      <div
        v-for="category in categoriesStore.categories"
        :key="category.id"
        class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <!-- Header de la categoría compacto -->
        <div 
          class="flex items-center justify-between p-3 sm:p-4 cursor-pointer"
          @click="toggleCategory(category.id)"
        >
          <div class="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div
              class="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
              :style="{ backgroundColor: category.color }"
            ></div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-1 sm:space-x-2">
                <h3 class="text-sm sm:text-lg font-semibold text-gray-900 truncate">{{ category.name }}</h3>
                <!-- Indicador de categoría del sistema -->
                <span 
                  v-if="!authStore.isAdmin && category.user_id !== authStore.user?.id"
                  class="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0"
                >
                  Sistema
                </span>
              </div>
              <div class="text-xs text-gray-600 mt-0.5 sm:mt-1 flex flex-wrap gap-1 sm:gap-2">
                <span class="truncate">Total: {{ formatCurrency(getCategoryTotal(category.id)) }}</span>
                <span class="hidden sm:inline">•</span>
                <span>{{ getCategoryCount(category.id) }} gastos</span>
                <span class="hidden sm:inline">•</span>
                <span>{{ getSubcategoriesForCategory(category.id).length }} subcategorías</span>
              </div>
            </div>
          </div>
          
          <!-- Botones de acción -->
          <div class="flex items-center space-x-1 sm:space-x-2">
            <!-- Botón expandir/colapsar -->
            <button
              @click.stop="toggleCategory(category.id)"
              class="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <ChevronDown 
                v-if="!expandedCategories.includes(category.id)"
                class="h-4 w-4 sm:h-5 sm:w-5 transform transition-transform duration-200" 
              />
              <ChevronUp 
                v-else
                class="h-4 w-4 sm:h-5 sm:w-5 transform transition-transform duration-200" 
              />
            </button>
            
            <!-- Menú de acciones -->
            <div v-if="categoriesStore.canEditCategory() || categoriesStore.canDeleteCategory()" class="relative" data-category-menu>
              <button
                @click.stop="toggleCategoryMenu(category.id)"
                class="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <MoreVertical class="h-3 w-3 sm:h-4 sm:w-4" />
              </button>

              <!-- Menú desplegable -->
              <div
                v-if="activeCategoryMenu === category.id"
                class="absolute right-0 w-28 sm:w-32 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                style="top: calc(100% + 8px);"
              >
                <button
                  v-if="categoriesStore.canEditCategory()"
                  @click="editCategory(category)"
                  class="block w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  <Edit class="h-3 w-3 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                  Editar
                </button>
                <button
                  v-if="categoriesStore.canDeleteCategory()"
                  @click="deleteCategory(category.id)"
                  class="block w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-danger-700 hover:bg-danger-50 transition-colors duration-200"
                >
                  <Trash2 class="h-3 w-3 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Contenido expandible compacto -->
        <div 
          v-if="expandedCategories.includes(category.id)"
          class="border-t border-gray-100 bg-gray-50 transition-all duration-300 ease-in-out"
        >
          <!-- Subcategorías -->
          <div class="p-3 sm:p-4">
            <div class="flex items-center justify-between mb-2 sm:mb-3">
              <h4 class="text-xs sm:text-sm font-medium text-gray-700">Subcategorías</h4>
              <button
                v-if="subcategoriesStore.canCreateSubcategory()"
                @click="addSubcategory(category)"
                class="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors duration-200"
              >
                <FolderPlus class="h-3 w-3" />
                Agregar
              </button>
            </div>
            
            <div class="space-y-1.5 sm:space-y-2">
              <div
                v-for="subcategory in getSubcategoriesForCategory(category.id)"
                :key="subcategory.id"
                class="flex items-center justify-between p-2 sm:p-3 bg-white rounded-md border border-gray-200 hover:border-gray-300 transition-colors duration-200"
              >
                <div class="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div
                    class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: subcategory.color }"
                  ></div>
                  <span class="text-xs sm:text-sm text-gray-700 font-medium truncate">{{ subcategory.name }}</span>
                </div>
                
                <!-- Menú de acciones para subcategorías -->
                <div v-if="subcategoriesStore.canEditSubcategory() || subcategoriesStore.canDeleteSubcategory()" class="relative flex-shrink-0" data-subcategory-menu>
                  <button
                    @click="toggleSubcategoryMenu(subcategory.id)"
                    class="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <MoreVertical class="h-3 w-3" />
                  </button>

                  <!-- Menú desplegable para subcategorías -->
                  <div
                    v-if="activeSubcategoryMenu === subcategory.id"
                    class="absolute right-0 w-20 sm:w-24 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                    style="top: calc(100% + 4px);"
                  >
                    <button
                      v-if="subcategoriesStore.canEditSubcategory()"
                      @click="editSubcategory(subcategory)"
                      class="block w-full text-left px-2 sm:px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <Edit class="h-3 w-3 inline mr-1" />
                      Editar
                    </button>
                    <button
                      v-if="subcategoriesStore.canDeleteSubcategory()"
                      @click="deleteSubcategory(subcategory.id)"
                      class="block w-full text-left px-2 sm:px-3 py-1 text-xs text-danger-700 hover:bg-danger-50 transition-colors duration-200"
                    >
                      <Trash2 class="h-3 w-3 inline mr-1" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
              
              <div
                v-if="getSubcategoriesForCategory(category.id).length === 0"
                class="text-center py-4 sm:py-6 text-gray-500"
              >
                <Folder class="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-gray-300 mb-2" />
                <p class="text-xs sm:text-sm">Sin subcategorías</p>
                <button
                  v-if="subcategoriesStore.canCreateSubcategory()"
                  @click="addSubcategory(category)"
                  class="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Agregar primera subcategoría
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div
        v-if="categoriesStore.categories.length === 0"
        class="text-center py-8 sm:py-12"
      >
        <Tag class="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
        <h3 class="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-gray-900">
          {{ authStore.isAdmin ? 'No hay categorías' : 'No hay categorías disponibles' }}
        </h3>
        <p class="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
          {{ authStore.isAdmin ? 'Comienza agregando tu primera categoría' : 'Contacta al administrador para que agregue categorías' }}
        </p>
        <button
          v-if="categoriesStore.canCreateCategory()"
          @click="showModal = true"
          class="flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 mt-3 sm:mt-4 mx-auto"
        >
          <Plus class="h-4 w-4 sm:h-5 sm:w-5" />
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

    <!-- Modal para agregar/editar subcategoría -->
    <SubcategoryModal
      v-if="showSubcategoryModal"
      :subcategory="editingSubcategory"
      :selected-category="selectedCategoryForSubcategory"
      @close="closeSubcategoryModal"
      @save="saveSubcategory"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import { useSubcategoriesStore } from '@/stores/subcategories'
import { useExpensesStore } from '@/stores/expenses'
import { useAuthStore } from '@/stores/auth'
import CategoryModal from '@/components/CategoryModal.vue'
import SubcategoryModal from '@/components/SubcategoryModal.vue'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import {
  Tag,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle,
  FolderPlus,
  ChevronDown,
  ChevronUp,
  Folder
} from 'lucide-vue-next'

const categoriesStore = useCategoriesStore()
const subcategoriesStore = useSubcategoriesStore()
const expensesStore = useExpensesStore()
const authStore = useAuthStore()

const showModal = ref(false)
const showSubcategoryModal = ref(false)
const editingCategory = ref(null)
const editingSubcategory = ref(null)
const activeCategoryMenu = ref(null)
const activeSubcategoryMenu = ref(null)
const selectedCategoryForSubcategory = ref(null)
const expandedCategories = ref([])

onMounted(async () => {
  console.log('Llamando a loadCategories...')
  await Promise.all([
    categoriesStore.loadCategories(),
    subcategoriesStore.loadCategoriesWithSubcategories(),
    expensesStore.loadExpenses()
  ])
  
  // Ya no expandimos automáticamente las categorías con subcategorías
  // expandCategoriesWithSubcategories()
})

// Función para expandir automáticamente categorías con subcategorías (comentada)
// const expandCategoriesWithSubcategories = () => {
//   categoriesStore.categories.forEach(category => {
//     const subcategories = getSubcategoriesForCategory(category.id)
//     if (subcategories.length > 0 && !expandedCategories.value.includes(category.id)) {
//       expandedCategories.value.push(category.id)
//     }
//   })
// }

const toggleCategory = (categoryId) => {
  const index = expandedCategories.value.indexOf(categoryId)
  if (index > -1) {
    expandedCategories.value.splice(index, 1)
  } else {
    expandedCategories.value.push(categoryId)
  }
}

const toggleCategoryMenu = (categoryId) => {
  // Cerrar menú de subcategorías si está abierto
  activeSubcategoryMenu.value = null
  // Toggle menú de categorías
  activeCategoryMenu.value = activeCategoryMenu.value === categoryId ? null : categoryId
}

const toggleSubcategoryMenu = (subcategoryId) => {
  // Cerrar menú de categorías si está abierto
  activeCategoryMenu.value = null
  // Toggle menú de subcategorías
  activeSubcategoryMenu.value = activeSubcategoryMenu.value === subcategoryId ? null : subcategoryId
}

const editCategory = (category) => {
  editingCategory.value = { ...category }
  showModal.value = true
  activeCategoryMenu.value = null
}

const deleteCategory = async (categoryId) => {
  const result = await Swal.fire({
    title: '¿Estás seguro de que quieres eliminar esta categoría?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      const deleteResult = await categoriesStore.deleteCategory(categoryId)
      
      if (deleteResult.success) {
        activeCategoryMenu.value = null
        // Remover de expandedCategories si estaba expandida
        const index = expandedCategories.value.indexOf(categoryId)
        if (index > -1) {
          expandedCategories.value.splice(index, 1)
        }
        await Swal.fire({
          icon: 'success',
          title: '¡Categoría eliminada!',
          text: 'La categoría se eliminó correctamente.',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: deleteResult.error || 'No se pudo eliminar la categoría.'
        })
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error inesperado',
        text: error.message || 'Ocurrió un error al eliminar la categoría.'
      })
    }
  }
}

const addSubcategory = (category) => {
  selectedCategoryForSubcategory.value = category
  editingSubcategory.value = null
  showSubcategoryModal.value = true
  activeSubcategoryMenu.value = null
  // Expandir la categoría si no está expandida
  if (!expandedCategories.value.includes(category.id)) {
    expandedCategories.value.push(category.id)
  }
}

const editSubcategory = (subcategory) => {
  editingSubcategory.value = { ...subcategory }
  showSubcategoryModal.value = true
  activeSubcategoryMenu.value = null
}

const deleteSubcategory = async (subcategoryId) => {
  const result = await Swal.fire({
    title: '¿Estás seguro de que quieres eliminar esta subcategoría?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      const deleteResult = await subcategoriesStore.deleteSubcategory(subcategoryId)
      
      if (deleteResult.success) {
        activeSubcategoryMenu.value = null
        await Swal.fire({
          icon: 'success',
          title: '¡Subcategoría eliminada!',
          text: 'La subcategoría se eliminó correctamente.',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: deleteResult.error || 'No se pudo eliminar la subcategoría.'
        })
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error inesperado',
        text: error.message || 'Ocurrió un error al eliminar la subcategoría.'
      })
    }
  }
}

const closeModal = () => {
  showModal.value = false
  editingCategory.value = null
}

const closeSubcategoryModal = () => {
  showSubcategoryModal.value = false
  editingSubcategory.value = null
  selectedCategoryForSubcategory.value = null
}

const saveCategory = async (categoryData) => {
  try {
    let result
    if (editingCategory.value) {
      result = await categoriesStore.updateCategory(editingCategory.value.id, categoryData)
      if (!result.success) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al actualizar categoría',
          text: result.error || 'Ocurrió un error inesperado.'
        })
        return
      }
    } else {
      result = await categoriesStore.createCategory(categoryData)
      if (!result.success) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al crear categoría',
          text: result.error || 'Ocurrió un error inesperado.'
        })
        return
      }
    }

    await Promise.all([
      categoriesStore.loadCategories(), // Recarga la lista de categorías
      subcategoriesStore.loadCategoriesWithSubcategories() // Recarga las subcategorías
    ])

    await Swal.fire({
      icon: 'success',
      title: editingCategory.value ? '¡Categoría actualizada!' : '¡Categoría creada!',
      text: editingCategory.value 
        ? 'La categoría se actualizó correctamente.' 
        : 'La categoría se creó correctamente.',
      timer: 2000,
      showConfirmButton: false
    })

    closeModal()
  } catch (error) {
    await Swal.fire({
      icon: 'error',
      title: 'Error inesperado',
      text: error.message || 'Ocurrió un error inesperado.'
    })
  }
}

const saveSubcategory = async (subcategoryData) => {
  try {
    let result
    if (editingSubcategory.value) {
      result = await subcategoriesStore.updateSubcategory(editingSubcategory.value.id, subcategoryData)
      if (!result.success) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al actualizar subcategoría',
          text: result.error || 'Ocurrió un error inesperado.'
        })
        return
      }
    } else {
      result = await subcategoriesStore.createSubcategory(subcategoryData)
      if (!result.success) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al crear subcategoría',
          text: result.error || 'Ocurrió un error inesperado.'
        })
        return
      }
    }

    await subcategoriesStore.loadCategoriesWithSubcategories() // Recarga la lista después de crear/editar

    await Swal.fire({
      icon: 'success',
      title: editingSubcategory.value ? '¡Subcategoría actualizada!' : '¡Subcategoría creada!',
      text: editingSubcategory.value 
        ? 'La subcategoría se actualizó correctamente.' 
        : 'La subcategoría se creó correctamente.',
      timer: 2000,
      showConfirmButton: false
    })

    closeSubcategoryModal()
  } catch (error) {
    await Swal.fire({
      icon: 'error',
      title: 'Error inesperado',
      text: error.message || 'Ocurrió un error inesperado.'
    })
  }
}

// Obtener subcategorías para una categoría específica
const getSubcategoriesForCategory = (categoryId) => {
  // Buscar en categoriesWithSubcategories que tiene la estructura correcta
  const categoryData = subcategoriesStore.categoriesWithSubcategories.find(
    cat => cat.id === categoryId
  )
  
  if (categoryData && categoryData.subcategories) {
    return categoryData.subcategories
  }
  
  // Fallback: buscar en subcategories directo
  return subcategoriesStore.subcategories.filter(subcategory => subcategory.category_id === categoryId)
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
    // Verificar si el clic fue fuera de los menús
    const isOutsideCategoryMenu = !e.target.closest('[data-category-menu]')
    const isOutsideSubcategoryMenu = !e.target.closest('[data-subcategory-menu]')
    
    if (isOutsideCategoryMenu) {
      activeCategoryMenu.value = null
    }
    
    if (isOutsideSubcategoryMenu) {
      activeSubcategoryMenu.value = null
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