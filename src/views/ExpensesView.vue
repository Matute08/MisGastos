<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Gastos</h1>
                <p class="text-slate-500">Gestiona todos tus gastos y compras</p>
            </div>
        </div>

        <!-- Resumen del mes actual -->
        <div class="space-y-4">
            <div class="text-center mb-2">
                <h2 class="text-xl font-semibold text-slate-800">
                    {{ monthYearTitle }}
                </h2>
            </div>

            <!-- Resumen - Desktop -->
            <SkeletonExpenseSummary v-if="isLoading" />
            <template v-else>
            <div class="hidden lg:flex card items-center justify-between">
                <button
                    @click="previousMonth"
                    class="btn-ghost p-2 rounded-xl flex items-center justify-center"
                >
                    <ChevronLeft class="h-5 w-5" />
                </button>
                <div class="flex-1">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="relative pl-4 border-l-4 border-primary-500 text-center">
                            <p class="text-sm text-slate-500 font-medium">Total Débito</p>
                            <p class="text-2xl font-bold text-primary-600">
                                {{ formatCurrency(totalDebitTransferExpenses) }}
                            </p>
                        </div>
                        <div class="relative pl-4 border-l-4 border-violet-500 text-center">
                            <p class="text-sm text-slate-500 font-medium">Total Crédito</p>
                            <p class="text-2xl font-bold text-violet-600">
                                {{ formatCurrency(totalCreditExpenses) }}
                            </p>
                        </div>
                        <div class="relative pl-4 border-l-4 border-success-500 text-center">
                            <p class="text-sm text-slate-500 font-medium">Gastos Totales</p>
                            <p class="text-2xl font-bold text-success-600">
                                {{ formatCurrency(totalExpenses) }}
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    @click="nextMonth"
                    class="btn-ghost p-2 rounded-xl flex items-center justify-center"
                >
                    <ChevronRight class="h-5 w-5" />
                </button>
            </div>

            <!-- Resumen - Mobile y Tablet -->
            <div class="block lg:hidden card !p-4">
                <div class="flex items-center justify-between mb-3">
                    <button
                        @click="previousMonth"
                        class="btn-ghost p-2 rounded-xl flex items-center justify-center"
                    >
                        <ChevronLeft class="h-4 w-4" />
                    </button>
                    <button
                        @click="nextMonth"
                        class="btn-ghost p-2 rounded-xl flex items-center justify-center"
                    >
                        <ChevronRight class="h-4 w-4" />
                    </button>
                </div>
                <div class="space-y-2.5">
                    <div class="flex items-center justify-between py-1.5 border-l-4 border-primary-500 pl-3 rounded-r-lg bg-primary-50/30">
                        <span class="text-xs text-slate-600 font-medium">Débito</span>
                        <span class="text-sm font-bold text-primary-600 tabular-nums">{{ formatCurrency(totalDebitTransferExpenses) }}</span>
                    </div>
                    <div class="flex items-center justify-between py-1.5 border-l-4 border-violet-500 pl-3 rounded-r-lg bg-violet-50/30">
                        <span class="text-xs text-slate-600 font-medium">Crédito</span>
                        <span class="text-sm font-bold text-violet-600 tabular-nums">{{ formatCurrency(totalCreditExpenses) }}</span>
                    </div>
                    <div class="flex items-center justify-between py-2 border-l-4 border-success-500 pl-3 rounded-r-lg bg-success-50/40 mt-1">
                        <span class="text-xs text-slate-700 font-semibold">Total</span>
                        <span class="text-base font-bold text-success-600 tabular-nums">{{ formatCurrency(totalExpenses) }}</span>
                    </div>
                </div>
            </div>
            </template>
        </div>

        <!-- Filtros Desktop -->
        <div class="hidden lg:block card">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div>
                    <label class="block text-sm font-medium text-slate-600 mb-1.5">Tarjeta</label>
                    <select
                        v-model="filters.card_id"
                        @change="updateFilters"
                        class="input-field"
                    >
                        <option value="">Todas las tarjetas</option>
                        <option
                            v-for="card in availableCardsForMonth"
                            :key="card.id"
                            :value="card.available_card_id"
                        >
                            {{ card.available_card?.name || card.name }}
                        </option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-600 mb-1.5">Categoría</label>
                    <select
                        v-model="filters.category_id"
                        @change="updateFilters"
                        class="input-field"
                    >
                        <option value="">Todas las categorías</option>
                        <option
                            v-for="category in availableCategoriesForMonth"
                            :key="category.id"
                            :value="category.id"
                        >
                            {{ category.name }}
                        </option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-600 mb-1.5">Mes</label>
                    <select
                        v-model="filters.month"
                        @change="updateFilters"
                        class="input-field"
                    >
                        <option
                            v-for="(name, idx) in monthNames"
                            :key="idx"
                            :value="idx + 1"
                        >
                            {{ name }}
                        </option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-600 mb-1.5">Año</label>
                    <select
                        v-model="filters.year"
                        @change="updateFilters"
                        class="input-field"
                    >
                        <option
                            v-for="year in availableYears"
                            :key="year"
                            :value="year"
                        >
                            {{ year }}
                        </option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-600 mb-1.5">Estado</label>
                    <select
                        v-model="filters.payment_status_id"
                        @change="updateFilters"
                        class="input-field"
                    >
                        <option :value="null">Todos los estados</option>
                        <option
                            v-for="status in availablePaymentStatuses"
                            :key="status.id"
                            :value="status.id"
                        >
                            {{ status.label }}
                        </option>
                    </select>
                </div>
            </div>

            <!-- Active filters pills + clear -->
            <div class="mt-4 flex flex-wrap items-center gap-2">
                <span
                    v-if="filters.card_id"
                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold ring-1 ring-inset ring-primary-200"
                >
                    Tarjeta filtrada
                    <button @click="filters.card_id = ''; updateFilters()" class="ml-0.5 hover:text-primary-900">
                        <X class="h-3 w-3" />
                    </button>
                </span>
                <span
                    v-if="filters.category_id"
                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold ring-1 ring-inset ring-violet-200"
                >
                    Categoría filtrada
                    <button @click="filters.category_id = ''; updateFilters()" class="ml-0.5 hover:text-violet-900">
                        <X class="h-3 w-3" />
                    </button>
                </span>
                <span
                    v-if="filters.payment_status_id"
                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold ring-1 ring-inset ring-amber-200"
                >
                    Estado filtrado
                    <button @click="filters.payment_status_id = null; updateFilters()" class="ml-0.5 hover:text-amber-900">
                        <X class="h-3 w-3" />
                    </button>
                </span>
                <div class="ml-auto">
                    <button
                        @click="clearFilters"
                        class="btn-ghost text-sm flex items-center gap-1.5"
                    >
                        <RotateCcw class="h-3.5 w-3.5" />
                        Limpiar Filtros
                    </button>
                </div>
            </div>
        </div>

        <!-- Filtros Móvil -->
        <div class="block lg:hidden">
            <div class="card !p-4">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-semibold text-slate-700">Filtros</h3>
                    <button
                        @click="clearFilters"
                        class="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 font-medium"
                    >
                        <RotateCcw class="h-3 w-3" />
                        Limpiar
                    </button>
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-500 mb-1">Tarjeta</label>
                        <select
                            v-model="filters.card_id"
                            @change="updateFilters"
                            class="input-field !py-1.5 !px-2.5 text-xs"
                        >
                            <option value="">Todas</option>
                            <option
                                v-for="card in availableCardsForMonth"
                                :key="card.id"
                                :value="card.available_card_id"
                            >
                                {{ card.available_card?.name || card.name }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-medium text-slate-500 mb-1">Categoría</label>
                        <select
                            v-model="filters.category_id"
                            @change="updateFilters"
                            class="input-field !py-1.5 !px-2.5 text-xs"
                        >
                            <option value="">Todas</option>
                            <option
                                v-for="category in availableCategoriesForMonth"
                                :key="category.id"
                                :value="category.id"
                            >
                                {{ category.name }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-medium text-slate-500 mb-1">Mes</label>
                        <select
                            v-model="filters.month"
                            @change="updateFilters"
                            class="input-field !py-1.5 !px-2.5 text-xs"
                        >
                            <option
                                v-for="(name, idx) in monthNames"
                                :key="idx"
                                :value="idx + 1"
                            >
                                {{ name }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-medium text-slate-500 mb-1">Año</label>
                        <select
                            v-model="filters.year"
                            @change="updateFilters"
                            class="input-field !py-1.5 !px-2.5 text-xs"
                        >
                            <option
                                v-for="year in availableYears"
                                :key="year"
                                :value="year"
                            >
                                {{ year }}
                            </option>
                        </select>
                    </div>

                    <div class="col-span-2">
                        <label class="block text-xs font-medium text-slate-500 mb-1">Estado</label>
                        <select
                            v-model="filters.payment_status_id"
                            @change="updateFilters"
                            class="input-field !py-1.5 !px-2.5 text-xs"
                        >
                            <option :value="null">Todos</option>
                            <option
                                v-for="status in availablePaymentStatuses"
                                :key="status.id"
                                :value="status.id"
                            >
                                {{ status.label }}
                            </option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

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

        <!-- Loading -->
        <div v-if="isLoading" class="pb-20">
          <!-- Skeleton desktop (tabla) -->
          <div class="hidden md:block card !p-0 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-100">
                <thead class="bg-slate-50/80">
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
          
          <!-- Skeleton vista móvil -->
          <SkeletonExpenseCard :count="8" class="block md:hidden" />
        </div>

        <!-- Lista de gastos -->
        <div v-else class="space-y-4 pb-20">

            <!-- Botón Seleccionar y Barra de acciones múltiples -->
            <div class="space-y-3">
                <div class="flex justify-center">
                    <button
                        @click="toggleBulkMode"
                        :class="[
                            'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200',
                            isBulkMode 
                                ? 'bg-success-600 hover:bg-success-700 text-white shadow-sm' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        ]"
                    >
                        <CheckCircle2 class="h-4 w-4" />
                        <span>{{ isBulkMode ? 'Cancelar Selección' : 'Seleccionar Gastos' }}</span>
                    </button>
                </div>

                <!-- Barra de acciones múltiples -->
                <div v-if="isBulkMode" class="card !bg-primary-50 !border-primary-200">
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    :checked="selectAllExpenses"
                                    @change="toggleSelectAllExpenses"
                                />
                                <span class="text-sm font-medium text-slate-700">
                                    Seleccionar todos ({{ selectedExpensesCount }} seleccionados)
                                </span>
                            </label>
                        </div>
                        
                        <div class="flex flex-wrap gap-2">
                            <button
                                @click="bulkChangeStatus(2)"
                                :disabled="selectedExpensesCount === 0"
                                class="btn-success !py-1.5 !px-3 !text-xs"
                            >
                                Pagado
                            </button>
                            <button
                                @click="bulkChangeStatus(1)"
                                :disabled="selectedExpensesCount === 0"
                                class="px-3 py-1.5 text-xs font-semibold bg-warning-500 text-white rounded-xl hover:bg-warning-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                 Pendiente
                            </button>
                            <button
                                @click="bulkDeleteExpenses"
                                :disabled="selectedExpensesCount === 0"
                                class="btn-danger !py-1.5 !px-3 !text-xs"
                            >
                                Eliminar Seleccionados
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Vista Desktop: Tabla de gastos -->
            <div class="hidden md:block card !p-0 overflow-hidden">
                <div class="overflow-x-auto">
                    <table :key="tableKey" class="min-w-full divide-y divide-slate-100">
                        <thead class="bg-slate-50/80">
                            <tr>
                                <th
                                    v-if="isBulkMode"
                                    class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                                >
                                    <input
                                        type="checkbox"
                                        :checked="selectAllExpenses"
                                        @change="toggleSelectAllExpenses"
                                    />
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Descripción
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Tarjeta
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Categoría
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Monto
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <template v-if="paginatedExpensesDesktop.length > 0">
                                <tr
                                    v-for="(item, index) in paginatedExpensesDesktop"
                                    :key="`${tableKey}-${Date.now()}-${item.is_installment ? 'installment-' + item.installment_id : 'expense-' + item.id}-${index}`"
                                    class="hover:bg-slate-50/60 transition-colors duration-150"
                                >
                                    <td v-if="isBulkMode" class="px-5 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            :checked="selectedExpenses.has(
                                                item.is_installment
                                                    ? `installment-${item.installment_id}`
                                                    : `expense-${item.id}`
                                            )"
                                            @change="toggleExpenseSelection(
                                                item.is_installment
                                                    ? `installment-${item.installment_id}`
                                                    : `expense-${item.id}`
                                            )"
                                        />
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap">
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="w-8 h-8 rounded-lg flex items-center justify-center"
                                                :class="item.is_installment ? 'bg-primary-50' : 'bg-slate-100'"
                                            >
                                                <CreditCard
                                                    v-if="item.is_installment"
                                                    class="h-4 w-4 text-primary-500"
                                                />
                                                <component
                                                    v-else
                                                    :is="getCategoryIcon(item.categories?.name)"
                                                    class="h-4 w-4 text-slate-500"
                                                />
                                            </div>
                                            <span
                                                class="text-xs font-semibold"
                                                :class="item.is_installment ? 'text-primary-600' : item.is_scheduled ? 'text-violet-600' : 'text-slate-500'"
                                            >
                                                {{ item.is_installment ? "Cuota" : item.is_scheduled ? "Programado" : "Gasto" }}
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-900">
                                        <div>
                                            <div class="font-semibold">
                                                {{ item.description }}
                                            </div>
                                            <div
                                                v-if="item.is_installment"
                                                class="text-xs text-slate-400 mt-0.5"
                                            >
                                                Cuota {{ item.installment_number }} de {{ item.installments_count }}
                                            </div>
                                            <div
                                                v-else-if="item.is_scheduled && getScheduledInstallmentLabel(item)"
                                                class="text-xs text-slate-400 mt-0.5"
                                            >
                                                {{ getScheduledInstallmentLabel(item) }}
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {{ item.expenses?.available_cards?.name || item.available_cards?.name || "Sin cuenta" }}
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap">
                                        <span
                                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                                            :style="{
                                                backgroundColor: item.categories?.color + '15',
                                                color: item.categories?.color,
                                            }"
                                        >
                                            <component
                                                :is="getCategoryIcon(item.categories?.name)"
                                                class="h-3 w-3"
                                            />
                                            {{ item.categories?.name || "Sin categoría" }}
                                        </span>
                                    </td>
                                    <td
                                        class="px-5 py-4 whitespace-nowrap text-sm font-bold"
                                        :class="item.is_installment ? 'text-primary-600' : 'text-slate-900'"
                                    >
                                        {{ formatCurrency(item.is_installment ? item.installment_amount : item.amount) }}
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {{ formatDate(item.is_installment ? item.due_date : item.purchase_date) }}
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap">
                                        <span
                                            :class="[
                                                getStatusBadgeClass(item),
                                            ]"
                                        >
                                            {{ getStatusLabel(item) }}
                                        </span>
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm">
                                        <div class="flex items-center gap-1">
                                            <button
                                                v-if="!item.is_installment"
                                                @click="editExpense(item)"
                                                class="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors duration-200"
                                            >
                                                <Edit class="h-4 w-4" />
                                            </button>
                                            <button
                                                v-if="!item.is_installment"
                                                @click="deleteExpense(item.id, item)"
                                                class="p-1.5 rounded-lg text-danger-600 hover:bg-danger-50 transition-colors duration-200"
                                            >
                                                <Trash2 class="h-4 w-4" />
                                            </button>
                                            <button
                                                v-if="item.is_installment"
                                                @click="showInstallments(item.expense_id, item.installment_number)"
                                                class="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors duration-200"
                                                title="Ver cuota"
                                            >
                                                <CreditCard class="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </template>

                            <template v-else-if="!filters.value || !filters.value.month || !filters.value.year">
                                <tr
                                    v-for="expense in paginatedDirectExpensesDesktop"
                                    :key="expense.id"
                                    class="hover:bg-slate-50/60 transition-colors duration-150"
                                >
                                    <td class="px-5 py-4 whitespace-nowrap">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                <component
                                                    :is="getCategoryIcon(expense.categories?.name)"
                                                    class="h-4 w-4 text-slate-500"
                                                />
                                            </div>
                                            <span class="text-xs font-semibold text-slate-500">Gasto</span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                                        <div>{{ expense.description }}</div>
                                        <div
                                            v-if="expense.is_scheduled && getScheduledInstallmentLabel(expense)"
                                            class="text-xs text-slate-400 font-normal mt-0.5"
                                        >
                                            {{ getScheduledInstallmentLabel(expense) }}
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {{ expense.expenses?.available_cards?.name || expense.available_cards?.name || "Sin cuenta" }}
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap">
                                        <span
                                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                                            :style="{
                                                backgroundColor: expense.categories?.color + '15',
                                                color: expense.categories?.color,
                                            }"
                                        >
                                            <component
                                                :is="getCategoryIcon(expense.categories?.name)"
                                                class="h-3 w-3"
                                            />
                                            {{ expense.categories?.name || "Sin categoría" }}
                                        </span>
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                        {{ formatCurrency(expense.amount) }}
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {{ formatDate(expense.purchase_date) }}
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap">
                                        <button
                                            @click="togglePaidStatus(expense)"
                                            :class="[
                                                'cursor-pointer transition-colors duration-200',
                                                getStatusBadgeClass(expense)
                                            ]"
                                        >
                                            {{ paymentStatusMap[expense.payment_status_id]?.label || "Sin estado" }}
                                        </button>
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm">
                                        <div class="flex items-center gap-1">
                                            <button
                                                @click="editExpense(expense)"
                                                class="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors duration-200"
                                            >
                                                <Edit class="h-4 w-4" />
                                            </button>
                                            <button
                                                @click="deleteExpense(expense.id, expense)"
                                                class="p-1.5 rounded-lg text-danger-600 hover:bg-danger-50 transition-colors duration-200"
                                            >
                                                <Trash2 class="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>

                <!-- Paginación desktop -->
                <div v-if="totalPagesDesktop > 1" class="flex justify-center items-center gap-2 px-6 py-4 border-t border-slate-100">
                    <button
                        @click="previousPageDesktop"
                        :disabled="currentPageDesktop === 1"
                        class="btn-secondary !py-2 !px-3 !text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    
                    <div class="flex items-center gap-1">
                        <span
                            v-for="page in visiblePagesDesktop"
                            :key="page"
                            @click="goToPageDesktop(page)"
                            :class="[
                                'px-3 py-1.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200',
                                page === currentPageDesktop
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            ]"
                        >
                            {{ page }}
                        </span>
                    </div>
                    
                    <button
                        @click="nextPageDesktop"
                        :disabled="currentPageDesktop === totalPagesDesktop"
                        class="btn-secondary !py-2 !px-3 !text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            <!-- Vista Móvil: Lista de tarjetas de gastos -->
            <div class="block md:hidden space-y-3">
                <template v-if="paginatedExpenses.length > 0">
                    <div
                        v-for="(item, index) in paginatedExpenses"
                        :key="`${tableKey}-${Date.now()}-${item.is_installment ? 'installment-' + item.installment_id : 'expense-' + item.id}-${index}`"
                        class="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden"
                    >
                        <!-- Category color accent -->
                        <div
                            class="h-1"
                            :style="{ backgroundColor: item.categories?.color || '#94a3b8' }"
                        ></div>
                        
                        <div class="p-4">
                            <!-- Header de la tarjeta -->
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <!-- Checkbox para selección múltiple -->
                                    <div v-if="isBulkMode" class="flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            :checked="selectedExpenses.has(
                                                item.is_installment
                                                    ? item.installment_id
                                                    : item.id
                                            )"
                                            @change="toggleExpenseSelection(
                                                item.is_installment
                                                    ? item.installment_id
                                                    : item.id
                                            )"
                                        />
                                    </div>
                                    
                                    <!-- Icono de categoría -->
                                    <div
                                        class="w-10 h-10 rounded-xl flex items-center justify-center"
                                        :style="{
                                            backgroundColor: (item.categories?.color || '#94a3b8') + '15',
                                        }"
                                    >
                                        <component
                                            :is="getCategoryIcon(item.categories?.name)"
                                            class="h-5 w-5"
                                            :style="{ color: item.categories?.color || '#94a3b8' }"
                                        />
                                    </div>
                                    
                                    <!-- Información principal -->
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-semibold text-slate-900 text-sm truncate">
                                            {{ item.description }}
                                        </h3>
                                        <p
                                            v-if="item.is_scheduled && getScheduledInstallmentLabel(item)"
                                            class="text-xs text-slate-400 mt-0.5"
                                        >
                                            {{ getScheduledInstallmentLabel(item) }}
                                        </p>
                                        <div class="flex items-center gap-2 mt-1">
                                            <span
                                                class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold"
                                                :style="{
                                                    backgroundColor: item.categories?.color + '15',
                                                    color: item.categories?.color,
                                                }"
                                            >
                                                {{ item.categories?.name || "Sin categoría" }}
                                            </span>
                                            <span
                                                class="text-xs font-medium"
                                                :class="item.is_installment ? 'text-primary-500' : item.is_scheduled ? 'text-violet-500' : 'text-slate-400'"
                                            >
                                                {{ item.is_installment ? "Cuota" : item.is_scheduled ? "Programado" : "Gasto" }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Monto y menú de acciones -->
                                <div class="text-right relative flex-shrink-0 ml-2">
                                    <div class="relative action-menu-container mb-1">
                                        <button
                                            @click="toggleActionMenu(item.id)"
                                            class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                                            title="Más opciones"
                                        >
                                            <MoreVertical class="h-4 w-4" />
                                        </button>
                                        
                                        <div
                                            v-if="activeActionMenu === item.id"
                                            class="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10 min-w-[140px]"
                                        >
                                            <button
                                                v-if="!item.is_installment"
                                                @click="editExpense(item)"
                                                class="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                                            >
                                                <Edit class="h-4 w-4 text-primary-500" />
                                                Editar
                                            </button>
                                            <button
                                                v-if="!item.is_installment"
                                                @click="deleteExpense(item.id, item)"
                                                class="w-full px-4 py-2.5 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2 font-medium"
                                            >
                                                <Trash2 class="h-4 w-4" />
                                                Eliminar
                                            </button>
                                            <button
                                                v-if="item.is_installment"
                                                @click="showInstallments(item.expense_id, item.installment_number)"
                                                class="w-full px-4 py-2.5 text-left text-sm text-primary-600 hover:bg-primary-50 flex items-center gap-2 font-medium"
                                            >
                                                <CreditCard class="h-4 w-4" />
                                                Ver cuota
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div
                                        class="text-base font-bold"
                                        :class="item.is_installment ? 'text-primary-600' : 'text-slate-900'"
                                    >
                                        {{ formatCurrency(item.is_installment ? item.installment_amount : item.amount) }}
                                    </div>
                                </div>
                            </div>

                            <!-- Detalles adicionales -->
                            <div class="space-y-2 pt-2 border-t border-slate-100">
                                <div
                                    v-if="item.is_installment"
                                    class="flex items-center justify-between text-xs"
                                >
                                    <span class="text-slate-500">Cuota {{ item.installment_number }} de {{ item.installments_count }}</span>
                                    <span class="text-primary-600 font-semibold">Vence: {{ formatDate(item.due_date) }}</span>
                                </div>

                                <div
                                    v-else-if="item.is_scheduled && getScheduledInstallmentLabel(item)"
                                    class="flex items-center justify-between text-xs"
                                >
                                    <span class="text-slate-500">{{ getScheduledInstallmentLabel(item) }}</span>
                                    <span class="text-violet-600 font-semibold">Mes: {{ formatDate(item.purchase_date) }}</span>
                                </div>

                                <div class="flex items-center justify-between text-xs">
                                    <span class="text-slate-500">Tarjeta</span>
                                    <span class="text-slate-700 font-semibold">{{ item.expenses?.available_cards?.name || item.available_cards?.name || "Sin cuenta" }}</span>
                                </div>

                                <div class="flex items-center justify-between">
                                    <span class="text-xs text-slate-500">Estado</span>
                                    <button
                                        @click="item.is_installment ? showInstallments(item.expense_id, item.installment_number) : togglePaidStatus(item)"
                                        :class="[
                                            'transition-colors duration-200',
                                            getStatusBadgeClass(item)
                                        ]"
                                    >
                                        {{ getStatusLabel(item) }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- Gastos normales (cuando no hay filtros de mes) -->
                <template v-else-if="!filters.value || !filters.value.month || !filters.value.year">
                    <div
                        v-for="expense in paginatedDirectExpenses"
                        :key="expense.id"
                        class="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden"
                    >
                        <!-- Category color accent -->
                        <div
                            class="h-1"
                            :style="{ backgroundColor: expense.categories?.color || '#94a3b8' }"
                        ></div>

                        <div class="p-4">
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <div v-if="isBulkMode" class="flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            :checked="selectedExpenses.has(expense.id)"
                                            @change="toggleExpenseSelection(expense.id)"
                                        />
                                    </div>
                                    
                                    <div
                                        class="w-10 h-10 rounded-xl flex items-center justify-center"
                                        :style="{
                                            backgroundColor: (expense.categories?.color || '#94a3b8') + '15',
                                        }"
                                    >
                                        <component
                                            :is="getCategoryIcon(expense.categories?.name)"
                                            class="h-5 w-5"
                                            :style="{ color: expense.categories?.color || '#94a3b8' }"
                                        />
                                    </div>
                                    
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-semibold text-slate-900 text-sm truncate">
                                            {{ expense.description }}
                                        </h3>
                                        <p
                                            v-if="expense.is_scheduled && getScheduledInstallmentLabel(expense)"
                                            class="text-xs text-slate-400 mt-0.5"
                                        >
                                            {{ getScheduledInstallmentLabel(expense) }}
                                        </p>
                                        <div class="flex items-center gap-2 mt-1">
                                            <span
                                                class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold"
                                                :style="{
                                                    backgroundColor: expense.categories?.color + '15',
                                                    color: expense.categories?.color,
                                                }"
                                            >
                                                {{ expense.categories?.name || "Sin categoría" }}
                                            </span>
                                            <span
                                                class="text-xs font-medium"
                                                :class="expense.is_scheduled ? 'text-violet-500' : 'text-slate-400'"
                                            >
                                                {{ expense.is_scheduled ? "Programado" : "Gasto" }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="text-right relative flex-shrink-0 ml-2">
                                    <div class="relative action-menu-container mb-1">
                                        <button
                                            @click="toggleActionMenu(expense.id)"
                                            class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                                            title="Más opciones"
                                        >
                                            <MoreVertical class="h-4 w-4" />
                                        </button>
                                        
                                        <div
                                            v-if="activeActionMenu === expense.id"
                                            class="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10 min-w-[140px]"
                                        >
                                            <button
                                                @click="editExpense(expense)"
                                                class="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                                            >
                                                <Edit class="h-4 w-4 text-primary-500" />
                                                Editar
                                            </button>
                                            <button
                                                @click="deleteExpense(expense.id, expense)"
                                                class="w-full px-4 py-2.5 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2 font-medium"
                                            >
                                                <Trash2 class="h-4 w-4" />
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div class="text-base font-bold text-slate-900">
                                        {{ formatCurrency(expense.amount) }}
                                    </div>
                                    <div class="text-xs text-slate-400 mt-0.5">
                                        {{ formatDate(expense.purchase_date) }}
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-2 pt-2 border-t border-slate-100">
                                <div class="flex items-center justify-between text-xs">
                                    <span class="text-slate-500">Tarjeta</span>
                                    <span class="text-slate-700 font-semibold">{{ expense.expenses?.available_cards?.name || expense.available_cards?.name || "Sin cuenta" }}</span>
                                </div>

                                <div class="flex items-center justify-between">
                                    <span class="text-xs text-slate-500">Estado</span>
                                    <button
                                        @click="togglePaidStatus(expense)"
                                        :class="[
                                            'cursor-pointer transition-colors duration-200',
                                            getStatusBadgeClass(expense)
                                        ]"
                                    >
                                        {{ paymentStatusMap[expense.payment_status_id]?.label || "Sin estado" }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- Paginación móvil -->
                <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-6 pt-4">
                    <button
                        @click="previousPage"
                        :disabled="currentPage === 1"
                        class="p-2 rounded-xl border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                    >
                        <ChevronLeft class="h-4 w-4 text-slate-600" />
                    </button>
                    
                    <div class="flex items-center gap-1">
                        <span
                            v-for="page in visiblePages"
                            :key="page"
                            @click="goToPage(page)"
                            :class="[
                                'px-3 py-1.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200',
                                page === currentPage
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-100'
                            ]"
                        >
                            {{ page }}
                        </span>
                    </div>
                    
                    <button
                        @click="nextPage"
                        :disabled="currentPage === totalPages"
                        class="p-2 rounded-xl border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                    >
                        <ChevronRight class="h-4 w-4 text-slate-600" />
                    </button>
                </div>
            </div>

            <!-- Estado vacío -->
            <div
                v-if="filteredExpensesToShow.length === 0 && !expensesStore.loading"
                class="card text-center py-16"
            >
                <div class="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <Receipt class="h-8 w-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900">
                    No hay gastos
                </h3>
                <p class="mt-1 text-slate-500 text-sm max-w-sm mx-auto">
                    Comienza agregando tu primer gasto para llevar el control de tus finanzas
                </p>
            </div>
        </div>

    </div>

    <!-- Modal para agregar/editar gasto -->
    <ExpenseModal
        v-if="showModal"
        :expense="editingExpense"
        @close="closeModal"
        @save="saveExpense"
    />

    <!-- Modal para ver cuotas -->
    <InstallmentsList
        v-if="showInstallmentsModal && selectedExpenseId"
        :expense-id="selectedExpenseId"
        @close="closeInstallmentsModal"
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
            'fixed bottom-24 lg:bottom-6 right-6 z-50 flex flex-col gap-3',
            (showModal || showInstallmentsModal || showScheduledModal) ? 'hidden' : ''
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
</template>

