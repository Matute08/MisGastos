<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
    <div
      class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/10 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up"
      @click.stop
    >
      <!-- Header -->
      <div class="px-6 py-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center"
            :style="{ backgroundColor: (category?.color || '#6366F1') + '20' }"
          >
            <Target class="h-5 w-5" :style="{ color: category?.color || '#6366F1' }" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-gray-100">
              Presupuesto Mensual
            </h3>
            <p class="text-xs text-slate-500 dark:text-gray-400">
              {{ category?.name }}
            </p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Form Body -->
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 mb-2">
            Límite Mensual de Gasto
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
            <input
              v-model.number="budgetAmount"
              type="number"
              min="0"
              step="1000"
              placeholder="Ej: 100000"
              class="input-field pl-8 text-lg font-bold tabular-nums"
              autofocus
              @keydown.enter="handleSave"
            />
          </div>
          <p class="text-xs text-slate-400 dark:text-gray-500 mt-2">
            Te alertaremos visualmente cuando tus compras en esta categoría alcancen el 75% o superen el límite.
          </p>
        </div>

        <!-- Quick Presets -->
        <div class="flex flex-wrap gap-2 pt-2">
          <button
            v-for="preset in [50000, 100000, 200000, 500000]"
            :key="preset"
            type="button"
            @click="budgetAmount = preset"
            class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-gray-300 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950/50 dark:hover:text-primary-400 transition-colors border border-transparent hover:border-primary-500/20"
          >
            ${{ preset.toLocaleString('es-AR') }}
          </button>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
        <button
          v-if="currentBudget > 0"
          @click="handleRemove"
          type="button"
          class="text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
        >
          Quitar presupuesto
        </button>
        <span v-else></span>

        <div class="flex items-center gap-3">
          <button
            @click="$emit('close')"
            type="button"
            class="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="handleSave"
            type="button"
            class="btn-primary px-5 py-2 text-sm font-bold shadow-md"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Target, X } from 'lucide-vue-next';

const props = defineProps({
  category: {
    type: Object,
    required: true
  },
  currentBudget: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['close', 'save', 'remove']);

const budgetAmount = ref(props.currentBudget || '');

function handleSave() {
  emit('save', {
    categoryId: props.category.id,
    amount: Number(budgetAmount.value) || 0
  });
}

function handleRemove() {
  emit('remove', props.category.id);
}
</script>
