<template>
  <Transition name="modal">
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="$emit('close')"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="modal-content bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl border border-slate-100 dark:border-gray-700 flex flex-col"
        style="max-height: min(88vh, 640px)"
        @wheel.stop
        @touchmove.stop
      >
        <!-- Header fijo -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-gray-700 shrink-0">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-gray-100">{{ modalTitle }}</h3>
            <p class="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{{ modalSubtitle }}</p>
          </div>
          <button
            @click="$emit('close')"
            type="button"
            class="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Cuerpo scrolleable -->
        <form @submit.prevent="handleSubmit" class="overflow-y-auto p-5 space-y-4">

          <!-- ── MODO SAVING ── -->
          <template v-if="mode === 'saving'">
            <div>
              <label class="lbl">Tipo</label>
              <select v-model="form.type" class="input-field">
                <option value="pesos">Ahorro en pesos</option>
                <option value="dolares">Compra de dólares</option>
              </select>
            </div>

            <div v-if="isPesos">
              <label class="lbl">Monto en ARS</label>
              <div class="relative">
                <span class="abs-prefix">$</span>
                <input v-model="form.amountArs" type="number" min="0" step="0.01" inputmode="decimal" class="input-field !pl-7" placeholder="0" required />
              </div>
            </div>
            <template v-else>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="lbl">USD comprados</label>
                  <input v-model="form.dollars" type="number" min="0" step="0.01" inputmode="decimal" class="input-field" placeholder="0" required />
                </div>
                <div>
                  <label class="lbl">Cotización</label>
                  <input v-model="form.exchangeRate" type="number" min="0" step="0.01" inputmode="decimal" class="input-field" placeholder="0" required />
                </div>
              </div>
              <p v-if="previewArs > 0" class="text-xs text-slate-500 dark:text-gray-400 -mt-2">
                Total en pesos: <span class="font-semibold text-slate-700 dark:text-gray-300">{{ formatCurrency(previewArs) }}</span>
              </p>
            </template>

            <div>
              <label class="lbl">Fecha</label>
              <input v-model="form.date" type="date" class="input-field" required />
            </div>
            <div>
              <label class="lbl">Nota <span class="font-normal text-slate-400">(opcional)</span></label>
              <input v-model="form.note" type="text" class="input-field" placeholder="Ej: en frasco, para vacaciones…" />
            </div>
          </template>

          <!-- ── MODO USAGE ── -->
          <template v-else-if="mode === 'usage'">
            <!-- Tipo para filtrar la lista -->
            <div>
              <label class="lbl">Tipo</label>
              <select v-model="form.type" class="input-field" @change="onTypeChange">
                <option value="pesos">Usar ahorro en pesos</option>
                <option value="dolares">Usar ahorro en dólares</option>
              </select>
            </div>

            <!-- Lista de ahorros disponibles para seleccionar -->
            <div>
              <label class="lbl">¿De cuál ahorro?</label>

              <div v-if="availableSavings.length === 0" class="rounded-xl border border-slate-200 dark:border-gray-600 p-4 text-center">
                <p class="text-sm text-slate-500 dark:text-gray-400">
                  No hay ahorros en {{ form.type === 'pesos' ? 'pesos' : 'dólares' }} disponibles.
                </p>
              </div>

              <div v-else class="space-y-2 max-h-44 overflow-y-auto pr-0.5">
                <button
                  v-for="s in availableSavings"
                  :key="s.id"
                  type="button"
                  @click="selectSaving(s)"
                  class="w-full text-left px-3.5 py-3 rounded-xl border transition-all"
                  :class="selectedSavingId === s.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500'
                    : 'border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500'"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-slate-800 dark:text-gray-100 leading-tight truncate">
                        {{ s.note || formatDate(s.date) }}
                      </p>
                      <p class="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                        {{ s.note ? formatDate(s.date) : '' }}
                      </p>
                    </div>
                    <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0 tabular-nums">
                      {{ s.type === 'dolares' ? `${toNumber(s.dollars).toFixed(2)} USD` : formatCurrency(s.amount_ars) }}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <!-- Monto a usar (solo si hay ahorro seleccionado) -->
            <template v-if="selectedSaving">
              <div v-if="isPesos">
                <label class="lbl">
                  Monto a usar
                  <span class="font-normal text-slate-400">· máx {{ formatCurrency(selectedSaving.amount_ars) }}</span>
                </label>
                <div class="relative">
                  <span class="abs-prefix">$</span>
                  <input
                    v-model="form.amountArs"
                    type="number"
                    min="0.01"
                    :max="selectedSaving.amount_ars"
                    step="0.01"
                    inputmode="decimal"
                    class="input-field !pl-7"
                    placeholder="0"
                    required
                  />
                </div>
                <p v-if="form.amountArs && Number(form.amountArs) >= selectedSaving.amount_ars - 0.01" class="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  Se usará el total — el ahorro quedará marcado como Usado.
                </p>
              </div>
              <template v-else>
                <div>
                  <label class="lbl">
                    USD a usar
                    <span class="font-normal text-slate-400">· máx {{ toNumber(selectedSaving.dollars).toFixed(2) }} USD</span>
                  </label>
                  <input
                    v-model="form.dollars"
                    type="number"
                    min="0.01"
                    :max="selectedSaving.dollars"
                    step="0.01"
                    inputmode="decimal"
                    class="input-field"
                    placeholder="0"
                    required
                  />
                </div>
                <p v-if="form.dollars && Number(form.dollars) >= toNumber(selectedSaving.dollars) - 1e-6" class="text-xs text-amber-600 dark:text-amber-400 -mt-2">
                  Se usará el total — el ahorro quedará marcado como Usado.
                </p>
              </template>

              <div>
                <label class="lbl">Fecha del uso</label>
                <input v-model="form.date" type="date" class="input-field" required />
              </div>
              <div>
                <label class="lbl">Nota <span class="font-normal text-slate-400">(opcional)</span></label>
                <input v-model="form.note" type="text" class="input-field" placeholder="Ej: pago tarjeta, retiro..." />
              </div>
            </template>
          </template>

          <!-- ── MODO EDIT ── -->
          <template v-else>
            <!-- Badge tipo -->
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                :class="item.direction === 'in'
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'"
              >
                {{ item.direction === 'in'
                  ? (item.type === 'dolares' ? 'Compra USD' : 'Ahorro ARS')
                  : (item.type === 'dolares' ? 'Uso USD' : 'Uso ARS') }}
              </span>
            </div>

            <div v-if="isPesos">
              <label class="lbl">Monto en ARS</label>
              <div class="relative">
                <span class="abs-prefix">$</span>
                <input v-model="form.amountArs" type="number" min="0" step="0.01" inputmode="decimal" class="input-field !pl-7" placeholder="0" required />
              </div>
            </div>
            <template v-else>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="lbl">USD</label>
                  <input v-model="form.dollars" type="number" min="0" step="0.01" inputmode="decimal" class="input-field" placeholder="0" required />
                </div>
                <div>
                  <label class="lbl">Cotización</label>
                  <input v-model="form.exchangeRate" type="number" min="0" step="0.01" inputmode="decimal" class="input-field" placeholder="0" required />
                </div>
              </div>
              <p v-if="previewArs > 0" class="text-xs text-slate-500 dark:text-gray-400 -mt-2">
                Total: <span class="font-semibold text-slate-700 dark:text-gray-300">{{ formatCurrency(previewArs) }}</span>
              </p>
            </template>

            <div>
              <label class="lbl">Fecha</label>
              <input v-model="form.date" type="date" class="input-field" required />
            </div>
            <div>
              <label class="lbl">Nota <span class="font-normal text-slate-400">(opcional)</span></label>
              <input v-model="form.note" type="text" class="input-field" placeholder="Ej: en frasco, para vacaciones…" />
            </div>
          </template>

          <!-- Error -->
          <p v-if="error" class="text-sm text-red-600 dark:text-red-400 rounded-xl bg-red-50 dark:bg-red-900/20 px-3 py-2.5 border border-red-200 dark:border-red-800">
            {{ error }}
          </p>

          <!-- Acciones -->
          <div class="flex gap-3 pt-1">
            <button type="button" @click="$emit('close')" class="btn-secondary flex-1">Cancelar</button>
            <button
              type="submit"
              :disabled="loading || (mode === 'usage' && !selectedSavingId)"
              class="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Guardando…' : submitLabel }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSavingsStore } from '@/stores/savings'

