<template>
    <div class="space-y-6">
        <!-- Header -->
        <div
            class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
        >
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Gastos</h1>
                <p class="text-gray-600">Gestiona todos tus gastos y compras</p>
            </div>
        </div>

        <!-- Resumen del mes actual - Movido arriba -->
        <div class="space-y-4">
            <!-- Título del mes actual -->
            <div class="text-center mb-2">
                <h2 class="text-xl font-semibold text-gray-800">
                    {{ monthYearTitle }}
                </h2>
            </div>
            
            <!-- Resumen con cuotas y flechas de mes - Solo Desktop -->
            <div class="hidden lg:flex card items-center justify-between">
                <button
                    @click="previousMonth"
                    class="btn-secondary px-2 py-1 flex items-center justify-center"
                >
                    <ChevronLeft class="h-4 w-4" />
                </button>
                <div class="flex-1">
                    <div
                        class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center"
                    >
                        <div>
                            <p class="text-sm text-gray-600">
                                Total Débito
                            </p>
                            <p class="text-2xl font-bold text-blue-700">
                                {{ formatCurrency(totalDebitTransferExpenses) }}
                            </p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">
                                Total Crédito
                            </p>
                            <p class="text-2xl font-bold text-purple-600">
                                {{ formatCurrency(totalCreditExpenses) }}
                            </p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Gastos Totales</p>
                            <p class="text-2xl font-bold text-green-600">
                                {{ formatCurrency(totalExpenses) }}
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    @click="nextMonth"
                    class="btn-secondary px-2 py-1 flex items-center justify-center"
                >
                    <ChevronRight class="h-4 w-4" />
                </button>
            </div>

            <!-- Resumen con cuotas y flechas de mes - Mobile y Tablet -->
            <div class="block lg:hidden card">
                <div class="flex items-center justify-between mb-3">
                    <button
                        @click="previousMonth"
                        class="btn-secondary px-2 py-1 flex items-center justify-center"
                    >
                        <ChevronLeft class="h-4 w-4" />
                    </button>
                    <button
                        @click="nextMonth"
                        class="btn-secondary px-2 py-1 flex items-center justify-center"
                    >
                        <ChevronRight class="h-4 w-4" />
                    </button>
                </div>
                <div class="grid grid-cols-3 gap-3">
                    <div class="text-center">
                        <p class="text-sm text-gray-600 mb-2">Débito</p>
                        <p class="text-sm font-bold text-blue-700 break-words leading-tight">
                            {{ formatCurrency(totalDebitTransferExpenses) }}
                        </p>
                    </div>
                    <div class="text-center">
                        <p class="text-sm text-gray-600 mb-2">Crédito</p>
                        <p class="text-sm font-bold text-purple-600 break-words leading-tight">
                            {{ formatCurrency(totalCreditExpenses) }}
                        </p>
                    </div>
                    <div class="text-center">
                        <p class="text-sm text-gray-600 mb-2">Total</p>
                        <p class="text-sm font-bold text-green-600 break-words leading-tight">
                            {{ formatCurrency(totalExpenses) }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filtros Desktop -->
        <div class="hidden lg:block card">
            <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
            >
                <!-- Filtro por tarjeta -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                        >Tarjeta</label
                    >
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

                <!-- Filtro por categoría -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                        >Categoría</label
                    >
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

                <!-- Filtro por mes -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                        >Mes</label
                    >
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

                <!-- Filtro por año (activo) -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                        >Año</label
                    >
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

                <!-- Filtro por estado de pago -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                        >Estado</label
                    >
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

            <!-- Botón limpiar filtros mejorado -->
            <div class="mt-4 flex justify-end">
                <button
                    @click="clearFilters"
                    class="btn-secondary flex items-center gap-2"
                >
                    <RotateCcw class="h-4 w-4" />
                    Limpiar Filtros
                </button>
            </div>
        </div>

        <!-- Filtros Móvil -->
        <div class="block lg:hidden">
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-medium text-gray-700">Filtros</h3>
                    <button
                        @click="clearFilters"
                        class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                        <RotateCcw class="h-3 w-3" />
                        Limpiar
                    </button>
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                    <!-- Filtro por tarjeta -->
                    <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1"
                            >Tarjeta</label
                        >
                        <select
                            v-model="filters.card_id"
                            @change="updateFilters"
                            class="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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

                    <!-- Filtro por categoría -->
                    <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1"
                            >Categoría</label
                        >
                        <select
                            v-model="filters.category_id"
                            @change="updateFilters"
                            class="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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

                    <!-- Filtro por mes -->
                    <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1"
                            >Mes</label
                        >
                        <select
                            v-model="filters.month"
                            @change="updateFilters"
                            class="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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

                    <!-- Filtro por año -->
                    <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1"
                            >Año</label
                        >
                        <select
                            v-model="filters.year"
                            @change="updateFilters"
                            class="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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

                    <!-- Filtro por estado de pago -->
                    <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1"
                            >Estado</label
                        >
                        <select
                            v-model="filters.payment_status_id"
                            @change="updateFilters"
                            class="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
            class="bg-danger-50 border border-danger-200 rounded-md p-4"
        >
            <div class="flex">
                <AlertCircle class="h-5 w-5 text-danger-400" />
                <div class="ml-3">
                    <p class="text-sm text-danger-700">
                        {{ expensesStore.error }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="expensesStore.loading" class="flex justify-center py-8">
            <div
                class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
            ></div>
        </div>

        <!-- Lista de gastos -->
        <div v-else class="space-y-4 pb-20">

            <!-- Botón Seleccionar y Barra de acciones múltiples -->
            <div class="space-y-3">
                <!-- Botón Seleccionar -->
                <div class="flex justify-center">
                    <button
                        @click="toggleBulkMode"
                        :class="[
                            'flex items-center gap-1 px-3 py-2 text-sm transition-colors rounded-md',
                            isBulkMode 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        ]"
                    >
                        <CheckCircle2 class="h-4 w-4" />
                        <span>{{ isBulkMode ? 'Cancelar Selección' : 'Seleccionar Gastos' }}</span>
                    </button>
                </div>

                <!-- Barra de acciones múltiples -->
                <div v-if="isBulkMode" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    :checked="selectAllExpenses"
                                    @change="toggleSelectAllExpenses"
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span class="text-sm font-medium text-gray-700">
                                    Seleccionar todos ({{ selectedExpensesCount }} seleccionados)
                                </span>
                            </label>
                        </div>
                        
                        <div class="flex flex-wrap gap-2">
                            <button
                                @click="bulkChangeStatus(2)"
                                :disabled="selectedExpensesCount === 0"
                                class="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Pagado
                            </button>
                            <button
                                @click="bulkChangeStatus(1)"
                                :disabled="selectedExpensesCount === 0"
                                class="px-3 py-1.5 text-xs font-medium bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                 Pendiente
                            </button>
                            <button
                                @click="bulkDeleteExpenses"
                                :disabled="selectedExpensesCount === 0"
                                class="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Eliminar Seleccionados
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Vista Desktop: Tabla de gastos -->
            <div class="hidden md:block card">
                <div class="overflow-x-auto">
                    <table :key="tableKey" class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th
                                    v-if="isBulkMode"
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    <input
                                        type="checkbox"
                                        :checked="selectAllExpenses"
                                        @change="toggleSelectAllExpenses"
                                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Tipo
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Descripción
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Tarjeta
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Categoría
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Monto
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Fecha
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Estado
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <!-- Gastos directos y cuotas -->

                            <template v-if="paginatedExpensesDesktop.length > 0">
                                <tr
                                    v-for="(item, index) in paginatedExpensesDesktop"
                                    :key="`${tableKey}-${Date.now()}-${item.is_installment ? 'installment-' + item.installment_id : 'expense-' + item.id}-${index}`"
                                >
                                    <td v-if="isBulkMode" class="px-6 py-4 whitespace-nowrap">
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
                                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center gap-2">
                                            <CreditCard
                                                v-if="item.is_installment"
                                                class="h-4 w-4 text-blue-500"
                                            />
                                            <Receipt
                                                v-else
                                                class="h-4 w-4 text-gray-500"
                                            />
                                            <span
                                                class="text-xs font-medium"
                                                :class="
                                                    item.is_installment
                                                        ? 'text-blue-600'
                                                        : 'text-gray-600'
                                                "
                                            >
                                                {{
                                                    item.is_installment
                                                        ? "Cuota"
                                                        : "Gasto"
                                                }}
                                            </span>
                                        </div>
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                    >
                                        <div>
                                            <div class="font-medium">
                                                {{ item.description }}
                                            </div>
                                            <div
                                                v-if="item.is_installment"
                                                class="text-xs text-gray-500"
                                            >
                                                Cuota
                                                {{ item.installment_number }} de
                                                {{ item.installments_count }}
                                            </div>
                                        </div>
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                                    >
                                        {{ item.expenses?.available_cards?.name || item.available_cards?.name || "Sin cuenta" }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span
                                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                            :style="{
                                                backgroundColor:
                                                    item.categories?.color +
                                                    '20',
                                                color: item.categories?.color,
                                            }"
                                        >
                                            {{
                                                item.categories?.name ||
                                                "Sin categoría"
                                            }}
                                        </span>
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm font-medium"
                                        :class="
                                            item.is_installment
                                                ? 'text-blue-600'
                                                : 'text-gray-900'
                                        "
                                    >
                                        {{
                                            formatCurrency(
                                                item.is_installment
                                                    ? item.installment_amount
                                                    : item.amount
                                            )
                                        }}
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                                    >
                                        {{
                                            formatDate(
                                                item.is_installment
                                                    ? item.due_date
                                                    : item.purchase_date
                                            )
                                        }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span
                                            :class="[
                                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                                getStatusColor(item),
                                            ]"
                                        >
                                            {{ getStatusLabel(item) }}
                                        </span>
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                    >
                                        <div class="flex space-x-2">
                                            <button
                                                v-if="!item.is_installment"
                                                @click="editExpense(item)"
                                                class="text-primary-600 hover:text-primary-900 transition-colors duration-200"
                                            >
                                                <Edit class="h-4 w-4" />
                                            </button>
                                            <button
                                                v-if="!item.is_installment"
                                                @click="deleteExpense(item.id, item)"
                                                class="text-danger-600 hover:text-danger-900 transition-colors duration-200"
                                            >
                                                <Trash2 class="h-4 w-4" />
                                            </button>
                                            <button
                                                v-if="item.is_installment"
                                                @click="
                                                    showInstallments(
                                                        item.expense_id,
                                                        item.installment_number
                                                    )
                                                "
                                                class="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                                                title="Ver cuota"
                                            >
                                                <CreditCard class="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </template>

                            <!-- Gastos normales (cuando no hay filtros de mes) -->
                            <template v-else-if="!filters.value || !filters.value.month || !filters.value.year">
                                <tr
                                    v-for="expense in paginatedDirectExpensesDesktop"
                                    :key="expense.id"
                                >
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center gap-2">
                                            <Receipt
                                                class="h-4 w-4 text-gray-500"
                                            />
                                            <span
                                                class="text-xs font-medium text-gray-600"
                                                >Gasto</span
                                            >
                                        </div>
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                    >
                                        {{ expense.description }}
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                                    >
                                        {{
                                            expense.expenses?.available_cards?.name || expense.available_cards?.name || "Sin cuenta"
                                        }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span
                                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                            :style="{
                                                backgroundColor:
                                                    expense.categories?.color +
                                                    '20',
                                                color: expense.categories
                                                    ?.color,
                                            }"
                                        >
                                            {{
                                                expense.categories?.name ||
                                                "Sin categoría"
                                            }}
                                        </span>
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                                    >
                                        {{ formatCurrency(expense.amount) }}
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                                    >
                                        {{ formatDate(expense.purchase_date) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <button
                                            @click="togglePaidStatus(expense)"
                                            :class="[
                                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-200',
                                                paymentStatusMap[
                                                    expense.payment_status_id
                                                ]?.code === 'pagada'
                                                    ? 'bg-success-100 text-success-800 hover:bg-success-200'
                                                    : paymentStatusMap[
                                                          expense
                                                              .payment_status_id
                                                      ]?.code === 'en_deuda'
                                                    ? 'bg-danger-100 text-danger-800 hover:bg-danger-200'
                                                    : 'bg-warning-100 text-warning-800 hover:bg-warning-200',
                                            ]"
                                        >
                                            {{
                                                paymentStatusMap[
                                                    expense.payment_status_id
                                                ]?.label || "Sin estado"
                                            }}
                                        </button>
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                    >
                                        <div class="flex space-x-2">
                                            <button
                                                @click="editExpense(expense)"
                                                class="text-primary-600 hover:text-primary-900 transition-colors duration-200"
                                            >
                                                <Edit class="h-4 w-4" />
                                            </button>
                                            <button
                                                @click="
                                                    deleteExpense(expense.id, expense)
                                                "
                                                class="text-danger-600 hover:text-danger-900 transition-colors duration-200"
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
                <div v-if="totalPagesDesktop > 1" class="flex justify-center items-center gap-2 mt-6 py-4 border-t border-gray-200">
                    <button
                        @click="previousPageDesktop"
                        :disabled="currentPageDesktop === 1"
                        class="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
                    >
                        Anterior
                    </button>
                    
                    <div class="flex items-center gap-1">
                        <span
                            v-for="page in visiblePagesDesktop"
                            :key="page"
                            @click="goToPageDesktop(page)"
                            :class="[
                                'px-3 py-1 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200',
                                page === currentPageDesktop
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            ]"
                        >
                            {{ page }}
                        </span>
                    </div>
                    
                    <button
                        @click="nextPageDesktop"
                        :disabled="currentPageDesktop === totalPagesDesktop"
                        class="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            <!-- Vista Móvil: Lista de tarjetas de gastos -->
            <div class="block md:hidden space-y-2">
                <template v-if="paginatedExpenses.length > 0">
                    <div
                        v-for="(item, index) in paginatedExpenses"
                        :key="`${tableKey}-${Date.now()}-${item.is_installment ? 'installment-' + item.installment_id : 'expense-' + item.id}-${index}`"
                        class="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
                    >
                        <!-- Header de la tarjeta -->
                        <div class="flex items-start justify-between mb-2">
                            <div class="flex items-center gap-2">
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
                                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <!-- Icono del tipo de gasto -->
                                <div
                                    class="w-8 h-8 rounded-full flex items-center justify-center"
                                    :class="
                                        item.is_installment
                                            ? 'bg-blue-100'
                                            : 'bg-gray-100'
                                    "
                                >
                                    <CreditCard
                                        v-if="item.is_installment"
                                        class="h-4 w-4 text-blue-600"
                                    />
                                    <Receipt
                                        v-else
                                        class="h-4 w-4 text-gray-600"
                                    />
                                </div>
                                
                                <!-- Información principal -->
                                <div class="flex-1">
                                    <h3 class="font-semibold text-gray-900 text-sm">
                                        {{ item.description }}
                                    </h3>
                                    <div class="flex items-center gap-2 mt-1">
                                        <span
                                            class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
                                            :style="{
                                                backgroundColor:
                                                    item.categories?.color +
                                                    '20',
                                                color: item.categories?.color,
                                            }"
                                        >
                                            {{ item.categories?.name || "Sin categoría" }}
                                        </span>
                                        <span
                                            class="text-xs text-gray-500"
                                            :class="
                                                item.is_installment
                                                    ? 'text-blue-600'
                                                    : 'text-gray-600'
                                            "
                                        >
                                            {{ item.is_installment ? "Cuota" : "Gasto" }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Monto y menú de acciones -->
                            <div class="text-right relative">
                                <!-- Menú de acciones con tres puntitos -->
                                <div class="relative action-menu-container mb-1">
                                    <button
                                        @click="toggleActionMenu(item.id)"
                                        class="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                        title="Más opciones"
                                    >
                                        <MoreVertical class="h-4 w-4" />
                                    </button>
                                    
                                    <!-- Menú desplegable -->
                                    <div
                                        v-if="activeActionMenu === item.id"
                                        class="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]"
                                    >
                                        <button
                                            v-if="!item.is_installment"
                                            @click="editExpense(item)"
                                            class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Edit class="h-4 w-4" />
                                            Editar
                                        </button>
                                        <button
                                            v-if="!item.is_installment"
                                            @click="deleteExpense(item.id, item)"
                                            class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Trash2 class="h-4 w-4" />
                                            Eliminar
                                        </button>
                                        <button
                                            v-if="item.is_installment"
                                            @click="showInstallments(item.expense_id, item.installment_number)"
                                            class="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                        >
                                            <CreditCard class="h-4 w-4" />
                                            Ver cuota
                                        </button>
                                    </div>
                                </div>
                                
                                <div
                                    class="text-base font-bold"
                                    :class="
                                        item.is_installment
                                            ? 'text-blue-600'
                                            : 'text-gray-900'
                                    "
                                >
                                    {{ formatCurrency(
                                        item.is_installment
                                            ? item.installment_amount
                                            : item.amount
                                    ) }}
                                </div>
                               
                            </div>
                        </div>

                        <!-- Detalles adicionales -->
                        <div class="space-y-1">
                            <!-- Información de cuota -->
                            <div
                                v-if="item.is_installment"
                                class="flex items-center justify-between text-xs"
                            >
                                <span class="text-gray-600">Cuota {{ item.installment_number }} de {{ item.installments_count }}</span>
                                <span class="text-blue-600 font-medium">Vence: {{ formatDate(item.due_date) }}</span>
                            </div>

                            <!-- Tarjeta -->
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-gray-600">Tarjeta</span>
                                <span class="text-gray-900 font-medium">{{ item.expenses?.available_cards?.name || item.available_cards?.name || "Sin cuenta" }}</span>
                            </div>


                            <!-- Estado -->
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-gray-600">Estado</span>
                                <button
                                    @click="item.is_installment ? showInstallments(item.expense_id, item.installment_number) : togglePaidStatus(item)"
                                    :class="[
                                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-200',
                                        getStatusColor(item)
                                    ]"
                                >
                                    {{ getStatusLabel(item) }}
                                </button>
                            </div>
                        </div>


                    </div>
                </template>

                <!-- Gastos normales (cuando no hay filtros de mes) -->
                <template v-else-if="!filters.value || !filters.value.month || !filters.value.year">
                    <div
                        v-for="expense in paginatedDirectExpenses"
                        :key="expense.id"
                        class="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
                    >
                        <!-- Header de la tarjeta -->
                        <div class="flex items-start justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <!-- Checkbox para selección múltiple -->
                                <div v-if="isBulkMode" class="flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        :checked="selectedExpenses.has(expense.id)"
                                        @change="toggleExpenseSelection(expense.id)"
                                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <!-- Icono del tipo de gasto -->
                                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Receipt class="h-4 w-4 text-gray-600" />
                                </div>
                                
                                <!-- Información principal -->
                                <div class="flex-1">
                                    <h3 class="font-semibold text-gray-900 text-sm">
                                        {{ expense.description }}
                                    </h3>
                                    <div class="flex items-center gap-2 mt-1">
                                        <span
                                            class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
                                            :style="{
                                                backgroundColor:
                                                    expense.categories?.color +
                                                    '20',
                                                color: expense.categories?.color,
                                            }"
                                        >
                                            {{ expense.categories?.name || "Sin categoría" }}
                                        </span>
                                        <span class="text-xs text-gray-500">Gasto</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Monto y menú de acciones -->
                            <div class="text-right relative">
                                <!-- Menú de acciones con tres puntitos -->
                                <div class="relative action-menu-container mb-1">
                                    <button
                                        @click="toggleActionMenu(expense.id)"
                                        class="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                        title="Más opciones"
                                    >
                                        <MoreVertical class="h-4 w-4" />
                                    </button>
                                    
                                    <!-- Menú desplegable -->
                                    <div
                                        v-if="activeActionMenu === expense.id"
                                        class="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]"
                                    >
                                        <button
                                            @click="editExpense(expense)"
                                            class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Edit class="h-4 w-4" />
                                            Editar
                                        </button>
                                        <button
                                            @click="deleteExpense(expense.id, expense)"
                                            class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Trash2 class="h-4 w-4" />
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="text-base font-bold text-gray-900">
                                    {{ formatCurrency(expense.amount) }}
                                </div>
                                <div class="text-xs text-gray-500 mt-0.5">
                                    {{ formatDate(expense.purchase_date) }}
                                </div>
                            </div>
                        </div>

                        <!-- Detalles adicionales -->
                        <div class="space-y-1">
                            <!-- Tarjeta -->
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-gray-600">Tarjeta</span>
                                <span class="text-gray-900 font-medium">{{ expense.expenses?.available_cards?.name || expense.available_cards?.name || "Sin cuenta" }}</span>
                            </div>

                            <!-- Estado -->
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-gray-600">Estado</span>
                                <button
                                    @click="togglePaidStatus(expense)"
                                    :class="[
                                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-200',
                                        paymentStatusMap[expense.payment_status_id]?.code === 'pagada'
                                            ? 'bg-success-100 text-success-800 hover:bg-success-200'
                                            : paymentStatusMap[expense.payment_status_id]?.code === 'en_deuda'
                                            ? 'bg-danger-100 text-danger-800 hover:bg-danger-200'
                                            : 'bg-warning-100 text-warning-800 hover:bg-warning-200',
                                    ]"
                                >
                                    {{ paymentStatusMap[expense.payment_status_id]?.label || "Sin estado" }}
                                </button>
                            </div>
                        </div>


                    </div>
                </template>

                <!-- Paginación móvil -->
                <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-6">
                    <button
                        @click="previousPage"
                        :disabled="currentPage === 1"
                        class="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 mt-6"
                    >
                        <ChevronLeft class="h-4 w-4" />
                    </button>
                    
                    <div class="flex items-center gap-1 mt-6">
                        <span
                            v-for="page in visiblePages"
                            :key="page"
                            @click="goToPage(page)"
                            :class="[
                                'px-3 py-1 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200',
                                page === currentPage
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            ]"
                        >
                            {{ page }}
                        </span>
                    </div>
                    
                    <button
                        @click="nextPage"
                        :disabled="currentPage === totalPages"
                        class="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 mt-6"
                    >
                        <ChevronRight class="h-4 w-4" />
                    </button>
                </div>
            </div>

            <!-- Estado vacío -->
            <div
                v-if="filteredExpensesToShow.length === 0 && !expensesStore.loading"
                class="text-center py-12"
            >
                <Receipt class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-4 text-lg font-medium text-gray-900">
                    No hay gastos
                </h3>
                <p class="mt-2 text-gray-600">
                    Comienza agregando tu primer gasto
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
        <!-- Botones de opciones (se muestran cuando showExpenseOptions es true) -->
        <div v-if="showExpenseOptions" class="flex flex-col gap-2">
            <!-- Botón para gasto programado -->
            <button 
                @click="openNewScheduledExpenseModal"
                class="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-offset-2 transform hover:scale-105 active:scale-95"
                title="Nuevo gasto programado"
            >
                <Calendar class="h-5 w-5" />
                <span class="hidden lg:inline">Gasto Programado</span>
            </button>
            
            <!-- Botón para gasto normal -->
            <button 
                @click="openNewExpenseModal"
                class="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 transform hover:scale-105 active:scale-95"
                title="Nuevo gasto"
            >
                <Receipt class="h-5 w-5" />
                <span class="hidden lg:inline">Gasto Normal</span>
            </button>
        </div>
        
        <!-- Botón principal (se muestra cuando showExpenseOptions es false) -->
        <button 
            @click="toggleExpenseOptions"
            class="flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 transform hover:scale-105 active:scale-95"
            title="Agregar gasto"
        >
            <Plus class="h-6 w-6" />
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
} from "lucide-vue-next";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
// Importar SweetAlert2
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// Mapeo manual de estados de pago
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
const now = new Date();
const filters = ref({
    card_id: "",
    category_id: "",
    month: now.getMonth() + 1, // Mes actual (getMonth() devuelve 0-11, por eso +1)
    year: now.getFullYear(), // Año actual
    payment_status_id: null, // Por defecto "Todos los estados"
});

