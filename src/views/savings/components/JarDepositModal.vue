<template>
  <Transition name="modal">
    <div
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="$emit('close')"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-gray-700 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-gray-700 shrink-0">
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              :style="{
                backgroundColor: (jar.color || '#10b981') + '20',
                color: jar.color || '#10b981'
              }"
            >
              <ArrowDownToLine class="h-4 w-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-gray-100">
                Ingresar dinero
              </h3>
              <p class="text-xs text-slate-500 dark:text-gray-400">
                Frasco: <strong class="text-slate-700 dark:text-gray-200">{{ jar.name }}</strong>
              </p>
            </div>
          </div>
          <button
            @click="$emit('close')"
            type="button"
            class="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="handleSubmit" class="p-5 space-y-4">
          <!-- Saldo actual del frasco -->
          <div class="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-700/40 border border-slate-100 dark:border-gray-700 flex items-center justify-between">
            <span class="text-xs text-slate-500 dark:text-gray-400">Saldo actual en frasco:</span>
            <span class="text-xs font-extrabold text-slate-800 dark:text-gray-100 tabular-nums">
              {{ formatAmount(jar.balance) }}
            </span>
          </div>

          <!-- Monto a ingresar -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 mb-1.5">
              Monto a ingresar ({{ jar.currency }})
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
                {{ jar.currency === 'USD' ? 'USD' : '$' }}
              </span>
              <input
                v-model="amount"
                type="number"
                min="0.01"
                step="any"
                inputmode="decimal"
                class="input-field !pl-10 !text-lg !font-bold"
                placeholder="0.00"
                required
                autofocus
              />
            </div>
          </div>

          <!-- Si es dólares, cotización -->
          <div v-if="jar.currency === 'USD'">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 mb-1.5">
              Cotización del dólar (ARS)
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
              <input
                v-model="exchangeRate"
                type="number"
                min="0.01"
                step="any"
                inputmode="decimal"
                class="input-field !pl-8"
                placeholder="Ej: 1200"
                required
              />
            </div>
          </div>

          <!-- Fecha -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 mb-1.5">
              Fecha
            </label>
            <input
              v-model="date"
              type="date"
              class="input-field"
              required
            />
          </div>

          <!-- Nota opcional -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 mb-1.5">
              Nota <span class="text-slate-400 font-normal normal-case">(opcional)</span>
            </label>
            <input
              v-model="note"
              type="text"
              class="input-field"
              placeholder="Ej: Aporte mensual, Extra"
              maxlength="60"
            />
          </div>

          <!-- Aviso de balance -->
          <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <span class="text-emerald-600 shrink-0">ℹ</span>
            <span>Este dinero se sumará a tu frasco y se <strong>descontará de tu saldo disponible</strong> en el balance.</span>
          </div>

          <!-- Botones -->
          <div class="pt-2 flex items-center justify-end gap-2.5">
            <button
              @click="$emit('close')"
              type="button"
              class="btn-secondary !py-2.5 !px-4 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || !amount || Number(amount) <= 0"
              class="btn-primary !py-2.5 !px-5 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary-500/20 disabled:opacity-50"
            >
              <ArrowDownToLine class="h-3.5 w-3.5" />
              <span>{{ isSubmitting ? 'Guardando...' : 'Ingresar dinero' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue';
import { X, ArrowDownToLine } from 'lucide-vue-next';

const props = defineProps({
  jar: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'save']);

const amount = ref('');
const date = ref(new Date().toISOString().slice(0, 10));
const note = ref('');
const exchangeRate = ref(1200);
const isSubmitting = ref(false);

const formatAmount = (val) => {
  const n = Number(val || 0);
  if (props.jar.currency === 'USD') {
    return `USD ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
};

const handleSubmit = async () => {
  const num = Number(amount.value);
  if (num <= 0) return;
  isSubmitting.value = true;
  try {
    emit('save', {
      amount: num,
      date: date.value,
      note: note.value.trim(),
      dollars: props.jar.currency === 'USD' ? num : undefined,
      exchange_rate: props.jar.currency === 'USD' ? Number(exchangeRate.value) : undefined
    });
  } finally {
    isSubmitting.value = false;
  }
};
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