const props = defineProps({
  mode: { type: String, required: true }, // 'saving' | 'usage' | 'edit'
  item: { type: Object, default: null }
})
const emit = defineEmits(['close'])

const savingsStore = useSavingsStore()

const toLocalDateInputValue = (date = new Date()) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const toNumber = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }

const form = ref({
  type: 'pesos',
  date: toLocalDateInputValue(),
  amountArs: '',
  dollars: '',
  exchangeRate: '',
  note: ''
})

const selectedSavingId = ref(null)
const loading = ref(false)
const error = ref('')

// Ahorros disponibles filtrados por tipo (solo direction='in' y status='ahorrado')
const availableSavings = computed(() =>
  savingsStore.records.filter(
    (r) => r.direction !== 'out' && (r.status || 'ahorrado') === 'ahorrado' && r.type === form.value.type
  ).sort((a, b) => new Date(b.date) - new Date(a.date))
)

const selectedSaving = computed(() =>
  selectedSavingId.value ? savingsStore.records.find((r) => r.id === selectedSavingId.value) : null
)

const isPesos = computed(() => {
  if (props.mode === 'edit') return props.item?.type === 'pesos'
  return form.value.type === 'pesos'
})

const previewArs = computed(() =>
  toNumber(form.value.dollars) * toNumber(form.value.exchangeRate)
)

