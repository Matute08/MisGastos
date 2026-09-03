<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-gray-100">Gastos</h1>
                <p class="text-slate-500 dark:text-gray-400">Gestiona todos tus gastos y compras</p>
            </div>
            <ExportButton
                :data="exportableExpenses"
                filename="gastos.csv"
                :columns="expenseCsvColumns"
                label="Exportar CSV"
            />
        </div>

        <!-- Resumen del mes actual -->
        <ExpenseSummaryHeader
            :is-loading="isLoading"
            :month-year-title="monthYearTitle"
            :total-debit-transfer-expenses="totalDebitTransferExpenses"
            :total-credit-expenses="totalCreditExpenses"
            :total-expenses="totalExpenses"
            :format-currency="formatCurrency"
            @previous-month="previousMonth"
            @next-month="nextMonth"
        />

        <!-- Filtros y Buscador -->
        <ExpenseFiltersBar
            :filters="filters"
            :available-cards-for-month="availableCardsForMonth"
            :available-categories-for-month="availableCategoriesForMonth"
            :month-names="monthNames"
            :available-years="availableYears"
            :available-payment-statuses="availablePaymentStatuses"
            :search-query="searchQuery"
            @update-filter="handleUpdateFilter"
            @clear-filter="handleClearFilter"
            @reset-filters="clearFilters"
            @update:search-query="searchQuery = $event"
        />

        <!-- Error -->
        <div
            v-if="expensesStore.error"
            class="bg-danger-50 border border-danger-200 rounded-2xl p-4"
        >
            <div class="flex items-center gap-3">
                <AlertCircle class="h-5 w-5 text-danger-500 flex-shrink-0" />
                <p class="text-sm text-danger-700">
                    {{ expensesStore.error }}
                </p>
            </div>
        </div>

        <!-- Loading Skeletons -->
        <div v-if="isLoading" class="pb-20">
            <div class="hidden md:block card !p-0 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-slate-100">
                        <thead class="bg-slate-50 dark:bg-gray-700/80">
                            <tr>
                                <th v-for="i in 9" :key="i" class="px-5 py-4 text-left">
                                    <div class="skeleton h-4 rounded-lg" :style="{ width: [16, 64, 96, 80, 80, 64, 64, 64, 64][i-1] + 'px' }"></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <tr v-for="i in 8" :key="i">
                                <td class="px-5 py-4"><div class="skeleton h-4 w-4 rounded-lg"></div></td>
                                <td class="px-5 py-4"><div class="skeleton h-8 w-8 rounded-full"></div></td>
                                <td class="px-5 py-4"><div class="skeleton h-4 w-32 rounded-lg"></div></td>
                                <td class="px-5 py-4"><div class="skeleton h-4 w-24 rounded-lg"></div></td>
                                <td class="px-5 py-4"><div class="skeleton h-5 w-20 rounded-full"></div></td>
                                <td class="px-5 py-4"><div class="skeleton h-4 w-24 rounded-lg"></div></td>
                                <td class="px-5 py-4"><div class="skeleton h-4 w-20 rounded-lg"></div></td>
                                <td class="px-5 py-4"><div class="skeleton h-6 w-20 rounded-full"></div></td>
                                <td class="px-5 py-4">
                                    <div class="flex gap-2">
                                        <div class="skeleton h-4 w-4 rounded-lg"></div>
                                        <div class="skeleton h-4 w-4 rounded-lg"></div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <SkeletonExpenseCard :count="8" class="block md:hidden" />
        </div>

        <!-- Lista de gastos -->
        <div v-else class="space-y-4 pb-20">
            <!-- Barra de acciones múltiples -->
            <ExpenseBatchBar
                :is-bulk-mode="isBulkMode"
                :select-all-expenses="selectAllExpenses"
                :selected-expenses-count="selectedExpensesCount"
                :is-bulk-action-loading="isBulkActionLoading"
                @toggle-bulk-mode="toggleBulkMode"
                @toggle-select-all-expenses="toggleSelectAllExpenses"
                @bulk-change-status="bulkChangeStatus"
                @bulk-delete-expenses="bulkDeleteExpenses"
            />

            <!-- Vista Desktop: Tabla de gastos -->
            <ExpenseTableDesktop
                :has-visible-expense-rows="hasVisibleExpenseRows"
                :is-bulk-mode="isBulkMode"
                :select-all-expenses="selectAllExpenses"
                :selected-expenses="selectedExpenses"
                :paginated-expenses-desktop="paginatedExpensesDesktop"
                :paginated-direct-expenses-desktop="paginatedDirectExpensesDesktop"
                :filters="filters"
                :table-key="tableKey"
                :total-pages-desktop="totalPagesDesktop"
                :current-page-desktop="currentPageDesktop"
                :visible-pages-desktop="visiblePagesDesktop"
                :get-expense-row-key="getExpenseRowKey"
                :get-category-icon="getCategoryIcon"
                :format-currency="formatCurrency"
                :format-date="formatDate"
                :get-status-badge-class="getStatusBadgeClass"
                :get-status-label="getStatusLabel"
                :payment-status-map="paymentStatusMap"
                :get-scheduled-installment-label="getScheduledInstallmentLabel"
                :get-scheduled-installment-info="getScheduledInstallmentInfo"
                @toggle-select-all-expenses="toggleSelectAllExpenses"
                @toggle-expense-selection="toggleExpenseSelection"
                @open-payment-status-modal="openPaymentStatusModal"
                @edit-expense="editExpense"
                @delete-expense="deleteExpense"
                @previous-page-desktop="previousPageDesktop"
                @next-page-desktop="nextPageDesktop"
                @go-to-page-desktop="goToPageDesktop"
            />

            <!-- Vista Móvil: Lista de tarjetas de gastos -->
            <ExpenseCardListMobile
                :has-visible-expense-rows="hasVisibleExpenseRows"
                :is-bulk-mode="isBulkMode"
                :selected-expenses="selectedExpenses"
                :paginated-expenses="paginatedExpenses"
                :paginated-direct-expenses="paginatedDirectExpenses"
                :filters="filters"
                :total-pages-mobile="totalPages"
                :current-page-mobile="currentPage"
                :get-expense-row-key="getExpenseRowKey"
                :get-category-icon="getCategoryIcon"
                :format-currency="formatCurrency"
                :format-date="formatDate"
                :get-status-badge-class="getStatusBadgeClass"
                :get-status-label="getStatusLabel"
                :payment-status-map="paymentStatusMap"
                :get-scheduled-installment-label="getScheduledInstallmentLabel"
                :get-scheduled-installment-info="getScheduledInstallmentInfo"
                @toggle-expense-selection="toggleExpenseSelection"
                @open-payment-status-modal="openPaymentStatusModal"
                @edit-expense="editExpense"
                @delete-expense="deleteExpense"
                @previous-page-mobile="previousPage"
                @next-page-mobile="nextPage"
            />

            <!-- Estados Vacíos -->
            <EmptyState
                v-if="visibleExpenseCount === 0 && !searchQuery && !expensesStore.loading"
                icon="Receipt"
                title="No hay gastos"
                description="Comienza agregando tu primer gasto para llevar el control de tus finanzas"
            />
            <EmptyState
                v-else-if="visibleExpenseCount === 0 && searchQuery && !expensesStore.loading"
                icon="SearchX"
                title="Sin resultados"
                description="No se encontraron gastos que coincidan con tu búsqueda"
            />
        </div>
    </div>

    <!-- Modal para agregar/editar gasto -->
    <ExpenseModal
        v-if="showModal"
        :expense="editingExpense"
        @close="closeModal"
        @save="saveExpense"
    />

    <!-- Modal para gastos programados -->
    <ScheduledExpenseModal
        v-if="showScheduledModal"
        @close="closeScheduledModal"
        @save="saveScheduledExpense"
    />

    <!-- Botones flotantes para gastos -->
    <div 
        :class="[
            'fixed z-50 flex flex-col gap-3 transition-all duration-300 ease-out',
            (showModal || showScheduledModal) ? 'hidden' : '',
            showFab ? 'bottom-24 lg:bottom-6 right-6 opacity-100 translate-y-0' : 'bottom-20 lg:bottom-4 right-6 opacity-0 translate-y-4 pointer-events-none'
        ]"
    >
        <div v-if="showExpenseOptions" class="flex flex-col gap-2">
            <button 
                @click="openNewScheduledExpenseModal"
                class="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-violet-400 focus:ring-offset-2 transform hover:scale-105 active:scale-95"
                title="Nuevo gasto programado"
            >
                <Calendar class="h-5 w-5" />
                <span class="hidden lg:inline">Gasto Programado</span>
            </button>
            
            <button 
                @click="openNewExpenseModal"
                class="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-400 focus:ring-offset-2 transform hover:scale-105 active:scale-95"
                title="Nuevo gasto"
            >
                <Receipt class="h-5 w-5" />
                <span class="hidden lg:inline">Gasto Normal</span>
            </button>
        </div>
        
        <button 
            @click="toggleExpenseOptions"
            class="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-400 focus:ring-offset-2 transform hover:scale-105 active:scale-95"
            title="Agregar gasto"
        >
            <Plus class="h-6 w-6" :class="showExpenseOptions ? 'rotate-45' : ''" style="transition: transform 0.2s" />
            <span class="hidden lg:inline">Nuevo Gasto</span>
        </button>
    </div>
    <ConfirmDialog
        v-model="showDeleteConfirm"
        title="¿Estás seguro?"
        message="Esta acción no se puede deshacer"
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
        @confirm="handleDeleteConfirm"
    />
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useExpensesStore } from "@/stores/expenses";
import { useUserCardsStore } from "@/stores/userCards";
import { useUserCategoriesStore } from "@/stores/userCategories";
import { fireConfetti } from "@/utils/confetti";