<script setup>
import { ref, computed, onMounted, watch, watchEffect, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useExpensesStore } from "@/stores/expenses";
import { useUserCardsStore } from "@/stores/userCards";
import { useUserCategoriesStore } from "@/stores/userCategories";
import ExpenseModal from "@/components/ExpenseModal.vue";
import InstallmentsList from "@/components/InstallmentsList.vue";
import ScheduledExpenseModal from "@/components/ScheduledExpenseModal.vue";
import SkeletonSummary from "@/components/SkeletonSummary.vue";
import SkeletonList from "@/components/SkeletonList.vue";
import SkeletonExpenseCard from "@/components/SkeletonExpenseCard.vue";
import SkeletonExpenseSummary from "@/components/SkeletonExpenseSummary.vue";
import {
    Plus,
    Receipt,
    Edit,
    Trash2,
    AlertCircle,
    RotateCcw,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    CheckCircle2,
    Calendar,
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
import { format, parseISO } from "date-fns";
import { getScheduledInstallmentLabel } from "@/utils/scheduledExpense.js";
import { es } from "date-fns/locale";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

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

const getCategoryIcon = (categoryName) => {
    if (!categoryName) return Receipt;
    return categoryIconMap[categoryName] || Receipt;
};

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
const isLoading = ref(true);
const now = new Date();
const filters = ref({
    card_id: "",
    category_id: "",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    payment_status_id: null,
});

const selectedExpenses = ref(new Set());
const isBulkMode = ref(false);
const selectAllExpenses = ref(false);

const selectedExpensesCount = computed(() => selectedExpenses.value.size);

const toggleBulkMode = () => {
    isBulkMode.value = !isBulkMode.value;
    if (!isBulkMode.value) {
        selectedExpenses.value.clear();
        selectAllExpenses.value = false;
    }
};

const toggleExpenseSelection = (expenseId) => {
    if (selectedExpenses.value.has(expenseId)) {
        selectedExpenses.value.delete(expenseId);
    } else {
        selectedExpenses.value.add(expenseId);
    }
};

const toggleSelectAllExpenses = () => {
    if (selectAllExpenses.value) {
        selectedExpenses.value.clear();
        selectAllExpenses.value = false;
    } else {
        const allExpenseIds = filteredExpensesToShow.value.map(item => 
            item.is_installment ? item.installment_id : item.id
        );
        selectedExpenses.value = new Set(allExpenseIds);
        selectAllExpenses.value = true;
    }
};

const bulkDeleteExpenses = async () => {
    if (selectedExpensesCount.value === 0) return;
    
    const { value: confirmed } = await Swal.fire({
        title: "¿Estás seguro?",
        text: `Se eliminarán ${selectedExpensesCount.value} gasto(s). Esta acción no se puede deshacer.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    });

    if (confirmed) {
        try {
            let successCount = 0;
            let errorCount = 0;
            
            for (const expenseId of selectedExpenses.value) {
                const result = await expensesStore.deleteExpense(expenseId);
                if (result.success) {
                    successCount++;
                } else {
                    errorCount++;
                }
            }
            
            if (filters.value && filters.value.year) {
                await loadMonthlyData();
            } else {
                await expensesStore.loadExpenses();
            }
            
            selectedExpenses.value.clear();
            isBulkMode.value = false;
            selectAllExpenses.value = false;
            
            await Swal.fire({
                icon: successCount > 0 ? "success" : "error",
                title: successCount > 0 ? "¡Gastos eliminados!" : "Error al eliminar",
                text: successCount > 0 
                    ? `Se eliminaron ${successCount} gasto(s) correctamente.${errorCount > 0 ? ` ${errorCount} gasto(s) no se pudieron eliminar.` : ''}`
                    : "No se pudo eliminar ningún gasto.",
            });
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "Error inesperado",
                text: error.message || "Ocurrió un error al eliminar los gastos.",
            });
        }
    }
};

const bulkChangeStatus = async (newStatusId) => {
    if (selectedExpensesCount.value === 0) return;
    
    const statusLabel = paymentStatusMap[newStatusId]?.label || "estado";
    
    const { value: confirmed } = await Swal.fire({
        title: "¿Confirmar cambio?",
        text: `Se cambiarán ${selectedExpensesCount.value} gasto(s) a estado "${statusLabel}".`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3b82f6",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, cambiar",
        cancelButtonText: "Cancelar",
    });

    if (confirmed) {
        try {
            let successCount = 0;
            let errorCount = 0;
            
            for (const expenseId of selectedExpenses.value) {
                try {
                    let actualId = expenseId;
                    let isInstallment = false;
                    
                    if (expenseId.startsWith('installment-')) {
                        actualId = expenseId.replace('installment-', '');
                        isInstallment = true;
                    } else if (expenseId.startsWith('expense-')) {
                        actualId = expenseId.replace('expense-', '');
                        isInstallment = false;
                    }
                    
                    let result;
                    if (isInstallment) {
                        result = await expensesStore.markInstallmentAsPaid(expenseId, newStatusId);
                    } else {
                        result = await expensesStore.markAsPaid(actualId, newStatusId);
                    }
                    if (result.success) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    console.error(`Error actualizando gasto ${expenseId}:`, error);
                    errorCount++;
                }
            }
            
            if (filters.value && filters.value.year) {
                await loadMonthlyData();
            } else {
                await expensesStore.loadExpenses();
            }
            await expensesStore.loadUpcomingInstallments(1000);
            
            selectedExpenses.value.clear();
            isBulkMode.value = false;
            selectAllExpenses.value = false;
            
            await Swal.fire({
                icon: successCount > 0 ? "success" : "error",
                title: successCount > 0 ? "¡Estados actualizados!" : "Error al actualizar",
                text: successCount > 0 
                    ? `Se actualizaron ${successCount} gasto(s) correctamente.${errorCount > 0 ? ` ${errorCount} gasto(s) no se pudieron actualizar.` : ''}`
                    : "No se pudo actualizar ningún gasto.",
            });
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "Error inesperado",
                text: error.message || "Ocurrió un error al actualizar los estados.",
            });
        }
    }
};

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

let _mounted = true

onMounted(async () => {
    isLoading.value = true

    const safetyTimer = setTimeout(() => {
        if (_mounted) isLoading.value = false
    }, 12000)

    try {
        await Promise.all([
            expensesStore.loadExpenses(),
            userCardsStore.loadUserCards(),
            userCategoriesStore.loadUserCategories(),
            expensesStore.loadPaymentStatuses(),
        ]);
        
        if (!_mounted) return

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
        console.error('Error cargando datos de gastos:', err)
    } finally {
        clearTimeout(safetyTimer)
        if (_mounted) isLoading.value = false
    }

    document.addEventListener('click', handleClickOutside);
});

watch(
    () => filters.value.payment_status_id,
    () => {
        expensesStore.clearMonthlyData();
        forceTableUpdate();
    },
    { immediate: false }
);

onUnmounted(() => {
    _mounted = false
    document.removeEventListener('click', handleClickOutside);
});

const handleClickOutside = (event) => {
    if (!event.target.closest('.action-menu-container')) {
        activeActionMenu.value = null;
    }
    
    if (!event.target.closest('.fixed.bottom-24') && !event.target.closest('.fixed.bottom-6')) {
        showExpenseOptions.value = false;
    }
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
    if (!allData || allData.length === 0) {
        return [];
    }
    
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
    if (!allData || allData.length === 0) {
        return [];
    }
    
    const categoryIds = new Set();
    allData.forEach(item => {
        if (item.categories?.id) {
            categoryIds.add(item.categories.id);
        }
    });
    
    return userCategoriesStore.categories.filter(category => categoryIds.has(category.id));
});

const availablePaymentStatuses = computed(() => {
    return expensesStore.paymentStatuses || [];
});

const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
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

                    await Swal.fire({
                        icon: "success",
                        title: "¡Gasto eliminado!",
                        text: result.message,
                        timer: 3000,
                        showConfirmButton: false,
                    });
                } else {
                    await Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: result.error || "No se pudo eliminar el gasto.",
                    });
                }
            } catch (error) {
                await Swal.fire({
                    icon: "error",
                    title: "Error inesperado",
                    text: error.message || "Ocurrió un error inesperado.",
                });
            }
        }
    } else {
        const result = await Swal.fire({
            title: "¿Estás seguro?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                const deleteResult = await expensesStore.deleteExpense(expenseId);

                if (deleteResult.success) {
                    if (filters.value && filters.value.year) {
                        await loadMonthlyData();
                    } else {
                        await expensesStore.loadExpenses();
                    }

                    await Swal.fire({
                        icon: "success",
                        title: "¡Gasto eliminado!",
                        text: "El gasto se eliminó correctamente",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                } else {
                    await Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: deleteResult.error || "No se pudo eliminar el gasto.",
                    });
                }
            } catch (error) {
                await Swal.fire({
                    icon: "error",
                    title: "Error inesperado",
                    text: error.message || "Ocurrió un error inesperado.",
                });
            }
        }
    }
};

const togglePaidStatus = async (expense) => {
    const currentStatus = paymentStatusMap[expense.payment_status_id]?.code;
    const newStatus = currentStatus === "pagada" ? "pendiente" : "pagada";
    const newStatusId = newStatus === "pagada" ? 2 : 1;
    const result = await expensesStore.markAsPaid(expense.id, newStatusId);
    if (result?.success) {
        if (filters.value?.month && filters.value?.year) {
            await loadMonthlyData();
        } else {
            await expensesStore.loadExpenses();
        }
        await expensesStore.loadUpcomingInstallments(1000);
    }
};

const openNewExpenseModal = async () => {
    const userCards = userCardsStore.cards;
    
    if (!userCards || userCards.length === 0) {
        showNoCardsAlert.value = true;
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Sin tarjetas asociadas',
            html: `
                <div style="text-align: center; padding: 20px 0;">
                    <p style="color: #374151; margin-bottom: 16px; font-size: 16px;">
                        Para poder agregar gastos, primero necesitas asociar una cuenta.
                    </p>
                    <p style="color: #6b7280; font-size: 14px;">
                        Ve a la sección de <strong>Cuentas</strong> para vincular tu primer cuenta.
                    </p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Ir a Cuentas',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280',
            reverseButtons: true
        });
        
        if (result.isConfirmed) {
            router.push('/cuentas');
        }
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
    showNoCardsAlert.value = true;
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Sin tarjetas asociadas',
      html: `
        <div style="text-align: center; padding: 20px 0;">
          <p style="color: #374151; margin-bottom: 16px; font-size: 16px;">
            Para poder agregar gastos programados, primero necesitas asociar una cuenta.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            Ve a la sección de <strong>Cuentas</strong> para vincular tu primer cuenta.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Ir a Cuentas',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      reverseButtons: true
    });
    
    if (result.isConfirmed) {
      router.push('/cuentas');
    }
    return;
  }
  
  showScheduledModal.value = true;
  showExpenseOptions.value = false;
};

const saveExpense = async (expenseData) => {
    try {
        let result;
        if (editingExpense.value) {
            result = await expensesStore.updateExpense(
                editingExpense.value.id,
                expenseData
            );
            if (!result.success) {
                Swal.fire({
                    icon: "error",
                    title: "Error al actualizar gasto",
                    text: result.error || "Ocurrió un error inesperado.",
                });
                return;
            }
        } else {
            result = await expensesStore.createExpense(expenseData);
            if (!result.success) {
                Swal.fire({
                    icon: "error",
                    title: "Error al crear gasto",
                    text: result.error || "Ocurrió un error inesperado.",
                });
                return;
            }
        }

        if (filters.value && filters.value.year) {
            await loadMonthlyData();
        } else {
            await expensesStore.loadExpenses();
        }

        Swal.fire({
            icon: "success",
            title: "¡Gasto guardado!",
            text: "El gasto se guardó correctamente.",
        });
        closeModal();
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error inesperado",
            text: error.message || "Ocurrió un error inesperado.",
        });
    }
};

const saveScheduledExpense = async (result) => {
    try {
        if (!result.success) {
            Swal.fire({
                icon: "error",
                title: "Error al crear gasto programado",
                text: result.error || "Ocurrió un error inesperado.",
            });
            return;
        }

        if (filters.value && filters.value.year) {
            await loadMonthlyData();
        } else {
            await expensesStore.loadExpenses();
        }

        Swal.fire({
            icon: "success",
            title: "¡Gasto programado creado!",
            text: `Se crearon ${result.data.length} gastos programados correctamente.`,
        });
        closeScheduledModal();
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error inesperado",
            text: error.message || "Ocurrió un error inesperado.",
        });
    }
};

const toggleInstallmentPaid = async (item) => {
    const currentStatus = item.payment_status_code;
    const newStatusId = currentStatus === "pendiente" ? 2 : 1;
    const result = await expensesStore.markInstallmentAsPaid(
        item.installment_id,
        newStatusId
    );
    if (result?.success && filters.value.month && filters.value.year) {
        await loadMonthlyData();
        await expensesStore.loadUpcomingInstallments(1000);
    }
};

const showInstallmentsModal = ref(false);
const selectedExpenseId = ref(null);

const showInstallments = async (expenseId, installmentNumber = null) => {
  try {
    await expensesStore.loadInstallments(expenseId);
    const cuota = expensesStore.installments.find(i => i.installment_number === installmentNumber) || expensesStore.installments[0];
    
    if (!cuota) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró la cuota especificada.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const currentStatus = paymentStatusMap[cuota.payment_status_id]?.code || 'pendiente';
    const isCurrentlyPaid = currentStatus === 'pagada';

                 const { value: isPaid } = await Swal.fire({
               title: `
                 <div style="display: flex; align-items: center; gap: 8px;">
                   <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                     <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
                       <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                     </svg>
                   </div>
                   <div style="font-size: 0.95em; font-weight: 600; color: #1f2937;">Cuota ${cuota.installment_number} de ${expensesStore.installments.length}</div>
                 </div>
               `,
                     html: `
                 <div style="text-align: left; font-size: 0.9em;">
                   <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                     <div style="padding: 8px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #3b82f6;">
                       <div style="font-size: 0.75em; color: #6b7280; margin-bottom: 1px;">Monto</div>
                       <div style="font-size: 0.9em; font-weight: 600; color: #3b82f6;">${formatCurrency(cuota.amount ?? cuota.installment_amount ?? 0)}</div>
                     </div>
                     
                     <div style="padding: 8px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #6366f1;">
                       <div style="font-size: 0.75em; color: #6b7280; margin-bottom: 1px;">Vencimiento</div>
                       <div style="font-size: 0.9em; font-weight: 600; color: #6366f1;">${formatDate(cuota.due_date)}</div>
                     </div>
                   </div>
                   
                   <div style="padding: 8px; background: #f8fafc; border-radius: 6px; border-left: 3px solid ${currentStatus === 'pagada' ? '#16a34a' : (currentStatus === 'en_deuda' ? '#dc2626' : '#f59e42')}; margin-bottom: 12px;">
                     <div style="font-size: 0.75em; color: #6b7280; margin-bottom: 1px;">Estado actual</div>
                     <div style="font-size: 0.9em; font-weight: 600; color: ${currentStatus === 'pagada' ? '#16a34a' : (currentStatus === 'en_deuda' ? '#dc2626' : '#f59e42')};">
                       ${paymentStatusMap[cuota.payment_status_id]?.label || 'Sin estado'}
                     </div>
                   </div>
                   
                   <div style="padding: 10px; background: ${isCurrentlyPaid ? '#fef3c7' : '#ecfdf5'}; border-radius: 6px; border: 1px solid ${isCurrentlyPaid ? '#f59e0b' : '#10b981'};">
                     <label style="display: flex; align-items: center; cursor: pointer; font-size: 0.85em; color: #374151;">
                       <input type="checkbox" id="swal-paid-checkbox" ${isCurrentlyPaid ? 'checked' : ''} style="margin-right: 8px; transform: scale(1.1); accent-color: #3b82f6; margin:10px" />
                       <span style="font-weight: 600; margin-left:10px">Marcar como pagada</span>
                     </label>
                     <div style="margin-top: 2px; font-size: 0.75em; color: #6b7280;">
                       ${isCurrentlyPaid ? 'Desmarcar para cambiar a pendiente' : 'Marcar para confirmar el pago'}
                     </div>
                   </div>
                 </div>
               `,
                     width: 320,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      customClass: {
        popup: 'swal2-modal-custom',
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom'
      },
      preConfirm: () => {
        const checked = document.getElementById('swal-paid-checkbox').checked;
        return checked;
      }
    });

    if (isPaid !== undefined && (isPaid !== isCurrentlyPaid)) {
      Swal.fire({
        title: 'Procesando...',
        html: '<div style="display:flex;flex-direction:column;align-items:center;"><div class="spinner" style="width:32px;height:32px;border:3px solid #f3f3f3;border-top:3px solid #3b82f6;border-radius:50%;animation:spin 1s linear infinite;"></div><p style="margin-top:12px;font-size:0.9em;">Actualizando estado...</p></div>',
        showConfirmButton: false,
        allowOutsideClick: false,
        width: 300,
        customClass: {
          popup: 'swal2-modal-custom'
        }
      });

      const newStatusId = isPaid ? 2 : 1;
      const result = await expensesStore.markInstallmentAsPaid(cuota.id, newStatusId);
      
      Swal.close();
      
      if (result && result.success) {
        await loadMonthlyData();
        await Swal.fire({
          icon: isPaid ? 'success' : 'info',
          title: isPaid ? '¡Cuota pagada!' : 'Cuota pendiente',
          html: `
            <div style='display:flex;flex-direction:column;align-items:center;'>
              <div style='width:48px;height:48px;background:${isPaid ? '#16a34a' : '#f59e42'};border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:12px;'>
                <svg width='24' height='24' fill='none' viewBox='0 0 24 24' stroke='white' stroke-width='2'>
                  <path d='M5 13l4 4L19 7'/>
                </svg>
              </div>
              <p style='font-size:1em;color:#374151;margin-bottom:4px;'>Estado actualizado</p>
              <p style='font-size:0.9em;color:#6b7280;'>${isPaid ? 'La cuota fue marcada como pagada' : 'La cuota está pendiente de pago'}</p>
            </div>
          `,
          width: 320,
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'swal2-modal-custom'
          }
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error al actualizar',
          html: `
            <div style='display:flex;flex-direction:column;align-items:center;'>
              <div style='width:48px;height:48px;background:#dc2626;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:12px;'>
                <svg width='24' height='24' fill='none' viewBox='0 0 24 24' stroke='white' stroke-width='2'>
                  <path d='M6 18L18 6M6 6l12 12'/>
                </svg>
              </div>
              <p style='font-size:1em;color:#374151;margin-bottom:4px;'>No se pudo actualizar</p>
              <p style='font-size:0.9em;color:#6b7280;'>${result && result.error ? result.error : 'Error desconocido'}</p>
            </div>
          `,
          width: 320,
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'swal2-modal-custom',
            confirmButton: 'swal2-confirm-custom'
          }
        });
      }
    }
  } catch (error) {
    console.error('Error al mostrar cuotas:', error);
  }
};
const closeInstallmentsModal = () => {
    showInstallmentsModal.value = false;
    selectedExpenseId.value = null;
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

const showDirectExpenses = ref(false);

const tableKey = ref(0);
const forceTableUpdate = () => {
    tableKey.value++;
};

const filteredExpensesToShow = computed(() => {
    const key = tableKey.value;
    
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

function previousMonth() {
    if (!filters.value) return;
    let month = parseInt(filters.value.month);
    let year = filters.value.year;
    if (month === 1) {
        month = 12;
        year = year - 1;
    } else {
        month = month - 1;
    }
    filters.value.month = month;
    filters.value.year = year;
    updateFilters();
}

function nextMonth() {
    if (!filters.value) return;
    let month = parseInt(filters.value.month);
    let year = filters.value.year;
    if (month === 12) {
        month = 1;
        year = year + 1;
    } else {
        month = month + 1;
    }
    filters.value.month = month;
    filters.value.year = year;
    updateFilters();
}

/** Monto de fila igual que en la tabla (cuota → installment_amount). */
const rowAmountForSummary = (item) => {
    const raw = item.is_installment ? item.installment_amount ?? item.amount : item.amount;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
};

/** Totales acordes a los filtros y listado visible (no al endpoint de balance, que solo suma crédito pagado). */
const totalDebitTransferExpenses = computed(() => {
    return filteredExpensesToShow.value.reduce((sum, item) => {
        if (item.available_cards?.type === "Crédito") return sum;
        return sum + rowAmountForSummary(item);
    }, 0);
});

const totalCreditExpenses = computed(() => {
    return filteredExpensesToShow.value.reduce((sum, item) => {
        if (item.available_cards?.type !== "Crédito") return sum;
        return sum + rowAmountForSummary(item);
    }, 0);
});

const totalExpenses = computed(() => {
    return filteredExpensesToShow.value.reduce((sum, item) => sum + rowAmountForSummary(item), 0);
});

function getStatusLabel(item) {
    if (item.payment_status_label) return item.payment_status_label;
    if (item.payment_status_id)
        return paymentStatusMap[item.payment_status_id]?.label || "Sin estado";
    return "Sin estado";
}

function getStatusColor(item) {
    const code =
        item.payment_status_code ||
        (item.payment_status_id
            ? paymentStatusMap[item.payment_status_id]?.code
            : null);
    if (code === "pagada") return "bg-success-100 text-success-800";
    if (code === "en_deuda") return "bg-danger-100 text-danger-800";
    if (code === "pendiente") return "bg-warning-100 text-warning-800";
    return "bg-warning-100 text-warning-800";
}

function getStatusBadgeClass(item) {
    const code =
        item.payment_status_code ||
        (item.payment_status_id
            ? paymentStatusMap[item.payment_status_id]?.code
            : null);
    if (code === "pagada") return "badge-success";
    if (code === "en_deuda") return "badge-danger";
    if (code === "pendiente") return "badge-warning";
    return "badge-warning";
}

const itemsPerPage = 5;
const currentPage = ref(1);

const paginatedExpenses = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredExpensesToShow.value.slice(start, end);
});

const paginatedDirectExpenses = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return directExpenses.value.slice(start, end);
});

const totalPages = computed(() => {
    return Math.ceil(filteredExpensesToShow.value.length / itemsPerPage);
});

const visiblePages = computed(() => {
    const pages = [];
    const start = Math.max(1, currentPage.value - 2);
    const end = Math.min(totalPages.value, currentPage.value + 2);

    if (start > 1) {
        pages.push(1);
        if (start > 2) {
            pages.push('...');
        }
    }
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    if (end < totalPages.value) {
        if (end < totalPages.value - 1) {
            pages.push('...');
        }
        pages.push(totalPages.value);
    }
    return pages;
});

const previousPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
    }
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
    }
};

const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
    }
};

const activeActionMenu = ref(null);
const toggleActionMenu = (id) => {
    activeActionMenu.value = activeActionMenu.value === id ? null : id;
};

const itemsPerPageDesktop = 10;
const currentPageDesktop = ref(1);

const paginatedExpensesDesktop = computed(() => {
    const start = (currentPageDesktop.value - 1) * itemsPerPageDesktop;
    const end = start + itemsPerPageDesktop;
    return filteredExpensesToShow.value.slice(start, end);
});

const paginatedDirectExpensesDesktop = computed(() => {
    const start = (currentPageDesktop.value - 1) * itemsPerPageDesktop;
    const end = start + itemsPerPageDesktop;
    return directExpenses.value.slice(start, end);
});

const totalPagesDesktop = computed(() => {
    return Math.ceil(filteredExpensesToShow.value.length / itemsPerPageDesktop);
});

const visiblePagesDesktop = computed(() => {
    const pages = [];
    const start = Math.max(1, currentPageDesktop.value - 2);
    const end = Math.min(totalPagesDesktop.value, currentPageDesktop.value + 2);

    if (start > 1) {
        pages.push(1);
        if (start > 2) {
            pages.push('...');
        }
    }
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    if (end < totalPagesDesktop.value) {
        if (end < totalPagesDesktop.value - 1) {
            pages.push('...');
        }
        pages.push(totalPagesDesktop.value);
    }
    return pages;
});

const previousPageDesktop = () => {
    if (currentPageDesktop.value > 1) {
        currentPageDesktop.value--;
    }
};

const nextPageDesktop = () => {
    if (currentPageDesktop.value < totalPagesDesktop.value) {
        currentPageDesktop.value++;
    }
};

const goToPageDesktop = (page) => {
    if (page >= 1 && page <= totalPagesDesktop.value) {
        currentPageDesktop.value = page;
    }
};
</script>

<style scoped>
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.spinner {
    animation: spin 1s linear infinite;
}

:deep(.swal2-modal-custom) {
    border-radius: 16px !important;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.12) !important;
    padding: 16px !important;
    max-width: 350px !important;
}

:deep(.swal2-confirm-custom) {
    background: linear-gradient(135deg, #4f46e5, #7c3aed) !important;
    border-radius: 12px !important;
    padding: 10px 20px !important;
    font-weight: 600 !important;
    font-size: 0.9em !important;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3) !important;
    transition: all 0.2s ease !important;
}

:deep(.swal2-confirm-custom:hover) {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4) !important;
}

:deep(.swal2-cancel-custom) {
    background: #f1f5f9 !important;
    border-radius: 12px !important;
    padding: 10px 20px !important;
    font-weight: 600 !important;
    font-size: 0.9em !important;
    color: #64748b !important;
    border: 1px solid #e2e8f0 !important;
    transition: all 0.2s ease !important;
}

:deep(.swal2-cancel-custom:hover) {
    background: #e2e8f0 !important;
    color: #334155 !important;
}

@media (max-width: 1024px) {
    .fixed.bottom-24.right-6 {
        bottom: 6rem;
        right: 1rem;
    }
}

@keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); }
    50% { box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
}

@media (min-width: 1025px) {
    .fixed.bottom-6.right-6 {
        animation: pulse-glow 2s infinite;
    }
}
</style>
