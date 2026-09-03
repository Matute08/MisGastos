<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <!-- Ingresos del Mes/Año -->
    <div class="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 p-5 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1 hover:border-emerald-500/40 group animate-fade-in" style="animation-delay: 0.05s; animation-fill-mode: backwards;">
      <div class="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
      
      <div class="flex items-center gap-4 min-w-0 z-10">
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <Wallet class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider truncate">{{ isAnnual ? 'Ingresos del Año' : 'Ingresos del Mes' }}</p>
          <template v-if="isLoading">
            <div class="skeleton h-7 w-28 mt-1"></div>
          </template>
          <p v-else class="break-words text-xl sm:text-2xl font-black leading-tight tabular-nums text-slate-900 dark:text-gray-100 mt-0.5">
            {{ formatCurrency(totalIncomeView) }}
          </p>
          <ComparisonBadge
            v-if="!isLoading"
            :current-value="totalIncomeView"
            :previous-value="previousPeriodIncome"
            class="mt-1"
          />
        </div>
      </div>

      <!-- Sparkline micro trend line in card background -->
      <div class="w-24 shrink-0 hidden sm:block opacity-70 group-hover:opacity-100 transition-opacity">
        <SparklineChart
          :data="[previousPeriodIncome * 0.9 || 10, previousPeriodIncome || 15, (previousPeriodIncome + totalIncomeView) / 2 || 20, totalIncomeView || 25]"
          color="#10B981"
          :height="36"
        />
      </div>
    </div>

    <!-- Gastos del Mes/Año -->
    <div class="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 p-5 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1 hover:border-rose-500/40 group animate-fade-in" style="animation-delay: 0.1s; animation-fill-mode: backwards;">
      <div class="absolute -right-8 -top-8 w-24 h-24 bg-rose-500/10 dark:bg-rose-500/15 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>

      <div class="flex items-center gap-4 min-w-0 z-10">
        <div class="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/50 dark:border-rose-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <Receipt class="w-6 h-6 text-rose-600 dark:text-rose-400" />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider truncate">{{ isAnnual ? 'Gastos del Año' : 'Gastos del Mes' }}</p>
          <template v-if="isLoading">
            <div class="skeleton h-7 w-28 mt-1"></div>
          </template>
          <p v-else class="break-words text-xl sm:text-2xl font-black leading-tight tabular-nums text-slate-900 dark:text-gray-100 mt-0.5">
            {{ formatCurrency(totalExpensesView) }}
          </p>
          <ComparisonBadge
            v-if="!isLoading"
            :current-value="totalExpensesView"
            :previous-value="previousPeriodExpenses"
            :inverse="true"
            class="mt-1"
          />
        </div>
      </div>

      <!-- Sparkline micro trend line in card background -->
      <div class="w-24 shrink-0 hidden sm:block opacity-70 group-hover:opacity-100 transition-opacity">
        <SparklineChart
          :data="[previousPeriodExpenses * 0.85 || 10, previousPeriodExpenses || 18, (previousPeriodExpenses + totalExpensesView) / 2 || 15, totalExpensesView || 22]"
          color="#F43F5E"
          :height="36"
        />
      </div>
    </div>

    <!-- Ahorro -->
    <div ref="savingsHelpRef" class="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 p-5 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1 hover:border-indigo-500/40 group animate-fade-in" style="animation-delay: 0.15s; animation-fill-mode: backwards;">
      <div class="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>

      <div class="flex items-center gap-4 min-w-0 z-10 flex-1">
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <PiggyBank class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider truncate flex items-center gap-1.5">
            Ahorro
            <button
              type="button"
              @click.stop="showSavingsHelp = !showSavingsHelp"
              class="inline-flex items-center justify-center w-4 h-4 rounded-full text-slate-400 dark:text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-200"
              :aria-expanded="showSavingsHelp"
              aria-label="Explicación del porcentaje de ahorro"
            >
              <HelpCircle class="w-4 h-4" />
            </button>
          </p>
          <template v-if="isLoading">
            <div class="skeleton h-7 w-20 mt-1"></div>
          </template>
          <p v-else class="text-xl sm:text-2xl font-black tabular-nums mt-0.5" :class="savingsPercentage >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
            {{ savingsPercentage.toFixed(1) }}%
          </p>
        </div>
      </div>

      <!-- Sparkline micro trend line for savings -->
      <div class="w-24 shrink-0 hidden sm:block opacity-70 group-hover:opacity-100 transition-opacity">
        <SparklineChart
          :data="[20, 28, 35, Math.max(10, Math.min(90, Math.round(savingsPercentage) || 30))]"
          color="#6366F1"
          :height="36"
        />
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
          class="absolute left-0 right-0 top-full mt-2 z-20 p-4 bg-slate-900/95 text-slate-100 text-sm rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-xl"
          role="tooltip"
        >
          <p class="font-semibold text-white mb-1">¿Qué es el % de ahorro?</p>
          <p class="leading-relaxed text-xs text-slate-300">
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
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Wallet, Receipt, PiggyBank, HelpCircle } from 'lucide-vue-next';
import ComparisonBadge from '@/components/ui/ComparisonBadge.vue';
import SparklineChart from '@/components/ui/SparklineChart.vue';

defineProps({
  isLoading: { type: Boolean, default: false },
  isAnnual: { type: Boolean, default: false },
  totalIncomeView: { type: Number, default: 0 },
  previousPeriodIncome: { type: Number, default: 0 },
  totalExpensesView: { type: Number, default: 0 },
  previousPeriodExpenses: { type: Number, default: 0 },
  savingsPercentage: { type: Number, default: 0 },
  formatCurrency: { type: Function, required: true }
});

const showSavingsHelp = ref(false);
const savingsHelpRef = ref(null);

const handleClickOutside = (e) => {
  if (savingsHelpRef.value && !savingsHelpRef.value.contains(e.target)) {
    showSavingsHelp.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>