// Subcomponentes modulares
import ExpenseSummaryHeader from "@/views/expenses/components/ExpenseSummaryHeader.vue";
import ExpenseFiltersBar from "@/views/expenses/components/ExpenseFiltersBar.vue";
import ExpenseBatchBar from "@/views/expenses/components/ExpenseBatchBar.vue";
import ExpenseTableDesktop from "@/views/expenses/components/ExpenseTableDesktop.vue";
import ExpenseCardListMobile from "@/views/expenses/components/ExpenseCardListMobile.vue";
import ExpenseModal from "@/views/expenses/components/ExpenseModal.vue";
import ScheduledExpenseModal from "@/views/expenses/components/ScheduledExpenseModal.vue";
import SkeletonExpenseCard from "@/components/skeletons/SkeletonExpenseCard.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import ExportButton from "@/components/ui/ExportButton.vue";

// Composables
import { useExpenseSelection } from "@/views/expenses/composables/useExpenseSelection";

import {
    Plus,
    Receipt,
    AlertCircle,
    Calendar,
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
import { format, parseISO } from "date-fns";
import { getScheduledInstallmentLabel, getScheduledInstallmentInfo } from "@/utils/scheduledExpense.js";

import { es } from "date-fns/locale";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const paymentStatusMap = {
    1: { code: "pendiente", label: "Pendiente" },
    2: { code: "pagada", label: "Pagada" },
    3: { code: "en_deuda", label: "En deuda" },
};

const router = useRouter();
const expensesStore = useExpensesStore();
const userCardsStore = useUserCardsStore();
const userCategoriesStore = useUserCategoriesStore();

const showModal = ref(false);
const showScheduledModal = ref(false);
const showNoCardsAlert = ref(false);
const editingExpense = ref(null);
const showExpenseOptions = ref(false);
const searchQuery = ref('');
const showDeleteConfirm = ref(false);
const expenseToDelete = ref(null);
const isLoading = ref(true);
const now = new Date();
const filters = ref({
    card_id: "",
    category_id: "",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    payment_status_id: null,
});

const tableKey = ref(0);
const forceTableUpdate = () => {
    tableKey.value++;
};

const filteredExpensesToShow = computed(() => {
    const _key = tableKey.value;
    const allData = expensesStore.filteredExpensesWithInstallments;
    
    if (!allData || allData.length === 0 || expensesStore.loading) {
        return [];
    }

    const validData = allData.filter(item => {
        if (!item) return false;
        return item.id || item.expense_id || item.amount !== undefined;
    });

    return validData.sort((a, b) => {
        const dateA = a.is_installment ? a.due_date : a.purchase_date;
        const dateB = b.is_installment ? b.due_date : b.purchase_date;
        return new Date(dateB) - new Date(dateA);
    });
});

const getExpenseRowKey = (item) => {
    if (!item) return "row-unknown";
    if (item.is_installment) return `installment-${item.installment_id ?? item.id}`;
    return `expense-${item.id ?? item.expense_id}`;
};

// Composable de selección y acciones por lote
const {
    selectedExpenses,
    isBulkMode,
    selectAllExpenses,
    isBulkActionLoading,
    selectedExpensesCount,
    toggleBulkMode,
    toggleExpenseSelection,
    toggleSelectAllExpenses,
    bulkDeleteExpenses,
    bulkChangeStatus
} = useExpenseSelection({
    filteredExpensesToShow,
    getExpenseRowKey,
    expensesStore,
    paymentStatusMap,
    loadDataCallback: async () => {
        if (filters.value && filters.value.year) {
            await loadMonthlyData();
        } else {
            await expensesStore.loadExpenses();
        }
        await expensesStore.loadUpcomingInstallments(1000);
    }
});

const availableYears = computed(() => {
    const startYear = new Date().getFullYear();
    let maxYear = new Date().getFullYear();
    const allInstallments = expensesStore.filteredExpensesWithInstallments;
    if (allInstallments.length > 0) {
        const years = allInstallments
            .map((inst) => {
                if (inst.is_installment && inst.due_date) {
                    return new Date(inst.due_date).getFullYear();
                } else if (inst.purchase_date) {
                    return new Date(inst.purchase_date).getFullYear();
                }
                return null;
            })
            .filter((y) => y !== null);
        if (years.length > 0) {
            maxYear = Math.max(...years, maxYear);
        }
    }
    const yearsArr = [];
    for (let y = startYear; y <= maxYear; y++) {
        yearsArr.push(y);
    }
    return yearsArr;
});

const directExpenses = computed(() =>
    expensesStore.filteredExpenses.filter((e) => e.installments_count === 1)
);

let _mounted = true;

onMounted(async () => {
    isLoading.value = true;

    const safetyTimer = setTimeout(() => {
        if (_mounted) isLoading.value = false;
    }, 12000);

    try {
        await Promise.all([
            expensesStore.loadExpenses(),
            userCardsStore.loadUserCards(),
            userCategoriesStore.loadUserCategories(),
            expensesStore.loadPaymentStatuses(),
        ]);
        
        if (!_mounted) return;

        expensesStore.updateFilters({
            card_id: filters.value.card_id || null,
            category_id: filters.value.category_id || null,
            month: filters.value.month || null,
            year: filters.value.year || null
        });
        
        if (filters.value && filters.value.year) {
            await loadMonthlyData();
        }
    } catch (err) {
        console.error('Error cargando datos de gastos:', err);
    } finally {
        clearTimeout(safetyTimer);
        if (_mounted) isLoading.value = false;
    }

    document.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleFabScroll, { passive: true });
});

