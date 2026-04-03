<template>
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overscroll-none"
    @click.self="$emit('close')"
    @keydown.esc="$emit('close')"
    role="dialog"
    aria-modal="true"
    aria-labelledby="income-modal-title"
  >
    <div
      class="modal-content bg-white rounded-2xl shadow-soft-lg max-w-lg w-full min-w-0 max-h-[90vh] overflow-y-auto overflow-x-hidden border border-slate-100"
      @wheel.stop
      @touchmove.stop
      role="document"
      ref="modalRef"
      tabindex="-1"
    >
      <div class="flex justify-between items-center p-6 border-b border-slate-100">
        <div>
          <h3 id="income-modal-title" class="text-lg font-bold text-slate-900">
            {{ income ? 'Editar Ingreso' : 'Nuevo Ingreso' }}
          </h3>
          <p class="text-sm text-slate-500 mt-0.5">{{ income ? 'Modifica los datos del ingreso' : 'Registra un nuevo ingreso' }}</p>
        </div>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl p-2 transition-all duration-200"
          aria-label="Cerrar modal"
          type="button"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-5 min-w-0" novalidate>
        <div>
          <label for="income-description" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Descripción
          </label>
          <div class="relative">
            <FileText class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="income-description"
              v-model="form.description"
              type="text"
              required
              class="input-field !pl-10"
              placeholder="Ej: Sueldo marzo, Freelance, etc."
            />
          </div>
        </div>

        <div>
          <label for="income-amount" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Monto
          </label>
          <div class="relative">
            <DollarSign class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="income-amount"
              v-model="form.amount"
              type="text"
              inputmode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              autocomplete="off"
              required
              class="input-field !pl-10"
              placeholder="0.00"
              @input="onAmountInput"
            />
          </div>
        </div>

        <div>
          <label for="income-date" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Fecha
          </label>
          <div class="relative min-w-0 w-full max-w-full">
            <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-[1]" />
            <input
              id="income-date"
              v-model="form.date"
              type="date"
              required
              class="input-field !pl-10"
            />
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
          <p class="text-sm font-semibold text-slate-800">Tipo de ingreso</p>
          <div class="space-y-2">
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                v-model="form.affectsCashBalance"
                type="radio"
                class="mt-1"
                :value="true"
              />
              <span>
                <span class="text-sm font-medium text-slate-800">Ingreso al balance (efectivo)</span>
                <span class="block text-xs text-slate-500 mt-0.5">
                  Sueldo, transferencias, préstamos, ventas, etc. Suma al balance y al gráfico de ingresos.
                </span>
              </span>
            </label>
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                v-model="form.affectsCashBalance"
                type="radio"
                class="mt-1"
                :value="false"
              />
              <span>
                <span class="text-sm font-medium text-slate-800">Crédito en tarjeta</span>
                <span class="block text-xs text-slate-500 mt-0.5">
                  Percepciones devueltas, reintegros o ajustes que acreditan la tarjeta. No suman al balance: reducen el consumo mostrado de esa tarjeta.
                </span>
              </span>
            </label>
          </div>

          <div v-if="!form.affectsCashBalance" class="pt-1">
            <label for="income-card" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Tarjeta de crédito
            </label>
            <select
              id="income-card"
              v-model="form.cardId"
              class="input-field w-full"
              :disabled="creditUserCards.length === 0"
            >
              <option value="" disabled>{{ creditUserCards.length ? 'Seleccioná una tarjeta' : 'No hay tarjetas de crédito vinculadas' }}</option>
              <option
                v-for="card in creditUserCards"
                :key="card.id"
                :value="card.available_card_id"
              >
                {{ card.available_card?.name }} · {{ card.available_card?.bank || '—' }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="error" class="bg-danger-50 border border-danger-100 rounded-xl p-4" role="alert">
          <p class="text-sm text-danger-700">{{ error }}</p>
        </div>

        <div class="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary inline-flex items-center justify-center min-w-[130px]"
          >
            <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            <span>{{ loading ? 'Guardando...' : (income ? 'Actualizar' : 'Crear Ingreso') }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useBodyScrollLock } from '@/composables/useBodyScrollLock.js'
import { useUserCardsStore } from '@/stores/userCards'
import { X, FileText, DollarSign, Calendar } from 'lucide-vue-next'

const props = defineProps({
  income: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const userCardsStore = useUserCardsStore()

const modalRef = ref(null)
const { lock: lockBodyScroll, unlock: unlockBodyScroll } = useBodyScrollLock()
const loading = ref(false)
const error = ref('')

const creditUserCards = computed(() =>
  (userCardsStore.cards || []).filter((c) => c.available_card?.type === 'Crédito')
)

const toLocalDateInputValue = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const form = ref({
  description: '',
  amount: '',
  date: toLocalDateInputValue(),
  affectsCashBalance: true,
  cardId: ''
})

const sanitizeAmount = (rawValue) => {
  const value = String(rawValue ?? '')
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '')
  const [intPart, ...rest] = value.split('.')
  const decimals = rest.join('')
  if (!rest.length) return intPart
  const safeInt = intPart === '' ? '0' : intPart
  return `${safeInt}.${decimals.slice(0, 2)}`
}

const onAmountInput = (event) => {
  const input = event?.target
  if (!input) return
  const next = sanitizeAmount(input.value)
  if (next !== input.value) input.value = next
  form.value.amount = next
}

const initForm = () => {
  if (props.income) {
    form.value = {
      description: props.income.description || '',
      amount: String(props.income.amount ?? ''),
      date: props.income.income_date || props.income.date || toLocalDateInputValue(),
      affectsCashBalance: props.income.affects_cash_balance !== false,
      cardId: props.income.card_id || ''
    }
  } else {
    form.value = {
      description: '',
      amount: '',
      date: toLocalDateInputValue(),
      affectsCashBalance: true,
      cardId: ''
    }
  }
  error.value = ''
}

watch(() => props.income, () => {
  initForm()
}, { immediate: true })

const handleSubmit = async () => {
  if (!form.value.description.trim()) {
    error.value = 'La descripción es obligatoria'
    return
  }
  const amount = parseFloat(form.value.amount)
  if (!amount || amount <= 0) {
    error.value = 'El monto debe ser mayor a 0'
    return
  }
  if (!form.value.date) {
    error.value = 'La fecha es obligatoria'
    return
  }
  if (!form.value.affectsCashBalance) {
    if (!form.value.cardId) {
      error.value = 'Seleccioná la tarjeta donde se acreditó el crédito'
      return
    }
  }

  loading.value = true
  error.value = ''

  try {
    const payload = {
      description: form.value.description.trim(),
      amount,
      income_date: form.value.date,
      affects_cash_balance: form.value.affectsCashBalance
    }
    if (!form.value.affectsCashBalance) {
      payload.card_id = form.value.cardId
    }
    emit('save', payload)
  } catch {
    error.value = 'Error al guardar el ingreso'
    loading.value = false
  }
}

onMounted(async () => {
  await userCardsStore.loadUserCards()
  lockBodyScroll()
  await nextTick()
  if (modalRef.value) modalRef.value.focus()
})

onBeforeUnmount(() => {
  unlockBodyScroll()
  loading.value = false
})
</script>
