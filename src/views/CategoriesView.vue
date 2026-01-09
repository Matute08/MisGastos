<template>
    <div class="space-y-4 sm:space-y-6">
        <!-- Header -->
        <div
            class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4"
        >
            <div>
                <h1 class="text-xl sm:text-2xl font-bold text-gray-900">
                    Categorías
                </h1>
                <p class="text-sm sm:text-base text-gray-600">
                    {{
                        authStore.isAdmin
                            ? "Administra las categorías del sistema"
                            : "Categorías disponibles para tus gastos"
                    }}
                </p>
            </div>
            <button
                v-if="categoriesStore.canCreateCategory()"
                @click="showModal = true"
                class="flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
                <Plus class="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Nueva Categoría</span>
            </button>
        </div>

        <!-- Error -->
        <div
            v-if="
                categoriesStore.error &&
                !isPermisoError(categoriesStore.error) &&
                categoriesStore.categories.length > 0
            "
            class="bg-danger-50 border border-danger-200 rounded-md p-3 sm:p-4"
        >
            <div class="flex">
                <AlertCircle
                    class="h-4 w-4 sm:h-5 sm:w-5 text-danger-400 flex-shrink-0"
                />
                <div class="ml-2 sm:ml-3">
                    <p class="text-xs sm:text-sm text-danger-700">
                        {{
                            categoriesStore.error.includes(
                                "Cannot read properties"
                            )
                                ? "Ocurrió un error al cargar las categorías. Intenta recargar la página."
                                : categoriesStore.error
                        }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Loading -->
        <SkeletonGrid
            v-if="categoriesStore.loading"
            :count="8"
            columns="grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        />

        <!-- Grid de categorías simplificado -->
        <div
            v-else
            class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
        >
            <div
                v-for="category in categoriesStore.categories.filter(c => c && c.id)"
                :key="category.id"
                class="group relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer overflow-visible"
                @click="toggleCategory(category)"
            >
                <!-- Color de fondo de la categoría -->
                <div
                    class="h-2 w-full"
                    :style="{ backgroundColor: category.color }"
                ></div>

                <!-- Contenido de la categoría -->
                <div class="p-3 sm:p-4 md:p-6">
                    <!-- Nombre de la categoría -->
                    <h3
                        class="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 text-center"
                    >
                        {{ category.name }}
                    </h3>
                    
                    <!-- Cantidad de subcategorías -->
                    <div class="text-center">
                        <span class="text-sm text-gray-500">
                            {{ getSubcategoriesForCategory(category.id).length }} 
                            {{ getSubcategoriesForCategory(category.id).length === 1 ? 'subcategoría' : 'subcategorías' }}
                        </span>
                    </div>
                </div>

                <!-- Botón de acciones -->
                <div
                    class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                    <div
                        v-if="
                            categoriesStore.canEditCategory() ||
                            categoriesStore.canDeleteCategory()
                        "
                        class="relative"
                        data-category-menu
                    >
                        <button
                            @click.stop="toggleCategoryMenu(category.id)"
                            class="p-2 bg-white/90 rounded-full text-gray-600 hover:text-gray-800 hover:bg-white transition-all duration-200 shadow-sm"
                        >
                            <MoreVertical class="h-4 w-4" />
                        </button>

                        <!-- Menú desplegable -->
                        <div
                            v-if="activeCategoryMenu === category.id"
                            class="absolute right-0 w-28 bg-white rounded-md shadow-lg py-1 z-[9999] border border-gray-200"
                            style="top: calc(100% + 4px)"
                        >
                            <button
                                v-if="categoriesStore.canEditCategory()"
                                @click="editCategory(category)"
                                class="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                            >
                                <Edit class="h-4 w-4 inline mr-2" />
                                Editar
                            </button>
                            <button
                                v-if="categoriesStore.canDeleteCategory()"
                                @click="deleteCategory(category.id)"
                                class="block w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-200"
                            >
                                <Trash2 class="h-4 w-4 inline mr-2" />
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal para mostrar subcategorías -->
            <div
                v-if="showSubcategoriesModal"
                class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 px-4"
                @wheel.prevent @touchmove.prevent @scroll.prevent
            >
                <div
                    class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[75vh] overflow-y-auto"
                    @wheel.stop @touchmove.stop @scroll.stop
                >
                    <div
                        class="flex justify-between items-center p-4 border-b border-gray-200"
                    >
                        <h3 class="text-lg font-semibold text-gray-900">
                            Subcategorías de
                            {{ selectedCategoryForSubcategory?.name }}
                        </h3>
                        <button
                            @click="closeSubcategoriesModal"
                            class="text-gray-400 hover:text-gray-600"
                        >
                            <X class="h-5 w-5" />
                        </button>
                    </div>

                    <div class="p-4 space-y-3">
                        <div
                            v-for="subcategory in getSubcategoriesForCategory(
                                selectedCategoryForSubcategory?.id
                            ).filter(s => s && s.id)"
                            :key="subcategory.id"
                            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                            <div class="flex items-center space-x-3">
                                <div
                                    class="w-3 h-3 rounded-full"
                                    :style="{
                                        backgroundColor: subcategory.color,
                                    }"
                                ></div>
                                <span
                                    class="text-sm font-medium text-gray-700"
                                    >{{ subcategory.name }}</span
                                >
                            </div>

                            <div class="flex items-center space-x-2">
                                <button
                                    v-if="
                                        subcategoriesStore.canEditSubcategory() && subcategory && subcategory.id
                                    "
                                    @click="editSubcategory(subcategory)"
                                    class="p-1 text-gray-400 hover:text-gray-600"
                                >
                                    <Edit class="h-4 w-4" />
                                </button>
                                <button
                                    v-if="
                                        subcategoriesStore.canDeleteSubcategory() && subcategory && subcategory.id
                                    "
                                    @click="deleteSubcategory(subcategory.id)"
                                    class="p-1 text-red-400 hover:text-red-600"
                                >
                                    <Trash2 class="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div
                            v-if="
                                getSubcategoriesForCategory(
                                    selectedCategoryForSubcategory?.id
                                ).length === 0
                            "
                            class="text-center py-6 text-gray-500"
                        >
                            <Folder
                                class="mx-auto h-8 w-8 text-gray-300 mb-2"
                            />
                            <p class="text-sm">Sin subcategorías</p>
                        </div>

                        <button
                            v-if="subcategoriesStore.canCreateSubcategory() && selectedCategoryForSubcategory"
                            @click="
                                addSubcategory(selectedCategoryForSubcategory)
                            "
                            class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                        >
                            <FolderPlus class="h-4 w-4" />
                            Agregar Subcategoría
                        </button>
                    </div>
                </div>
            </div>

            <!-- Estado vacío -->
            <div
                v-if="categoriesStore.categories.length === 0"
                class="text-center py-8 sm:py-12"
            >
                <Tag class="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                <h3
                    class="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-gray-900"
                >
                    {{
                        authStore.isAdmin
                            ? "No hay categorías"
                            : "No hay categorías disponibles"
                    }}
                </h3>
                <p class="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                    {{
                        authStore.isAdmin
                            ? "Comienza agregando tu primera categoría"
                            : "Contacta al administrador para que agregue categorías"
                    }}
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
import { ref, onMounted, watch } from "vue";
import { useCategoriesStore } from "@/stores/categories";
import { useSubcategoriesStore } from "@/stores/subcategories";
import { useExpensesStore } from "@/stores/expenses";
import { useAuthStore } from "@/stores/auth";
import CategoryModal from "@/components/CategoryModal.vue";
import SubcategoryModal from "@/components/SubcategoryModal.vue";
import SkeletonGrid from "@/components/SkeletonGrid.vue";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
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
    Folder,
    X,
} from "lucide-vue-next";