onUnmounted(() => {
    _mounted = false;
    document.removeEventListener('click', handleClickOutside);
    window.removeEventListener('scroll', handleFabScroll);
});

const handleClickOutside = (event) => {
    if (!event.target.closest('.fixed.bottom-24') && !event.target.closest('.fixed.bottom-6')) {
        showExpenseOptions.value = false;
    }
};

const handleUpdateFilter = ({ key, value }) => {
    filters.value[key] = value;
    updateFilters();
};

const handleClearFilter = (key) => {
    filters.value[key] = key === 'payment_status_id' ? null : '';
    updateFilters();
};

const updateFilters = () => {
    expensesStore.clearMonthlyData();
    forceTableUpdate();
    
    currentPage.value = 1;
    currentPageDesktop.value = 1;
    
    expensesStore.updateFilters({
        card_id: filters.value.card_id || null,
        category_id: filters.value.category_id || null,
        month: filters.value.month || null,
        year: filters.value.year || null,
        payment_status_id: filters.value.payment_status_id || null
    });
    
    setTimeout(() => {
        expensesStore.clearMonthlyData();
        forceTableUpdate();
    }, 50);
    
    if (filters.value && filters.value.month && filters.value.year) {
        loadMonthlyData();
    }
};

const loadMonthlyData = async () => {
    if (filters.value && filters.value.month && filters.value.year) {
        expensesStore.clearMonthlyData();
        await new Promise(resolve => setTimeout(resolve, 10));
        forceTableUpdate();
        
        const backendFilters = {
            card_id: filters.value.card_id && filters.value.card_id !== 'null' ? filters.value.card_id : null,
            category_id: filters.value.category_id && filters.value.category_id !== 'null' ? filters.value.category_id : null,
            payment_status_id: filters.value.payment_status_id && filters.value.payment_status_id !== 'null' ? filters.value.payment_status_id : null
        };
        
        await Promise.all([
            expensesStore.loadMonthlyExpensesWithInstallments(
                parseInt(filters.value.month),
                parseInt(filters.value.year),
                backendFilters
            ),
            expensesStore.loadMonthlyTotals(
                parseInt(filters.value.month),
                parseInt(filters.value.year),
                backendFilters
            ),
        ]);
        
        forceTableUpdate();
    }
};

