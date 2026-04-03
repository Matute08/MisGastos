import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { savings as savingsApi } from '@/lib/api'

/** Solo para respaldo/migración cuando el usuario no está logueado o la API falla. */
const STORAGE_KEY = 'mg_savings_records_v1'

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function normalizeRecord(r) {
  if (!r) return r
  return {
    ...r,
    amount_ars: r.amount_ars != null ? toNumber(r.amount_ars) : 0,
    dollars: r.dollars != null ? toNumber(r.dollars) : undefined,
    exchange_rate: r.exchange_rate != null ? toNumber(r.exchange_rate) : undefined,
    status: r.status || 'ahorrado',
    direction: r.direction || 'in'
  }
}

function hasAuthToken() {
  return typeof localStorage !== 'undefined' && !!localStorage.getItem('token')
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return (parsed || []).map((r) => normalizeRecord({
      ...r,
      status: r.status || 'ahorrado',
      direction: r.direction || 'in'
    }))
  } catch {
    return []
  }
}

function persistToLocalStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

function legacyRowToCreateBody(r) {
  const direction = r.direction || 'in'
  const status = r.status || 'ahorrado'
  const note = r.note || ''
  const date = r.date
  if (r.type === 'dolares') {
    return {
      type: 'dolares',
      date,
      dollars: toNumber(r.dollars),
      exchange_rate: toNumber(r.exchange_rate),
      direction,
      status,
      note
    }
  }
  return {
    type: 'pesos',
    date,
    amount_ars: toNumber(r.amount_ars),
    direction,
    status,
    note
  }
}

