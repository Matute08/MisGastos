<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-gray-700/80 overflow-hidden transform transition-all animate-fade-in-up"
          @keydown.down.prevent="navigateResults(1)"
          @keydown.up.prevent="navigateResults(-1)"
          @keydown.enter.prevent="selectActiveItem"
          @keydown.esc.prevent="close"
        >
          <!-- Search Header -->
          <div class="relative flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-gray-700/80 bg-slate-50/50 dark:bg-gray-800/50">
            <Search class="h-5 w-5 text-slate-400 dark:text-gray-500 shrink-0 mr-3" />
            <input
              ref="searchInput"
              v-model="query"
              type="text"
              placeholder="Escribe un comando o busca una sección..."
              class="w-full bg-transparent border-0 text-slate-800 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 text-base focus:ring-0 focus:outline-none"
            />
            <div class="flex items-center gap-1 shrink-0 ml-2">
              <kbd class="px-2 py-0.5 text-xs font-semibold text-slate-500 dark:text-gray-400 bg-slate-200/70 dark:bg-gray-700 rounded border border-slate-300/60 dark:border-gray-600">
                ESC
              </kbd>
            </div>
          </div>

          <!-- Command Groups / Results -->
          <div class="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100/60 dark:divide-gray-700/40">
            <!-- No results -->
            <div
              v-if="filteredGroups.length === 0"
              class="py-12 text-center text-slate-500 dark:text-gray-400"
            >
              <HelpCircle class="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p class="text-sm font-medium">No se encontraron resultados para "{{ query }}"</p>
              <p class="text-xs text-slate-400 dark:text-gray-500 mt-1">Prueba con términos como "gasto", "tarjetas", "ahorro" o "tema"</p>
            </div>

            <!-- Group items -->
            <div
              v-for="group in filteredGroups"
              :key="group.name"
              class="py-2 first:pt-1 last:pb-1"
            >
              <div class="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-gray-400 uppercase tracking-wider">
                {{ group.name }}
              </div>

              <div class="space-y-0.5 mt-1">
                <button
                  v-for="item in group.items"
                  :key="item.id"
                  :class="[
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-150',
                    activeItemId === item.id
                      ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-900 dark:text-primary-200 font-medium ring-1 ring-primary-500/20'
                      : 'text-slate-700 dark:text-gray-200 hover:bg-slate-100/70 dark:hover:bg-gray-700/50'
                  ]"
                  @click="runAction(item)"
                  @mouseenter="activeItemId = item.id"
                >
                  <div class="flex items-center gap-3">
                    <div
                      :class="[
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        item.color || 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300'
                      ]"
                    >
                      <component :is="item.icon" class="h-4 w-4" />
                    </div>
                    <div>
                      <span class="font-medium">{{ item.title }}</span>
                      <p v-if="item.description" class="text-xs text-slate-400 dark:text-gray-400 line-clamp-1">
                        {{ item.description }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-1 text-xs text-slate-400">
                    <span v-if="item.badge" class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 text-[11px] font-medium">
                      {{ item.badge }}
                    </span>
                    <ArrowRight v-if="activeItemId === item.id" class="h-4 w-4 text-primary-500 ml-1" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Footer with shortcuts hint -->
          <div class="px-4 py-2.5 bg-slate-50 dark:bg-gray-900/50 border-t border-slate-100 dark:border-gray-700/80 flex items-center justify-between text-xs text-slate-400 dark:text-gray-500">
            <div class="flex items-center gap-3">
              <span class="inline-flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-[10px]">↑</kbd>
                <kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-[10px]">↓</kbd>
                Navegar
              </span>
              <span class="inline-flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-[10px]">↵</kbd>
                Ejecutar
              </span>
            </div>
            <div class="flex items-center gap-1">
              <span>MisGastos Pro</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Search,
  LayoutDashboard,
  Receipt,
  TrendingUp,
  CreditCard,
  Tags,
  PiggyBank,
  Calendar,
  Activity,
  User,
  PlusCircle,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
  ArrowRight
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'action']);

const router = useRouter();
const authStore = useAuthStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const query = ref('');
const searchInput = ref(null);
const activeItemId = ref(null);

const isDarkMode = ref(false);

const checkDarkMode = () => {
  isDarkMode.value = document.documentElement.classList.contains('dark');
};

const toggleTheme = () => {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  isDarkMode.value = isDark;
};