const categoriesStore = useCategoriesStore();
const subcategoriesStore = useSubcategoriesStore();
const expensesStore = useExpensesStore();
const authStore = useAuthStore();

const showModal = ref(false);
const showSubcategoryModal = ref(false);
const showSubcategoriesModal = ref(false);
const editingCategory = ref(null);
const editingSubcategory = ref(null);
const activeCategoryMenu = ref(null);
const activeSubcategoryMenu = ref(null);
const selectedCategoryForSubcategory = ref(null);
const expandedCategories = ref([]);

onMounted(async () => {
    await Promise.all([
        categoriesStore.loadCategories(),
        subcategoriesStore.loadCategoriesWithSubcategories(),
        expensesStore.loadExpenses(),
    ]);
});

// Bloqueo de scroll del body cuando hay cualquier modal abierto
watch(
    [showModal, showSubcategoryModal, showSubcategoriesModal],
    ([catOpen, subOpen, listOpen]) => {
        const anyOpen = catOpen || subOpen || listOpen;
        if (anyOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    },
    { immediate: true }
);

// Función para expandir automáticamente categorías con subcategorías (comentada)
// const expandCategoriesWithSubcategories = () => {
//   categoriesStore.categories.forEach(category => {
//     const subcategories = getSubcategoriesForCategory(category.id)
//     if (subcategories.length > 0 && !expandedCategories.value.includes(category.id)) {
//       expandedCategories.value.push(category.id)
//     }
//   })
// }

const toggleCategory = (category) => {
    if (!category || !category.id) {
        console.error('Error: category is null or undefined in toggleCategory');
        return;
    }
    
    selectedCategoryForSubcategory.value = category;
    showSubcategoriesModal.value = true;
};

const toggleCategoryMenu = (categoryId) => {
    // Cerrar menú de subcategorías si está abierto
    activeSubcategoryMenu.value = null;
    // Toggle menú de categorías
    activeCategoryMenu.value =
        activeCategoryMenu.value === categoryId ? null : categoryId;
};

const toggleSubcategoryMenu = (subcategoryId) => {
    // Cerrar menú de categorías si está abierto
    activeCategoryMenu.value = null;
    // Toggle menú de subcategorías
    activeSubcategoryMenu.value =
        activeSubcategoryMenu.value === subcategoryId ? null : subcategoryId;
};

const editCategory = (category) => {
    editingCategory.value = { ...category };
    showModal.value = true;
    activeCategoryMenu.value = null;
};

const deleteCategory = async (categoryId) => {
    const result = await Swal.fire({
        title: "¿Estás seguro de que quieres eliminar esta categoría?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
        try {
            const deleteResult = await categoriesStore.deleteCategory(
                categoryId
            );

            if (deleteResult.success) {
                activeCategoryMenu.value = null;
                // Remover de expandedCategories si estaba expandida
                const index = expandedCategories.value.indexOf(categoryId);
                if (index > -1) {
                    expandedCategories.value.splice(index, 1);
                }
                await categoriesStore.loadCategories();
                await subcategoriesStore.loadCategoriesWithSubcategories();
                await Swal.fire({
                    icon: "success",
                    title: "¡Categoría eliminada!",
                    text: "La categoría se eliminó correctamente.",
                    timer: 2000,
                    showConfirmButton: false,
                });
            } else {
                await Swal.fire({
                    icon: "error",
                    title: "Error al eliminar",
                    text:
                        deleteResult.error ||
                        "No se pudo eliminar la categoría.",
                });
            }
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "Error inesperado",
                text:
                    error.message ||
                    "Ocurrió un error al eliminar la categoría.",
            });
        }
    }
};

