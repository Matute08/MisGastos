<template>
  <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900/95 to-purple-950/80 backdrop-blur-2xl p-6 sm:p-8 border border-white/20 dark:border-white/15 shadow-2xl glow-border-indigo transition-all duration-300">
    <!-- Top edge light shine for glass reflection -->
    <div class="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
    
    <!-- Ambient interior glow orbs -->
    <div class="absolute -top-20 -left-20 w-72 h-72 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

    <div class="relative z-10">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <p class="text-indigo-200 text-xs font-semibold tracking-wider uppercase">Dinero Disponible</p>
          </div>
          <template v-if="isLoading">
            <div class="skeleton h-10 w-56 !bg-white/10 !from-white/5 !via-white/15 !to-white/5 mb-1"></div>
          </template>
          <h1 v-else class="text-3xl sm:text-5xl font-black text-white tracking-tight tabular-nums drop-shadow-sm">
            {{ formatCurrency(balanceView) }}
          </h1>
          <ComparisonBadge
            v-if="!isLoading"
            :current-value="balanceView"
            :previous-value="previousPeriodBalance"
            class="text-white/80 mt-1.5"
          />
          <p v-if="!isAnnual" class="text-indigo-100/90 text-xs mt-1.5">
            Ahorro en USD: <span class="font-bold text-white">{{ formatUsd(savedUsdView) }}</span>
            · aprox {{ formatCurrency(savedArsView) }}
          </p>
          <router-link
            v-if="!isLoading"
            :to="{ name: 'activity' }"
            class="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white border border-white/20 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <Receipt class="h-4 w-4 text-indigo-300" />
            Consultar actividad
          </router-link>
        </div>

        <!-- Pill Toggle Mensual/Anual -->
        <div class="flex items-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-1.5 self-start sm:self-auto shadow-inner">
          <button
            @click="$emit('update:isAnnual', false)"
            :class="[
              'px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200',
              !isAnnual
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md'
                : 'text-indigo-200/70 hover:text-white'
            ]"
          >
            <Calendar class="inline-block w-3.5 h-3.5 mr-1 -mt-0.5" />
            Mensual
          </button>
          <button
            @click="$emit('update:isAnnual', true)"
            :class="[
              'px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200',
              isAnnual
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md'
                : 'text-indigo-200/70 hover:text-white'
            ]"
          >
            <TrendingUp class="inline-block w-3.5 h-3.5 mr-1 -mt-0.5" />
            Anual
          </button>
        </div>
      </div>

      <!-- Inline Stats (Ingresos & Gastos) perfectly aligned in grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 border-t border-white/10">
        <div class="flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 transition-colors">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ArrowUpRight class="w-5 h-5 text-emerald-300" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">Ingresos</p>
            <template v-if="isLoading">
              <div class="skeleton h-5 w-24 !bg-white/10 !from-white/5 !via-white/15 !to-white/5 mt-0.5"></div>
            </template>
            <p v-else class="break-words text-sm sm:text-base font-extrabold leading-tight tabular-nums text-emerald-300 mt-0.5">
              {{ formatCurrency(totalIncomeView) }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 transition-colors">
          <div class="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
            <ArrowDownRight class="w-5 h-5 text-rose-300" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">Gastos</p>
            <template v-if="isLoading">
              <div class="skeleton h-5 w-24 !bg-white/10 !from-white/5 !via-white/15 !to-white/5 mt-0.5"></div>
            </template>
            <p v-else class="break-words text-sm sm:text-base font-extrabold leading-tight tabular-nums text-rose-300 mt-0.5">
              {{ formatCurrency(totalExpensesView) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { Receipt, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-vue-next';
import ComparisonBadge from '@/components/ui/ComparisonBadge.vue';

defineProps({
  isLoading: { type: Boolean, default: false },
  isAnnual: { type: Boolean, default: false },
  balanceView: { type: Number, default: 0 },
  previousPeriodBalance: { type: Number, default: 0 },
  savedUsdView: { type: Number, default: 0 },
  savedArsView: { type: Number, default: 0 },
  totalIncomeView: { type: Number, default: 0 },
  totalExpensesView: { type: Number, default: 0 },
  formatCurrency: { type: Function, required: true },
  formatUsd: { type: Function, required: true }
});

defineEmits(['update:isAnnual']);
</script>