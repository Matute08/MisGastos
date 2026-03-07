<template>
    <div class="space-y-6 sm:space-y-8">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
                <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">
                    Categorías
                </h1>
                <p class="text-sm sm:text-base text-slate-500 mt-1">
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
                class="btn-primary flex items-center justify-center gap-2 text-sm sm:text-base"
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
            class="bg-danger-50 border border-danger-200 rounded-2xl p-4"
        >
            <div class="flex items-start gap-3">
                <AlertCircle class="h-5 w-5 text-danger-500 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-danger-700">
                    {{
                        categoriesStore.error.includes("Cannot read properties")
                            ? "Ocurrió un error al cargar las categorías. Intenta recargar la página."
                            : categoriesStore.error
                    }}
                </p>
            </div>
        </div>

        <!-- Loading -->
        <SkeletonGrid v-if="isLoading" :count="8" />

        <!-- Grid de categorías -->
        <div
            v-else
            class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6"
        >
            <div
                v-for="category in categoriesStore.categories.filter(c => c && c.id)"
                :key="category.id"
                class="group relative bg-white rounded-2xl shadow-soft border border-slate-100 hover:shadow-soft-lg hover:border-slate-200 transition-all duration-300 cursor-pointer overflow-visible"
                @click="toggleCategory(category)"
            >
                <!-- Contenido de la categoría -->
                <div class="p-4 sm:p-5 md:p-6 flex flex-col items-center text-center">
                    <!-- Icono circular con color de categoría -->
                    <div
                        class="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 sm:mb-4 transition-transform duration-300 group-hover:scale-110"
                        :style="{ backgroundColor: category.color + '20' }"
                    >
                        <component
                            :is="getCategoryIcon(category.name)"
                            class="h-6 w-6 sm:h-7 sm:w-7"
                            :style="{ color: category.color }"
                        />
                    </div>

                    <!-- Nombre de la categoría -->
                    <h3 class="text-sm sm:text-base md:text-lg font-bold text-slate-900 mb-2 leading-tight">
                        {{ category.name }}
                    </h3>

                    <!-- Badge de subcategorías -->
                    <span
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600"
                    >
                        <Folder class="h-3 w-3" />
                        {{ getSubcategoriesForCategory(category.id).length }}
                        {{ getSubcategoriesForCategory(category.id).length === 1 ? 'sub' : 'subs' }}
                    </span>
                </div>

                <!-- Botón de acciones admin -->
                <div
                    class="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
                            class="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-slate-500 hover:text-slate-700 hover:bg-white transition-all duration-200 shadow-sm border border-slate-100"
                        >
                            <MoreVertical class="h-4 w-4" />
                        </button>

                        <!-- Menú desplegable -->
                        <div
                            v-if="activeCategoryMenu === category.id"
                            class="absolute right-0 w-36 bg-white rounded-xl shadow-soft-lg py-1.5 z-[9999] border border-slate-100"
                            style="top: calc(100% + 6px)"
                        >
                            <button
                                v-if="categoriesStore.canEditCategory()"
                                @click="editCategory(category)"
                                class="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg mx-auto transition-colors duration-200"
                            >
                                <Edit class="h-4 w-4 text-slate-400" />
                                Editar
                            </button>
                            <button
                                v-if="categoriesStore.canDeleteCategory()"
                                @click="deleteCategory(category.id)"
                                class="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-sm text-danger-600 hover:bg-danger-50 rounded-lg mx-auto transition-colors duration-200"
                            >
                                <Trash2 class="h-4 w-4" />
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Estado vacío -->
            <div
                v-if="categoriesStore.categories.length === 0"
                class="col-span-full flex flex-col items-center justify-center py-16 sm:py-20"
            >
                <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 flex items-center justify-center mb-5">
                    <Tag class="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                </div>
                <h3 class="text-lg sm:text-xl font-bold text-slate-900">
                    {{
                        authStore.isAdmin
                            ? "No hay categorías"
                            : "No hay categorías disponibles"
                    }}
                </h3>
                <p class="mt-2 text-sm sm:text-base text-slate-500 text-center max-w-sm">
                    {{
                        authStore.isAdmin
                            ? "Comienza agregando tu primera categoría"
                            : "Contacta al administrador para que agregue categorías"
                    }}
                </p>
                <button
                    v-if="categoriesStore.canCreateCategory()"
                    @click="showModal = true"
                    class="btn-primary flex items-center gap-2 mt-5 text-sm sm:text-base"
                >
                    <Plus class="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Agregar Categoría</span>
                </button>
            </div>
        </div>

        <!-- Modal para mostrar subcategorías -->
        <div
            v-if="showSubcategoriesModal"
            class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            @click.self="closeSubcategoriesModal"
            @wheel.prevent @touchmove.prevent @scroll.prevent
        >
            <div
                class="bg-white rounded-2xl shadow-soft-lg max-w-md w-full max-h-[75vh] overflow-hidden animate-fade-in"
                @wheel.stop @touchmove.stop @scroll.stop
            >
                <!-- Header del modal -->
                <div class="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100">
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 rounded-full flex items-center justify-center"
                            :style="{ backgroundColor: (selectedCategoryForSubcategory?.color || '#6366F1') + '20' }"
                        >
                            <component
                                :is="getCategoryIcon(selectedCategoryForSubcategory?.name)"
                                class="h-5 w-5"
                                :style="{ color: selectedCategoryForSubcategory?.color || '#6366F1' }"
                            />
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-slate-900">
                                {{ selectedCategoryForSubcategory?.name }}
                            </h3>
                            <p class="text-xs text-slate-500">Subcategorías</p>
                        </div>
                    </div>
                    <button
                        @click="closeSubcategoriesModal"
                        class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
                    >
                        <X class="h-5 w-5" />
                    </button>
                </div>

                <!-- Lista de subcategorías -->
                <div class="p-5 sm:p-6 space-y-3 overflow-y-auto max-h-[calc(75vh-140px)]">
                    <div
                        v-for="subcategory in getSubcategoriesForCategory(
                            selectedCategoryForSubcategory?.id
                        ).filter(s => s && s.id)"
                        :key="subcategory.id"
                        class="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="w-3 h-3 rounded-full ring-2 ring-offset-1"
                                :style="{
                                    backgroundColor: subcategory.color,
                                    ringColor: subcategory.color + '40',
                                }"
                            ></div>
                            <span class="text-sm font-medium text-slate-700">
                                {{ subcategory.name }}
                            </span>
                        </div>

                        <div class="flex items-center gap-1.5">
                            <button
                                v-if="subcategoriesStore.canEditSubcategory() && subcategory && subcategory.id"
                                @click="editSubcategory(subcategory)"
                                class="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                            >
                                <Edit class="h-3.5 w-3.5" />
                            </button>
                            <button
                                v-if="subcategoriesStore.canDeleteSubcategory() && subcategory && subcategory.id"
                                @click="deleteSubcategory(subcategory.id)"
                                class="p-1.5 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all duration-200"
                            >
                                <Trash2 class="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    <!-- Estado vacío subcategorías -->
                    <div
                        v-if="
                            getSubcategoriesForCategory(
                                selectedCategoryForSubcategory?.id
                            ).length === 0
                        "
                        class="text-center py-10"
                    >
                        <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <Folder class="h-6 w-6 text-slate-300" />
                        </div>
                        <p class="text-sm text-slate-500">Sin subcategorías</p>
                    </div>

                    <!-- Botón agregar subcategoría -->
                    <button
                        v-if="subcategoriesStore.canCreateSubcategory() && selectedCategoryForSubcategory"
                        @click="addSubcategory(selectedCategoryForSubcategory)"
                        class="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                    >
                        <FolderPlus class="h-4 w-4" />
                        Agregar Subcategoría
                    </button>
                </div>
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
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useCategoriesStore } from "@/stores/categories";
import { useSubcategoriesStore } from "@/stores/subcategories";
import { useExpensesStore } from "@/stores/expenses";
import { useAuthStore } from "@/stores/auth";
import CategoryModal from "@/components/CategoryModal.vue";
import SubcategoryModal from "@/components/SubcategoryModal.vue";
import Swal from "sweetalert2";
import SkeletonGrid from "@/components/SkeletonGrid.vue";
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
    UtensilsCrossed,
    Car,
    Gamepad2,
    Home,
    GraduationCap,
    Shirt,
    ShoppingCart,
    Tv,
    Dumbbell,
    PawPrint,
    Plane,
    Laptop,
    Heart,
    Landmark,
    ShoppingBag,
    MoreHorizontal,
} from "lucide-vue-next";

