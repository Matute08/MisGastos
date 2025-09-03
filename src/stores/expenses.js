import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { expenses as expensesApi } from '@/lib/api'
import { useAuthStore } from './auth'
import { format, addMonths, parseISO } from 'date-fns'
import { useCardsStore } from './cards'

export const useExpensesStore = defineStore('expenses', () => {
  const expenses = ref([])
  const installments = ref([])
  const monthlyExpensesWithInstallments = ref([])
  const monthlyTotals = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({
    card_id: null,
    category_id: null,
    month: null,
    year: null,
    payment_status_code: null,
    payment_status_id: null
  })
  
  const authStore = useAuthStore()
  const upcomingInstallments = ref([])
  const creditCardsSummary = ref([])
  const expensesSummaryByType = ref([])
  const paymentStatuses = ref([])

  // Computed properties
  const filteredExpenses = computed(() => {
    let filtered = expenses.value

    if (filters.value.card_id) {
      filtered = filtered.filter(expense => expense.available_cards?.id === filters.value.card_id)
    }
    
    if (filters.value.category_id) {
      filtered = filtered.filter(expense => expense.categories?.id === filters.value.category_id)
    }
    
    if (filters.value.month) {
      filtered = filtered.filter(expense => expense.month === filters.value.month)
    }
    
    if (filters.value.year) {
      filtered = filtered.filter(expense => expense.year === filters.value.year)
    }
    
    if (filters.value.payment_status_code) {
      filtered = filtered.filter(expense => expense.payment_status_code === filters.value.payment_status_code)
    }

    return filtered
  })

  const totalExpenses = computed(() => 
    filteredExpenses.value.reduce((total, expense) => total + expense.amount, 0)
  )

  const expensesByCategory = computed(() => {
    const grouped = {}
    filteredExpenses.value.forEach(expense => {
      const categoryName = expense.categories?.name || 'Sin categoría'
      if (!grouped[categoryName]) {
        grouped[categoryName] = 0
      }
      grouped[categoryName] += expense.amount
    })
    return grouped
  })

  const expensesByCard = computed(() => {
    const grouped = {}
    filteredExpenses.value.forEach(expense => {
      const cardName = expense.available_cards?.name || 'Sin tarjeta'
      if (!grouped[cardName]) {
        grouped[cardName] = 0
      }
      grouped[cardName] += expense.amount
    })
    return grouped
  })

  // Computed para gastos con cuotas filtrados
  const filteredExpensesWithInstallments = computed(() => {
    // Los datos ya vienen filtrados del backend, no necesitamos aplicar filtros adicionales aquí
    // El backend maneja todos los filtros: card_id, category_id, payment_status_id, month, year
    return monthlyExpensesWithInstallments.value
  })

  // Computed para totales con cuotas
  const totalWithInstallments = computed(() => {
    if (!monthlyTotals.value) return 0
    return monthlyTotals.value.total_combined || 0
  })

  const totalExpensesOnly = computed(() => {
    if (!monthlyTotals.value) return 0
    return monthlyTotals.value.total_expenses || 0
  })

  const totalInstallmentsOnly = computed(() => {
    if (!monthlyTotals.value) return 0
    return monthlyTotals.value.total_installments || 0
  })

  // Computed para filtrar próximas cuotas del mes siguiente si las del mes actual ya están pagas
  const filteredUpcomingInstallments = computed(() => {
    if (!upcomingInstallments.value.length) return []
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const currentMonthInstallments = upcomingInstallments.value.filter(inst => {
      const due = parseISO(inst.due_date)
      return due.getMonth() + 1 === currentMonth && due.getFullYear() === currentYear
    })
    const allPaid = currentMonthInstallments.every(inst => inst.payment_status_id === 3) // 3: pagada
    if (currentMonthInstallments.length && !allPaid) {
      return currentMonthInstallments
    }
    // Si todas las del mes actual están pagas, mostrar las del mes siguiente
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
    return upcomingInstallments.value.filter(inst => {
      const due = parseISO(inst.due_date)
      return due.getMonth() + 1 === nextMonth && due.getFullYear() === nextYear
    })
  })

  // Cargar gastos
  const loadExpenses = async () => {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      const response = await expensesApi.getExpenses(authStore.user.id, filters.value)
      
      if (!response.success) {
        error.value = response.error || 'Error al cargar gastos'
        return { success: false, error: response.error || 'Error al cargar gastos' }
      }
      
      expenses.value = response.data || []
      return { success: true, data: response.data }
    } catch (err) {
      console.error('Error cargando gastos:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Cargar gastos con cuotas por mes
  const loadMonthlyExpensesWithInstallments = async (month, year, filters = {}) => {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      const response = await expensesApi.getMonthlyExpensesWithInstallments(
        authStore.user.id, 
        month, 
        year,
        filters
      )
      
      if (!response.success) {
        error.value = response.error || 'Error al cargar gastos mensuales'
        return { success: false, error: response.error || 'Error al cargar gastos mensuales' }
      }
      
      // Asegurar que accedemos al array real de gastos
      monthlyExpensesWithInstallments.value = response.data || []
      
      return { success: true, data: response.data }
    } catch (err) {
      console.error('Error cargando gastos mensuales:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Cargar totales mensuales con cuotas
  const loadMonthlyTotals = async (month, year, filters = {}) => {
    if (!authStore.user) return
    
    try {
      const response = await expensesApi.getMonthlyTotalWithInstallments(
        authStore.user.id, 
        month, 
        year,
        filters
      )
      
      if (!response.success) {
        console.error('Error al cargar totales:', response.error)
        return { success: false, error: response.error }
      }
      
      monthlyTotals.value = response.data?.[0] || null
      return { success: true, data: response.data?.[0] }
    } catch (err) {
      console.error('Error al cargar totales:', err)
      return { success: false, error: err.message }
    }
  }

  // Crear gasto con cuotas
  const createExpense = async (expenseData) => {
    if (!authStore.user) return { success: false, error: 'Usuario no autenticado' }
    
    loading.value = true
    error.value = null
    
    try {
      
      // Preparar datos para enviar al backend
      const expenseWithUserId = {
        ...expenseData,
        user_id: authStore.user.id
      }
      
      
      const response = await expensesApi.createExpense(expenseWithUserId)
      
      if (!response.success) {
        console.error('🔍 Frontend Store - Error al crear gasto:', response.error)
        error.value = response.error
        return { success: false, error: response.error }
      }
      
      
      const newExpense = response.data
      expenses.value.unshift(newExpense)
      
      // Recargar gastos para obtener los datos actualizados con cuotas
      await loadExpenses()
      
      return { success: true, data: newExpense }
    } catch (err) {
      console.error('🔍 Frontend Store - Error inesperado al crear gasto:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Actualizar gasto
  const updateExpense = async (id, updates) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await expensesApi.updateExpense(id, updates)
      
      if (!response.success) {
        error.value = response.error
        return { success: false, error: response.error }
      }
      
      const index = expenses.value.findIndex(expense => expense.id === id)
      if (index !== -1) {
        expenses.value[index] = response.data
      }
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Eliminar gasto
  const deleteExpense = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await expensesApi.deleteExpense(id)
      
      if (!response.success) {
        error.value = response.error
        return { success: false, error: response.error }
      }
      
      expenses.value = expenses.value.filter(expense => expense.id !== id)
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Marcar gasto como pagado
  const markAsPaid = async (id, payment_status_id) => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: apiError } = await expensesApi.markAsPaid(id, payment_status_id)
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      const index = expenses.value.findIndex(expense => expense.id === id)
      if (index !== -1) {
        expenses.value[index] = data[0]
      }
      
      return { success: true, data: data[0] }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }



  // Cargar cuotas de un gasto
  const loadInstallments = async (expenseId) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await expensesApi.getInstallments(expenseId)
      
      if (!response.success) {
        error.value = response.error
        return { success: false, error: response.error }
      }
      
      installments.value = response.data || []
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Función para marcar cuota como pagada/pendiente usando payment_status_id
  const markInstallmentAsPaid = async (id, payment_status_id) => {
    loading.value = true
    error.value = null
    try {
      // Extraer el ID real si viene con prefijo
      let actualId = id;
      if (id.startsWith('installment-')) {
        actualId = id.replace('installment-', '');
      }
      
      const response = await expensesApi.markInstallmentAsPaid(actualId, payment_status_id)
      
      if (response.error) {
        error.value = response.error
        return { success: false, error: response.error }
      }
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.message
      console.error('[markInstallmentAsPaid] Error inesperado:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Cargar próximas cuotas a vencer
  const loadUpcomingInstallments = async (limit = 10) => {
    if (!authStore.user) return
    loading.value = true
    error.value = null
    try {
      const response = await expensesApi.getUpcomingInstallments(authStore.user.id, limit)
      if (!response.success) {
        error.value = response.error
        return { success: false, error: response.error }
      }
      upcomingInstallments.value = response.data || []
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Cargar resumen de tarjetas de crédito
  const loadCreditCardsSummary = async (isAnnual = false) => {
    if (!authStore.user) return
    loading.value = true
    error.value = null
    try {
      const response = await expensesApi.getCreditCardsSummary(isAnnual)
      if (!response.success) {
        error.value = response.error
        return { success: false, error: response.error }
      }
      creditCardsSummary.value = response.data || []
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Cargar resumen por tipo de tarjeta
  const loadExpensesSummaryByType = async (isAnnual = false) => {
    if (!authStore.user) return
    loading.value = true
    error.value = null
    try {
      const response = await expensesApi.getExpensesSummaryByType(isAnnual)
      if (!response.success) {
        error.value = response.error
        return { success: false, error: response.error }
      }
      expensesSummaryByType.value = response.data || []
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Cargar todos los estados de pago
  const loadPaymentStatuses = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await expensesApi.getAllPaymentStatuses()
      if (!response.success) {
        return { success: false, error: response.error }
      }
      paymentStatuses.value = response.data || []
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Actualizar filtros
  const updateFilters = (newFilters) => {
    let payment_status_code = newFilters.payment_status_code || null
    filters.value = { ...filters.value, ...newFilters, payment_status_code }
  }

  // Limpiar filtros
  const clearFilters = () => {
    filters.value = {
      card_id: null,
      category_id: null,
      month: null,
      year: null,
      payment_status_code: null,
      payment_status_id: null
    }
  }

  // Limpiar datos mensuales
  const clearMonthlyData = () => {
    // Limpiar datos de manera más agresiva
    monthlyExpensesWithInstallments.value = []
    monthlyTotals.value = null
    
    // Forzar reactividad múltiples veces
    setTimeout(() => {
      monthlyExpensesWithInstallments.value = []
    }, 0)
    
    setTimeout(() => {
      monthlyExpensesWithInstallments.value = []
    }, 10)
    
    setTimeout(() => {
      monthlyExpensesWithInstallments.value = []
    }, 50)
  }

  // Limpiar error
  const clearError = () => {
    error.value = null
  }

  return {
    expenses,
    installments,
    monthlyExpensesWithInstallments,
    monthlyTotals,
    loading,
    error,
    filters,
    filteredExpenses,
    filteredExpensesWithInstallments,
    totalExpenses,
    totalWithInstallments,
    totalExpensesOnly,
    totalInstallmentsOnly,
    expensesByCategory,
    expensesByCard,
    loadExpenses,
    loadMonthlyExpensesWithInstallments,
    loadMonthlyTotals,
    createExpense,
    updateExpense,
    deleteExpense,
    markAsPaid,
    loadInstallments,
    markInstallmentAsPaid,
    updateFilters,
    clearFilters,
    clearMonthlyData,
    clearError,
    upcomingInstallments,
    loadUpcomingInstallments,
    filteredUpcomingInstallments,
    creditCardsSummary,
    loadCreditCardsSummary,
    expensesSummaryByType,
    loadExpensesSummaryByType,
    paymentStatuses,
    loadPaymentStatuses
  }
}) 