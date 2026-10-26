<template>
  <div class="max-w-4xl mx-auto space-y-6">

    <!-- Encabezado con título y botón de nuevo frasco -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-gray-100 flex items-center gap-2.5">
          <Sparkles class="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <span>Frascos de Ahorro</span>
        </h1>
        <p class="text-sm text-slate-500 dark:text-gray-400 mt-1">
          Separar tu dinero por objetivos, ingresar y retirar fondos cuando quieras al estilo Mercado Pago.
        </p>
      </div>

      <button
        @click="openCreateJarModal"
        type="button"
        class="btn-primary !py-2.5 !px-4 self-start sm:self-auto flex items-center gap-2 text-sm font-bold shadow-md shadow-primary-500/20 active:scale-95"
      >
        <Plus class="h-4 w-4 stroke-[2.5]" />
        <span>Nuevo frasco</span>
      </button>
    </div>

    <!-- Tarjetas de resumen general -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <!-- Total en Pesos -->
      <div class="card !p-4 flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <PiggyBank class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <p class="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
            Ahorro en pesos
          </p>
          <p class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-gray-100 tabular-nums leading-tight truncate">
            {{ formatCurrency(savingsStore.totalSavedArs) }}
          </p>
        </div>
      </div>

      <!-- Total en Dólares -->
      <div class="card !p-4 flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <DollarSign class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <p class="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
            Ahorro en dólares
          </p>
          <p class="text-lg sm:text-xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums leading-tight truncate">
            USD {{ savingsStore.totalSavedUsd.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
          </p>
        </div>
      </div>

      <!-- Cantidad de frascos -->
      <div class="card !p-4 flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <Layers class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <p class="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
            Frascos activos
          </p>
          <p class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-gray-100 tabular-nums leading-tight">
            {{ savingsStore.jars.length }}
          </p>
        </div>
      </div>
    </div>

    <!-- Aviso de error de conexión si aplica -->
    <p v-if="savingsStore.lastLoadError" class="text-xs text-amber-700 dark:text-amber-400 px-1">
      Sin conexión al servidor — mostrando datos locales.
    </p>

    <!-- Grid de Frascos -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-slate-800 dark:text-gray-200">
          Mis Frascos
        </h2>
        <span class="text-xs text-slate-400">
          {{ savingsStore.jars.length }} {{ savingsStore.jars.length === 1 ? 'frasco' : 'frascos' }}
        </span>
      </div>

      <!-- Cargando frascos -->
      <div v-if="savingsStore.isLoadingJars && savingsStore.jars.length === 0" class="py-12 flex justify-center items-center text-slate-400">
        <Loader2 class="h-6 w-6 animate-spin mr-2" />
        <span class="text-sm">Cargando frascos...</span>
      </div>

      <!-- Estado vacío -->
      <div v-else-if="savingsStore.jars.length === 0" class="card !p-8 text-center space-y-3">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
          <Sparkles class="h-6 w-6" />
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-800 dark:text-gray-100">No tenés frascos creados</h3>
          <p class="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            Creá tu primer frasco para separar tus ahorros por objetivos (por ej. "Vacaciones", "iPhone", "Fondo imprevistos").
          </p>
        </div>
        <button
          @click="openCreateJarModal"
          type="button"
          class="btn-primary !py-2.5 !px-5 text-xs font-bold inline-flex items-center gap-1.5"
        >
          <Plus class="h-4 w-4" />
          <span>Crear mi primer frasco</span>
        </button>
      </div>

      <!-- Grid de tarjetas -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <JarCard
          v-for="jar in savingsStore.jars"
          :key="jar.id"
          :jar="jar"
          @deposit="openDepositModal(jar)"
          @withdraw="openWithdrawModal(jar)"
          @edit="openEditJarModal(jar)"
          @delete="handleDeleteJar(jar)"
          @details="openDetailModal(jar)"
        />
      </div>
    </div>

    <!-- Historial consolidado de movimientos -->
    <div class="card !p-0 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 class="card-title !text-base">Historial de movimientos</h3>
          <p class="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
            Ingresos y retiros de tus frascos y ahorros
          </p>
        </div>
        <span class="text-xs text-slate-400 dark:text-gray-500">
          {{ savingsStore.sortedRecords.length }}
          {{ savingsStore.sortedRecords.length === 1 ? 'movimiento' : 'movimientos' }}
        </span>
      </div>

      <div class="divide-y divide-slate-100 dark:divide-gray-700 max-h-[30rem] overflow-y-auto">
        <div
          v-for="item in savingsStore.sortedRecords"
          :key="item.id"
          class="px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <div class="flex items-center justify-between gap-3">
            <!-- Icono y descripción -->
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                :class="item.direction === 'out'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'"
              >
                <ArrowUpFromLine v-if="item.direction === 'out'" class="h-4 w-4" />
                <ArrowDownToLine v-else class="h-4 w-4" />
              </div>

              <div class="min-w-0">
                <p class="text-sm font-bold text-slate-800 dark:text-gray-100 leading-snug truncate">
                  {{ cleanRecordTitle(item) }}
                </p>
                <p class="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                  {{ formatDate(item.date) }}
                  <span v-if="item.type === 'dolares'">
                    · {{ Math.abs(item.dollars ?? 0) }} USD @ ${{ item.exchange_rate }}
                  </span>
                  <span v-if="getRecordSubtext(item)"> · {{ getRecordSubtext(item) }}</span>
                </p>
              </div>
            </div>

            <!-- Importe y eliminar -->
            <div class="flex items-center gap-3 shrink-0">
              <div class="text-right">
                <p
                  class="text-sm font-bold tabular-nums"
                  :class="item.direction === 'out'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'"
                >
                  {{ item.direction === 'out' ? '-' : '+' }}{{ formatCurrency(Math.abs(item.amount_ars)) }}
                </p>
                <span class="text-[10px] font-semibold text-slate-400 uppercase">
                  {{ item.direction === 'out' ? 'Retiro' : 'Ingreso' }}
                </span>
              </div>

              <button
                @click="confirmDeleteRecord(item)"
                type="button"
                class="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Eliminar movimiento"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="savingsStore.sortedRecords.length === 0" class="py-12">
          <EmptyState
            icon="PiggyBank"
            title="No hay movimientos registrados"
            description="Creá un frasco o ingresá dinero para ver tu historial aquí"
          />
        </div>
      </div>
    </div>

    <!-- Modales -->
    <!-- Modal Crear / Editar Frasco -->
    <JarFormModal
      v-if="activeJarFormModal"
      :jar="selectedJar"
      @close="activeJarFormModal = false; selectedJar = null"
      @save="handleSaveJar"
    />

    <!-- Modal Ingresar Dinero -->
    <JarDepositModal
      v-if="activeDepositJar"
      :jar="activeDepositJar"
      @close="activeDepositJar = null"
      @save="handleSaveDeposit"
    />

    <!-- Modal Retirar Dinero -->
    <JarWithdrawModal
      v-if="activeWithdrawJar"
      :jar="activeWithdrawJar"
      @close="activeWithdrawJar = null"
      @save="handleSaveWithdraw"
    />

    <!-- Modal Detalle / Historial de Frasco -->
    <JarDetailModal
      v-if="activeDetailJar"
      :jar="activeDetailJar"
      @close="activeDetailJar = null"
    />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Sparkles,
  PiggyBank,
  DollarSign,
  Layers,
  Plus,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2
} from 'lucide-vue-next';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

import { useSavingsStore } from '@/stores/savings';
import EmptyState from '@/components/ui/EmptyState.vue';
import JarCard from '@/views/savings/components/JarCard.vue';
import JarFormModal from '@/views/savings/components/JarFormModal.vue';
import JarDepositModal from '@/views/savings/components/JarDepositModal.vue';
import JarWithdrawModal from '@/views/savings/components/JarWithdrawModal.vue';
import JarDetailModal from '@/views/savings/components/JarDetailModal.vue';

const savingsStore = useSavingsStore();

// Modals state
const activeJarFormModal = ref(false);
const selectedJar = ref(null);
const activeDepositJar = ref(null);
const activeWithdrawJar = ref(null);
const activeDetailJar = ref(null);

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true
});

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0);

