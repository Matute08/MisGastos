<template>
  <div class="space-y-4">
    <div class="text-center mb-2">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-gray-200">
        {{ monthYearTitle }}
      </h2>
    </div>

    <!-- Resumen - Desktop -->
    <SkeletonExpenseSummary v-if="isLoading" />
    <template v-else>
      <div class="hidden lg:flex rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 p-6 items-center justify-between shadow-soft dark:shadow-2xl transition-all">
        <button
          @click="$emit('previousMonth')"
          class="p-2.5 rounded-2xl text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all flex items-center justify-center active:scale-95"
          aria-label="Mes anterior"
        >
          <ChevronLeft class="h-5 w-5" />
        </button>
        <div class="flex-1 px-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-white/10">
            <div class="text-center px-4">
              <span class="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Total Débito / Transf.</span>
              <p class="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-gray-100 mt-1">
                {{ formatCurrency(totalDebitTransferExpenses) }}
              </p>
            </div>
            <div class="text-center px-4">
              <span class="text-[11px] font-bold text-purple-500 dark:text-purple-400 uppercase tracking-wider">Total Crédito</span>
              <p class="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-gray-100 mt-1">
                {{ formatCurrency(totalCreditExpenses) }}
              </p>
            </div>
            <div class="text-center px-4">
              <span class="text-[11px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">Gastos Totales</span>
              <p class="text-2xl sm:text-3xl font-black tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                {{ formatCurrency(totalExpenses) }}
              </p>
            </div>
          </div>
        </div>
        <button
          @click="$emit('nextMonth')"
          class="p-2.5 rounded-2xl text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all flex items-center justify-center active:scale-95"
          aria-label="Mes siguiente"
        >
          <ChevronRight class="h-5 w-5" />
        </button>
      </div>

      <!-- Resumen - Mobile y Tablet -->
      <div class="block lg:hidden card !p-4">
        <div class="flex items-center justify-between mb-3">
          <button
            @click="$emit('previousMonth')"
            class="btn-ghost p-2 rounded-xl flex items-center justify-center"
            aria-label="Mes anterior"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <button
            @click="$emit('nextMonth')"
            class="btn-ghost p-2 rounded-xl flex items-center justify-center"
            aria-label="Mes siguiente"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
        <div class="space-y-2.5">
          <div class="flex items-center justify-between py-1.5 border-l-4 border-primary-500 pl-3 rounded-r-lg bg-primary-50/30 dark:bg-primary-900/20">
            <span class="text-xs text-slate-600 dark:text-gray-400 font-medium">Débito</span>
            <span class="text-sm font-bold text-primary-600 dark:text-primary-400 tabular-nums">{{ formatCurrency(totalDebitTransferExpenses) }}</span>
          </div>
          <div class="flex items-center justify-between py-1.5 border-l-4 border-violet-500 pl-3 rounded-r-lg bg-violet-50/30 dark:bg-violet-900/20">
            <span class="text-xs text-slate-600 dark:text-gray-400 font-medium">Crédito</span>
            <span class="text-sm font-bold text-violet-600 dark:text-violet-400 tabular-nums">{{ formatCurrency(totalCreditExpenses) }}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-l-4 border-success-500 pl-3 rounded-r-lg bg-success-50/40 dark:bg-success-900/20 mt-1">
            <span class="text-xs text-slate-700 dark:text-gray-300 font-semibold">Total</span>
            <span class="text-base font-bold text-success-600 dark:text-success-400 tabular-nums">{{ formatCurrency(totalExpenses) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import SkeletonExpenseSummary from '@/components/skeletons/SkeletonExpenseSummary.vue';

defineProps({
  isLoading: { type: Boolean, default: false },
  monthYearTitle: { type: String, default: '' },
  totalDebitTransferExpenses: { type: Number, default: 0 },
  totalCreditExpenses: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  formatCurrency: { type: Function, required: true }
});

defineEmits(['previousMonth', 'nextMonth']);
</script>