const addSubcategory = (category) => {
    if (!category || !category.id) {
        console.error('Error: category is null or undefined in addSubcategory');
        return;
    }
    
    selectedCategoryForSubcategory.value = category;
    editingSubcategory.value = null;
    showSubcategoryModal.value = true;
    activeSubcategoryMenu.value = null;
    // Expandir la categoría si no está expandida
    if (!expandedCategories.value.includes(category.id)) {
        expandedCategories.value.push(category.id);
    }
};

const editSubcategory = (subcategory) => {
    if (!subcategory || !subcategory.id) {
        console.error('Error: subcategory is null or undefined in editSubcategory');
        return;
    }
    
    editingSubcategory.value = { ...subcategory };
    showSubcategoryModal.value = true;
    activeSubcategoryMenu.value = null;
};

const deleteSubcategory = async (subcategoryId) => {
    if (!subcategoryId) {
        console.error('Error: subcategoryId is null or undefined in deleteSubcategory');
        await Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo identificar la subcategoría a eliminar.",
        });
        return;
    }
    
    const result = await Swal.fire({
        title: "¿Estás seguro de que quieres eliminar esta subcategoría?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
        try {
            const deleteResult = await subcategoriesStore.deleteSubcategory(
                subcategoryId
            );

            if (deleteResult.success) {
                activeSubcategoryMenu.value = null;
                await subcategoriesStore.loadCategoriesWithSubcategories();
                await Swal.fire({
                    icon: "success",
                    title: "¡Subcategoría eliminada!",
                    text: "La subcategoría se eliminó correctamente.",
                    timer: 2000,
                    showConfirmButton: false,
                });
            } else {
                await Swal.fire({
                    icon: "error",
                    title: "Error al eliminar",
                    text:
                        deleteResult.error ||
                        "No se pudo eliminar la subcategoría.",
                });
            }
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "Error inesperado",
                text:
                    error.message ||
                    "Ocurrió un error al eliminar la subcategoría.",
            });
        }
    }
};