const groups = computed(() => [
  {
    name: '⚡ Acciones Rápidas',
    items: [
      {
        id: 'new-expense',
        title: 'Nuevo Gasto',
        description: 'Registrar un gasto directo o en cuotas',
        icon: PlusCircle,
        color: 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
        badge: 'G',
        action: () => {
          router.push('/expenses?action=new');
        }
      },
      {
        id: 'new-income',
        title: 'Nuevo Ingreso',
        description: 'Registrar un ingreso de sueldo o cobro',
        icon: TrendingUp,
        color: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
        badge: 'I',
        action: () => {
          router.push('/incomes?action=new');
        }
      },
      {
        id: 'new-saving',
        title: 'Nuevo Ahorro',
        description: 'Crear cuenta o movimiento de ahorro',
        icon: PiggyBank,
        color: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400',
        action: () => {
          router.push('/savings');
        }
      }
    ]
  },
  {
    name: '🧭 Navegación',
    items: [
      {
        id: 'nav-dashboard',
        title: 'Dashboard General',
        description: 'Resumen financiero, balance y gráficos',
        icon: LayoutDashboard,
        color: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400',
        action: () => router.push('/dashboard')
      },
      {
        id: 'nav-expenses',
        title: 'Mis Gastos',
        description: 'Listado de gastos, cuotas y programados',
        icon: Receipt,
        color: 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
        action: () => router.push('/expenses')
      },
      {
        id: 'nav-incomes',
        title: 'Mis Ingresos',
        description: 'Control de sueldos y cobros periódicos',
        icon: TrendingUp,
        color: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
        action: () => router.push('/incomes')
      },
      {
        id: 'nav-cards',
        title: 'Tarjetas y Cuentas',
        description: 'Límites, cierres, vencimientos y bancos',
        icon: CreditCard,
        color: 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
        action: () => router.push('/cards')
      },
      {
        id: 'nav-categories',
        title: 'Categorías',
        description: 'Administración de rubros y subcategorías',
        icon: Tags,
        color: 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
        action: () => router.push('/categories')
      },
      {
        id: 'nav-savings',
        title: 'Cuentas de Ahorro',
        description: 'Fondos en USD, ARS y billeteras',
        icon: PiggyBank,
        color: 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
        action: () => router.push('/savings')
      },
      {
        id: 'nav-monthly',
        title: 'Resumen Mensual',
        description: 'Comparativas mes a mes y desglose anual',
        icon: Calendar,
        color: 'bg-teal-100 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400',
        action: () => router.push('/monthly')
      },
      {
        id: 'nav-activity',
        title: 'Actividad Reciente',
        description: 'Registro histórico de operaciones',
        icon: Activity,
        color: 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300',
        action: () => router.push('/activity')
      },
      {
        id: 'nav-profile',
        title: 'Mi Perfil',
        description: 'Preferencias de usuario y cuenta',
        icon: User,
        color: 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300',
        action: () => router.push('/profile')
      }
    ]
  },
  {
    name: '⚙️ Preferencias',
    items: [
      {
        id: 'pref-theme',
        title: isDarkMode.value ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro',
        description: 'Alternar tema visual de la aplicación',
        icon: isDarkMode.value ? Sun : Moon,
        color: 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
        action: () => toggleTheme()
      },
      {
        id: 'pref-logout',
        title: 'Cerrar Sesión',
        description: 'Finalizar la sesión actual de forma segura',
        icon: LogOut,
        color: 'bg-danger-50 dark:bg-danger-950/50 text-danger-600 dark:text-danger-400',
        action: async () => {
          await authStore.logout();
          router.push('/login');
        }
      }
    ]
  }
]);

const filteredGroups = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return groups.value;

  return groups.value
    .map((g) => ({
      name: g.name,
      items: g.items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      )
    }))
    .filter((g) => g.items.length > 0);
});

const allFilteredItems = computed(() => {
  return filteredGroups.value.flatMap((g) => g.items);
});

watch(filteredGroups, (newGroups) => {
  const items = allFilteredItems.value;
  if (items.length > 0 && (!activeItemId.value || !items.some(i => i.id === activeItemId.value))) {
    activeItemId.value = items[0].id;
  } else if (items.length === 0) {
    activeItemId.value = null;
  }
}, { immediate: true });

watch(isOpen, async (val) => {
  if (val) {
    checkDarkMode();
    query.value = '';
    await nextTick();
    searchInput.value?.focus();
    const items = allFilteredItems.value;
    if (items.length > 0) {
      activeItemId.value = items[0].id;
    }
  }
});

const navigateResults = (direction) => {
  const items = allFilteredItems.value;
  if (items.length === 0) return;

  const currentIndex = items.findIndex((i) => i.id === activeItemId.value);
  let nextIndex = currentIndex + direction;

  if (nextIndex < 0) nextIndex = items.length - 1;
  if (nextIndex >= items.length) nextIndex = 0;

  activeItemId.value = items[nextIndex].id;
};

const selectActiveItem = () => {
  const item = allFilteredItems.value.find((i) => i.id === activeItemId.value);
  if (item) {
    runAction(item);
  }
};

const runAction = (item) => {
  close();
  if (item.action) {
    item.action();
  }
};

const close = () => {
  isOpen.value = false;
};

onMounted(() => {
  checkDarkMode();
});
</script>