const formatDate = (date) => {
  if (!date) return '';
  return format(parseISO(date), 'dd/MM/yyyy', { locale: es });
};

// Helper para limpiar el título del registro
const cleanRecordTitle = (item) => {
  const note = item.note || '';
  const match = note.match(/\[frasco:([^\]]+)\]/);
  if (match) {
    const jarId = match[1];
    const jar = savingsStore.jars.find(j => j.id === jarId);
    if (jar) {
      return jar.name;
    }
  }
  if (item.direction === 'out') {
    return item.type === 'dolares' ? 'Retiro de dólares' : 'Retiro de ahorro';
  }
  return item.type === 'dolares' ? 'Aporte en dólares' : 'Aporte de ahorro';
};

// Helper para el subtítulo de la nota sin la etiqueta de frasco
const getRecordSubtext = (item) => {
  const note = item.note || '';
  const cleaned = note.replace(/\[frasco:[^\]]+\]\s*/g, '').trim();
  return cleaned || null;
};

// Acciones para crear / editar frascos
const openCreateJarModal = () => {
  selectedJar.value = null;
  activeJarFormModal.value = true;
};

const openEditJarModal = (jar) => {
  selectedJar.value = { ...jar };
  activeJarFormModal.value = true;
};

const handleSaveJar = async (payload) => {
  try {
    if (selectedJar.value && selectedJar.value.id) {
      await savingsStore.updateJar(selectedJar.value.id, payload);
      Toast.fire({ icon: 'success', title: 'Frasco actualizado' });
    } else {
      await savingsStore.createJar(payload);
      Toast.fire({ icon: 'success', title: '¡Frasco creado con éxito!' });
    }
    activeJarFormModal.value = false;
    selectedJar.value = null;
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err?.response?.data?.message || err.message || 'No se pudo guardar el frasco'
    });
  }
};