const availableCardsForMonth = computed(() => {
    const allData = expensesStore.monthlyExpensesWithInstallments;
    if (!allData || allData.length === 0) return [];
    
    const cardIds = new Set();
    allData.forEach(item => {
        if (item.available_cards?.id) {
            cardIds.add(item.available_cards.id);
        }
    });
    
    return userCardsStore.cards.filter(card => cardIds.has(card.available_card_id));
});

const availableCategoriesForMonth = computed(() => {
    const allData = expensesStore.monthlyExpensesWithInstallments;
    if (!allData || allData.length === 0) return [];
    
    const categoryIds = new Set();
    allData.forEach(item => {
        if (item.categories?.id) {
            categoryIds.add(item.categories.id);
        }
    });
    
    return userCategoriesStore.categories.filter(category => categoryIds.has(category.id));
});

const availablePaymentStatuses = computed(() => expensesStore.paymentStatuses || []);

const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const monthYearTitle = computed(() => {
    if (!filters.value || !filters.value.month || !filters.value.year) return "";
    const month = parseInt(filters.value.month);
    const year = filters.value.year;
    if (!month || !year) return "";
    return `${monthNames[month - 1]} ${year}`;
});

const clearFilters = () => {
    filters.value.card_id = "";
    filters.value.category_id = "";
    filters.value.month = new Date().getMonth() + 1;
    filters.value.year = new Date().getFullYear();
    filters.value.payment_status_id = null;
    
    expensesStore.updateFilters({
        card_id: null,
        category_id: null,
        month: filters.value.month,
        year: filters.value.year,
        payment_status_id: null,
        payment_status_code: null
    });
    
    loadMonthlyData();
};

