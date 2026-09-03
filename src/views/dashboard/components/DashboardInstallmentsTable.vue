<template>
  <div class="space-y-6">
    <!-- Upcoming Payments - Desktop Table -->
    <div v-if="isLoading" class="hidden lg:block">
      <SkeletonTable :columns="6" :rows="5" />
    </div>
    <div v-else-if="upcomingInstallmentsList.length > 0" class="hidden lg:block card animate-slide-up" style="animation-delay: 0.1s; animation-fill-mode: backwards;">
      <div class="card-header">
        <h3 class="card-title">Próximos Vencimientos</h3>
        <p class="card-subtitle">Pagos próximos a vencer</p>
      </div>
      <div class="overflow-x-auto -mx-6">
        <table class="min-w-full">
          <thead>
            <tr class="bg-slate-50/80 dark:bg-gray-700/80">
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Tarjeta</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Categoría</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Vencimiento</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-gray-700">
            <tr
              v-for="(inst, idx) in paginatedUpcomingInstallments"
              :key="inst.id"
              :class="idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-slate-50/40 dark:bg-gray-800/50'"
              class="hover:bg-primary-50/30 dark:hover:bg-primary-900/20 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-gray-100">
                {{ inst.expenses?.description || 'Cuota' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-gray-300">
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
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-gray-100">
                {{ formatCurrency(inst.amount) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-gray-300">
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

      <!-- Desktop Pagination -->
      <div v-if="totalVencimientosPages > 1" class="flex items-center justify-center gap-2 pt-4 border-t border-slate-100 dark:border-gray-700 mt-4">
        <button
          @click="setVencimientosPage(vencimientosPage - 1)"
          :disabled="vencimientosPage === 1"
          class="p-2 rounded-lg text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <span class="text-sm text-slate-600 dark:text-gray-300 px-3">
          Página {{ vencimientosPage }} de {{ totalVencimientosPages }}
        </span>
        <button
          @click="setVencimientosPage(vencimientosPage + 1)"
          :disabled="vencimientosPage === totalVencimientosPages"
          class="p-2 rounded-lg text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-soft dark:shadow-none border border-slate-100 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 dark:border-gray-700">
          <h3 class="text-lg font-bold text-slate-900 dark:text-gray-100">Próximos Vencimientos</h3>
          <p class="text-sm text-slate-500 dark:text-gray-400 mt-0.5">Pagos próximos a vencer</p>
        </div>
        <div class="divide-y divide-slate-50 dark:divide-gray-700">
          <div v-for="inst in paginatedUpcomingInstallments" :key="inst.id" class="p-4">
            <div class="flex items-center justify-between mb-2">
              <span :class="inst.payment_status_id === 3 ? 'badge-danger' : 'badge-warning'">
                {{ inst.payment_status_id === 3 ? 'En deuda' : 'Pendiente' }}
              </span>
              <span class="text-xs text-slate-400 dark:text-gray-500 font-medium">{{ formatDate(inst.due_date) }}</span>
            </div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-slate-900 dark:text-gray-100 text-sm truncate mr-2">
                {{ inst.expenses?.description || 'Cuota' }}
              </h4>
              <span class="text-lg font-bold text-slate-900 dark:text-gray-100 flex-shrink-0">{{ formatCurrency(inst.amount) }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
              <span>{{ inst.expenses?.available_cards?.name || 'Sin cuenta' }}</span>
              <span class="text-slate-300 dark:text-gray-600">•</span>
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
        <div v-if="totalVencimientosPages > 1" class="px-5 py-3 border-t border-slate-100 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <button
              @click="setVencimientosPage(vencimientosPage - 1)"
              :disabled="vencimientosPage === 1"
              class="flex items-center gap-1 text-sm text-slate-500 dark:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft class="w-4 h-4" />
              <span>Anterior</span>
            </button>
            <span class="text-sm text-slate-500 dark:text-gray-400">{{ vencimientosPage }} de {{ totalVencimientosPages }}</span>
            <button
              @click="setVencimientosPage(vencimientosPage + 1)"
              :disabled="vencimientosPage === totalVencimientosPages"
              class="flex items-center gap-1 text-sm text-slate-500 dark:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
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
import { ref, computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import SkeletonTable from '@/components/skeletons/SkeletonTable.vue';
import SkeletonList from '@/components/skeletons/SkeletonList.vue';

const props = defineProps({
  isLoading: { type: Boolean, default: false },
  upcomingInstallmentsList: { type: Array, default: () => [] },
  formatCurrency: { type: Function, required: true },
  formatDate: { type: Function, required: true }
});

const vencimientosPage = ref(1);
const vencimientosPerPage = 5;

const paginatedUpcomingInstallments = computed(() => {
  const start = (vencimientosPage.value - 1) * vencimientosPerPage;
  return props.upcomingInstallmentsList.slice(start, start + vencimientosPerPage);
});

const totalVencimientosPages = computed(() => {
  return Math.max(1, Math.ceil(props.upcomingInstallmentsList.length / vencimientosPerPage));
});

const setVencimientosPage = (page) => {
  if (page >= 1 && page <= totalVencimientosPages.value) {
    vencimientosPage.value = page;
  }
};
</script>