const handleDeleteJar = async (jar) => {
  const hasBalance = Number(jar.balance || 0) > 0;
  const result = await Swal.fire({
    title: `¿Eliminar "${jar.name}"?`,
    text: hasBalance
      ? `Este frasco tiene ${formatCurrency(jar.balance)}. Primero retiralo o el dinero se mantendrá en tu historial.`
      : 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await savingsStore.deleteJar(jar.id);
      Toast.fire({ icon: 'success', title: 'Frasco eliminado' });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.response?.data?.message || err.message || 'No se pudo eliminar el frasco'
      });
    }
  }
};

// Acciones de Depósito / Retiro / Detalle
const openDepositModal = (jar) => {
  activeDepositJar.value = jar;
};

const handleSaveDeposit = async (payload) => {
  if (!activeDepositJar.value) return;
  try {
    await savingsStore.depositToJar(activeDepositJar.value.id, payload);
    activeDepositJar.value = null;
    Toast.fire({ icon: 'success', title: 'Dinero ingresado al frasco' });
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err?.response?.data?.message || err.message || 'No se pudo ingresar dinero'
    });
  }
};

const openWithdrawModal = (jar) => {
  activeWithdrawJar.value = jar;
};

const handleSaveWithdraw = async (payload) => {
  if (!activeWithdrawJar.value) return;
  try {
    await savingsStore.withdrawFromJar(activeWithdrawJar.value.id, payload);
    activeWithdrawJar.value = null;
    Toast.fire({ icon: 'success', title: 'Dinero retirado al balance disponible' });
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err?.response?.data?.message || err.message || 'No se pudo retirar dinero'
    });
  }
};

const openDetailModal = (jar) => {
  activeDetailJar.value = jar;
};

const confirmDeleteRecord = async (item) => {
  const result = await Swal.fire({
    title: '¿Eliminar movimiento?',
    text: 'Esta acción eliminará el registro del historial de ahorros.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await savingsStore.removeSaving(item.id);
      Toast.fire({ icon: 'success', title: 'Movimiento eliminado' });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.response?.data?.message || err.message || 'No se pudo eliminar el movimiento'
      });
    }
  }
};

onMounted(() => {
  void savingsStore.load();
});
</script>