const closeModal = () => {
    showModal.value = false;
    editingCategory.value = null;
};

const closeSubcategoryModal = () => {
    showSubcategoryModal.value = false;
    editingSubcategory.value = null;
    selectedCategoryForSubcategory.value = null;
    // Restaurar scroll del body
    document.body.style.overflow = '';
};

const closeSubcategoriesModal = () => {
    showSubcategoriesModal.value = false;
    selectedCategoryForSubcategory.value = null;
    // Restaurar scroll del body
    document.body.style.overflow = '';
};

const saveCategory = async (categoryData) => {
    try {
        let result;
        if (editingCategory.value) {
            result = await categoriesStore.updateCategory(
                editingCategory.value.id,
                categoryData
            );
            if (!result.success) {
                await Swal.fire({
                    icon: "error",
                    title: "Error al actualizar categoría",
                    text: result.error || "Ocurrió un error inesperado.",
                });
                return;
            }
        } else {
            result = await categoriesStore.createCategory(categoryData);
            if (!result.success) {
                await Swal.fire({
                    icon: "error",
                    title: "Error al crear categoría",
                    text: result.error || "Ocurrió un error inesperado.",
                });
                return;
            }
        }

        await Promise.all([
            categoriesStore.loadCategories(), // Recarga la lista de categorías
            subcategoriesStore.loadCategoriesWithSubcategories(), // Recarga las subcategorías
        ]);

        await Swal.fire({
            icon: "success",
            title: editingCategory.value
                ? "¡Categoría actualizada!"
                : "¡Categoría creada!",
            text: editingCategory.value
                ? "La categoría se actualizó correctamente."
                : "La categoría se creó correctamente.",
            timer: 2000,
            showConfirmButton: false,
        });

        closeModal();
    } catch (error) {
        await Swal.fire({
            icon: "error",
            title: "Error inesperado",
            text: error.message || "Ocurrió un error inesperado.",
        });
    }
};