const editExpense = (expense) => {
    editingExpense.value = { ...expense };
    showModal.value = true;
};

const deleteExpense = async (expenseId, expenseItem = null) => {
    const isScheduled = expenseItem?.is_scheduled || false;
    
    if (isScheduled) {
        const { value: deleteOption } = await Swal.fire({
            title: "¿Cómo quieres eliminar este gasto programado?",
            html: `
                <div style="text-align: left; margin: 20px 0;">
                    <p style="margin-bottom: 15px; color: #374151;">
                        Si querés dejar de ver este gasto en los meses siguientes, elegí cancelar la serie.
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border: 2px solid #7c3aed; border-radius: 6px; background: #faf5ff;">
                            <input type="radio" name="deleteOption" value="future" checked style="margin: 0;">
                            <div>
                                <div style="font-weight: 600; color: #374151;">Desde esta cuota y todas las futuras (recomendado)</div>
                                <div style="font-size: 0.875rem; color: #6b7280;">Elimina este mes y los gastos programados que faltan; no volverán a aparecer.</div>
                            </div>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                            <input type="radio" name="deleteOption" value="current" style="margin: 0;">
                            <div>
                                <div style="font-weight: 600; color: #374151;">Solo este mes</div>
                                <div style="font-size: 0.875rem; color: #6b7280;">Quita solo esta instancia; los demás meses ya generados siguen en la lista.</div>
                            </div>
                        </label>
                    </div>
                </div>
            `,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Eliminar",
            cancelButtonText: "Cancelar",
            preConfirm: () => {
                const selectedOption = document.querySelector('input[name="deleteOption"]:checked');
                return selectedOption ? selectedOption.value : null;
            }
        });

        if (deleteOption) {
            try {
                const result = await expensesStore.deleteExpense(expenseId, deleteOption);
                if (result.success) {
                    if (filters.value && filters.value.year) {
                        await loadMonthlyData();
                    } else {
                        await expensesStore.loadExpenses();
                    }
                    await Swal.fire({ icon: "success", title: "¡Gasto eliminado!", text: result.message, timer: 3000, showConfirmButton: false });
                } else {
                    await Swal.fire({ icon: "error", title: "Error", text: result.error || "No se pudo eliminar el gasto." });
                }
            } catch (error) {
                await Swal.fire({ icon: "error", title: "Error inesperado", text: error.message || "Ocurrió un error inesperado." });
            }
        }
    } else {
        expenseToDelete.value = { id: expenseId, item: expenseItem };
        showDeleteConfirm.value = true;
    }
};

