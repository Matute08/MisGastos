<template>
  <div class="space-y-6">
    <!-- Charts Section - Desktop -->
    <div class="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <template v-if="isLoading">
        <SkeletonChart v-for="i in 3" :key="`skeleton-chart-desktop-${i}`" />
      </template>
      <template v-else>
        <!-- Doughnut: Gastos por Categoría -->
        <div class="card animate-fade-in" style="animation-delay: 0.1s; animation-fill-mode: backwards;">
          <div class="card-header">
            <div class="flex items-center justify-between w-full">
              <div>
                <h3 class="card-title">Gastos por Categoría</h3>
                <p class="card-subtitle">Distribución de gastos</p>
              </div>
              <ExportButton
                :data="categoryChartExport.data"
                filename="gastos-por-categoria.csv"
                :columns="categoryChartExport.columns"
                label="Exportar CSV"
              />
            </div>
          </div>
          <div class="h-72 flex items-center justify-center">
            <Doughnut
              v-if="chartData.categories.labels.length > 0"
              :data="chartData.categories"
              :options="doughnutOptions"
              :plugins="[centerTextPlugin]"
            />
            <p v-else class="text-slate-400 dark:text-gray-500 text-sm">No hay datos para mostrar</p>
          </div>
        </div>

        <!-- Bar: Gastos por Cuenta -->
        <div class="card animate-fade-in" style="animation-delay: 0.2s; animation-fill-mode: backwards;">
          <div class="card-header">
            <div class="flex items-center justify-between w-full">
              <div>
                <h3 class="card-title">Gastos por Cuenta</h3>
                <p class="card-subtitle">Distribución por tarjeta/cuenta</p>
              </div>
              <ExportButton
                :data="cardsChartExport.data"
                filename="gastos-por-cuenta.csv"
                :columns="cardsChartExport.columns"
                label="Exportar CSV"
              />
            </div>
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
        <div class="card animate-fade-in" style="animation-delay: 0.3s; animation-fill-mode: backwards;">
          <div class="card-header">
            <div class="flex items-center justify-between w-full">
              <div>
                <h3 class="card-title">Ingresos vs Gastos</h3>
                <p class="card-subtitle">{{ isAnnual ? 'Evolución mensual del año' : 'Últimos 6 meses' }}</p>
              </div>
              <ExportButton
                :data="evolutionChartExport.data"
                filename="ingresos-vs-gastos.csv"
                :columns="evolutionChartExport.columns"
                label="Exportar CSV"
              />
            </div>
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
        <div class="card animate-fade-in" style="animation-delay: 0.4s; animation-fill-mode: backwards;">
          <div class="card-header">
            <div class="flex items-center justify-between w-full">
              <div>
                <h3 class="card-title">Top 5 Gastos</h3>
                <p class="card-subtitle">{{ isAnnual ? 'Mayores gastos del año' : 'Mayores gastos del mes' }}</p>
              </div>
              <ExportButton
                :data="topExpensesChartExport.data"
                filename="top-5-gastos.csv"
                :columns="topExpensesChartExport.columns"
                label="Exportar CSV"
              />
            </div>
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
        <div class="card animate-fade-in" style="animation-delay: 0.5s; animation-fill-mode: backwards;">
          <div class="card-header">
            <div class="flex items-center justify-between w-full">
              <div>
                <h3 class="card-title">Por Tipo de Pago</h3>
                <p class="card-subtitle">Débito, crédito y transferencias</p>
              </div>
              <ExportButton
                :data="paymentTypeChartExport.data"
                filename="tipo-de-pago.csv"
                :columns="paymentTypeChartExport.columns"
                label="Exportar CSV"
              />
            </div>
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
              currentChartIndex === index ? 'bg-primary-600 scale-110' : 'bg-slate-300 dark:bg-gray-600 hover:bg-slate-400 dark:hover:bg-gray-500'
            ]"
            :aria-label="`Ir al gráfico ${index + 1}`"
          ></button>
        </div>

        <!-- Carousel Nav Buttons -->
        <button
          v-if="!isLoading && currentChartIndex > 0"
          @click="currentChartIndex--"
          class="absolute left-1 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-full p-2 shadow-soft dark:shadow-none border border-slate-100 dark:border-gray-700"
          aria-label="Gráfico anterior"
        >
          <ChevronLeft class="w-4 h-4 text-slate-600 dark:text-gray-300" />
        </button>
        <button
          v-if="!isLoading && currentChartIndex < availableCharts.length - 1"
          @click="currentChartIndex++"
          class="absolute right-1 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-full p-2 shadow-soft dark:shadow-none border border-slate-100 dark:border-gray-700"
          aria-label="Gráfico siguiente"
        >
          <ChevronRight class="w-4 h-4 text-slate-600 dark:text-gray-300" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Doughnut, Bar } from 'vue-chartjs';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import SkeletonChart from '@/components/skeletons/SkeletonChart.vue';
import ExportButton from '@/components/ui/ExportButton.vue';

defineProps({
  isLoading: { type: Boolean, default: false },
  isAnnual: { type: Boolean, default: false },
  chartData: { type: Object, required: true },
  evolutionChartData: { type: Object, required: true },
  topExpensesChartData: { type: Object, required: true },
  paymentTypeChartData: { type: Object, required: true },
  doughnutOptions: { type: Object, required: true },
  barChartOptions: { type: Object, required: true },
  evolutionChartOptions: { type: Object, required: true },
  topExpensesChartOptions: { type: Object, required: true },
  paymentTypeDoughnutOptions: { type: Object, required: true },
  centerTextPlugin: { type: Object, required: true },
  categoryChartExport: { type: Object, required: true },
  cardsChartExport: { type: Object, required: true },
  evolutionChartExport: { type: Object, required: true },
  topExpensesChartExport: { type: Object, required: true },
  paymentTypeChartExport: { type: Object, required: true }
});

const currentChartIndex = ref(0);
const availableCharts = [1, 2, 3, 4, 5];
let touchStartX = 0;

const handleTouchStart = (e) => {
  touchStartX = e.touches[0].clientX;
};

const handleTouchEnd = (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const diff = touchStartX - touchEndX;
  if (Math.abs(diff) > 50) {
    if (diff > 0 && currentChartIndex.value < availableCharts.length - 1) {
      currentChartIndex.value++;
    } else if (diff < 0 && currentChartIndex.value > 0) {
      currentChartIndex.value--;
    }
  }
};
</script>