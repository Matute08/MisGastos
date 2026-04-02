import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'mg_savings_records_v1'

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export const useSavingsStore = defineStore('savings', () => {
  const records = ref([])

  const sortedRecords = computed(() =>
    [...records.value].sort((a, b) => new Date(b.date) - new Date(a.date))
  )

  const totalSavedArs = computed(() =>
    records.value
      .filter((r) => (r.status || 'ahorrado') === 'ahorrado')
      .reduce((sum, r) => sum + toNumber(r.amount_ars), 0)
  )

  const totalSavedUsd = computed(() =>
    records.value
      .filter((r) => (r.status || 'ahorrado') === 'ahorrado' && r.type === 'dolares')
      .reduce((sum, r) => sum + toNumber(r.dollars), 0)
  )

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      records.value = (parsed || []).map((r) => ({
        ...r,
        status: r.status || 'ahorrado',
        direction: r.direction || 'in'
      }))
    } catch {
      records.value = []
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
  }

  function addPesoSaving({ date, amountArs, note = '' }) {
    const amount = toNumber(amountArs)
    if (!date || amount <= 0) return
    records.value.push({
      id: crypto.randomUUID(),
      type: 'pesos',
      date,
      amount_ars: amount,
      note,
      status: 'ahorrado',
      direction: 'in'
    })
    persist()
  }

  function addDollarSaving({ date, dollars, exchangeRate, note = '' }) {
    const usd = toNumber(dollars)
    const rate = toNumber(exchangeRate)
    if (!date || usd <= 0 || rate <= 0) return
    records.value.push({
      id: crypto.randomUUID(),
      type: 'dolares',
      date,
      dollars: usd,
      exchange_rate: rate,
      amount_ars: usd * rate,
      note,
      status: 'ahorrado',
      direction: 'in'
    })
    persist()
  }

  function registerUsage({ type, date, amountArs, dollars, exchangeRate, note = '' }) {
    if (!date) return
    if (type === 'dolares') {
      const usd = toNumber(dollars)
      const rate = toNumber(exchangeRate)
      if (usd <= 0 || rate <= 0) return
      records.value.push({
        id: crypto.randomUUID(),
        type: 'dolares',
        date,
        dollars: -usd,
        exchange_rate: rate,
        amount_ars: -(usd * rate),
        note,
        status: 'ahorrado',
        direction: 'out'
      })
    } else {
      const amount = toNumber(amountArs)
      if (amount <= 0) return
      records.value.push({
        id: crypto.randomUUID(),
        type: 'pesos',
        date,
        amount_ars: -amount,
        note,
        status: 'ahorrado',
        direction: 'out'
      })
    }
    persist()
  }

  function updateSaving(id, payload) {
    const idx = records.value.findIndex((r) => r.id === id)
    if (idx === -1) return
    const current = records.value[idx]
    const next = { ...current, ...payload }
    if (next.type === 'dolares') {
      const usd = toNumber(next.dollars)
      const rate = toNumber(next.exchange_rate)
      next.dollars = usd
      next.exchange_rate = rate
      next.amount_ars = usd * rate
    } else {
      next.amount_ars = toNumber(next.amount_ars)
      delete next.dollars
      delete next.exchange_rate
    }
    records.value[idx] = next
    persist()
  }

  function toggleStatus(id) {
    const idx = records.value.findIndex((r) => r.id === id)
    if (idx === -1) return
    const current = records.value[idx]
    records.value[idx] = {
      ...current,
      status: (current.status || 'ahorrado') === 'ahorrado' ? 'usado' : 'ahorrado'
    }
    persist()
  }

  function removeSaving(id) {
    records.value = records.value.filter(r => r.id !== id)
    persist()
  }

  function getTotalSavedUntil(year, month) {
    const y = Number(year)
    const m = Number(month)
    return records.value
      .filter((r) => {
        if ((r.status || 'ahorrado') !== 'ahorrado') return false
        const d = new Date(r.date)
        const ry = d.getFullYear()
        const rm = d.getMonth() + 1
        return ry < y || (ry === y && rm <= m)
      })
      .reduce((sum, r) => sum + toNumber(r.amount_ars), 0)
  }

  /** Neto de movimientos de ahorro en el mes (entradas − usos), solo registros con estado ahorrado. */
  function netSavedInMonth(month, year) {
    const m = Number(month)
    const y = Number(year)
    return records.value
      .filter((r) => (r.status || 'ahorrado') === 'ahorrado')
      .filter((r) => {
        const d = new Date(r.date)
        return d.getMonth() + 1 === m && d.getFullYear() === y
      })
      .reduce((sum, r) => sum + toNumber(r.amount_ars), 0)
  }

  function netSavedInYear(year) {
    const y = Number(year)
    return records.value
      .filter((r) => (r.status || 'ahorrado') === 'ahorrado')
      .filter((r) => new Date(r.date).getFullYear() === y)
      .reduce((sum, r) => sum + toNumber(r.amount_ars), 0)
  }

  return {
    records,
    sortedRecords,
    totalSavedArs,
    totalSavedUsd,
    load,
    addPesoSaving,
    addDollarSaving,
    registerUsage,
    updateSaving,
    toggleStatus,
    removeSaving,
    getTotalSavedUntil,
    netSavedInMonth,
    netSavedInYear
  }
})