const saveSubcategory = async (subcategoryData) => {
    try {
        let result;
        if (editingSubcategory.value && editingSubcategory.value.id) {
            result = await subcategoriesStore.updateSubcategory(
                editingSubcategory.value.id,
                subcategoryData
            );
            if (!result.success) {
                await Swal.fire({
                    icon: "error",
                    title: "Error al actualizar subcategoría",
                    text: result.error || "Ocurrió un error inesperado.",
                });
                return;
            }
        } else if (editingSubcategory.value && !editingSubcategory.value.id) {
            await Swal.fire({
                icon: "error",
                title: "Error al actualizar subcategoría",
                text: "No se pudo identificar la subcategoría a actualizar.",
            });
            return;
        } else {
            result = await subcategoriesStore.createSubcategory(
                subcategoryData
            );
            if (!result.success) {
                await Swal.fire({
                    icon: "error",
                    title: "Error al crear subcategoría",
                    text: result.error || "Ocurrió un error inesperado.",
                });
                return;
            }
        }

        await subcategoriesStore.loadCategoriesWithSubcategories(); // Recarga la lista después de crear/editar

        await Swal.fire({
            icon: "success",
            title: editingSubcategory.value
                ? "¡Subcategoría actualizada!"
                : "¡Subcategoría creada!",
            text: editingSubcategory.value
                ? "La subcategoría se actualizó correctamente."
                : "La subcategoría se creó correctamente.",
            timer: 2000,
            showConfirmButton: false,
        });

        // Cerrar modal de edición/creación pero mantener el modal de subcategorías abierto
        showSubcategoryModal.value = false;
        editingSubcategory.value = null;
        // NO limpiar selectedCategoryForSubcategory para mantener el modal de subcategorías abierto
        // selectedCategoryForSubcategory.value = null;
        // NO restaurar scroll del body porque el modal de subcategorías sigue abierto
        // document.body.style.overflow = '';
    } catch (error) {
        await Swal.fire({
            icon: "error",
            title: "Error inesperado",
            text: error.message || "Ocurrió un error inesperado.",
        });
    }
};

// Obtener subcategorías para una categoría específica
const getSubcategoriesForCategory = (categoryId) => {
    if (!categoryId) return [];
    
    // Buscar en categoriesWithSubcategories que tiene la estructura correcta
    const categoryData = subcategoriesStore.categoriesWithSubcategories.find(
        (cat) => cat.id === categoryId
    );

    if (categoryData && categoryData.subcategories) {
        return categoryData.subcategories;
    }

    // Fallback: buscar en subcategories directo
    return subcategoriesStore.subcategories.filter(
        (subcategory) => subcategory && subcategory.category_id === categoryId
    );
};

// Funciones de utilidad
const getCategoryTotal = (categoryId) => {
    return expensesStore.expenses
        .filter((expense) => expense.category_id === categoryId)
        .reduce((total, expense) => total + expense.amount, 0);
};

const getCategoryCount = (categoryId) => {
    return expensesStore.expenses.filter(
        (expense) => expense.category_id === categoryId
    ).length;
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
    }).format(amount);
};

// Cerrar menús al hacer clic fuera
onMounted(() => {
    document.addEventListener("click", (e) => {
        // Verificar si el clic fue fuera de los menús
        const isOutsideCategoryMenu = !e.target.closest("[data-category-menu]");
        const isOutsideSubcategoryMenu = !e.target.closest(
            "[data-subcategory-menu]"
        );

        if (isOutsideCategoryMenu) {
            activeCategoryMenu.value = null;
        }

        if (isOutsideSubcategoryMenu) {
            activeSubcategoryMenu.value = null;
        }
    });
});

// Ocultar errores de permisos o RLS
function isPermisoError(error) {
    if (!error) return false;
    const msg = error.toLowerCase();
    return (
        msg.includes("permission denied") ||
        msg.includes("row-level security") ||
        msg.includes("forbidden") ||
        msg.includes("rls")
    );
}
</script>