const handleDeleteConfirm = async () => {
    if (!expenseToDelete.value) return;
    const { id } = expenseToDelete.value;
    try {
        const deleteResult = await expensesStore.deleteExpense(id);
        if (deleteResult.success) {
            if (filters.value && filters.value.year) {
                await loadMonthlyData();
            } else {
                await expensesStore.loadExpenses();
            }
            await Swal.fire({ icon: "success", title: "¡Gasto eliminado!", text: "El gasto se eliminó correctamente", timer: 2000, showConfirmButton: false });
        } else {
            await Swal.fire({ icon: "error", title: "Error", text: deleteResult.error || "No se pudo eliminar el gasto." });
        }
    } catch (error) {
        await Swal.fire({ icon: "error", title: "Error inesperado", text: error.message || "Ocurrió un error inesperado." });
    }
    expenseToDelete.value = null;
};

const openPaymentStatusModal = async (item) => {
    const currentStatusId = Number(item?.payment_status_id) || 1;
    const currentStatusCode = paymentStatusMap[currentStatusId]?.code || "pendiente";
    
    const { isConfirmed, value: selectedStatusId } = await Swal.fire({
        title: "Actualizar estado",
        html: `...`,
        showCancelButton: true,
        confirmButtonText: "Guardar estado",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
            const selected = document.querySelector('input[name="payment-status-option"]:checked');
            return selected ? Number(selected.value) : null;
        },
    });

    if (!isConfirmed || !selectedStatusId) return;
    
    const isInstallment = item.is_installment === true;
    const targetId = isInstallment ? (item.installment_id ?? item.id) : item.id;
    
    const result = isInstallment
        ? await expensesStore.markInstallmentAsPaid(targetId, selectedStatusId)
        : await expensesStore.markAsPaid(targetId, selectedStatusId);

    if (result?.success) {
        if (selectedStatusId === 2) {
            fireConfetti({ count: 50 });
        }
        if (filters.value?.month && filters.value?.year) await loadMonthlyData();
        else await expensesStore.loadExpenses();
        await expensesStore.loadUpcomingInstallments(1000);
        Swal.fire({ icon: "success", title: "Estado actualizado", timer: 1800, showConfirmButton: false });
    }
};

const openNewExpenseModal = async () => {
    const userCards = userCardsStore.cards;
    if (!userCards || userCards.length === 0) {
        showNoCardsAlert.value = true;
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Sin tarjetas asociadas',
            html: `...`,
            showCancelButton: true,
            confirmButtonText: 'Ir a Cuentas',
            cancelButtonText: 'Cancelar',
        });
        if (result.isConfirmed) router.push('/cuentas');
        return;
    }
    editingExpense.value = null;
    showModal.value = true;
    showExpenseOptions.value = false;
};

const closeModal = () => {
    showModal.value = false;
    editingExpense.value = null;
};

const closeScheduledModal = () => {
    showScheduledModal.value = false;
};

const toggleExpenseOptions = () => {
    showExpenseOptions.value = !showExpenseOptions.value;
};

const openNewScheduledExpenseModal = async () => {
    const userCards = userCardsStore.cards;
    if (!userCards || userCards.length === 0) {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Sin tarjetas asociadas',
            showCancelButton: true,
            confirmButtonText: 'Ir a Cuentas',
            cancelButtonText: 'Cancelar',
        });
        if (result.isConfirmed) router.push('/cuentas');
        return;
    }
    showScheduledModal.value = true;
    showExpenseOptions.value = false;
};