const categoryIconMap = {
    'Comida': UtensilsCrossed,
    'Transporte': Car,
    'Entretenimiento': Gamepad2,
    'Vivienda': Home,
    'Educación': GraduationCap,
    'Ropa': Shirt,
    'Supermercado': ShoppingCart,
    'Streaming/TV': Tv,
    'Deporte': Dumbbell,
    'Mascotas': PawPrint,
    'Viajes/Ocio': Plane,
    'Electronico/PC': Laptop,
    'Bienestar': Heart,
    'Gastos Financieros': Landmark,
    'Compras': ShoppingBag,
    'Otros': MoreHorizontal,
};

const getCategoryIcon = (name) => {
    if (!name) return Tag;
    return categoryIconMap[name] || Tag;
};

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
const isLoading = ref(true);

let _mounted = true;
onMounted(async () => {
    isLoading.value = true;
    const safetyTimer = setTimeout(() => {
        if (_mounted) isLoading.value = false;
    }, 12000);
    try {
        await Promise.all([
            categoriesStore.loadCategories(),
            subcategoriesStore.loadCategoriesWithSubcategories(),
            expensesStore.loadExpenses(),
        ]);
    } catch {
        // Error ya manejado por los stores
    } finally {
        clearTimeout(safetyTimer);
        if (_mounted) isLoading.value = false;
    }
});

