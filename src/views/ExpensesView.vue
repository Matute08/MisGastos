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
        <div class="space-y-4">
            <div class="text-center mb-2">
                <h2 class="text-xl font-semibold text-slate-800 dark:text-gray-200">
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
                            <p class="text-sm text-slate-500 dark:text-gray-400 font-medium">Total Débito</p>
                            <p class="text-2xl font-bold text-primary-600">
                                {{ formatCurrency(totalDebitTransferExpenses) }}
                            </p>
                        </div>
                        <div class="relative pl-4 border-l-4 border-violet-500 text-center">
                            <p class="text-sm text-slate-500 dark:text-gray-400 font-medium">Total Crédito</p>
                            <p class="text-2xl font-bold text-violet-600">
                                {{ formatCurrency(totalCreditExpenses) }}
                            </p>
                        </div>
                        <div class="relative pl-4 border-l-4 border-success-500 text-center">
                            <p class="text-sm text-slate-500 dark:text-gray-400 font-medium">Gastos Totales</p>
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
                        <span class="text-xs text-slate-600 dark:text-gray-400 font-medium">Débito</span>
                        <span class="text-sm font-bold text-primary-600 tabular-nums">{{ formatCurrency(totalDebitTransferExpenses) }}</span>
                    </div>
                    <div class="flex items-center justify-between py-1.5 border-l-4 border-violet-500 pl-3 rounded-r-lg bg-violet-50/30">
                        <span class="text-xs text-slate-600 dark:text-gray-400 font-medium">Crédito</span>
                        <span class="text-sm font-bold text-violet-600 tabular-nums">{{ formatCurrency(totalCreditExpenses) }}</span>
                    </div>
                    <div class="flex items-center justify-between py-2 border-l-4 border-success-500 pl-3 rounded-r-lg bg-success-50/40 mt-1">
                        <span class="text-xs text-slate-700 dark:text-gray-300 font-semibold">Total</span>
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
                    <label class="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5">Tarjeta</label>
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
                    <label class="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5">Categoría</label>
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
                    <label class="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5">Mes</label>
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
                    <label class="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5">Año</label>
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
                    <label class="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5">Estado</label>
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
                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold ring-1 ring-inset ring-primary-200 dark:ring-primary-700"
                >
                    Tarjeta filtrada
                    <button @click="filters.card_id = ''; updateFilters()" class="ml-0.5 hover:text-primary-900">
                        <X class="h-3 w-3" />
                    </button>
                </span>
                <span
                    v-if="filters.category_id"
                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold ring-1 ring-inset ring-violet-200 dark:ring-violet-700"
                >
                    Categoría filtrada
                    <button @click="filters.category_id = ''; updateFilters()" class="ml-0.5 hover:text-violet-900">
                        <X class="h-3 w-3" />
                    </button>
                </span>
                <span
                    v-if="filters.payment_status_id"
                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold ring-1 ring-inset ring-amber-200 dark:ring-amber-700"
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
                    <h3 class="text-sm font-semibold text-slate-700 dark:text-gray-300">Filtros</h3>
                    <button
                        @click="clearFilters"
                        class="text-xs text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300 dark:text-gray-300 flex items-center gap-1 font-medium"
                    >
                        <RotateCcw class="h-3 w-3" />
                        Limpiar
                    </button>
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Tarjeta</label>
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
                        <label class="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Categoría</label>
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
                        <label class="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Mes</label>
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
                        <label class="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Año</label>
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
                        <label class="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Estado</label>
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

        <div class="sm:px-0">
          <SearchBar v-model="searchQuery" placeholder="Buscar por descripción..." />
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
                <thead class="bg-slate-50 dark:bg-gray-700/80 dark:bg-gray-700/80">
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
                                : 'bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 text-slate-700 dark:text-gray-300'
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
                                    :disabled="isBulkActionLoading"
                                />
                                <span class="text-sm font-medium text-slate-700 dark:text-gray-300">
                                    Seleccionar todos ({{ selectedExpensesCount }} seleccionados)
                                </span>
                            </label>
                        </div>
                        
                        <div class="flex flex-wrap gap-2">
                            <button
                                @click="bulkChangeStatus(2)"
                                :disabled="selectedExpensesCount === 0 || isBulkActionLoading"
                                class="btn-success !py-1.5 !px-3 !text-xs"
                            >
                                <span v-if="isBulkActionLoading" class="inline-flex items-center gap-1">
                                    <Loader2 class="h-3.5 w-3.5 animate-spin" />
                                    Procesando...
                                </span>
                                <span v-else>Pagado</span>
                            </button>
                            <button
                                @click="bulkChangeStatus(1)"
                                :disabled="selectedExpensesCount === 0 || isBulkActionLoading"
                                class="px-3 py-1.5 text-xs font-semibold bg-warning-500 text-white rounded-xl hover:bg-warning-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                <span v-if="isBulkActionLoading" class="inline-flex items-center gap-1">
                                    <Loader2 class="h-3.5 w-3.5 animate-spin" />
                                    Procesando...
                                </span>
                                <span v-else>Pendiente</span>
                            </button>
                            <button
                                @click="bulkDeleteExpenses"
                                :disabled="selectedExpensesCount === 0 || isBulkActionLoading"
                                class="btn-danger !py-1.5 !px-3 !text-xs"
                            >
                                <span v-if="isBulkActionLoading" class="inline-flex items-center gap-1">
                                    <Loader2 class="h-3.5 w-3.5 animate-spin" />
                                    Procesando...
                                </span>
                                <span v-else>Eliminar Seleccionados</span>
                            </button>
                        </div>
                    </div>
                    <p v-if="isBulkActionLoading" class="text-xs text-slate-600 dark:text-gray-400">
                        Procesando cambios en los gastos seleccionados. Esto puede tardar unos segundos.
                    </p>
                </div>
            </div>

            <!-- Vista Desktop: Tabla de gastos -->
            <div class="hidden md:block card !p-0 overflow-hidden">
                <div class="overflow-x-auto">
                    <table :key="tableKey" class="min-w-full divide-y divide-slate-100">
                        <thead class="bg-slate-50 dark:bg-gray-700/80 dark:bg-gray-700/80">
                            <tr>
                                <th
                                    v-if="isBulkMode"
                                    class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                    <input
                                        type="checkbox"
                                        :checked="selectAllExpenses"
                                        @change="toggleSelectAllExpenses"
                                    />
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                    Descripción
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                    Tarjeta
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                    Categoría
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                    Monto
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th class="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <template v-if="paginatedExpensesDesktop.length > 0">
                                <tr
                                    v-for="item in paginatedExpensesDesktop"
                                    :key="getExpenseRowKey(item)"
                                    class="hover:bg-slate-50 dark:bg-gray-700 dark:hover:bg-gray-700/60 dark:bg-gray-700/60 transition-colors duration-150"
                                >
                                    <td v-if="isBulkMode" class="px-5 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            :checked="selectedExpenses.has(
                                                `expense-${item.id}`
                                            )"
                                            @change="toggleExpenseSelection(
                                                `expense-${item.id}`
                                            )"
                                        />
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap">
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="w-8 h-8 rounded-lg flex items-center justify-center"
                                                :class="item.is_installment ? 'bg-primary-50' : 'bg-slate-100 dark:bg-gray-700'"
                                            >
                                                <CreditCard
                                                    v-if="item.is_installment"
                                                    class="h-4 w-4 text-primary-500"
                                                />
                                                <component
                                                    v-else
                                                    :is="getCategoryIcon(item.categories?.name)"
                                                    class="h-4 w-4 text-slate-500 dark:text-gray-400"
                                                />
                                            </div>
                                            <span
                                                class="text-xs font-semibold"
                                                :class="item.is_installment ? 'text-primary-600' : item.is_scheduled ? 'text-violet-600' : 'text-slate-500 dark:text-gray-400'"
                                            >
                                                {{ item.is_installment ? "Cuota" : item.is_scheduled ? "Programado" : "Gasto" }}
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-gray-100">
                                        <div>
                                            <div class="font-semibold">
                                                {{ item.description }}
                                            </div>
                                            <div
                                                v-if="item.is_installment"
                                                class="text-xs text-slate-400 dark:text-gray-500 mt-0.5"
                                            >
                                                Cuota {{ item.installment_number }} de {{ item.installments_count }}
                                            </div>
                                            <div
                                                v-else-if="item.is_scheduled && getScheduledInstallmentLabel(item)"
                                                class="text-xs text-slate-400 dark:text-gray-500 mt-0.5"
                                            >
                                                {{ getScheduledInstallmentLabel(item) }}
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-gray-400">
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
                                        :class="item.is_installment ? 'text-primary-600' : 'text-slate-900 dark:text-gray-100'"
                                    >
                                        {{ formatCurrency(item.is_installment ? item.installment_amount : item.amount) }}
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-gray-400">
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
                                                @click="openPaymentStatusModal(item)"
                                                class="p-1.5 rounded-lg text-success-600 hover:bg-success-50 transition-colors duration-200"
                                                title="Cambiar estado"
                                            >
                                                <CheckCircle2 class="h-4 w-4" />
                                            </button>
                                            <button
                                                @click="editExpense(item)"
                                                class="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors duration-200"
                                            >
                                                <Edit class="h-4 w-4" />
                                            </button>
                                            <button
                                                @click="deleteExpense(item.id, item)"
                                                class="p-1.5 rounded-lg text-danger-600 hover:bg-danger-50 transition-colors duration-200"
                                            >
                                                <Trash2 class="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </template>

                            <template v-else-if="!filters.value || !filters.value.month || !filters.value.year">
                                <tr
                                    v-for="expense in paginatedDirectExpensesDesktop"
                                    :key="expense.id"
                                    class="hover:bg-slate-50 dark:bg-gray-700 dark:hover:bg-gray-700/60 dark:bg-gray-700/60 transition-colors duration-150"
                                >
                                    <td class="px-5 py-4 whitespace-nowrap">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
                                                <component
                                                    :is="getCategoryIcon(expense.categories?.name)"
                                                    class="h-4 w-4 text-slate-500 dark:text-gray-400"
                                                />
                                            </div>
                                            <span class="text-xs font-semibold text-slate-500 dark:text-gray-400">Gasto</span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-gray-100">
                                        <div>{{ expense.description }}</div>
                                        <div
                                            v-if="expense.is_scheduled && getScheduledInstallmentLabel(expense)"
                                            class="text-xs text-slate-400 dark:text-gray-500 font-normal mt-0.5"
                                        >
                                            {{ getScheduledInstallmentLabel(expense) }}
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-gray-400">
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
                                    <td class="px-5 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-gray-100">
                                        {{ formatCurrency(expense.amount) }}
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-gray-400">
                                        {{ formatDate(expense.purchase_date) }}
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap">
                                        <span
                                            :class="[
                                                getStatusBadgeClass(expense)
                                            ]"
                                        >
                                            {{ paymentStatusMap[expense.payment_status_id]?.label || "Sin estado" }}
                                        </span>
                                    </td>
                                    <td class="px-5 py-4 whitespace-nowrap text-sm">
                                        <div class="flex items-center gap-1">
                                            <button
                                                @click="openPaymentStatusModal(expense)"
                                                class="p-1.5 rounded-lg text-success-600 hover:bg-success-50 transition-colors duration-200"
                                                title="Cambiar estado"
                                            >
                                                <CheckCircle2 class="h-4 w-4" />
                                            </button>
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
                <div v-if="totalPagesDesktop > 1" class="flex justify-center items-center gap-2 px-6 py-4 border-t border-slate-100 dark:border-gray-700">
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
                                    : 'text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 dark:bg-gray-700 hover:text-slate-700 dark:hover:text-gray-300 dark:text-gray-300'
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
            <TransitionGroup name="list" tag="div" class="block md:hidden space-y-3">
                <template v-if="paginatedExpenses.length > 0">
                    <div
                        v-for="item in paginatedExpenses"
                        :key="getExpenseRowKey(item)"
                        class="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-slate-100 dark:border-gray-700 overflow-hidden card-hover"
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
                                            :checked="selectedExpenses.has(`expense-${item.id}`)"
                                            @change="toggleExpenseSelection(`expense-${item.id}`)"
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
                                        <h3 class="font-semibold text-slate-900 dark:text-gray-100 text-sm truncate">
                                            {{ item.description }}
                                        </h3>
                                        <p
                                            v-if="item.is_scheduled && getScheduledInstallmentLabel(item)"
                                            class="text-xs text-slate-400 dark:text-gray-500 mt-0.5"
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
                                                :class="item.is_installment ? 'text-primary-500' : item.is_scheduled ? 'text-violet-500' : 'text-slate-400 dark:text-gray-500'"
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
                                            class="p-1.5 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors duration-200"
                                            title="Más opciones"
                                        >
                                            <MoreVertical class="h-4 w-4" />
                                        </button>
                                        
                                        <div
                                            v-if="activeActionMenu === item.id"
                                            class="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-100 dark:border-gray-700 py-1 z-10 min-w-[140px]"
                                        >
                                            <button
                                                @click="editExpense(item)"
                                                class="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:bg-gray-700 dark:hover:bg-gray-700 flex items-center gap-2 font-medium"
                                            >
                                                <Edit class="h-4 w-4 text-primary-500" />
                                                Editar
                                            </button>
                                            <button
                                                @click="deleteExpense(item.id, item)"
                                                class="w-full px-4 py-2.5 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2 font-medium"
                                            >
                                                <Trash2 class="h-4 w-4" />
                                                Eliminar
                                            </button>
                                            <button
                                                @click="openPaymentStatusModal(item)"
                                                class="w-full px-4 py-2.5 text-left text-sm text-success-700 hover:bg-success-50 flex items-center gap-2 font-medium"
                                            >
                                                <CheckCircle2 class="h-4 w-4" />
                                                Cambiar estado
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div
                                        class="text-base font-bold"
                                        :class="item.is_installment ? 'text-primary-600' : 'text-slate-900 dark:text-gray-100'"
                                    >
                                        {{ formatCurrency(item.is_installment ? item.installment_amount : item.amount) }}
                                    </div>
                                </div>
                            </div>

                            <!-- Detalles adicionales -->
                            <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-gray-700">
                                <div
                                    v-if="item.is_installment"
                                    class="flex items-center justify-between text-xs"
                                >
                                    <span class="text-slate-500 dark:text-gray-400">Cuota {{ item.installment_number }} de {{ item.installments_count }}</span>
                                    <span class="text-primary-600 font-semibold">Vence: {{ formatDate(item.due_date) }}</span>
                                </div>

                                <div
                                    v-else-if="item.is_scheduled && getScheduledInstallmentLabel(item)"
                                    class="flex items-center justify-between text-xs"
                                >
                                    <span class="text-slate-500 dark:text-gray-400">{{ getScheduledInstallmentLabel(item) }}</span>
                                    <span class="text-violet-600 font-semibold">Mes: {{ formatDate(item.purchase_date) }}</span>
                                </div>

                                <div class="flex items-center justify-between text-xs">
                                    <span class="text-slate-500 dark:text-gray-400">Tarjeta</span>
                                    <span class="text-slate-700 dark:text-gray-300 font-semibold">{{ item.expenses?.available_cards?.name || item.available_cards?.name || "Sin cuenta" }}</span>
                                </div>

                                <div class="flex items-center justify-between">
                                    <span class="text-xs text-slate-500 dark:text-gray-400">Estado</span>
                                    <button
                                        @click="openPaymentStatusModal(item)"
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
                        class="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-slate-100 dark:border-gray-700 overflow-hidden card-hover"
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
                                            :checked="selectedExpenses.has(`expense-${expense.id}`)"
                                            @change="toggleExpenseSelection(`expense-${expense.id}`)"
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
                                        <h3 class="font-semibold text-slate-900 dark:text-gray-100 text-sm truncate">
                                            {{ expense.description }}
                                        </h3>
                                        <p
                                            v-if="expense.is_scheduled && getScheduledInstallmentLabel(expense)"
                                            class="text-xs text-slate-400 dark:text-gray-500 mt-0.5"
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
                                                :class="expense.is_scheduled ? 'text-violet-500' : 'text-slate-400 dark:text-gray-500'"
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
                                            class="p-1.5 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors duration-200"
                                            title="Más opciones"
                                        >
                                            <MoreVertical class="h-4 w-4" />
                                        </button>
                                        
                                        <div
                                            v-if="activeActionMenu === expense.id"
                                            class="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-100 dark:border-gray-700 py-1 z-10 min-w-[140px]"
                                        >
                                            <button
                                                @click="editExpense(expense)"
                                                class="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:bg-gray-700 dark:hover:bg-gray-700 flex items-center gap-2 font-medium"
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
                                            <button
                                                @click="openPaymentStatusModal(expense)"
                                                class="w-full px-4 py-2.5 text-left text-sm text-success-700 hover:bg-success-50 flex items-center gap-2 font-medium"
                                            >
                                                <CheckCircle2 class="h-4 w-4" />
                                                Cambiar estado
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div class="text-base font-bold text-slate-900 dark:text-gray-100">
                                        {{ formatCurrency(expense.amount) }}
                                    </div>
                                    <div class="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
                                        {{ formatDate(expense.purchase_date) }}
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-gray-700">
                                <div class="flex items-center justify-between text-xs">
                                    <span class="text-slate-500 dark:text-gray-400">Tarjeta</span>
                                    <span class="text-slate-700 dark:text-gray-300 font-semibold">{{ expense.expenses?.available_cards?.name || expense.available_cards?.name || "Sin cuenta" }}</span>
                                </div>

                                <div class="flex items-center justify-between">
                                    <span class="text-xs text-slate-500 dark:text-gray-400">Estado</span>
                                    <button
                                        @click="openPaymentStatusModal(expense)"
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
                        class="p-2 rounded-xl border border-slate-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:bg-gray-700 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronLeft class="h-4 w-4 text-slate-600 dark:text-gray-400" />
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
                                    : 'text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 dark:bg-gray-700'
                            ]"
                        >
                            {{ page }}
                        </span>
                    </div>
                    
                    <button
                        @click="nextPage"
                        :disabled="currentPage === totalPages"
                        class="p-2 rounded-xl border border-slate-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:bg-gray-700 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronRight class="h-4 w-4 text-slate-600 dark:text-gray-400" />
                    </button>
                </div>
            </TransitionGroup>

            <EmptyState
                v-if="filteredExpensesToShow.length === 0 && !expensesStore.loading"
                icon="Receipt"
                title="No hay gastos"
                description="Comienza agregando tu primer gasto para llevar el control de tus finanzas"
            />
            <EmptyState
                v-else-if="searchedExpenses.length === 0 && searchQuery && !expensesStore.loading"
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
import { ref, computed, onMounted, watch, watchEffect, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useExpensesStore } from "@/stores/expenses";
import { useUserCardsStore } from "@/stores/userCards";
import { useUserCategoriesStore } from "@/stores/userCategories";
import ExpenseModal from "@/components/ExpenseModal.vue";
import ScheduledExpenseModal from "@/components/ScheduledExpenseModal.vue";
import SkeletonSummary from "@/components/SkeletonSummary.vue";
import SkeletonList from "@/components/SkeletonList.vue";
import SkeletonExpenseCard from "@/components/SkeletonExpenseCard.vue";
import SkeletonExpenseSummary from "@/components/SkeletonExpenseSummary.vue";
import SearchBar from "@/components/SearchBar.vue";
import EmptyState from "@/components/EmptyState.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import ExportButton from "@/components/ExportButton.vue";
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
    Loader2,
    Calendar,
    X,
    SearchX,
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

