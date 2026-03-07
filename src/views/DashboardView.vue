<template>
  <div class="space-y-6">
    <!-- Header (mobile) -->
    <div class="lg:hidden">
      <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p class="text-slate-500">Resumen de tus finanzas</p>
    </div>

    <!-- Hero Balance Card -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 sm:p-8 shadow-glow">
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0wIDM2YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0tMTgtMThjMS42NTcgMCAzLTEuMzQzIDMtM3MtMS4zNDMtMy0zLTMtMyAxLjM0My0zIDMgMS4zNDMgMyAzIDN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
      <div class="relative z-10">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <p class="text-primary-200 text-sm font-medium mb-1">{{ isAnnual ? 'Balance del Año' : 'Balance del Mes' }}</p>
            <template v-if="isLoading">
              <div class="skeleton h-10 w-56 !bg-white/10 !from-white/5 !via-white/15 !to-white/5 mb-1"></div>
            </template>
            <h1 v-else class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {{ formatCurrency(balanceView) }}
            </h1>
          </div>
          <!-- Pill Toggle Mensual/Anual -->
          <div class="flex items-center bg-white/10 backdrop-blur-sm rounded-full p-1 self-start sm:self-auto">
            <button
              @click="isAnnual = false"
              :class="[
                'px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200',
                !isAnnual ? 'bg-white text-primary-700 shadow-sm' : 'text-white/80 hover:text-white'
              ]"
            >
              <Calendar class="inline-block w-4 h-4 mr-1 -mt-0.5" />
              Mensual
            </button>
            <button
              @click="isAnnual = true"
              :class="[
                'px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200',
                isAnnual ? 'bg-white text-primary-700 shadow-sm' : 'text-white/80 hover:text-white'
              ]"
            >
              <TrendingUp class="inline-block w-4 h-4 mr-1 -mt-0.5" />
              Anual
            </button>
          </div>
        </div>
        <!-- Inline Stats -->
        <div class="flex flex-wrap gap-4 sm:gap-6">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-success-500/20 flex items-center justify-center">
              <ArrowUpRight class="w-4 h-4 text-success-300" />
            </div>
            <div>
              <p class="text-xs text-primary-200">Ingresos</p>
              <template v-if="isLoading">
                <div class="skeleton h-5 w-24 !bg-white/10 !from-white/5 !via-white/15 !to-white/5"></div>
              </template>
              <p v-else class="text-sm font-bold text-success-300">{{ formatCurrency(totalIncomeView) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-danger-500/20 flex items-center justify-center">
              <ArrowDownRight class="w-4 h-4 text-danger-300" />
            </div>
            <div>
              <p class="text-xs text-primary-200">Gastos</p>
              <template v-if="isLoading">
                <div class="skeleton h-5 w-24 !bg-white/10 !from-white/5 !via-white/15 !to-white/5"></div>
              </template>
              <p v-else class="text-sm font-bold text-danger-300">{{ formatCurrency(totalExpensesView) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Row (3 cards) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Ingresos del Mes -->
      <div class="bg-white rounded-2xl shadow-soft border-l-4 border-success-500 p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0">
          <Wallet class="w-6 h-6 text-success-500" />
        </div>
        <div class="min-w-0">
          <p class="text-sm text-slate-500 truncate">{{ isAnnual ? 'Ingresos del Año' : 'Ingresos del Mes' }}</p>
          <template v-if="isLoading">
            <div class="skeleton h-7 w-28 mt-1"></div>
          </template>
          <p v-else class="text-xl font-bold text-slate-900 truncate">{{ formatCurrency(totalIncomeView) }}</p>
        </div>
      </div>
      <!-- Gastos del Mes -->
      <div class="bg-white rounded-2xl shadow-soft border-l-4 border-danger-500 p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-danger-50 flex items-center justify-center flex-shrink-0">
          <Receipt class="w-6 h-6 text-danger-500" />
        </div>
        <div class="min-w-0">
          <p class="text-sm text-slate-500 truncate">{{ isAnnual ? 'Gastos del Año' : 'Gastos del Mes' }}</p>
          <template v-if="isLoading">
            <div class="skeleton h-7 w-28 mt-1"></div>
          </template>
          <p v-else class="text-xl font-bold text-slate-900 truncate">{{ formatCurrency(totalExpensesView) }}</p>
        </div>
      </div>
      <!-- Ahorro -->
      <div ref="savingsHelpRef" class="bg-white rounded-2xl shadow-soft border-l-4 border-primary-500 p-5 flex items-center gap-4 relative">
        <div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
          <PiggyBank class="w-6 h-6 text-primary-500" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm text-slate-500 truncate flex items-center gap-1.5">
            Ahorro
            <button
              type="button"
              @click.stop="showSavingsHelp = !showSavingsHelp"
              class="inline-flex items-center justify-center w-4 h-4 rounded-full text-slate-400 hover:text-primary-500 hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-200"
              :aria-expanded="showSavingsHelp"
              aria-label="Explicación del porcentaje de ahorro"
            >
              <HelpCircle class="w-4 h-4" />
            </button>
          </p>
          <template v-if="isLoading">
            <div class="skeleton h-7 w-20 mt-1"></div>
          </template>
          <p v-else class="text-xl font-bold" :class="savingsPercentage >= 0 ? 'text-success-600' : 'text-danger-600'">
            {{ savingsPercentage.toFixed(1) }}%
          </p>
        </div>
        <!-- Popover explicación Ahorro -->
        <Transition
          enter-active-class="transition ease-out duration-150"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div
            v-if="showSavingsHelp"
            class="absolute left-0 right-0 top-full mt-2 z-20 p-4 bg-slate-800 text-slate-100 text-sm rounded-xl shadow-soft-lg border border-slate-700"
            role="tooltip"
          >
            <p class="font-semibold text-white mb-1">¿Qué es el % de ahorro?</p>
            <p class="leading-relaxed">
              Es el porcentaje de tus <strong>ingresos</strong> que no gastaste en el período. Se calcula como: (Balance ÷ Ingresos) × 100.
              <template v-if="savingsPercentage >= 0">
                Tu <strong>{{ savingsPercentage.toFixed(1) }}%</strong> significa que de cada peso que entró, <strong>{{ Math.round(savingsPercentage) }}</strong> centavos quedaron como ahorro.
              </template>
              <template v-else>
                Tu <strong>{{ savingsPercentage.toFixed(1) }}%</strong> indica que gastaste más de lo que entró en el período.
              </template>
            </p>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Credit Cards Summary -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <template v-if="isLoading">
        <SkeletonCard v-for="i in 4" :key="`skeleton-card-${i}`" />
      </template>
      <template v-else>
        <div
          v-for="card in displayedCreditCards"
          :key="card.id"
          class="bg-white rounded-2xl shadow-soft border border-slate-100 p-4 hover:shadow-soft-lg transition-shadow duration-200"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
              <CreditCard class="h-5 w-5 text-primary-600" />
            </div>
            <span class="text-xs text-slate-400 font-medium">{{ isAnnual ? 'Año' : 'Mes' }}</span>
          </div>
          <h3 class="text-sm font-semibold text-slate-900 mb-1 truncate">{{ card.name }}</h3>
          <p class="text-lg font-bold text-slate-900">{{ formatCurrency(card.amount) }}</p>
          <p class="text-xs text-slate-400 mt-1">{{ card.bank }}</p>
        </div>

        <div
          v-if="(expensesStore.creditCardsSummary || []).length > 4"
          class="bg-white rounded-2xl shadow-soft border-2 border-dashed border-slate-200 p-4 flex items-center justify-center hover:border-primary-400 transition-colors duration-200 cursor-pointer"
          @click="showAllCards = !showAllCards"
        >
          <div class="text-center">
            <div class="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Plus class="h-5 w-5 text-slate-400" />
            </div>
            <p class="text-xs text-slate-500 font-medium">
              {{ showAllCards ? 'Ver menos' : `Ver ${(expensesStore.creditCardsSummary || []).length - 4} más` }}
            </p>
          </div>
        </div>
      </template>
    </div>

    <!-- Account Summary -->
    <SkeletonSummary v-if="isLoading" :items="3" />
    <div v-else class="card">
      <div class="card-header">
        <h3 class="card-title">Resumen de Cuentas</h3>
        <p class="card-subtitle">Distribución por tipo de cuenta</p>
      </div>
      <div class="space-y-3">
        <div
          v-for="summary in expensesStore.expensesSummaryByType"
          :key="summary.type"
          class="flex items-center justify-between py-2 border-b border-slate-50"
        >
          <div class="flex items-center">
            <div class="w-6 h-6 bg-primary-50 rounded-md flex items-center justify-center mr-3">
              <CreditCard class="h-4 w-4 text-primary-600" />
            </div>
            <span class="text-sm font-medium text-slate-600">{{ summary.type }}</span>
          </div>
          <span class="text-lg font-bold text-slate-900">{{ formatCurrency(summary.total) }}</span>
        </div>
        <div class="flex items-center justify-between py-2 border-t-2 border-slate-200 pt-3">
          <div class="flex items-center">
            <div class="w-6 h-6 bg-primary-100 rounded-md flex items-center justify-center mr-3">
              <DollarSign class="h-4 w-4 text-primary-600" />
            </div>
            <span class="text-sm font-semibold text-slate-700">{{ isAnnual ? 'Total Año' : 'Total Mes' }}</span>
          </div>
          <span class="text-xl font-bold text-slate-900">{{ formatCurrency(totalExpensesView) }}</span>
        </div>
      </div>
    </div>

    <!-- Charts Section - Desktop -->
    <div class="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <template v-if="isLoading">
        <SkeletonChart v-for="i in 3" :key="`skeleton-chart-desktop-${i}`" />
      </template>
      <template v-else>
        <!-- Doughnut: Gastos por Categoría -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Gastos por Categoría</h3>
            <p class="card-subtitle">Distribución de gastos</p>
          </div>
          <div class="h-72 flex items-center justify-center">
            <Doughnut
              v-if="chartData.categories.labels.length > 0"
              :data="chartData.categories"
              :options="doughnutOptions"
              :plugins="[centerTextPlugin]"
            />
            <p v-else class="text-slate-400 text-sm">No hay datos para mostrar</p>
          </div>
        </div>
        <!-- Bar: Gastos por Cuenta -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Gastos por Cuenta</h3>
            <p class="card-subtitle">Distribución por tarjeta/cuenta</p>
          </div>
          <div class="h-72">
            <Bar
              v-if="chartData.cards.labels.length > 0"
              :data="chartData.cards"
              :options="barChartOptions"
            />
            <div v-else class="h-full flex items-center justify-center">
              <p class="text-slate-400 text-sm">No hay datos para mostrar</p>
            </div>
          </div>
        </div>
        <!-- Bar: Ingresos vs Gastos -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Ingresos vs Gastos</h3>
            <p class="card-subtitle">{{ isAnnual ? 'Evolución mensual del año' : 'Últimos 6 meses' }}</p>
          </div>
          <div class="h-72">
            <Bar
              v-if="evolutionChartData.labels.length > 0"
              :data="evolutionChartData"
              :options="evolutionChartOptions"
            />
            <div v-else class="h-full flex items-center justify-center">
              <p class="text-slate-400 text-sm">No hay datos para mostrar</p>
            </div>
          </div>
        </div>
        <!-- Bar Horizontal: Top 5 Gastos -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Top 5 Gastos</h3>
            <p class="card-subtitle">{{ isAnnual ? 'Mayores gastos del año' : 'Mayores gastos del mes' }}</p>
          </div>
          <div class="h-72">
            <Bar
              v-if="topExpensesChartData.labels.length > 0"
              :data="topExpensesChartData"
              :options="topExpensesChartOptions"
            />
            <div v-else class="h-full flex items-center justify-center">
              <p class="text-slate-400 text-sm">No hay datos para mostrar</p>
            </div>
          </div>
        </div>
        <!-- Doughnut: Tipo de Pago -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Por Tipo de Pago</h3>
            <p class="card-subtitle">Débito, crédito y transferencias</p>
          </div>
          <div class="h-72 flex items-center justify-center">
            <Doughnut
              v-if="paymentTypeChartData.labels.length > 0"
              :data="paymentTypeChartData"
              :options="paymentTypeDoughnutOptions"
              :plugins="[centerTextPlugin]"
            />
            <p v-else class="text-slate-400 text-sm">No hay datos para mostrar</p>
          </div>
        </div>
      </template>
    </div>

    <!-- Charts Section - Mobile Carousel -->
    <div class="block lg:hidden">
      <div class="relative">
        <SkeletonChart v-if="isLoading" />
        <div v-else class="overflow-hidden">
          <div
            class="flex transition-transform duration-300 ease-in-out"
            :style="{ transform: `translateX(-${currentChartIndex * 100}%)` }"
            @touchstart="handleTouchStart"
            @touchend="handleTouchEnd"
          >
            <!-- Doughnut: Categorías -->
            <div class="w-full flex-shrink-0 px-0.5">
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">Gastos por Categoría</h3>
                  <p class="card-subtitle">Distribución de gastos</p>
                </div>
                <div class="h-64 flex items-center justify-center">
                  <Doughnut
                    v-if="chartData.categories.labels.length > 0"
                    :data="chartData.categories"
                    :options="doughnutOptions"
                    :plugins="[centerTextPlugin]"
                  />
                  <p v-else class="text-slate-400 text-sm">No hay datos para mostrar</p>
                </div>
              </div>
            </div>
            <!-- Bar: Cuentas -->
            <div class="w-full flex-shrink-0 px-0.5">
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">Gastos por Cuenta</h3>
                  <p class="card-subtitle">Distribución por tarjeta/cuenta</p>
                </div>
                <div class="h-64">
                  <Bar
                    v-if="chartData.cards.labels.length > 0"
                    :data="chartData.cards"
                    :options="barChartOptions"
                  />
                  <div v-else class="h-full flex items-center justify-center">
                    <p class="text-slate-400 text-sm">No hay datos para mostrar</p>
                  </div>
                </div>
              </div>
            </div>
            <!-- Bar: Evolución -->
            <div class="w-full flex-shrink-0 px-0.5">
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">Ingresos vs Gastos</h3>
                  <p class="card-subtitle">{{ isAnnual ? 'Evolución anual' : 'Últimos 6 meses' }}</p>
                </div>
                <div class="h-64">
                  <Bar
                    v-if="evolutionChartData.labels.length > 0"
                    :data="evolutionChartData"
                    :options="evolutionChartOptions"
                  />
                  <div v-else class="h-full flex items-center justify-center">
                    <p class="text-slate-400 text-sm">No hay datos para mostrar</p>
                  </div>
                </div>
              </div>
            </div>
            <!-- Bar Horizontal: Top 5 -->
            <div class="w-full flex-shrink-0 px-0.5">
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">Top 5 Gastos</h3>
                  <p class="card-subtitle">{{ isAnnual ? 'Mayores del año' : 'Mayores del mes' }}</p>
                </div>
                <div class="h-64">
                  <Bar
                    v-if="topExpensesChartData.labels.length > 0"
                    :data="topExpensesChartData"
                    :options="topExpensesChartOptions"
                  />
                  <div v-else class="h-full flex items-center justify-center">
                    <p class="text-slate-400 text-sm">No hay datos para mostrar</p>
                  </div>
                </div>
              </div>
            </div>
            <!-- Doughnut: Tipo de Pago -->
            <div class="w-full flex-shrink-0 px-0.5">
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">Por Tipo de Pago</h3>
                  <p class="card-subtitle">Débito, crédito y transferencias</p>
                </div>
                <div class="h-64 flex items-center justify-center">
                  <Doughnut
                    v-if="paymentTypeChartData.labels.length > 0"
                    :data="paymentTypeChartData"
                    :options="paymentTypeDoughnutOptions"
                    :plugins="[centerTextPlugin]"
                  />
                  <p v-else class="text-slate-400 text-sm">No hay datos para mostrar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Carousel Dots -->
        <div v-if="!isLoading" class="flex justify-center mt-4 space-x-2">
          <button
            v-for="(_, index) in availableCharts"
            :key="index"
            @click="currentChartIndex = index"
            :class="[
              'w-2.5 h-2.5 rounded-full transition-all duration-200',
              currentChartIndex === index ? 'bg-primary-600 scale-110' : 'bg-slate-300 hover:bg-slate-400'
            ]"
            :aria-label="`Ir al gráfico ${index + 1}`"
          ></button>
        </div>
        <!-- Carousel Nav Buttons -->
        <button
          v-if="!isLoading && currentChartIndex > 0"
          @click="currentChartIndex--"
          class="absolute left-1 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur rounded-full p-2 shadow-soft border border-slate-100"
          aria-label="Gráfico anterior"
        >
          <ChevronLeft class="w-4 h-4 text-slate-600" />
        </button>
        <button
          v-if="!isLoading && currentChartIndex < availableCharts.length - 1"
          @click="currentChartIndex++"
          class="absolute right-1 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur rounded-full p-2 shadow-soft border border-slate-100"
          aria-label="Gráfico siguiente"
        >
          <ChevronRight class="w-4 h-4 text-slate-600" />
        </button>
      </div>
    </div>

    <!-- Upcoming Payments - Desktop Table -->
    <div v-if="isLoading" class="hidden lg:block">
      <SkeletonTable :columns="6" :rows="5" />
    </div>
    <div v-else-if="upcomingInstallmentsList.length > 0" class="hidden lg:block card">
      <div class="card-header">
        <h3 class="card-title">Próximos Vencimientos</h3>
        <p class="card-subtitle">Pagos próximos a vencer</p>
      </div>
      <div class="overflow-x-auto -mx-6">
        <table class="min-w-full">
          <thead>
            <tr class="bg-slate-50/80">
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarjeta</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vencimiento</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr
              v-for="(inst, idx) in paginatedUpcomingInstallments"
              :key="inst.id"
              :class="idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'"
              class="hover:bg-primary-50/30 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                {{ inst.expenses?.description || 'Cuota' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {{ inst.expenses?.available_cards?.name || 'Sin tarjeta' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  :style="{
                    backgroundColor: (inst.expenses?.categories?.color || '#6366F1') + '15',
                    color: inst.expenses?.categories?.color || '#6366F1'
                  }"
                >
                  {{ inst.expenses?.categories?.name || 'Sin categoría' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                {{ formatCurrency(inst.amount) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {{ formatDate(inst.due_date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="inst.payment_status_id === 3 ? 'badge-danger' : 'badge-warning'">
                  {{ inst.payment_status_id === 3 ? 'En deuda' : 'Pendiente' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div v-if="totalVencimientosPages > 1" class="flex items-center justify-center gap-2 pt-4 border-t border-slate-100 mt-4">
        <button
          @click="setVencimientosPage(vencimientosPage - 1)"
          :disabled="vencimientosPage === 1"
          class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <span class="text-sm text-slate-600 px-3">
          Página {{ vencimientosPage }} de {{ totalVencimientosPages }}
        </span>
        <button
          @click="setVencimientosPage(vencimientosPage + 1)"
          :disabled="vencimientosPage === totalVencimientosPages"
          class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Upcoming Payments - Mobile Cards -->
    <div v-if="isLoading" class="block lg:hidden">
      <SkeletonList :count="5" />
    </div>
    <div v-else-if="upcomingInstallmentsList.length > 0" class="block lg:hidden">
      <div class="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100">
          <h3 class="text-lg font-bold text-slate-900">Próximos Vencimientos</h3>
          <p class="text-sm text-slate-500 mt-0.5">Pagos próximos a vencer</p>
        </div>
        <div class="divide-y divide-slate-50">
          <div v-for="inst in paginatedUpcomingInstallments" :key="inst.id" class="p-4">
            <div class="flex items-center justify-between mb-2">
              <span :class="inst.payment_status_id === 3 ? 'badge-danger' : 'badge-warning'">
                {{ inst.payment_status_id === 3 ? 'En deuda' : 'Pendiente' }}
              </span>
              <span class="text-xs text-slate-400 font-medium">{{ formatDate(inst.due_date) }}</span>
            </div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-slate-900 text-sm truncate mr-2">
                {{ inst.expenses?.description || 'Cuota' }}
              </h4>
              <span class="text-lg font-bold text-slate-900 flex-shrink-0">{{ formatCurrency(inst.amount) }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-500">
              <span>{{ inst.expenses?.available_cards?.name || 'Sin cuenta' }}</span>
              <span class="text-slate-300">•</span>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                :style="{
                  backgroundColor: (inst.expenses?.categories?.color || '#6366F1') + '15',
                  color: inst.expenses?.categories?.color || '#6366F1'
                }"
              >
                {{ inst.expenses?.categories?.name || 'Sin categoría' }}
              </span>
            </div>
          </div>
        </div>
        <!-- Mobile Pagination -->
        <div v-if="totalVencimientosPages > 1" class="px-5 py-3 border-t border-slate-100">
          <div class="flex items-center justify-between">
            <button
              @click="setVencimientosPage(vencimientosPage - 1)"
              :disabled="vencimientosPage === 1"
              class="flex items-center gap-1 text-sm text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft class="w-4 h-4" />
              <span>Anterior</span>
            </button>
            <span class="text-sm text-slate-500">{{ vencimientosPage }} de {{ totalVencimientosPages }}</span>
            <button
              @click="setVencimientosPage(vencimientosPage + 1)"
              :disabled="vencimientosPage === totalVencimientosPages"
              class="flex items-center gap-1 text-sm text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Siguiente</span>
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useExpensesStore } from '@/stores/expenses'
import { useIncomesStore } from '@/stores/incomes'
import { useCardsStore } from '@/stores/cards'
import { useCategoriesStore } from '@/stores/categories'
import { Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Plus,
  Wallet,
  Receipt,
  PiggyBank,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  HelpCircle
} from 'lucide-vue-next'
import SkeletonCard from '@/components/SkeletonCard.vue'
import SkeletonSummary from '@/components/SkeletonSummary.vue'
import SkeletonChart from '@/components/SkeletonChart.vue'
import SkeletonTable from '@/components/SkeletonTable.vue'
import SkeletonList from '@/components/SkeletonList.vue'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
  CategoryScale,
  LinearScale,
  BarElement
)

const expensesStore = useExpensesStore()
const incomesStore = useIncomesStore()
const cardsStore = useCardsStore()
const categoriesStore = useCategoriesStore()

const isAnnual = ref(false)
const showAllCards = ref(false)
const showSavingsHelp = ref(false)
const savingsHelpRef = ref(null)
const isLoading = ref(true)

const currentChartIndex = ref(0)
const touchStartX = ref(0)

const currentMonth = new Date().getMonth() + 1
const currentYear = new Date().getFullYear()

// --- Utility ---
const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)

const formatDate = (date) =>
  format(parseISO(date), 'dd/MM/yyyy', { locale: es })

// --- Center text plugin for Doughnut ---
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, chartArea } = chart
    if (!chartArea) return
    const dataset = chart.data.datasets[0]
    if (!dataset || !dataset.data || dataset.data.length === 0) return
    const total = dataset.data.reduce((sum, val) => sum + val, 0)
    const formatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(total)
    const centerX = (chartArea.left + chartArea.right) / 2
    const centerY = (chartArea.top + chartArea.bottom) / 2
    const innerRadius = chart._metasets?.[0]?.data?.[0]?.innerRadius || 0
    const maxWidth = innerRadius * 1.6
    let fontSize = 16
    ctx.save()
    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`
    while (ctx.measureText(formatted).width > maxWidth && fontSize > 9) {
      fontSize--
      ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`
    }
    ctx.fillStyle = '#1e293b'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(formatted, centerX, centerY)
    ctx.restore()
  }
}

// --- Credit Cards ---
const displayedCreditCards = computed(() => {
  const cards = expensesStore.creditCardsSummary || []
  return showAllCards.value ? cards : cards.slice(0, 4)
})

// --- Carousel ---
const availableCharts = computed(() => {
  return [
    { name: 'Categorías' },
    { name: 'Cuentas' },
    { name: 'Evolución' },
    { name: 'Top Gastos' },
    { name: 'Tipo de Pago' }
  ]
})

const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
}

const handleTouchEnd = (e) => {
  const diff = touchStartX.value - e.changedTouches[0].clientX
  if (Math.abs(diff) > 50) {
    if (diff > 0 && currentChartIndex.value < availableCharts.value.length - 1) {
      currentChartIndex.value++
    } else if (diff < 0 && currentChartIndex.value > 0) {
      currentChartIndex.value--
    }
  }
}

// --- Upcoming Installments ---
const upcomingInstallmentsList = computed(() => {
  const today = new Date()
  return expensesStore.upcomingInstallments.filter(inst => {
    const due = parseISO(inst.due_date)
    return due >= today && (inst.payment_status_id === 1 || inst.payment_status_id === 3)
  })
})

const vencimientosPage = ref(1)
const vencimientosPerPage = 5
const paginatedUpcomingInstallments = computed(() => {
  const start = (vencimientosPage.value - 1) * vencimientosPerPage
  return upcomingInstallmentsList.value.slice(start, start + vencimientosPerPage)
})
const totalVencimientosPages = computed(() =>
  Math.ceil(upcomingInstallmentsList.value.length / vencimientosPerPage)
)
function setVencimientosPage(page) {
  vencimientosPage.value = page
}

// --- Expenses total ---
const totalExpensesView = computed(() => {
  const now = new Date()
  const cm = now.getMonth() + 1
  const cy = now.getFullYear()

  if (isAnnual.value) {
    return expensesStore.expenses
      .filter(e => parseISO(e.purchase_date).getFullYear() === cy)
      .reduce((sum, e) => sum + e.amount, 0)
  }

  const monthlyDirect = expensesStore.expenses
    .filter(e => {
      const d = parseISO(e.purchase_date)
      return d.getMonth() + 1 === cm && d.getFullYear() === cy
    })
    .reduce((sum, e) => sum + e.amount, 0)

  const monthlyInst = expensesStore.upcomingInstallments
    .filter(inst => {
      const due = parseISO(inst.due_date)
      return due.getMonth() + 1 === cm && due.getFullYear() === cy
    })
    .reduce((sum, inst) => sum + inst.amount, 0)

  return monthlyDirect + monthlyInst
})

// --- Income total ---
const totalIncomeView = computed(() =>
  incomesStore.incomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0)
)

// --- Balance & Savings ---
const balanceView = computed(() => totalIncomeView.value - totalExpensesView.value)

const savingsPercentage = computed(() => {
  if (totalIncomeView.value <= 0) return 0
  return (balanceView.value / totalIncomeView.value) * 100
})

// --- Chart Data: Categories & Cards ---
const chartColors = [
  '#6366F1', '#10B981', '#F59E0B', '#F43F5E',
  '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
  '#EC4899', '#14B8A6', '#EAB308', '#3B82F6'
]

const chartData = computed(() => {
  let categories = {}
  let cards = {}
  const cm = currentMonth
  const cy = currentYear

  const addInstallments = (monthFilter) => {
    expensesStore.upcomingInstallments.forEach(inst => {
      const due = parseISO(inst.due_date)
      const match = monthFilter
        ? due.getMonth() + 1 === cm && due.getFullYear() === cy
        : due.getFullYear() === cy
      if (!match || inst.payment_status_id === 3) return

      if (inst.expenses?.categories) {
        const cat = inst.expenses.categories.name || 'Sin categoría'
        categories[cat] = (categories[cat] || 0) + inst.amount
      }
      if (inst.expenses?.available_cards) {
        const card = inst.expenses.available_cards.name || 'Sin cuenta'
        cards[card] = (cards[card] || 0) + inst.amount
      }
    })
  }

  const addDirectExpenses = (monthFilter) => {
    expensesStore.expenses.forEach(expense => {
      const d = parseISO(expense.purchase_date)
      const match = monthFilter
        ? d.getMonth() + 1 === cm && d.getFullYear() === cy
        : d.getFullYear() === cy
      if (!match || (expense.installments_count && expense.installments_count > 1)) return

      const cat = expense.categories?.name || 'Sin categoría'
      categories[cat] = (categories[cat] || 0) + expense.amount
      if (expense.available_cards) {
        const card = expense.available_cards.name || 'Sin cuenta'
        cards[card] = (cards[card] || 0) + expense.amount
      }
    })
  }

  if (isAnnual.value) {
    addInstallments(false)
    addDirectExpenses(false)
  } else {
    addInstallments(true)
    addDirectExpenses(true)
  }

  categories = Object.fromEntries(Object.entries(categories).filter(([, v]) => v > 0))
  cards = Object.fromEntries(Object.entries(cards).filter(([, v]) => v > 0))

  const catLabels = Object.keys(categories)
  const cardLabels = Object.keys(cards)

  return {
    categories: {
      labels: catLabels,
      datasets: [{
        data: Object.values(categories),
        backgroundColor: catLabels.map((_, i) => chartColors[i % chartColors.length]),
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    cards: {
      labels: cardLabels,
      datasets: [{
        label: 'Gastos',
        data: Object.values(cards),
        backgroundColor: cardLabels.map((_, i) => chartColors[i % chartColors.length]),
        borderRadius: 8,
        borderSkipped: false
      }]
    }
  }
})

// --- Evolution Chart (income vs expenses per month) ---
const monthLabelsShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const evolutionChartData = computed(() => {
  const cy = currentYear
  const cm = currentMonth

  const getExpenseForMonth = (m, y) => {
    const inst = expensesStore.upcomingInstallments
      .filter(i => {
        const due = parseISO(i.due_date)
        return due.getMonth() + 1 === m && due.getFullYear() === y && i.payment_status_id !== 3
      })
      .reduce((sum, i) => sum + i.amount, 0)

    const direct = expensesStore.expenses
      .filter(e => {
        const d = parseISO(e.purchase_date)
        return d.getMonth() + 1 === m && d.getFullYear() === y && (!e.installments_count || e.installments_count === 1)
      })
      .reduce((sum, e) => sum + e.amount, 0)

    return inst + direct
  }

  const getIncomeForMonth = (m, y) => {
    return incomesStore.incomes
      .filter(inc => {
        const d = parseISO(inc.income_date || inc.date || inc.created_at)
        return d.getMonth() + 1 === m && d.getFullYear() === y
      })
      .reduce((sum, inc) => sum + parseFloat(inc.amount), 0)
  }

  if (isAnnual.value) {
    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    return {
      labels: monthLabelsShort,
      datasets: [
        {
          label: 'Ingresos',
          data: months.map(m => getIncomeForMonth(m, cy)),
          backgroundColor: '#10B981',
          borderRadius: 8,
          borderSkipped: false
        },
        {
          label: 'Gastos',
          data: months.map(m => getExpenseForMonth(m, cy)),
          backgroundColor: '#F43F5E',
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    }
  }

  const periods = []
  for (let i = 5; i >= 0; i--) {
    let m = cm - i
    let y = cy
    if (m <= 0) { m += 12; y-- }
    periods.push({ m, y })
  }

  return {
    labels: periods.map(p => monthLabelsShort[p.m - 1]),
    datasets: [
      {
        label: 'Ingresos',
        data: periods.map(p => getIncomeForMonth(p.m, p.y)),
        backgroundColor: '#10B981',
        borderRadius: 8,
        borderSkipped: false
      },
      {
        label: 'Gastos',
        data: periods.map(p => getExpenseForMonth(p.m, p.y)),
        backgroundColor: '#F43F5E',
        borderRadius: 8,
        borderSkipped: false
      }
    ]
  }
})

// --- Top 5 Expenses Chart ---
const topExpensesChartData = computed(() => {
  const cm = currentMonth
  const cy = currentYear

  let allItems = []

  expensesStore.expenses.forEach(e => {
    const d = parseISO(e.purchase_date)
    const match = isAnnual.value
      ? d.getFullYear() === cy
      : d.getMonth() + 1 === cm && d.getFullYear() === cy
    if (!match || (e.installments_count && e.installments_count > 1)) return
    allItems.push({ description: e.description || 'Sin descripción', amount: e.amount })
  })

  expensesStore.upcomingInstallments.forEach(inst => {
    const due = parseISO(inst.due_date)
    const match = isAnnual.value
      ? due.getFullYear() === cy
      : due.getMonth() + 1 === cm && due.getFullYear() === cy
    if (!match || inst.payment_status_id === 3) return
    allItems.push({
      description: (inst.expenses?.description || 'Cuota') + ` (${inst.installment_number}/${inst.expenses?.installments_count || '?'})`,
      amount: inst.amount
    })
  })

  allItems.sort((a, b) => b.amount - a.amount)
  const top5 = allItems.slice(0, 5)

  return {
    labels: top5.map(i => i.description.length > 25 ? i.description.slice(0, 22) + '...' : i.description),
    datasets: [{
      label: 'Monto',
      data: top5.map(i => i.amount),
      backgroundColor: ['#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'],
      borderRadius: 8,
      borderSkipped: false
    }]
  }
})

// --- Payment Type Distribution (Débito vs Crédito vs Transferencia) ---
const paymentTypeChartData = computed(() => {
  const cm = currentMonth
  const cy = currentYear
  const typeMap = {}

  expensesStore.expenses.forEach(e => {
    const d = parseISO(e.purchase_date)
    const match = isAnnual.value
      ? d.getFullYear() === cy
      : d.getMonth() + 1 === cm && d.getFullYear() === cy
    if (!match || (e.installments_count && e.installments_count > 1)) return
    const type = e.available_cards?.type || 'Otro'
    typeMap[type] = (typeMap[type] || 0) + e.amount
  })

  expensesStore.upcomingInstallments.forEach(inst => {
    const due = parseISO(inst.due_date)
    const match = isAnnual.value
      ? due.getFullYear() === cy
      : due.getMonth() + 1 === cm && due.getFullYear() === cy
    if (!match || inst.payment_status_id === 3) return
    const type = inst.expenses?.available_cards?.type || 'Otro'
    typeMap[type] = (typeMap[type] || 0) + inst.amount
  })

  const typeColors = {
    'Crédito': '#8B5CF6',
    'Débito': '#3B82F6',
    'Transferencia': '#10B981',
    'Efectivo': '#F59E0B',
    'Otro': '#94A3B8'
  }

  const labels = Object.keys(typeMap).filter(k => typeMap[k] > 0)
  return {
    labels,
    datasets: [{
      data: labels.map(l => typeMap[l]),
      backgroundColor: labels.map(l => typeColors[l] || '#94A3B8'),
      borderWidth: 0,
      hoverOffset: 6
    }]
  }
})

// --- Chart Options ---
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } } },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 13, weight: '600' },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ctx.parsed)}`
      }
    }
  }
}

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 13, weight: '600' },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        label: (ctx) => ` ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ctx.parsed.y)}`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { font: { size: 11 }, callback: (v) => '$' + (v / 1000).toFixed(0) + 'k' }
    },
    x: { grid: { display: false }, ticks: { font: { size: 11 } } }
  }
}

const evolutionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } } },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 13, weight: '600' },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ctx.parsed.y)}`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { font: { size: 11 }, callback: (v) => '$' + (v / 1000).toFixed(0) + 'k' }
    },
    x: { grid: { display: false }, ticks: { font: { size: 11 } } }
  }
}

const topExpensesChartOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 13, weight: '600' },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        label: (ctx) => ` ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ctx.parsed.x)}`
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { font: { size: 11 }, callback: (v) => '$' + (v / 1000).toFixed(0) + 'k' }
    },
    y: {
      grid: { display: false },
      ticks: { font: { size: 11 }, autoSkip: false }
    }
  }
}

const paymentTypeDoughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } } },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 13, weight: '600' },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        label: (ctx) => {
          const total = ctx.dataset.data.reduce((s, v) => s + v, 0)
          const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0
          return ` ${ctx.label}: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ctx.parsed)} (${pct}%)`
        }
      }
    }
  }
}

// --- Data Loading ---
let _mounted = true

onMounted(async () => {
  isLoading.value = true
  expensesStore.clearFilters()

  const safetyTimer = setTimeout(() => {
    if (_mounted) isLoading.value = false
  }, 12000)

  try {
    await Promise.all([
      expensesStore.loadExpenses(),
      expensesStore.loadUpcomingInstallments(1000),
      expensesStore.loadCreditCardsSummary(isAnnual.value),
      expensesStore.loadExpensesSummaryByType(isAnnual.value),
      incomesStore.loadIncomes({ month: currentMonth, year: currentYear }),
      cardsStore.loadCards(),
      categoriesStore.loadCategories()
    ])
  } catch (err) {
    console.error('Error cargando dashboard:', err)
  } finally {
    clearTimeout(safetyTimer)
    if (_mounted) isLoading.value = false
  }
})

const closeSavingsHelpOnClickOutside = (e) => {
  if (savingsHelpRef.value && !savingsHelpRef.value.contains(e.target)) {
    showSavingsHelp.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeSavingsHelpOnClickOutside)
})

onUnmounted(() => {
  _mounted = false
  document.removeEventListener('click', closeSavingsHelpOnClickOutside)
})

watch(isAnnual, async (annual) => {
  if (!_mounted) return
  currentChartIndex.value = 0
  isLoading.value = true
  try {
    const incomeFilters = annual
      ? { year: currentYear }
      : { month: currentMonth, year: currentYear }
    await Promise.all([
      expensesStore.loadCreditCardsSummary(annual),
      expensesStore.loadExpensesSummaryByType(annual),
      incomesStore.loadIncomes(incomeFilters)
    ])
  } catch (err) {
    console.error('Error toggling annual view:', err)
  } finally {
    if (_mounted) isLoading.value = false
  }
})
</script>