const saveExpense = async (expenseData) => {
    try {
        let result;
        if (editingExpense.value) {
            result = await expensesStore.updateExpense(editingExpense.value.id, expenseData);
        } else {
            result = await expensesStore.createExpense(expenseData);
        }
        if (result.success) {
            if (filters.value && filters.value.year) await loadMonthlyData();
            else await expensesStore.loadExpenses();
            Swal.fire({ icon: "success", title: "¡Gasto guardado!" });
            closeModal();
        }
    } catch (error) {
        Swal.fire({ icon: "error", title: "Error inesperado" });
    }
};

const saveScheduledExpense = async (result) => {
    if (result.success) {
        if (filters.value && filters.value.year) await loadMonthlyData();
        else await expensesStore.loadExpenses();
        Swal.fire({ icon: "success", title: "¡Gasto programado creado!" });
        closeScheduledModal();
    }
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
    }).format(amount);
};

const formatDate = (date) => {
    return format(parseISO(date), "dd/MM/yyyy", { locale: es });
};

const getCategoryIcon = (categoryName) => {
    const map = {
        'Comida': UtensilsCrossed, 'Transporte': Car, 'Entretenimiento': Gamepad2, 'Vivienda': Home,
        'Educación': GraduationCap, 'Ropa': Shirt, 'Supermercado': ShoppingCart, 'Streaming/TV': Tv,
        'Deporte': Dumbbell, 'Mascotas': PawPrint, 'Viajes/Ocio': Plane, 'Electronico/PC': Laptop,
        'Bienestar': Heart, 'Gastos Financieros': Landmark, 'Compras': ShoppingBag, 'Otros': MoreHorizontal,
    };
    return map[categoryName] || Receipt;
};

const normalizeText = (text) => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};

const searchedExpenses = computed(() => {
    if (!searchQuery.value) return filteredExpensesToShow.value;
    const q = normalizeText(searchQuery.value);
    return filteredExpensesToShow.value.filter(item =>
        normalizeText(item.description || '').includes(q)
    );
});

const searchedDirectExpenses = computed(() => {
    if (!searchQuery.value) return directExpenses.value;
    const q = normalizeText(searchQuery.value);
    return directExpenses.value.filter(item =>
        normalizeText(item.description || '').includes(q)
    );
});

const usesDirectExpensesFallback = computed(() =>
    !filters.value?.month || !filters.value?.year
);

const visibleExpenseCount = computed(() =>
    searchedExpenses.value.length +
    (usesDirectExpensesFallback.value ? searchedDirectExpenses.value.length : 0)
);

const hasVisibleExpenseRows = computed(() => visibleExpenseCount.value > 0);

function previousMonth() {
    if (!filters.value) return;
    let month = parseInt(filters.value.month);
    let year = filters.value.year;
    if (month === 1) { month = 12; year = year - 1; }
    else { month = month - 1; }
    filters.value.month = month;
    filters.value.year = year;
    updateFilters();
}

function nextMonth() {
    if (!filters.value) return;
    let month = parseInt(filters.value.month);
    let year = filters.value.year;
    if (month === 12) { month = 1; year = year + 1; }
    else { month = month + 1; }
    filters.value.month = month;
    filters.value.year = year;
    updateFilters();
}

const rowAmountForSummary = (item) => {
    const raw = item.is_installment ? item.installment_amount ?? item.amount : item.amount;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
};

const getCardType = (item) => {
    return item.available_cards?.type || item.expenses?.available_cards?.type || item.card_type || "";
};

const isCreditExpense = (item) => {
    const type = getCardType(item);
    if (type === "Crédito") return true;
    if (item.is_installment && type !== "Débito" && type !== "Transferencia") return true;
    return false;
};

const expensesForSummary = computed(() => {
    return usesDirectExpensesFallback.value ? directExpenses.value : filteredExpensesToShow.value;
});

const totalDebitTransferExpenses = computed(() => {
    return expensesForSummary.value.reduce((sum, item) => {
        if (isCreditExpense(item)) return sum;
        return sum + rowAmountForSummary(item);
    }, 0);
});

const totalCreditExpenses = computed(() => {
    return expensesForSummary.value.reduce((sum, item) => {
        if (!isCreditExpense(item)) return sum;
        return sum + rowAmountForSummary(item);
    }, 0);
});