onUnmounted(() => {
    _mounted = false;
});

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

const toggleCategory = (category) => {
    if (!category || !category.id) {
        console.error('Error: category is null or undefined in toggleCategory');
        return;
    }

    selectedCategoryForSubcategory.value = category;
    showSubcategoriesModal.value = true;
};

const toggleCategoryMenu = (categoryId) => {
    activeSubcategoryMenu.value = null;
    activeCategoryMenu.value =
        activeCategoryMenu.value === categoryId ? null : categoryId;
};

const toggleSubcategoryMenu = (subcategoryId) => {
    activeCategoryMenu.value = null;
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
            const deleteResult = await categoriesStore.deleteCategory(categoryId);

            if (deleteResult.success) {
                activeCategoryMenu.value = null;
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
                    text: deleteResult.error || "No se pudo eliminar la categoría.",
                });
            }
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "Error inesperado",
                text: error.message || "Ocurrió un error al eliminar la categoría.",
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
            const deleteResult = await subcategoriesStore.deleteSubcategory(subcategoryId);

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
                    text: deleteResult.error || "No se pudo eliminar la subcategoría.",
                });
            }
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "Error inesperado",
                text: error.message || "Ocurrió un error al eliminar la subcategoría.",
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
    document.body.style.overflow = '';
};

const closeSubcategoriesModal = () => {
    showSubcategoriesModal.value = false;
    selectedCategoryForSubcategory.value = null;
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
            categoriesStore.loadCategories(),
            subcategoriesStore.loadCategoriesWithSubcategories(),
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
            result = await subcategoriesStore.createSubcategory(subcategoryData);
            if (!result.success) {
                await Swal.fire({
                    icon: "error",
                    title: "Error al crear subcategoría",
                    text: result.error || "Ocurrió un error inesperado.",
                });
                return;
            }
        }

        await subcategoriesStore.loadCategoriesWithSubcategories();

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

        showSubcategoryModal.value = false;
        editingSubcategory.value = null;
    } catch (error) {
        await Swal.fire({
            icon: "error",
            title: "Error inesperado",
            text: error.message || "Ocurrió un error inesperado.",
        });
    }
};

const getSubcategoriesForCategory = (categoryId) => {
    if (!categoryId) return [];

    const categoryData = subcategoriesStore.categoriesWithSubcategories.find(
        (cat) => cat.id === categoryId
    );

    if (categoryData && categoryData.subcategories) {
        return categoryData.subcategories;
    }

    return subcategoriesStore.subcategories.filter(
        (subcategory) => subcategory && subcategory.category_id === categoryId
    );
};

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

onMounted(() => {
    document.addEventListener("click", (e) => {
        const isOutsideCategoryMenu = !e.target.closest("[data-category-menu]");
        const isOutsideSubcategoryMenu = !e.target.closest("[data-subcategory-menu]");

        if (isOutsideCategoryMenu) {
            activeCategoryMenu.value = null;
        }

        if (isOutsideSubcategoryMenu) {
            activeSubcategoryMenu.value = null;
        }
    });
});

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