export const useSavingsStore = defineStore('savings', () => {
  const records = ref([])
  const lastLoadError = ref(null)

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

  function reset() {
    records.value = []
    lastLoadError.value = null
  }

  async function migrateLocalToServerIfNeeded() {
    if (records.value.length > 0) return
    let parsed = []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      parsed = raw ? JSON.parse(raw) : []
    } catch {
      return
    }
    if (!Array.isArray(parsed) || parsed.length === 0) return

    for (const r of parsed) {
      const body = legacyRowToCreateBody(r)
      if (!body.date) continue
      const res = await savingsApi.create(body)
      if (!res?.success) {
        throw new Error(res?.error || 'No se pudo migrar ahorros locales')
      }
    }
    localStorage.removeItem(STORAGE_KEY)
    const again = await savingsApi.list()
    if (again?.success && Array.isArray(again.data)) {
      records.value = again.data.map(normalizeRecord)
    }
  }

  async function load() {
    lastLoadError.value = null
    if (!hasAuthToken()) {
      records.value = loadFromLocalStorage()
      return { success: true, source: 'local' }
    }
    try {
      const res = await savingsApi.list()
      if (!res?.success) {
        throw new Error(res?.error || 'Error al cargar ahorros')
      }
      records.value = (res.data || []).map(normalizeRecord)
      try {
        await migrateLocalToServerIfNeeded()
      } catch (e) {
        console.warn('[savings] Migración local ignorada:', e.message)
      }
      return { success: true, source: 'api' }
    } catch (e) {
      lastLoadError.value = e.message
      records.value = loadFromLocalStorage()
      return { success: false, source: 'local', error: e.message }
    }
  }

  async function addPesoSaving({ date, amountArs, note = '' }) {
    const amount = toNumber(amountArs)
    if (!date || amount <= 0) return

    if (hasAuthToken()) {
      const res = await savingsApi.create({
        type: 'pesos',
        date,
        amount_ars: amount,
        note,
        direction: 'in',
        status: 'ahorrado'
      })
      if (!res?.success) throw new Error(res?.error || 'No se pudo guardar el ahorro')
      records.value.push(normalizeRecord(res.data))
      return
    }

    records.value.push({
      id: crypto.randomUUID(),
      type: 'pesos',
      date,
      amount_ars: amount,
      note,
      status: 'ahorrado',
      direction: 'in'
    })
    persistToLocalStorage(records.value)
  }

  async function addDollarSaving({ date, dollars, exchangeRate, note = '' }) {
    const usd = toNumber(dollars)
    const rate = toNumber(exchangeRate)
    if (!date || usd <= 0 || rate <= 0) return

    if (hasAuthToken()) {
      const res = await savingsApi.create({
        type: 'dolares',
        date,
        dollars: usd,
        exchange_rate: rate,
        note,
        direction: 'in',
        status: 'ahorrado'
      })
      if (!res?.success) throw new Error(res?.error || 'No se pudo guardar el ahorro')
      records.value.push(normalizeRecord(res.data))
      return
    }

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
    persistToLocalStorage(records.value)
  }

  async function registerUsage({ type, date, amountArs, dollars, exchangeRate, note = '' }) {
    if (!date) return

    if (type === 'dolares') {
      const usd = toNumber(dollars)
      const rate = toNumber(exchangeRate)
      if (usd <= 0 || rate <= 0) return

      if (hasAuthToken()) {
        const res = await savingsApi.create({
          type: 'dolares',
          date,
          dollars: -usd,
          exchange_rate: rate,
          note,
          direction: 'out',
          status: 'ahorrado'
        })
        if (!res?.success) throw new Error(res?.error || 'No se pudo registrar el uso')
        records.value.push(normalizeRecord(res.data))
        return
      }

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

      if (hasAuthToken()) {
        const res = await savingsApi.create({
          type: 'pesos',
          date,
          amount_ars: -amount,
          note,
          direction: 'out',
          status: 'ahorrado'
        })
        if (!res?.success) throw new Error(res?.error || 'No se pudo registrar el uso')
        records.value.push(normalizeRecord(res.data))
        return
      }

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
    persistToLocalStorage(records.value)
  }

  async function updateSaving(id, payload) {
    const idx = records.value.findIndex((r) => r.id === id)
    if (idx === -1) return

    if (hasAuthToken()) {
      const body = {
        type: payload.type,
        date: payload.date,
        note: payload.note
      }
      if (payload.type === 'dolares') {
        body.dollars = toNumber(payload.dollars)
        body.exchange_rate = toNumber(payload.exchange_rate ?? payload.exchangeRate)
      } else {
        body.amount_ars = toNumber(payload.amount_ars)
      }
      const res = await savingsApi.update(id, body)
      if (!res?.success) throw new Error(res?.error || 'No se pudo actualizar')
      records.value[idx] = normalizeRecord(res.data)
      return
    }

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
    persistToLocalStorage(records.value)
  }

  async function toggleStatus(id) {
    const idx = records.value.findIndex((r) => r.id === id)
    if (idx === -1) return

    const current = records.value[idx]
    const nextStatus = (current.status || 'ahorrado') === 'ahorrado' ? 'usado' : 'ahorrado'

    if (hasAuthToken()) {
      const res = await savingsApi.update(id, { status: nextStatus })
      if (!res?.success) throw new Error(res?.error || 'No se pudo actualizar el estado')
      records.value[idx] = normalizeRecord(res.data)
      return
    }

    records.value[idx] = { ...current, status: nextStatus }
    persistToLocalStorage(records.value)
  }

  async function removeSaving(id) {
    if (hasAuthToken()) {
      const res = await savingsApi.remove(id)
      if (!res?.success) throw new Error(res?.error || 'No se pudo eliminar')
      records.value = records.value.filter((r) => r.id !== id)
      return
    }

    records.value = records.value.filter((r) => r.id !== id)
    persistToLocalStorage(records.value)
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

  /**
   * Lo que el dashboard resta del balance: solo aportes a ahorro (direction in) en el mes.
   * - No usamos los movimientos de uso (out): registrar un uso baja totalSavedArs pero no debe
   *   “devolver” dinero al balance.
   * - No filtramos por status: marcar in como usado no altera que ese aporte ya salió del flujo.
   */
  function netSavedInMonth(month, year) {
    const m = Number(month)
    const y = Number(year)
    return records.value
      .filter((r) => (r.direction || 'in') === 'in')
      .filter((r) => {
        const d = new Date(r.date)
        return d.getMonth() + 1 === m && d.getFullYear() === y
      })
      .reduce((sum, r) => sum + toNumber(r.amount_ars), 0)
  }

  function netSavedInYear(year) {
    const y = Number(year)
    return records.value
      .filter((r) => (r.direction || 'in') === 'in')
      .filter((r) => new Date(r.date).getFullYear() === y)
      .reduce((sum, r) => sum + toNumber(r.amount_ars), 0)
  }

  return {
    records,
    sortedRecords,
    totalSavedArs,
    totalSavedUsd,
    lastLoadError,
    reset,
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
