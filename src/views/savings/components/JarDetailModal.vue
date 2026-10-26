<template>
  <Transition name="modal">
    <div
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="$emit('close')"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-gray-700 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-gray-700 shrink-0">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
              :style="{
                backgroundColor: (jar.color || '#10b981') + '20',
                color: jar.color || '#10b981'
              }"
            >
              <PiggyBank class="h-5 w-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-slate-900 dark:text-gray-100">
                  {{ jar.name }}
                </h3>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300">
                  {{ jar.currency }}
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-gray-400">
                Historial de movimientos del frasco
              </p>
            </div>
          </div>
          <button
            @click="$emit('close')"
            type="button"
            class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Resumen del Frasco -->
        <div class="px-6 py-4 bg-slate-50/70 dark:bg-gray-800/50 border-b border-slate-100 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
          <div class="p-3 bg-white dark:bg-gray-700/50 rounded-2xl border border-slate-100 dark:border-gray-700/70">
            <p class="text-[11px] font-medium text-slate-500 dark:text-gray-400">Saldo actual</p>
            <p class="text-sm font-extrabold text-slate-900 dark:text-gray-100 tabular-nums mt-0.5">
              {{ formatAmount(jar.balance) }}
            </p>
          </div>
          <div class="p-3 bg-white dark:bg-gray-700/50 rounded-2xl border border-slate-100 dark:border-gray-700/70">
            <p class="text-[11px] font-medium text-slate-500 dark:text-gray-400">Total ingresado</p>
            <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              +{{ formatAmount(totalIn) }}
            </p>
          </div>
          <div class="p-3 bg-white dark:bg-gray-700/50 rounded-2xl border border-slate-100 dark:border-gray-700/70 col-span-2 sm:col-span-1">
            <p class="text-[11px] font-medium text-slate-500 dark:text-gray-400">Total retirado</p>
            <p class="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
              -{{ formatAmount(totalOut) }}
            </p>
          </div>
        </div>

        <!-- Lista de Movimientos -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 class="h-6 w-6 animate-spin mb-2" />
            <p class="text-xs">Cargando movimientos...</p>
          </div>

          <div v-else-if="movements.length === 0" class="py-12 text-center text-slate-400">
            <History class="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p class="text-sm font-medium">Aún no hay movimientos en este frasco</p>
            <p class="text-xs text-slate-400 mt-1">Usa los botones de ingresar o retirar dinero para comenzar.</p>
          </div>

          <div v-else class="space-y-2.5">
            <div
              v-for="item in movements"
              :key="item.id"
              class="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-gray-800/80 border border-slate-100 dark:border-gray-700 hover:border-slate-200 dark:hover:border-gray-600 transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                  :class="item.type === 'ingreso' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'"
                >
                  <ArrowDownToLine v-if="item.type === 'ingreso'" class="h-4 w-4" />
                  <ArrowUpFromLine v-else class="h-4 w-4" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-800 dark:text-gray-200 capitalize">
                      {{ item.type === 'ingreso' ? 'Ingreso' : 'Retiro' }}
                    </span>
                    <span class="text-[11px] text-slate-400 dark:text-gray-500">
                      {{ formatDate(item.date) }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-gray-400 truncate mt-0.5">
                    {{ item.note || (item.type === 'ingreso' ? 'Aporte al frasco' : 'Retiro de fondos') }}
                  </p>
                </div>
              </div>

              <div class="text-right shrink-0 pl-3">
                <span
                  class="text-sm font-bold tabular-nums"
                  :class="item.type === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
                >
                  {{ item.type === 'ingreso' ? '+' : '-' }}{{ formatAmount(item.amount) }}
                </span>
                <p v-if="jar.currency === 'USD' && item.exchange_rate" class="text-[10px] text-slate-400">
                  Cotiz: ${{ item.exchange_rate }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3.5 border-t border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800 flex items-center justify-between shrink-0">
          <span class="text-xs text-slate-500 dark:text-gray-400">
            {{ movements.length }} {{ movements.length === 1 ? 'movimiento' : 'movimientos' }}
          </span>
          <button
            @click="$emit('close')"
            type="button"
            class="btn-secondary !py-2 !px-4 text-xs font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { X, PiggyBank, ArrowDownToLine, ArrowUpFromLine, History, Loader2 } from 'lucide-vue-next';
import { useSavingsStore } from '@/stores/savings';

const props = defineProps({
  jar: {
    type: Object,
    required: true
  }
});

defineEmits(['close']);

const savingsStore = useSavingsStore();
const isLoading = ref(true);
const movements = ref([]);

const formatAmount = (val) => {
  const n = Number(val || 0);
  if (props.jar.currency === 'USD') {
    return `USD ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const totalIn = computed(() => {
  return movements.value
    .filter(m => m.type === 'ingreso')
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);
});

const totalOut = computed(() => {
  return movements.value
    .filter(m => m.type === 'retiro')
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);
});

onMounted(async () => {
  try {
    const res = await savingsStore.getJarMovements(props.jar.id);
    movements.value = res.movements || [];
  } catch (err) {
    console.error('Error al cargar movimientos del frasco:', err);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
