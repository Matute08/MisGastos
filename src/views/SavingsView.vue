<template>
  <div class="max-w-2xl mx-auto space-y-5">

    <!-- Encabezado -->
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-gray-100">Ahorros</h1>
      <p class="text-sm text-slate-500 dark:text-gray-400 mt-0.5">Registrá y gestioná tus ahorros en pesos y dólares.</p>
    </div>

    <!-- Tarjetas de resumen -->
    <div class="grid grid-cols-2 gap-3">
      <div class="card !p-4 space-y-1">
        <p class="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wide">Pesos ahorrados</p>
        <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight truncate">
          {{ formatCurrency(savingsStore.totalSavedArs) }}
        </p>
      </div>
      <div class="card !p-4 space-y-1">
        <p class="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wide">USD ahorrados</p>
        <p class="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums leading-tight">
          USD {{ savingsStore.totalSavedUsd.toFixed(2) }}
        </p>
      </div>
    </div>

    <!-- Acciones principales -->
    <div class="grid grid-cols-2 gap-3">
      <button @click="openModal('saving')" class="btn-primary flex items-center justify-center gap-2 py-3">
        <PiggyBank class="h-4 w-4 shrink-0" />
        <span>Nuevo ahorro</span>
      </button>
      <button @click="openModal('usage')" class="btn-secondary flex items-center justify-center gap-2 py-3">
        <ArrowDownCircle class="h-4 w-4 shrink-0" />
        <span>Registrar uso</span>
      </button>
    </div>

    <!-- Aviso de error de sync -->
    <p v-if="savingsStore.lastLoadError" class="text-xs text-amber-700 dark:text-amber-400 px-1">
      Sin conexión al servidor — mostrando datos locales.
    </p>

    <!-- Historial -->
    <div class="card !p-0 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
        <h3 class="card-title !text-base">Historial</h3>
        <span class="text-xs text-slate-400 dark:text-gray-500">
          {{ savingsStore.sortedRecords.length }}
          {{ savingsStore.sortedRecords.length === 1 ? 'registro' : 'registros' }}
        </span>
      </div>

      <div class="divide-y divide-slate-100 dark:divide-gray-700 max-h-[36rem] overflow-y-auto">
        <div
          v-for="item in savingsStore.sortedRecords"
          :key="item.id"
          class="px-5 py-3.5"
          :class="item.direction === 'out' ? 'bg-slate-50/60 dark:bg-gray-700/20' : ''"
        >
          <div class="flex items-start gap-3">
            <!-- Icono del tipo -->
            <div
              class="mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              :class="item.direction === 'out'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400'
                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'"
            >
              <TrendingDown v-if="item.direction === 'out'" class="h-4 w-4" />
              <TrendingUp v-else class="h-4 w-4" />
            </div>

            <!-- Texto -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-semibold text-slate-800 dark:text-gray-100 leading-snug">
                  {{ itemLabel(item) }}
                </p>
                <p
                  class="text-sm font-bold tabular-nums shrink-0"
                  :class="item.direction === 'out'
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-slate-700 dark:text-gray-200'"
                >
                  {{ item.direction === 'out' ? '-' : '' }}{{ formatCurrency(Math.abs(item.amount_ars)) }}
                </p>
              </div>
              <p class="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                {{ formatDate(item.date) }}
                <span v-if="item.type === 'dolares'">
                  · {{ Math.abs(item.dollars ?? 0) }} USD @ {{ item.exchange_rate }}
                </span>
                <span v-if="item.note"> · {{ item.note }}</span>
              </p>

              <!-- Estado + acciones -->
              <div class="flex items-center gap-2 mt-2 flex-wrap">
                <!-- Badge de estado -->
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="item.status === 'ahorrado'
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : item.status === 'retirado'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'"
                >
                  {{ item.status === 'ahorrado' ? 'Ahorrado' : item.status === 'retirado' ? 'Retirado' : 'Usado' }}
                </span>

                <!-- Botones de acción (solo para direction=in) -->
                <template v-if="item.direction !== 'out'">
                  <!-- "Marcar usado" solo si el ahorro está activo; no se permite reactivar -->
                  <button
                    v-if="item.status === 'ahorrado'"
                    @click="toggleStatus(item)"
                    type="button"
                    class="action-btn text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  >
                    Marcar usado
                  </button>

                  <button
                    v-if="item.status === 'ahorrado'"
                    @click="openModal('withdrawal', item)"
                    type="button"
                    class="action-btn text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <ArrowUpFromLine class="h-3 w-3" />
                    Retirar
                  </button>

                  <button
                    @click="openModal('edit', item)"
                    type="button"
                    class="action-btn text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  >
                    <Pencil class="h-3 w-3" />
                    Editar
                  </button>
                </template>

                <button
                  @click="deleteSaving(item.id)"
                  type="button"
                  class="action-btn ml-auto text-slate-400 dark:text-gray-500 border-slate-200 dark:border-gray-600 hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 class="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="savingsStore.sortedRecords.length === 0" class="py-12">
          <EmptyState
            icon="PiggyBank"
            title="No hay ahorros registrados"
            description="Comenzá registrando tu primer ahorro"
          />
        </div>
      </div>
    </div>

    <!-- Modal unificado -->
    <SavingsModal
      v-if="activeModal"
      :mode="activeModal.mode"
      :item="activeModal.item ?? null"
      @close="activeModal = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2, PiggyBank, ArrowDownCircle, TrendingUp, TrendingDown, Pencil, ArrowUpFromLine } from 'lucide-vue-next'
import { useSavingsStore } from '@/stores/savings'
import EmptyState from '@/components/EmptyState.vue'
import SavingsModal from '@/components/SavingsModal.vue'

const savingsStore = useSavingsStore()

const activeModal = ref(null)

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0)

const formatDate = (date) => format(parseISO(date), 'dd/MM/yyyy', { locale: es })

const itemLabel = (item) => {
  if (item.direction === 'out') {
    if (item.status === 'retirado') return item.type === 'dolares' ? 'Retiro USD' : 'Retiro ARS'
    return item.type === 'dolares' ? 'Uso de USD' : 'Uso de ARS'
  }
  return item.type === 'dolares' ? 'Compra USD' : 'Ahorro ARS'
}

const openModal = (mode, item = null) => {
  activeModal.value = { mode, item }
}

const toggleStatus = async (item) => {
  try {
    await savingsStore.toggleStatus(item.id)
  } catch (e) {
    console.error(e)
  }
}

const deleteSaving = async (id) => {
  try {
    await savingsStore.removeSaving(id)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  void savingsStore.load()
})
</script>