const totalExpenses = computed(() => {
    return totalDebitTransferExpenses.value + totalCreditExpenses.value;
});

function getStatusLabel(item) {
    if (item.payment_status_label) return item.payment_status_label;
    if (item.payment_status_id) return paymentStatusMap[item.payment_status_id]?.label || "Sin estado";
    return "Sin estado";
}

const expenseCsvColumns = [
    { key: 'description', label: 'Descripción' },
    { key: 'amount', label: 'Monto' },
    { key: 'date', label: 'Fecha' },
    { key: 'category', label: 'Categoría' },
    { key: 'card', label: 'Tarjeta' },
    { key: 'type', label: 'Tipo' },
    { key: 'status', label: 'Estado' }
];

const exportableExpenses = computed(() => {
    return searchedExpenses.value.map(e => ({
        description: e.description || '',
        amount: e.is_installment ? (e.installment_amount ?? e.amount) : e.amount,
        date: e.is_installment ? (e.due_date || '') : (e.purchase_date || ''),
        category: (e.categories?.name || e.expenses?.categories?.name) || '',
        card: (e.available_cards?.name || e.expenses?.available_cards?.name) || '',
        type: e.is_installment ? 'Cuota' : e.is_scheduled ? 'Programado' : 'Directo',
        status: getStatusLabel(e) || ''
    }));
});

function getStatusBadgeClass(item) {
    const code = item.payment_status_code || (item.payment_status_id ? paymentStatusMap[item.payment_status_id]?.code : null);
    if (code === "pagada") return "badge-success";
    if (code === "en_deuda") return "badge-danger";
    return "badge-warning";
}

const itemsPerPage = 5;
const currentPage = ref(1);

const paginatedExpenses = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return searchedExpenses.value.slice(start, start + itemsPerPage);
});

const paginatedDirectExpenses = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return searchedDirectExpenses.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() => Math.ceil(searchedExpenses.value.length / itemsPerPage));

const previousPage = () => { if (currentPage.value > 1) currentPage.value--; };
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };

const itemsPerPageDesktop = 10;
const currentPageDesktop = ref(1);

const paginatedExpensesDesktop = computed(() => {
    const start = (currentPageDesktop.value - 1) * itemsPerPageDesktop;
    return searchedExpenses.value.slice(start, start + itemsPerPageDesktop);
});

const paginatedDirectExpensesDesktop = computed(() => {
    const start = (currentPageDesktop.value - 1) * itemsPerPageDesktop;
    return searchedDirectExpenses.value.slice(start, start + itemsPerPageDesktop);
});

const totalPagesDesktop = computed(() => Math.ceil(searchedExpenses.value.length / itemsPerPageDesktop));

const visiblePagesDesktop = computed(() => {
    const pages = [];
    const start = Math.max(1, currentPageDesktop.value - 2);
    const end = Math.min(totalPagesDesktop.value, currentPageDesktop.value + 2);
    if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPagesDesktop.value) { if (end < totalPagesDesktop.value - 1) pages.push('...'); pages.push(totalPagesDesktop.value); }
    return pages;
});

const previousPageDesktop = () => { if (currentPageDesktop.value > 1) currentPageDesktop.value--; };
const nextPageDesktop = () => { if (currentPageDesktop.value < totalPagesDesktop.value) currentPageDesktop.value++; };
const goToPageDesktop = (page) => { if (page >= 1 && page <= totalPagesDesktop.value) currentPageDesktop.value = page; };

watch(searchQuery, () => {
    currentPage.value = 1;
    currentPageDesktop.value = 1;
});

const showFab = ref(true);
let lastFabScrollY = 0;
const handleFabScroll = () => {
    const currentScrollY = window.scrollY;
    showFab.value = currentScrollY < lastFabScrollY || currentScrollY < 50;
    lastFabScrollY = currentScrollY;
};
</script>

<style scoped>
@media (max-width: 1024px) {
    .fixed.bottom-24.right-6 { bottom: 6rem; right: 1rem; }
}
@keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); }
    50% { box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
}
@media (min-width: 1025px) {
    .fixed.bottom-6.right-6 { animation: pulse-glow 2s infinite; }
}
</style>
