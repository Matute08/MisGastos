<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Ahorros</h1>
      <p class="text-slate-500">Registra ahorro en pesos o compra de dolares con cotizacion.</p>
    </div>

    <div class="card space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="card-title">Nuevo ahorro</h3>
          <p class="card-subtitle">Estos movimientos no son gasto, se registran aparte.</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-500">Ahorro del mes</p>
          <p class="text-base font-bold text-emerald-600">{{ formatCurrency(savingsInCurrentMonth) }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
        <div class="md:col-span-3">
          <select v-model="form.type" class="input-field w-full">
            <option value="pesos">Ahorro en pesos</option>
            <option value="dolares">Compra de dolares</option>
          </select>
        </div>

        <div class="md:col-span-3">
          <input v-model="form.date" type="date" class="input-field w-full" />
        </div>

        <div class="md:col-span-4">
          <div v-if="form.type === 'pesos'">
            <input
              v-model="form.amountArs"
              type="number"
              min="0"
              step="0.01"
              class="input-field w-full"
              placeholder="Monto en ARS"
            />
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              v-model="form.dollars"
              type="number"
              min="0"
              step="0.01"
              class="input-field w-full"
              placeholder="USD comprados"
            />
            <input
              v-model="form.exchangeRate"
              type="number"
              min="0"
              step="0.01"
              class="input-field w-full"
              placeholder="Cotizacion"
            />
          </div>
          <p v-if="form.type === 'dolares'" class="mt-1 text-xs text-slate-500">
            Total en pesos: <span class="font-semibold text-slate-700">{{ formatCurrency(dollarPreviewArs) }}</span>
          </p>
        </div>

        <div class="md:col-span-2">
          <button @click="save" class="btn-primary w-full">{{ isEditing ? 'Actualizar' : 'Guardar' }}</button>
        </div>

        <div class="md:col-span-10">
          <input
            v-model="form.note"
            type="text"
            class="input-field w-full"
            placeholder="Nota opcional"
          />
        </div>
      </div>
    </div>

    <div class="card space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="card-title">Registrar uso de ahorros</h3>
          <p class="card-subtitle">Descuenta del total ahorrado sin editar registros anteriores.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
        <div class="md:col-span-3">
          <select v-model="usageForm.type" class="input-field w-full">
            <option value="pesos">Usar ahorro en pesos</option>
            <option value="dolares">Usar ahorro en dolares</option>
          </select>
        </div>
        <div class="md:col-span-3">
          <input v-model="usageForm.date" type="date" class="input-field w-full" />
        </div>
        <div class="md:col-span-4">
          <div v-if="usageForm.type === 'pesos'">
            <input
              v-model="usageForm.amountArs"
              type="number"
              min="0"
              step="0.01"
              class="input-field w-full"
              placeholder="Monto usado en ARS"
            />
            <p class="mt-1 text-xs text-slate-500">
              Disponible ARS: <span class="font-semibold">{{ formatCurrency(savingsStore.totalSavedArs) }}</span>
            </p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              v-model="usageForm.dollars"
              type="number"
              min="0"
              step="0.01"
              class="input-field w-full"
              placeholder="USD usados"
            />
            <input
              v-model="usageForm.exchangeRate"
              type="number"
              min="0"
              step="0.01"
              class="input-field w-full"
              placeholder="Cotizacion de uso"
            />
            <p class="sm:col-span-2 mt-1 text-xs text-slate-500">
              Disponible USD: <span class="font-semibold">{{ savingsStore.totalSavedUsd.toFixed(2) }}</span>
              · Total en pesos: <span class="font-semibold text-slate-700">{{ formatCurrency(usageDollarPreviewArs) }}</span>
            </p>
          </div>
        </div>
        <div class="md:col-span-2">
          <button @click="registerUsage" class="btn-primary w-full">Registrar uso</button>
        </div>
        <div class="md:col-span-10">
          <input
            v-model="usageForm.note"
            type="text"
            class="input-field w-full"
            placeholder="Nota opcional"
          />
        </div>
        <div
          v-if="usageError"
          class="md:col-span-12 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {{ usageError }}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Historial de ahorros</h3>
      </div>

      <div class="space-y-2 max-h-[28rem] overflow-y-auto">
        <div
          v-for="item in savingsStore.sortedRecords"
          :key="item.id"
          class="flex items-center justify-between rounded-lg border border-slate-200 p-3"
        >
          <div>
            <p class="text-sm font-semibold text-slate-800">
              {{ item.direction === 'out'
                ? (item.type === 'dolares' ? 'Uso de USD' : 'Uso de ARS')
                : (item.type === 'dolares' ? 'Compra USD' : 'Ahorro ARS') }}
            </p>
            <p class="text-xs text-slate-500">
              {{ formatDate(item.date) }}
              <span v-if="item.type === 'dolares'"> · {{ item.dollars }} USD @ {{ item.exchange_rate }}</span>
              <span v-if="item.note"> · {{ item.note }}</span>
            </p>
            <p class="text-xs mt-0.5" :class="item.status === 'ahorrado' ? 'text-emerald-600' : 'text-amber-600'">
              {{ item.status === 'ahorrado' ? 'Estado: Ahorrado' : 'Estado: Usado' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <p class="text-sm font-bold text-slate-700">{{ formatCurrency(item.amount_ars) }}</p>
            <button
              v-if="item.direction !== 'out'"
              @click="toggleStatus(item)"
              class="text-xs px-2 py-1 rounded-md border"
              :class="item.status === 'ahorrado' ? 'text-amber-700 border-amber-300 bg-amber-50' : 'text-emerald-700 border-emerald-300 bg-emerald-50'"
            >
              {{ item.status === 'ahorrado' ? 'Marcar usado' : 'Reactivar' }}
            </button>
            <button
              v-if="item.direction !== 'out'"
              @click="startEdit(item)"
              class="text-primary-600 hover:text-primary-700 text-xs px-2 py-1 rounded-md border border-primary-200 bg-primary-50"
            >
              Editar
            </button>
            <button @click="savingsStore.removeSaving(item.id)" class="text-danger-500 hover:text-danger-700">
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
        <p v-if="savingsStore.sortedRecords.length === 0" class="text-sm text-slate-500">
          Aun no hay ahorros registrados.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2 } from 'lucide-vue-next'
import { useSavingsStore } from '@/stores/savings'

const savingsStore = useSavingsStore()

const form = ref({
  type: 'pesos',
  date: new Date().toISOString().slice(0, 10),
  amountArs: '',
  dollars: '',
  exchangeRate: '',
  note: ''
})
const usageForm = ref({
  type: 'pesos',
  date: new Date().toISOString().slice(0, 10),
  amountArs: '',
  dollars: '',
  exchangeRate: '',
  note: ''
})
const editingId = ref(null)
const isEditing = computed(() => !!editingId.value)
const usageError = ref('')

watch(usageForm, () => {
  usageError.value = ''
}, { deep: true })

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount || 0)

const formatDate = (date) => format(parseISO(date), 'dd/MM/yyyy', { locale: es })

const savingsInCurrentMonth = computed(() => {
  const now = new Date()
  const m = now.getMonth() + 1
  const y = now.getFullYear()
  return savingsStore.records
    .filter((r) => {
      const d = new Date(r.date)
      return d.getMonth() + 1 === m && d.getFullYear() === y && (r.status || 'ahorrado') === 'ahorrado'
    })
    .reduce((sum, r) => sum + Number(r.amount_ars || 0), 0)
})

const dollarPreviewArs = computed(() =>
  Number(form.value.dollars || 0) * Number(form.value.exchangeRate || 0)
)

const usageDollarPreviewArs = computed(() =>
  Number(usageForm.value.dollars || 0) * Number(usageForm.value.exchangeRate || 0)
)

const save = () => {
  if (isEditing.value) {
    const payload = {
      type: form.value.type,
      date: form.value.date,
      note: form.value.note
    }
    if (form.value.type === 'dolares') {
      payload.dollars = form.value.dollars
      payload.exchange_rate = form.value.exchangeRate
    } else {
      payload.amount_ars = form.value.amountArs
    }
    savingsStore.updateSaving(editingId.value, payload)
  } else {
    if (form.value.type === 'dolares') {
      savingsStore.addDollarSaving({
        date: form.value.date,
        dollars: form.value.dollars,
        exchangeRate: form.value.exchangeRate,
        note: form.value.note
      })
    } else {
      savingsStore.addPesoSaving({
        date: form.value.date,
        amountArs: form.value.amountArs,
        note: form.value.note
      })
    }
  }

  editingId.value = null
  form.value.amountArs = ''
  form.value.dollars = ''
  form.value.exchangeRate = ''
  form.value.note = ''
}

const startEdit = (item) => {
  editingId.value = item.id
  form.value.type = item.type
  form.value.date = item.date
  form.value.note = item.note || ''
  if (item.type === 'dolares') {
    form.value.dollars = item.dollars || ''
    form.value.exchangeRate = item.exchange_rate || ''
    form.value.amountArs = ''
  } else {
    form.value.amountArs = item.amount_ars || ''
    form.value.dollars = ''
    form.value.exchangeRate = ''
  }
}

const toggleStatus = (item) => {
  savingsStore.toggleStatus(item.id)
}

const registerUsage = () => {
  usageError.value = ''

  if (usageForm.value.type === 'dolares') {
    const usdToUse = Number(usageForm.value.dollars || 0)
    const rate = Number(usageForm.value.exchangeRate || 0)
    const availableUsd = Number(savingsStore.totalSavedUsd || 0)

    if (!usdToUse || usdToUse <= 0) {
      usageError.value = 'Indicá cuántos dólares querés usar.'
      return
    }
    if (!rate || rate <= 0) {
      usageError.value = 'Indicá la cotización del uso en pesos.'
      return
    }
    if (usdToUse > availableUsd + 1e-6) {
      usageError.value = `No tenés suficientes dólares ahorrados. Disponible: ${availableUsd.toFixed(2)} USD.`
      return
    }
  } else {
    const arsToUse = Number(usageForm.value.amountArs || 0)
    const availableArs = Number(savingsStore.totalSavedArs || 0)

    if (!arsToUse || arsToUse <= 0) {
      usageError.value = 'Indicá cuántos pesos ahorrados querés usar.'
      return
    }
    if (arsToUse > availableArs + 0.01) {
      usageError.value = `No tenés suficiente ahorro en pesos. Disponible: ${formatCurrency(availableArs)}.`
      return
    }
  }

  savingsStore.registerUsage({
    type: usageForm.value.type,
    date: usageForm.value.date,
    amountArs: usageForm.value.amountArs,
    dollars: usageForm.value.dollars,
    exchangeRate: usageForm.value.exchangeRate,
    note: usageForm.value.note
  })

  usageForm.value.amountArs = ''
  usageForm.value.dollars = ''
  usageForm.value.exchangeRate = ''
  usageForm.value.note = ''
}

onMounted(() => {
  savingsStore.load()
})
</script>
