import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { incomes as incomesApi } from '@/lib/api'

export const useIncomesStore = defineStore('incomes', () => {
  const incomes = ref([])
  /** Ingresos para el gráfico de evolución (varios meses/años), no pisa `incomes` */
  const incomesForChart = ref([])
  const loading = ref(false)
  const error = ref(null)

  const totalIncome = computed(() =>
    incomes.value
      .filter((inc) => inc.affects_cash_balance !== false)
      .reduce((sum, inc) => sum + parseFloat(inc.amount), 0)
  )

  /** Créditos en tarjeta (percepciones, devoluciones): no suman al balance de efectivo. */
  const totalCardCreditIncome = computed(() =>
    incomes.value
      .filter((inc) => inc.affects_cash_balance === false)
      .reduce((sum, inc) => sum + parseFloat(inc.amount), 0)
  )

  /** Carga ingresos por año y los deja en incomesForChart (para Dashboard Ingresos vs Gastos) */
  async function loadIncomesForChart(years = []) {
    if (!years.length) {
      incomesForChart.value = []
      return
    }
    try {
      const results = await Promise.all(
        years.map((y) => incomesApi.getIncomes({ year: y }))
      )
      const merged = (results || [])
        .flatMap((r) => r.data || [])
        .sort((a, b) => (a.income_date || a.date || '').localeCompare(b.income_date || b.date || ''))
      incomesForChart.value = merged
    } catch (err) {
      incomesForChart.value = []
    }
  }

  async function loadIncomes(filters = {}) {
    loading.value = true
    error.value = null
    try {
      const result = await incomesApi.getIncomes(filters)
      incomes.value = result.data || []
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createIncome(data) {
    try {
      const result = await incomesApi.createIncome(data)
      incomes.value.unshift(result.data)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function updateIncome(id, data) {
    try {
      const result = await incomesApi.updateIncome(id, data)
      const idx = incomes.value.findIndex(i => i.id === id)
      if (idx !== -1) incomes.value[idx] = result.data
      return result
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function deleteIncome(id) {
    try {
      await incomesApi.deleteIncome(id)
      incomes.value = incomes.value.filter(i => i.id !== id)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function getSummary(params = {}) {
    try {
      return await incomesApi.getSummary(params)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  return {
    incomes,
    incomesForChart,
    loading,
    error,
    totalIncome,
    totalCardCreditIncome,
    loadIncomes,
    loadIncomesForChart,
    createIncome,
    updateIncome,
    deleteIncome,
    getSummary,
  }
})
