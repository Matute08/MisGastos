<template>
  <div class="space-y-6">
    <!-- Credit Cards Summary -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <template v-if="isLoading">
        <SkeletonCard v-for="i in 4" :key="`skeleton-card-${i}`" />
      </template>
      <template v-else>
        <FintechCreditCard
          v-for="(card, index) in displayedCreditCards"
          :key="card.id"
          :card="card"
          :is-annual="isAnnual"
          :style="{ animationDelay: `${0.2 + index * 0.05}s`, animationFillMode: 'backwards' }"
          class="animate-fade-in"
        />

        <div
          v-if="creditCardsList.length > 4"
          class="rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/30 backdrop-blur-md p-5 flex items-center justify-center hover:border-primary-400 dark:hover:border-primary-500 transition-all duration-200 cursor-pointer hover:shadow-soft-lg active:scale-[0.98] animate-fade-in"
          style="animation-delay: 0.4s; animation-fill-mode: backwards;"
          @click="showAllCards = !showAllCards"
        >
          <div class="text-center">
            <div class="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-2 border border-slate-200/50 dark:border-white/10">
              <Plus class="h-4 w-4 text-slate-500 dark:text-gray-400" />
            </div>
            <p class="text-xs text-slate-500 dark:text-gray-400 font-bold">
              {{ showAllCards ? 'Ver menos' : `Ver ${creditCardsList.length - 4} más` }}
            </p>
          </div>
        </div>
      </template>
    </div>

    <!-- Account Summary -->
    <SkeletonSummary v-if="isLoading" :items="3" />
    <div v-else class="card animate-slide-up" style="animation-fill-mode: backwards;">
      <div class="card-header">
        <h3 class="card-title">Resumen de Cuentas</h3>
        <p class="card-subtitle">Distribución por tipo de cuenta</p>
      </div>
      <div class="space-y-3">
        <div
          v-for="summary in expensesSummaryByType"
          :key="summary.type"
          class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/10"
        >
          <div class="flex items-center">
            <div class="w-7 h-7 bg-primary-500/10 dark:bg-primary-500/20 rounded-lg flex items-center justify-center mr-3 border border-primary-500/20">
              <CreditCard class="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <span class="text-sm font-medium text-slate-600 dark:text-gray-300">{{ summary.type }}</span>
          </div>
          <span class="text-lg font-bold tabular-nums text-slate-900 dark:text-gray-100">{{ formatCurrency(summary.total) }}</span>
        </div>
        <div class="flex items-center justify-between py-2 border-t-2 border-slate-200 dark:border-white/20 pt-3">
          <div class="flex items-center">
            <div class="w-7 h-7 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 border border-emerald-500/20">
              <DollarSign class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span class="text-sm font-bold text-slate-800 dark:text-gray-200">Total</span>
          </div>
          <span class="text-xl font-black tabular-nums text-slate-900 dark:text-gray-100">{{ formatCurrency(totalExpensesView) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { CreditCard, Plus, DollarSign } from 'lucide-vue-next';
import SkeletonCard from '@/components/skeletons/SkeletonCard.vue';
import SkeletonSummary from '@/components/skeletons/SkeletonSummary.vue';
import FintechCreditCard from '@/components/ui/FintechCreditCard.vue';

const props = defineProps({
  isLoading: { type: Boolean, default: false },
  isAnnual: { type: Boolean, default: false },
  creditCardsList: { type: Array, default: () => [] },
  expensesSummaryByType: { type: Array, default: () => [] },
  totalExpensesView: { type: Number, default: 0 },
  formatCurrency: { type: Function, required: true }
});

const showAllCards = ref(false);

const displayedCreditCards = computed(() => {
  if (showAllCards.value) {
    return props.creditCardsList;
  }
  return props.creditCardsList.slice(0, 4);
});
</script>