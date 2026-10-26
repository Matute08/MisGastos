<template>
  <div
    class="card !p-5 relative overflow-hidden transition-all duration-200 hover:shadow-lg border border-slate-200/80 dark:border-gray-700/80 flex flex-col justify-between group"
  >
    <!-- Top accent bar based on jar color -->
    <div
      class="absolute top-0 left-0 right-0 h-1.5"
      :style="{ backgroundColor: jar.color || '#4f46e5' }"
    ></div>

    <div>
      <!-- Header del Frasco -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
            :style="{
              backgroundColor: (jar.color || '#4f46e5') + '18',
              color: jar.color || '#4f46e5'
            }"
          >
            <component :is="resolvedIcon" class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <h3 class="font-bold text-slate-800 dark:text-gray-100 text-base leading-snug truncate">
              {{ jar.name }}
            </h3>
            <span
              class="inline-block mt-0.5 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full"
              :class="jar.currency === 'USD'
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'"
            >
              {{ jar.currency === 'USD' ? 'USD Dólares' : 'ARS Pesos' }}
            </span>
          </div>
        </div>

        <!-- Menu dropdown trigger -->
        <div class="relative shrink-0">
          <button
            @click.stop="toggleMenu"
            type="button"
            class="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
            title="Opciones del frasco"
          >
            <MoreVertical class="h-4 w-4" />
          </button>

          <!-- Dropdown menu -->
          <div
            v-if="isMenuOpen"
            v-click-outside="closeMenu"
            class="absolute right-0 top-8 z-30 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-100 dark:border-gray-700 py-1.5 text-xs text-slate-700 dark:text-gray-200 animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              @click="handleAction('details')"
              class="w-full text-left px-3.5 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-gray-700/60 transition-colors"
            >
              <Eye class="h-3.5 w-3.5 text-slate-400" />
              <span>Ver movimientos</span>
            </button>
            <button
              @click="handleAction('edit')"
              class="w-full text-left px-3.5 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-gray-700/60 transition-colors"
            >
              <Pencil class="h-3.5 w-3.5 text-slate-400" />
              <span>Editar frasco</span>
            </button>
            <div class="my-1 border-t border-slate-100 dark:border-gray-700"></div>
            <button
              @click="handleAction('delete')"
              class="w-full text-left px-3.5 py-2 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 class="h-3.5 w-3.5" />
              <span>Eliminar frasco</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Saldo Actual -->
      <div class="mt-4">
        <p class="text-xs font-medium text-slate-400 dark:text-gray-400">Saldo disponible</p>
        <p class="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
          {{ formattedBalance }}
        </p>
      </div>

      <!-- Meta de ahorro (si tiene target_amount) -->
      <div v-if="jar.target_amount && jar.target_amount > 0" class="mt-3 space-y-1.5">
        <div class="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
          <span>Meta: {{ formatAmount(jar.target_amount) }}</span>
          <span class="font-semibold" :style="{ color: jar.color || '#4f46e5' }">
            {{ jar.progress ?? 0 }}%
          </span>
        </div>
        <div class="w-full h-2 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :style="{
              width: `${Math.min(100, jar.progress ?? 0)}%`,
              backgroundColor: jar.color || '#4f46e5'
            }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Botones de Acción: Ingresar y Retirar -->
    <div class="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-gray-700/80">
      <button
        @click="$emit('deposit', jar)"
        type="button"
        class="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/40 active:scale-95"
      >
        <ArrowDownToLine class="h-3.5 w-3.5" />
        <span>Ingresar</span>
      </button>

      <button
        @click="$emit('withdraw', jar)"
        type="button"
        :disabled="jar.balance <= 0"
        class="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
      >
        <ArrowUpFromLine class="h-3.5 w-3.5" />
        <span>Retirar</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  ArrowDownToLine,
  ArrowUpFromLine,
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
    required: true
  }
});

const emit = defineEmits(['deposit', 'withdraw', 'edit', 'delete', 'details']);

const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

const handleAction = (action) => {
  closeMenu();
  emit(action, props.jar);
};

const iconMap = {
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
};

const resolvedIcon = computed(() => {
  return iconMap[props.jar.icon] || PiggyBank;
});

const formatAmount = (val) => {
  const n = Number(val || 0);
  if (props.jar.currency === 'USD') {
    return `USD ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
};

const formattedBalance = computed(() => formatAmount(props.jar.balance));

// Directiva simple de click outside
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.addEventListener('click', el._clickOutside);
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside);
  }
};
</script>