const selectedExpenses = ref(new Set());
const isBulkMode = ref(false);
const selectAllExpenses = ref(false);
const isBulkActionLoading = ref(false);

const selectedExpensesCount = computed(() => selectedExpenses.value.size);

const toggleBulkMode = () => {
    if (isBulkActionLoading.value) return;
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
    if (isBulkActionLoading.value) return;
    if (selectAllExpenses.value) {
        selectedExpenses.value.clear();
        selectAllExpenses.value = false;
    } else {
        const allExpenseIds = filteredExpensesToShow.value
            .map(item => `expense-${item.id}`
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
            isBulkActionLoading.value = true;
            Swal.fire({
                title: "Procesando...",
                text: "Actualizando gastos seleccionados, por favor esperá.",
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });
            let successCount = 0;
            let errorCount = 0;
            
            for (const selectedId of selectedExpenses.value) {
                const expenseId = selectedId.startsWith('expense-')
                    ? selectedId.replace('expense-', '')
                    : selectedId;

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
            Swal.close();
            
            await Swal.fire({
                icon: successCount > 0 ? "success" : "error",
                title: successCount > 0 ? "¡Gastos eliminados!" : "Error al eliminar",
                text: successCount > 0 
                    ? `Se eliminaron ${successCount} gasto(s) correctamente.${errorCount > 0 ? ` ${errorCount} gasto(s) no se pudieron eliminar.` : ''}`
                    : "No se pudo eliminar ningún gasto.",
            });
        } catch (error) {
            Swal.close();
            await Swal.fire({
                icon: "error",
                title: "Error inesperado",
                text: error.message || "Ocurrió un error al eliminar los gastos.",
            });
        } finally {
            isBulkActionLoading.value = false;
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
            isBulkActionLoading.value = true;
            Swal.fire({
                title: "Procesando...",
                text: "Actualizando gastos seleccionados, por favor esperá.",
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });
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
                        result = await expensesStore.markInstallmentAsPaid(actualId, newStatusId);
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
            Swal.close();
            
            await Swal.fire({
                icon: successCount > 0 ? "success" : "error",
                title: successCount > 0 ? "¡Estados actualizados!" : "Error al actualizar",
                text: successCount > 0 
                    ? `Se actualizaron ${successCount} gasto(s) correctamente.${errorCount > 0 ? ` ${errorCount} gasto(s) no se pudieron actualizar.` : ''}`
                    : "No se pudo actualizar ningún gasto.",
            });
        } catch (error) {
            Swal.close();
            await Swal.fire({
                icon: "error",
                title: "Error inesperado",
                text: error.message || "Ocurrió un error al actualizar los estados.",
            });
        } finally {
            isBulkActionLoading.value = false;
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
    window.addEventListener('scroll', handleFabScroll, { passive: true });
});

watch(
    () => filters.value.payment_status_id,
    () => {
        expensesStore.clearMonthlyData();
        forceTableUpdate();
    },
    { immediate: false }
);

watch(searchQuery, () => {
    currentPage.value = 1;
    currentPageDesktop.value = 1;
});

onUnmounted(() => {
    _mounted = false
    document.removeEventListener('click', handleClickOutside);
    window.removeEventListener('scroll', handleFabScroll);
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
    expenseToDelete.value = null;
};

const resolvePaymentStatusId = (item) => {
    const parsed = Number(item?.payment_status_id);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const resolvePaymentStatusCode = (statusId) => {
    return paymentStatusMap[statusId]?.code || "pendiente";
};

const applyPaymentStatusUpdate = async (item, newStatusId) => {
    if (!item) return { success: false, error: "Gasto inválido" };

    const isInstallment = item.is_installment === true;
    const targetId = isInstallment
        ? (item.installment_id ?? item.id)
        : item.id;

    if (!targetId) {
        return { success: false, error: "No se encontró el identificador del gasto" };
    }

    const result = isInstallment
        ? await expensesStore.markInstallmentAsPaid(targetId, newStatusId)
        : await expensesStore.markAsPaid(targetId, newStatusId);

    if (!result?.success) return result;

    if (filters.value?.month && filters.value?.year) {
        await loadMonthlyData();
    } else {
        await expensesStore.loadExpenses();
    }
    await expensesStore.loadUpcomingInstallments(1000);

    return result;
};

const openPaymentStatusModal = async (item) => {
    if (!item) return;

    const currentStatusId = resolvePaymentStatusId(item);
    const currentStatusCode = resolvePaymentStatusCode(currentStatusId);
    const itemTypeLabel = item.is_installment ? "cuota" : "gasto";
    const itemTitle = item.description || `Actualizar ${itemTypeLabel}`;
    const amount = item.is_installment ? (item.installment_amount ?? item.amount) : item.amount;

    const { isConfirmed, value: selectedStatusId } = await Swal.fire({
        title: "Actualizar estado",
        html: `
            <div style="text-align:left; margin-top:4px;">
                <div style="padding:12px; border-radius:10px; background:#f8fafc; border:1px solid #e2e8f0; margin-bottom:12px;">
                    <div style="font-size:0.78em; color:#64748b; margin-bottom:4px;">${itemTypeLabel.toUpperCase()}</div>
                    <div style="font-size:0.95em; color:#0f172a; font-weight:600;">${itemTitle}</div>
                    <div style="margin-top:6px; font-size:0.85em; color:#334155;">Monto: ${formatCurrency(amount || 0)}</div>
                </div>
                <div id="status-options" style="display:grid; gap:8px;">
                    <label data-status-option="2" style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; border:1px solid #d1fae5; background:#ecfdf5; cursor:pointer;">
                        <input type="radio" name="payment-status-option" value="2" style="accent-color:#16a34a;" />
                        <div>
                            <div style="font-weight:600; color:#166534; font-size:0.9em;">Pagada</div>
                            <div style="font-size:0.76em; color:#15803d;">Registrar que ya fue abonada</div>
                        </div>
                    </label>
                    <label data-status-option="1" style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; border:1px solid #fde68a; background:#fffbeb; cursor:pointer;">
                        <input type="radio" name="payment-status-option" value="1" style="accent-color:#f59e0b;" />
                        <div>
                            <div style="font-weight:600; color:#92400e; font-size:0.9em;">Pendiente</div>
                            <div style="font-size:0.76em; color:#b45309;">Aun no fue abonada</div>
                        </div>
                    </label>
                </div>
                <p style="margin:10px 2px 0; font-size:0.75em; color:#64748b;">
                    Estado actual: <strong>${paymentStatusMap[currentStatusId]?.label || "Pendiente"}</strong>
                </p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Guardar estado",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#64748b",
        didOpen: () => {
            const selector = `input[name="payment-status-option"][value="${currentStatusCode === "pagada" ? "2" : "1"}"]`;
            const selectedInput = document.querySelector(selector);
            if (selectedInput) selectedInput.checked = true;
        },
        preConfirm: () => {
            const selected = document.querySelector('input[name="payment-status-option"]:checked');
            if (!selected) {
                Swal.showValidationMessage("Seleccioná un estado");
                return null;
            }
            return Number(selected.value);
        },
    });

    if (!isConfirmed || !selectedStatusId) return;
    if (selectedStatusId === currentStatusId) return;

    Swal.fire({
        title: "Actualizando estado...",
        text: "Guardando cambios, por favor esperá.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
    });

    const result = await applyPaymentStatusUpdate(item, selectedStatusId);
    Swal.close();

    if (result?.success) {
        await Swal.fire({
            icon: "success",
            title: "Estado actualizado",
            text: `El ${itemTypeLabel} ahora figura como "${paymentStatusMap[selectedStatusId]?.label || "actualizado"}".`,
            timer: 1800,
            showConfirmButton: false,
        });
    } else {
        await Swal.fire({
            icon: "error",
            title: "No se pudo actualizar",
            text: result?.error || "Ocurrió un error al actualizar el estado.",
        });
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
            const isScheduledEdit = editingExpense.value.is_scheduled === true;

            if (isScheduledEdit) {
                const updateScopeResult = await Swal.fire({
                    title: "Actualizar gasto programado",
                    text: "¿Querés aplicar el cambio solo a este mes o también a los meses futuros?",
                    icon: "question",
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: "Este y futuros",
                    denyButtonText: "Solo este mes",
                    cancelButtonText: "Cancelar",
                    confirmButtonColor: "#7c3aed",
                    denyButtonColor: "#3b82f6",
                    cancelButtonColor: "#6b7280",
                });

                if (!updateScopeResult.isConfirmed && !updateScopeResult.isDenied) return;

                if (updateScopeResult.isConfirmed) {
                    const scheduledData = {
                        description: expenseData.description,
                        amount: expenseData.amount,
                        card_id: expenseData.card_id,
                        category_id: expenseData.category_id,
                        subcategory_id: expenseData.subcategory_id || null,
                        scheduled_start_month: editingExpense.value.scheduled_start_month,
                        scheduled_months: editingExpense.value.scheduled_months ?? null,
                        payment_status_id:
                            editingExpense.value.payment_status_id ||
                            expenseData.payment_status_id ||
                            1,
                    };

                    result = await expensesStore.updateScheduledExpense(
                        editingExpense.value.id,
                        scheduledData
                    );
                } else if (updateScopeResult.isDenied) {
                    result = await expensesStore.updateExpense(
                        editingExpense.value.id,
                        expenseData
                    );
                }
            } else {
                result = await expensesStore.updateExpense(
                    editingExpense.value.id,
                    expenseData
                );
            }

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

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
    }).format(amount);
};


const formatDate = (date) => {
    return format(parseISO(date), "dd/MM/yyyy", { locale: es });
};

const getExpenseRowKey = (item) => {
    if (!item) return "row-unknown";
    if (item.is_installment) return `installment-${item.installment_id ?? item.id}`;
    return `expense-${item.id ?? item.expense_id}`;
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

const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const searchedExpenses = computed(() => {
  if (!searchQuery.value) return filteredExpensesToShow.value
  const q = normalizeText(searchQuery.value)
  return filteredExpensesToShow.value.filter(item =>
    normalizeText(item.description || '').includes(q)
  )
})

const searchedDirectExpenses = computed(() => {
  if (!searchQuery.value) return directExpenses.value
  const q = normalizeText(searchQuery.value)
  return directExpenses.value.filter(item =>
    normalizeText(item.description || '').includes(q)
  )
})

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

const expenseCsvColumns = [
    { key: 'description', label: 'Descripción' },
    { key: 'amount', label: 'Monto' },
    { key: 'date', label: 'Fecha' },
    { key: 'category', label: 'Categoría' },
    { key: 'card', label: 'Tarjeta' },
    { key: 'type', label: 'Tipo' },
    { key: 'status', label: 'Estado' }
]

const exportableExpenses = computed(() => {
    return searchedExpenses.value.map(e => ({
        description: e.description || '',
        amount: e.is_installment ? (e.installment_amount ?? e.amount) : e.amount,
        date: e.is_installment ? (e.due_date || '') : (e.purchase_date || ''),
        category: (e.categories?.name || e.expenses?.categories?.name) || '',
        card: (e.available_cards?.name || e.expenses?.available_cards?.name) || '',
        type: e.is_installment ? 'Cuota' : e.is_scheduled ? 'Programado' : 'Directo',
        status: getStatusLabel(e) || ''
    }))
})

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
    return searchedExpenses.value.slice(start, end);
});

const paginatedDirectExpenses = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return searchedDirectExpenses.value.slice(start, end);
});

const totalPages = computed(() => {
    return Math.ceil(searchedExpenses.value.length / itemsPerPage);
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

const showFab = ref(true)
let lastFabScrollY = 0
const handleFabScroll = () => {
  const currentScrollY = window.scrollY
  showFab.value = currentScrollY < lastFabScrollY || currentScrollY < 50
  lastFabScrollY = currentScrollY
}

const itemsPerPageDesktop = 10;
const currentPageDesktop = ref(1);

const paginatedExpensesDesktop = computed(() => {
    const start = (currentPageDesktop.value - 1) * itemsPerPageDesktop;
    const end = start + itemsPerPageDesktop;
    return searchedExpenses.value.slice(start, end);
});

const paginatedDirectExpensesDesktop = computed(() => {
    const start = (currentPageDesktop.value - 1) * itemsPerPageDesktop;
    const end = start + itemsPerPageDesktop;
    return searchedDirectExpenses.value.slice(start, end);
});

const totalPagesDesktop = computed(() => {
    return Math.ceil(searchedExpenses.value.length / itemsPerPageDesktop);
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
