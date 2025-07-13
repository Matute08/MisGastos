import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { expenses as expensesApi, installments as installmentsApi } from '@/lib/supabase'
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
    payment_status_code: null
  })
  
  const authStore = useAuthStore()
  const upcomingInstallments = ref([])

  // Computed properties
  const filteredExpenses = computed(() => {
    let filtered = expenses.value

    if (filters.value.card_id) {
      filtered = filtered.filter(expense => expense.card_id === filters.value.card_id)
    }
    
    if (filters.value.category_id) {
      filtered = filtered.filter(expense => expense.category_id === filters.value.category_id)
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
      const cardName = expense.cards?.name || 'Sin tarjeta'
      if (!grouped[cardName]) {
        grouped[cardName] = 0
      }
      grouped[cardName] += expense.amount
    })
    return grouped
  })

  // Computed para gastos con cuotas filtrados
  const filteredExpensesWithInstallments = computed(() => {
    let filtered = monthlyExpensesWithInstallments.value

    if (filters.value.card_id) {
      filtered = filtered.filter(item => item.card_id === filters.value.card_id)
    }
    
    if (filters.value.category_id) {
      filtered = filtered.filter(item => item.category_id === filters.value.category_id)
    }
    
    if (filters.value.payment_status_code) {
      filtered = filtered.filter(item => item.payment_status_code === filters.value.payment_status_code)
    }

    return filtered
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
      const { data, error: apiError } = await expensesApi.getExpenses(authStore.user.id, filters.value)
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      expenses.value = data || []
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Cargar gastos con cuotas por mes
  const loadMonthlyExpensesWithInstallments = async (month, year) => {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      const { data, error: apiError } = await installmentsApi.getMonthlyExpensesWithInstallments(
        authStore.user.id, 
        month, 
        year
      )
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      monthlyExpensesWithInstallments.value = data || []
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Cargar totales mensuales con cuotas
  const loadMonthlyTotals = async (month, year) => {
    if (!authStore.user) return
    
    try {
      const { data, error: apiError } = await installmentsApi.getMonthlyTotalWithInstallments(
        authStore.user.id, 
        month, 
        year
      )
      
      if (apiError) {
        console.error('Error al cargar totales:', apiError)
        return { success: false, error: apiError.message }
      }
      
      monthlyTotals.value = data?.[0] || null
      return { success: true, data: data?.[0] }
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
      // Eliminar el campo auxiliar antes de guardar en la base
      const { first_installment_date, ...expenseToSave } = expenseData
      const expenseWithUserId = {
        ...expenseToSave,
        user_id: authStore.user.id
      }
      
      console.log('Creando gasto con datos:', expenseWithUserId)
      
      const { data, error: apiError } = await expensesApi.createExpense(expenseWithUserId)
      
      if (apiError) {
        console.error('Error al crear gasto:', apiError)
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      console.log('Gasto creado exitosamente:', data)
      
      const newExpense = data[0]
      expenses.value.unshift(newExpense)
      
      // Recargar gastos para obtener los datos actualizados con cuotas
      await loadExpenses()
      
      return { success: true, data: newExpense }
    } catch (err) {
      console.error('Error inesperado al crear gasto:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Crear cuotas para un gasto
  const createInstallmentsForExpense = async (expense, expenseData) => {
    const { card_id, amount, installments_count, purchase_date, first_installment_date } = expenseData
    
    // Obtener información de la tarjeta para calcular las fechas de cierre
    const cardsStore = useCardsStore()
    const card = cardsStore.getCardById(card_id)
    
    if (!card || card.type !== 'Crédito') return
    
    // Usar la fecha manual si existe, si no, calcular como antes
    let firstDate
    if (first_installment_date) {
      firstDate = parseISO(first_installment_date)
    } else {
      const purchaseDate = parseISO(purchase_date)
      const closingDay = card.closing_day
      // Calcular el cierre más próximo
      let cierre = new Date(purchaseDate)
      cierre.setDate(closingDay)
      if (purchaseDate.getDate() >= closingDay) {
        // Si la compra es el día del cierre o después, el cierre es el mes siguiente
        cierre.setMonth(cierre.getMonth() + 1)
      }
      // La primer cuota vence el mes siguiente al cierre
      firstDate = new Date(cierre)
      firstDate.setMonth(firstDate.getMonth() + 1)
    }
    const installmentAmount = amount / installments_count
    
    // Crear las cuotas
    const installmentsData = []
    for (let i = 0; i < installments_count; i++) {
      const dueDate = addMonths(firstDate, i)
      installmentsData.push({
        expense_id: expense.id,
        installment_number: i + 1,
        amount: installmentAmount,
        due_date: format(dueDate, 'yyyy-MM-dd'),
        payment_status_id: 1 // 1 = pendiente
      })
    }
    
    const { error: apiError } = await installmentsApi.createInstallments(installmentsData)
    
    if (apiError) {
      console.error('Error al crear cuotas:', apiError)
    }
  }

  // Actualizar gasto
  const updateExpense = async (id, updates) => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: apiError } = await expensesApi.updateExpense(id, updates)
      
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

  // Eliminar gasto
  const deleteExpense = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const { error: apiError } = await expensesApi.deleteExpense(id)
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
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
  const markAsPaid = async (id, isPaid) => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: apiError } = await expensesApi.markAsPaid(id, isPaid)
      
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
      const { data, error: apiError } = await installmentsApi.getInstallments(expenseId)
      
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      
      installments.value = data || []
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Cambiar la firma de la función para aceptar el código de estado
  const markInstallmentAsPaid = async (id, statusCode) => {
    loading.value = true
    error.value = null
    try {
      // Buscar la cuota antes del update para obtener el expense_id
      const installment = installments.value.find(inst => inst.id === id)
      const expense_id = installment ? installment.expense_id : null
      console.log('[markInstallmentAsPaid] id:', id, 'statusCode:', statusCode, 'expense_id:', expense_id)
      const { data: statusData, error: statusError } = await installmentsApi.getPaymentStatusByCode(statusCode)
      if (statusError || !statusData || !statusData[0]) {
        error.value = 'No se pudo obtener el estado de pago.'
        console.error('[markInstallmentAsPaid] Error al obtener estado:', statusError, statusData)
        return { success: false, error: error.value }
      }
      const payment_status_id = statusData[0].id
      console.log('[markInstallmentAsPaid] payment_status_id:', payment_status_id)
      const { data, error: apiError } = await installmentsApi.updateInstallmentStatus(id, payment_status_id)
      if (apiError) {
        error.value = apiError.message
        console.error('[markInstallmentAsPaid] Error al actualizar cuota:', apiError)
        return { success: false, error: apiError.message }
      }
      const index = installments.value.findIndex(installment => installment.id === id)
      if (index !== -1) {
        installments.value[index] = data[0]
      }
      // Usar el expense_id guardado antes del update
      if (expense_id) {
        await loadInstallments(expense_id)
      }
      return { success: true, data: data[0] }
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
      const { data, error: apiError } = await installmentsApi.getUpcomingInstallments(authStore.user.id, limit)
      if (apiError) {
        error.value = apiError.message
        return { success: false, error: apiError.message }
      }
      upcomingInstallments.value = data || []
      return { success: true, data }
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
      payment_status_code: null
    }
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
    clearError,
    createInstallmentsForExpense,
    upcomingInstallments,
    loadUpcomingInstallments,
    filteredUpcomingInstallments
  }
}) 