const modalTitle = computed(() => {
  if (props.mode === 'saving') return 'Nuevo ahorro'
  if (props.mode === 'usage') return 'Registrar uso'
  return 'Editar ahorro'
})

const modalSubtitle = computed(() => {
  if (props.mode === 'saving') return 'Estos movimientos no son gasto.'
  if (props.mode === 'usage') return 'Seleccioná el ahorro del que usaste dinero.'
  return 'Modificá los datos del registro.'
})

const submitLabel = computed(() => {
  if (props.mode === 'saving') return 'Guardar ahorro'
  if (props.mode === 'usage') return 'Registrar uso'
  return 'Guardar cambios'
})

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0)

const formatDate = (d) => format(parseISO(d), "dd 'de' MMM yyyy", { locale: es })

function onTypeChange() {
  selectedSavingId.value = null
  form.value.amountArs = ''
  form.value.dollars = ''
}

function selectSaving(s) {
  selectedSavingId.value = s.id
  // Pre-llenar el monto con el valor completo del ahorro seleccionado
  if (s.type === 'dolares') {
    form.value.dollars = String(toNumber(s.dollars))
  } else {
    form.value.amountArs = String(toNumber(s.amount_ars))
  }
}

// Al cambiar el tipo de ahorro disponible, resetear selección si la guardada ya no aplica
watch(() => form.value.type, () => {
  if (selectedSaving.value && selectedSaving.value.type !== form.value.type) {
    selectedSavingId.value = null
    form.value.amountArs = ''
    form.value.dollars = ''
  }
})

onMounted(() => {
  document.body.classList.add('overflow-hidden')
  if (props.mode === 'edit' && props.item) {
    form.value.date = props.item.date
    form.value.note = props.item.note || ''
    if (props.item.type === 'dolares') {
      form.value.dollars = String(Math.abs(toNumber(props.item.dollars)))
      form.value.exchangeRate = String(toNumber(props.item.exchange_rate))
    } else {
      form.value.amountArs = String(Math.abs(toNumber(props.item.amount_ars)))
    }
  }
})

onUnmounted(() => {
  document.body.classList.remove('overflow-hidden')
})

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (props.mode === 'saving') {
      if (form.value.type === 'dolares') {
        await savingsStore.addDollarSaving({
          date: form.value.date,
          dollars: form.value.dollars,
          exchangeRate: form.value.exchangeRate,
          note: form.value.note
        })
      } else {
        await savingsStore.addPesoSaving({
          date: form.value.date,
          amountArs: form.value.amountArs,
          note: form.value.note
        })
      }
    } else if (props.mode === 'usage') {
      if (!selectedSavingId.value) {
        error.value = 'Seleccioná un ahorro primero.'
        return
      }
      const amountToConsume = isPesos.value ? form.value.amountArs : form.value.dollars
      if (!amountToConsume || toNumber(amountToConsume) <= 0) {
        error.value = 'Ingresá el monto a usar.'
        return
      }

      // Si el usuario cambió la fecha o nota, actualizamos la nota en el registro antes de consumir
      // El consumo reduce el monto o marca como usado
      await savingsStore.consumeFromSaving(selectedSavingId.value, amountToConsume)

      // Si además tiene nota de uso, la podemos guardar como nota en el registro resultante
      // (consumeFromSaving ya llama a updateSaving internamente con la nota original)
    } else if (props.mode === 'edit') {
      const payload = {
        type: props.item.type,
        date: form.value.date,
        note: form.value.note
      }
      if (props.item.type === 'dolares') {
        payload.dollars = toNumber(form.value.dollars)
        payload.exchange_rate = toNumber(form.value.exchangeRate)
      } else {
        payload.amount_ars = toNumber(form.value.amountArs)
      }
      await savingsStore.updateSaving(props.item.id, payload)
    }
    emit('close')
  } catch (e) {
    error.value = e?.message || 'Ocurrió un error. Intentá de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>

<style>
/* Helpers usados solo en este componente pero definidos globalmente para Tailwind v4 */
</style>
