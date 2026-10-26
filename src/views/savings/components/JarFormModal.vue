<template>
  <Transition name="modal">
    <div
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="$emit('close')"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-gray-700 flex flex-col overflow-hidden max-h-[90vh]"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-700 shrink-0">
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-gray-100">
              {{ isEditing ? 'Editar frasco' : 'Crear nuevo frasco' }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              {{ isEditing ? 'Modificá los datos de tu objetivo de ahorro' : 'Organizá tu dinero en una meta o reserva' }}
            </p>
          </div>
          <button
            @click="$emit('close')"
            type="button"
            class="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4 overflow-y-auto">
          <!-- Nombre del Frasco -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 mb-1.5">
              Nombre del frasco
            </label>
            <input
              v-model="form.name"
              type="text"
              class="input-field"
              placeholder="Ej: iPhone, Vacaciones, Fondo de emergencia"
              maxlength="40"
              required
              autofocus
            />
          </div>

          <!-- Moneda (solo al crear) -->
          <div v-if="!isEditing">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 mb-1.5">
              Moneda
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="form.currency = 'ARS'"
                :class="[
                  'py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2',
                  form.currency === 'ARS'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-sm'
                    : 'border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700'
                ]"
              >
                <span>🇦🇷 Pesos (ARS)</span>
              </button>
              <button
                type="button"
                @click="form.currency = 'USD'"
                :class="[
                  'py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2',
                  form.currency === 'USD'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 shadow-sm'
                    : 'border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700'
                ]"
              >
                <span>🇺🇸 Dólares (USD)</span>
              </button>
            </div>
          </div>

          <!-- Meta de ahorro opcional -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 mb-1.5">
              Meta de ahorro <span class="text-slate-400 font-normal normal-case">(opcional)</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                {{ form.currency === 'USD' ? 'USD' : '$' }}
              </span>
              <input
                v-model="form.target_amount"
                type="number"
                min="0"
                step="any"
                inputmode="decimal"
                class="input-field !pl-10"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Depósito inicial (solo al crear) -->
          <div v-if="!isEditing" class="p-3.5 rounded-2xl bg-slate-50 dark:bg-gray-700/40 border border-slate-100 dark:border-gray-700">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 mb-1">
              Depósito inicial <span class="text-slate-400 font-normal normal-case">(opcional)</span>
            </label>
            <p class="text-[11px] text-slate-400 dark:text-gray-400 mb-2">
              Se descontará automáticamente de tu saldo disponible.
            </p>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                {{ form.currency === 'USD' ? 'USD' : '$' }}
              </span>
              <input
                v-model="form.initial_deposit"
                type="number"
                min="0"
                step="any"
                inputmode="decimal"
                class="input-field !pl-10 !bg-white dark:!bg-gray-800"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Selección de Color -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 mb-2">
              Color identificador
            </label>
            <div class="flex items-center gap-2 flex-wrap">
              <button
                v-for="c in colorOptions"
                :key="c"
                type="button"
                @click="form.color = c"
                class="w-7 h-7 rounded-full transition-transform flex items-center justify-center"
                :class="form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-gray-800' : 'hover:scale-110'"
                :style="{ backgroundColor: c }"
              >
                <Check v-if="form.color === c" class="h-3.5 w-3.5 text-white stroke-[3]" />
              </button>
            </div>
          </div>

          <!-- Selección de Ícono -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 mb-2">
              Ícono
            </label>
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="ico in iconOptions"
                :key="ico.name"
                type="button"
                @click="form.icon = ico.name"
                :class="[
                  'p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all',
                  form.icon === ico.name
                    ? 'border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300 ring-1 ring-primary-500'
                    : 'border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700'
                ]"
              >
                <component :is="ico.component" class="h-5 w-5" />
              </button>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-gray-700">
            <button
              @click="$emit('close')"
              type="button"
              class="btn-secondary !py-2.5 !px-4 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="btn-primary !py-2.5 !px-5 text-xs font-bold flex items-center gap-2 shadow-md shadow-primary-500/20"
            >
              <span v-if="isSubmitting">Guardando...</span>
              <span v-else>{{ isEditing ? 'Guardar cambios' : 'Crear frasco' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  X,
  Check,
  PiggyBank,
  Smartphone,
  Calendar,
  Plane,
  Car,
  Home,
  ShieldCheck,
  Heart,
  Sparkles,
  Laptop
} from 'lucide-vue-next';

const props = defineProps({
  jar: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'save']);

const isEditing = computed(() => !!props.jar);
const isSubmitting = ref(false);

const colorOptions = [
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

const iconOptions = [
  { name: 'PiggyBank', component: PiggyBank },
  { name: 'Smartphone', component: Smartphone },
  { name: 'Calendar', component: Calendar },
  { name: 'Plane', component: Plane },
  { name: 'Car', component: Car },
  { name: 'Home', component: Home },
  { name: 'ShieldCheck', component: ShieldCheck },
  { name: 'Heart', component: Heart },
  { name: 'Sparkles', component: Sparkles },
  { name: 'Laptop', component: Laptop },
];

const form = ref({
  name: props.jar?.name || '',
  currency: props.jar?.currency || 'ARS',
  target_amount: props.jar?.target_amount ?? '',
  initial_deposit: '',
  color: props.jar?.color || '#10b981',
  icon: props.jar?.icon || 'PiggyBank'
});

const handleSubmit = async () => {
  if (!form.value.name.trim()) return;
  isSubmitting.value = true;
  try {
    emit('save', {
      name: form.value.name.trim(),
      currency: form.value.currency,
      target_amount: form.value.target_amount ? Number(form.value.target_amount) : null,
      initial_deposit: form.value.initial_deposit ? Number(form.value.initial_deposit) : 0,
      color: form.value.color,
      icon: form.value.icon
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