// Variables para selección múltiple
const selectedExpenses = ref(new Set());
const isBulkMode = ref(false);
const selectAllExpenses = ref(false);

// Computed para el conteo de seleccionados
const selectedExpensesCount = computed(() => selectedExpenses.value.size);

// Funciones para selección múltiple
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
            
            // Recargar datos
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
                    
                    // Extraer el ID real y determinar si es cuota o gasto
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
            
            // Recargar datos
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

// Años disponibles: desde el año actual hasta el año máximo de las cuotas existentes
const availableYears = computed(() => {
    const startYear = new Date().getFullYear(); // Año actual
    // Buscar el año máximo entre todas las cuotas (installments) cargadas
    let maxYear = new Date().getFullYear();
    const allInstallments = expensesStore.filteredExpensesWithInstallments;
    if (allInstallments.length > 0) {
        const years = allInstallments
            .map((inst) => {
                // Puede ser gasto directo o cuota
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
    // Generar el array de años
    const yearsArr = [];
    for (let y = startYear; y <= maxYear; y++) {
        yearsArr.push(y);
    }
    return yearsArr;
});

const directExpenses = computed(() =>
    expensesStore.filteredExpenses.filter((e) => e.installments_count === 1)
);

onMounted(async () => {
    await Promise.all([
        expensesStore.loadExpenses(),
        userCardsStore.loadUserCards(),
        userCategoriesStore.loadUserCategories(),
        expensesStore.loadPaymentStatuses(),
    ]);
    
    // Actualizar filtros iniciales en el store
    expensesStore.updateFilters({
        card_id: filters.value.card_id || null,
        category_id: filters.value.category_id || null,
        month: filters.value.month || null,
        year: filters.value.year || null
    });
    
    // Si hay mes y año seleccionados, cargar los datos mensuales automáticamente
    if (filters.value && filters.value.year) {
        loadMonthlyData();
    }

    // Cerrar menú de acciones cuando se hace clic fuera
    document.addEventListener('click', handleClickOutside);
});

// Watcher para forzar actualización cuando cambien los filtros
watch(
    () => filters.value.payment_status_id,
    () => {
        // Limpiar datos inmediatamente cuando cambie el filtro de estado
        expensesStore.clearMonthlyData();
        forceTableUpdate();
    },
    { immediate: false }
);

// Limpiar event listener al desmontar
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

const handleClickOutside = (event) => {
    if (!event.target.closest('.action-menu-container')) {
        activeActionMenu.value = null;
    }
    
    // Cerrar opciones de gastos si se hace clic fuera
    if (!event.target.closest('.fixed.bottom-24') && !event.target.closest('.fixed.bottom-6')) {
        showExpenseOptions.value = false;
    }
};

const updateFilters = () => {
    // Limpiar datos inmediatamente y forzar actualización
    expensesStore.clearMonthlyData();
    forceTableUpdate();
    
    // Resetear paginación cuando cambian los filtros
    currentPage.value = 1;
    currentPageDesktop.value = 1;
    
    // Actualizar filtros en el store
    expensesStore.updateFilters({
        card_id: filters.value.card_id || null,
        category_id: filters.value.category_id || null,
        month: filters.value.month || null,
        year: filters.value.year || null,
        payment_status_id: filters.value.payment_status_id || null
    });
    
    // Forzar limpieza adicional
    setTimeout(() => {
        expensesStore.clearMonthlyData();
        forceTableUpdate();
    }, 50);
    
    // Recargar datos del backend cuando cambien los filtros
    if (filters.value && filters.value.month && filters.value.year) {
        loadMonthlyData();
    }
};



const loadMonthlyData = async () => {
    if (filters.value && filters.value.month && filters.value.year) {
        // Limpiar datos inmediatamente
        expensesStore.clearMonthlyData();
        
        // Esperar un momento para que se limpien los datos
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
        
        // Forzar actualización después de cargar
        forceTableUpdate();
    }
};

// Computed para las tarjetas utilizadas en el mes actual
const availableCardsForMonth = computed(() => {
    const allData = expensesStore.monthlyExpensesWithInstallments;
    if (!allData || allData.length === 0) {
        return [];
    }
    
    // Extraer IDs únicos de tarjetas utilizadas en el mes
    const cardIds = new Set();
    allData.forEach(item => {
        if (item.available_cards?.id) {
            cardIds.add(item.available_cards.id);
        }
    });
    
    // Filtrar las tarjetas del usuario que se usaron en este mes
    return userCardsStore.cards.filter(card => cardIds.has(card.available_card_id));
});

// Computed para las categorías utilizadas en el mes actual
const availableCategoriesForMonth = computed(() => {
    const allData = expensesStore.monthlyExpensesWithInstallments;
    if (!allData || allData.length === 0) {
        return [];
    }
    
    // Extraer IDs únicos de categorías utilizadas en el mes
    const categoryIds = new Set();
    allData.forEach(item => {
        if (item.categories?.id) {
            categoryIds.add(item.categories.id);
        }
    });
    
    // Filtrar las categorías del usuario que se usaron en este mes
    return userCategoriesStore.categories.filter(category => categoryIds.has(category.id));
});

// Computed para los estados de pago (ahora viene de la API)
const availablePaymentStatuses = computed(() => {
    return expensesStore.paymentStatuses || [];
});

// Computed para el nombre del mes y año actual
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

// Modificar clearFilters para que solo limpie tarjeta y categoría
const clearFilters = () => {
    filters.value.card_id = "";
    filters.value.category_id = "";
    filters.value.month = new Date().getMonth() + 1; // Mes actual por defecto
    filters.value.year = new Date().getFullYear(); // Año actual por defecto
    
    // Actualizar filtros en el store
    expensesStore.updateFilters({
        card_id: null,
        category_id: null,
        month: filters.value.month,
        year: filters.value.year
    });
    
    // Recargar datos después de limpiar filtros
    loadMonthlyData();
};

const editExpense = (expense) => {
    editingExpense.value = { ...expense };
    showModal.value = true;
};

const deleteExpense = async (expenseId, expenseItem = null) => {
    
    const isScheduled = expenseItem?.is_scheduled || false;
    
    
    if (isScheduled) {
        // Modal para gastos programados
        const { value: deleteOption } = await Swal.fire({
            title: "¿Cómo quieres eliminar este gasto programado?",
            html: `
                <div style="text-align: left; margin: 20px 0;">
                    <p style="margin-bottom: 15px; color: #374151;">
                        Este es un gasto programado. Puedes:
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                            <input type="radio" name="deleteOption" value="current" checked style="margin: 0;">
                            <div>
                                <div style="font-weight: 600; color: #374151;">Solo este mes</div>
                                <div style="font-size: 0.875rem; color: #6b7280;">Eliminar únicamente este gasto, mantener los futuros</div>
                            </div>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                            <input type="radio" name="deleteOption" value="future" style="margin: 0;">
                            <div>
                                <div style="font-weight: 600; color: #374151;">Este mes y todos los futuros</div>
                                <div style="font-size: 0.875rem; color: #6b7280;">Cancelar completamente el gasto programado</div>
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
                    // Recargar datos
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
        // Gasto normal
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
                    // Recargar datos
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
    await expensesStore.markAsPaid(expense.id, newStatusId);
};

const openNewExpenseModal = async () => {

    
    // Verificar si el usuario tiene tarjetas asociadas
    const userCards = userCardsStore.cards;
    
    if (!userCards || userCards.length === 0) {
        // Mostrar alerta para asociar tarjeta primero
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
            // Redirigir a la vista de cuentas
            router.push('/cuentas');
        }
        return;
    }
    
    // Si tiene tarjetas, abrir el modal normalmente
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
  // Verificar si el usuario tiene tarjetas asociadas
  const userCards = userCardsStore.cards;
  
  if (!userCards || userCards.length === 0) {
    // Mostrar alerta para asociar tarjeta primero
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
      // Redirigir a la vista de cuentas
      router.push('/cuentas');
    }
    return;
  }
  
  // Si tiene tarjetas, abrir el modal normalmente
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
            // Las cuotas se crean manualmente en el backend
        }

        // Recargar datos según el contexto actual
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
        // El resultado ya viene del modal, no necesitamos crear el gasto aquí
        if (!result.success) {
            Swal.fire({
                icon: "error",
                title: "Error al crear gasto programado",
                text: result.error || "Ocurrió un error inesperado.",
            });
            return;
        }

        // Recargar datos según el contexto actual
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
    const newStatusId = currentStatus === "pendiente" ? 2 : 1; // 2 = pagada, 1 = pendiente
    await expensesStore.markInstallmentAsPaid(
        item.installment_id,
        newStatusId
    );
    // Recargar datos si estamos en vista mensual
    if (filters.value.year) {
        loadMonthlyData();
    }
};

// Modal para ver cuotas
const showInstallmentsModal = ref(false);
const selectedExpenseId = ref(null);

// Reemplazar el método showInstallments para mostrar el modal de una sola cuota
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

      const newStatusId = isPaid ? 2 : 1; // 2 = pagada, 1 = pendiente
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

// Funciones de utilidad
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
    }).format(amount);
};

const formatDate = (date) => {
    return format(parseISO(date), "dd/MM/yyyy", { locale: es });
};

// Checkbox para alternar entre gastos directos y cuotas
const showDirectExpenses = ref(false);

// Forzar actualización de la tabla
const tableKey = ref(0);
const forceTableUpdate = () => {
    tableKey.value++;
};

// Computed para filtrar lo que se muestra en la tabla
const filteredExpensesToShow = computed(() => {
    // Forzar reactividad con tableKey
    const key = tableKey.value;
    
    // Usar los datos filtrados del store, no los datos sin filtrar
    const allData = expensesStore.filteredExpensesWithInstallments;
    
    // Si no hay datos o está cargando, retornar array vacío
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

// Funciones para cambiar de mes con las flechas
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

// Total de gastos débito/transferencia del mes (desde backend)
const totalDebitTransferExpenses = computed(() => {
    return expensesStore.monthlyTotals?.total_debit_transfer || 0;
});

// Total de gastos de crédito del mes (desde backend)
const totalCreditExpenses = computed(() => {
    return expensesStore.monthlyTotals?.total_credit || 0;
});

// Total de gastos combinados (desde backend)
const totalExpenses = computed(() => {
    return expensesStore.monthlyTotals?.total_expenses || 0;
});

// Funciones para mostrar el estado correctamente
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

// Paginación
const itemsPerPage = 5; // Número de elementos por página
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

// Menú de acciones con tres puntitos
const activeActionMenu = ref(null);
const toggleActionMenu = (id) => {
    activeActionMenu.value = activeActionMenu.value === id ? null : id;
};

// Paginación para la vista desktop
const itemsPerPageDesktop = 10; // Número de elementos por página para la vista desktop
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
/* Estilos para el spinner de carga */
@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.spinner {
    animation: spin 1s linear infinite;
}

/* Estilos personalizados para SweetAlert */
         :deep(.swal2-modal-custom) {
           border-radius: 12px !important;
           box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12) !important;
           padding: 16px !important;
           max-width: 350px !important;
         }

:deep(.swal2-confirm-custom) {
  background: linear-gradient(135deg, #3b82f6, #6366f1) !important;
  border-radius: 8px !important;
  padding: 10px 20px !important;
  font-weight: 600 !important;
  font-size: 0.9em !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
  transition: all 0.2s ease !important;
}

:deep(.swal2-confirm-custom:hover) {
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4) !important;
}

:deep(.swal2-cancel-custom) {
  background: #f3f4f6 !important;
  border-radius: 8px !important;
  padding: 10px 20px !important;
  font-weight: 600 !important;
  font-size: 0.9em !important;
  color: #6b7280 !important;
  border: 1px solid #e5e7eb !important;
  transition: all 0.2s ease !important;
}

:deep(.swal2-cancel-custom:hover) {
  background: #e5e7eb !important;
  color: #374151 !important;
}

/* Estilos para el spinner */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mejoras para la tabla */
.expenses-table {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.expenses-table th {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    font-weight: 600;
    color: #374151;
    padding: 16px 12px;
    border-bottom: 2px solid #e5e7eb;
}

.expenses-table td {
    padding: 16px 12px;
    border-bottom: 1px solid #f3f4f6;
    transition: background-color 0.2s ease;
}

.expenses-table tbody tr:hover {
    background-color: #f8fafc;
}

/* Estilos para los badges de estado */
.status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.status-pagada {
    background-color: #dcfce7;
    color: #166534;
}

.status-pendiente {
    background-color: #fef3c7;
    color: #92400e;
}

.status-en-deuda {
    background-color: #fee2e2;
    color: #991b1b;
}

/* Estilos para los botones de acción */
.action-button {
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
    background: transparent;
}

.action-button:hover {
    background-color: #f3f4f6;
    transform: translateY(-1px);
}

.action-button:active {
    transform: translateY(0);
}

/* Mejoras para los filtros */
.filter-section {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.filter-row {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 150px;
}

.filter-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
}

.filter-select {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: white;
    font-size: 0.875rem;
    transition: border-color 0.2s ease;
}

.filter-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-filters-btn {
    padding: 8px 16px;
    background: #6b7280;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.clear-filters-btn:hover {
    background: #4b5563;
    transform: translateY(-1px);
}

/* Mejoras para las tarjetas de resumen */
.summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
}

.summary-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border-left: 4px solid #3b82f6;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.summary-card-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.summary-card-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
}

/* Responsive design */
@media (max-width: 768px) {
    .filter-row {
        flex-direction: column;
        align-items: stretch;
    }

    .filter-group {
        min-width: auto;
    }

    .summary-cards {
        grid-template-columns: 1fr;
    }

    .expenses-table {
        font-size: 0.875rem;
    }

    .expenses-table th,
    .expenses-table td {
        padding: 12px 8px;
    }
}

/* Estilos para el botón flotante */
@media (max-width: 1024px) {
  .fixed.bottom-24.right-6 {
    bottom: 6rem; /* Evitar que se superponga con la navegación móvil/tablet */
    right: 1rem;
  }
}

/* Animación de pulso para llamar la atención */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
}

/* Aplicar animación solo en desktop */
@media (min-width: 1025px) {
  .fixed.bottom-6.right-6 {
    animation: pulse-glow 2s infinite;
  }
}
</style>