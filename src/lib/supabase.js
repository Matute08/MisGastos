import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Funciones de autenticación
export const auth = {
  // Registro de usuario
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  },

  // Inicio de sesión
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Cerrar sesión
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Obtener usuario actual
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Escuchar cambios de autenticación
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Funciones para tarjetas
export const cards = {
  // Obtener todas las tarjetas del usuario
  async getCards(userId) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Crear nueva tarjeta
  async createCard(cardData) {
    const { data, error } = await supabase
      .from('cards')
      .insert([cardData])
      .select()
    
    return { data, error }
  },

  // Actualizar tarjeta
  async updateCard(id, updates) {
    const { data, error } = await supabase
      .from('cards')
      .update(updates)
      .eq('id', id)
      .select()
    
    return { data, error }
  },

  // Eliminar tarjeta
  async deleteCard(id) {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id)
    
    return { error }
  }
}

// Funciones para gastos
export const expenses = {
  // Obtener todos los gastos del usuario
  async getExpenses(userId, filters = {}) {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        cards(name, type, bank),
        categories(name, color)
      `)
      .eq('user_id', userId)
    
    // Aplicar filtros
    if (filters.card_id) query = query.eq('card_id', filters.card_id)
    if (filters.category_id) query = query.eq('category_id', filters.category_id)
    if (filters.month) query = query.eq('month', filters.month)
    if (filters.year) query = query.eq('year', filters.year)
    
    const { data, error } = await query.order('created_at', { ascending: false })
    return { data, error }
  },

  // Crear nuevo gasto
  async createExpense(expenseData) {
    console.log('Supabase: Creando gasto con datos:', expenseData)
    
    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
    
    console.log('Supabase: Respuesta de creación:', { data, error })
    
    return { data, error }
  },

  // Actualizar gasto
  async updateExpense(id, updates) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
    
    return { data, error }
  },

  // Eliminar gasto
  async deleteExpense(id) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
    
    return { error }
  },

  // Marcar gasto como pagado (nuevo: por estado)
  async markAsPaid(id, payment_status_id) {
    const { data, error } = await supabase
      .from('expenses')
      .update({ payment_status_id })
      .eq('id', id)
    return { data, error }
  }
}

// Funciones para categorías
export const categories = {
  // Obtener todas las categorías
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
    return { data, error }
  },

  // Crear nueva categoría
  async createCategory(categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
    return { data, error }
  },

  // Actualizar categoría
  async updateCategory(id, updates) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
    
    return { data, error }
  },

  // Eliminar categoría
  async deleteCategory(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    return { error }
  }
}

// Funciones para cuotas
export const installments = {
  // Obtener cuotas de un gasto
  async getInstallments(expenseId) {
    const { data, error } = await supabase
      .from('installments')
      .select('*')
      .eq('expense_id', expenseId)
      .order('due_date', { ascending: true })
    
    return { data, error }
  },

  // Crear cuotas para un gasto
  async createInstallments(installmentsData) {
    const { data, error } = await supabase
      .from('installments')
      .insert(installmentsData)
      .select()
    
    return { data, error }
  },

  // Marcar cuota como pagada (nuevo: por estado)
  async updateInstallmentStatus(id, payment_status_id) {
    console.log('[updateInstallmentStatus] id:', id, 'payment_status_id:', payment_status_id)
    const { data, error } = await supabase
      .from('installments')
      .update({ payment_status_id })
      .eq('id', String(id))
      .select('*')
    console.log('[updateInstallmentStatus] response:', { data, error })
    if (error) {
      console.error('[updateInstallmentStatus] Supabase error:', error)
    }
    return { data, error }
  },

  // Obtener id de estado de pago por código
  async getPaymentStatusByCode(code) {
    const { data, error } = await supabase
      .from('payment_status')
      .select('id, code, label')
      .eq('code', code)
    return { data, error }
  },

  // Obtener cuotas por mes específico
  async getMonthlyInstallments(userId, month, year) {
    const { data, error } = await supabase
      .from('monthly_installments')
      .select('*')
      .eq('user_id', userId)
      .eq('installment_month', month)
      .eq('installment_year', year)
      .order('due_date', { ascending: true })
    
    return { data, error }
  },

  // Obtener gastos y cuotas activas por mes
  async getMonthlyExpensesWithInstallments(userId, month, year) {
    const { data, error } = await supabase
      .rpc('get_monthly_expenses_with_installments', {
        p_user_id: userId,
        p_month: month,
        p_year: year
      })
    
    return { data, error }
  },

  // Obtener total mensual con cuotas
  async getMonthlyTotalWithInstallments(userId, month, year) {
    const { data, error } = await supabase
      .rpc('get_monthly_total_with_installments', {
        p_user_id: userId,
        p_month: month,
        p_year: year
      })
    
    return { data, error }
  },

  // Obtener resumen de cuotas por gasto
  async getExpenseInstallmentsSummary(expenseId) {
    const { data, error } = await supabase
      .rpc('get_expense_installments_summary', {
        p_expense_id: expenseId
      })
    
    return { data, error }
  },

  // Obtener todas las cuotas próximas a vencer para un usuario
  async getUpcomingInstallments(userId, limit = 1000) {
    const { data, error } = await supabase
      .from('installments')
      .select('*, expenses(*, cards(name, type), categories(name, color))')
      .eq('expenses.user_id', userId)
      .in('payment_status_id', [1, 2]) // 1: pendiente, 2: en deuda
      .order('due_date', { ascending: true })
      .limit(limit)
    return { data, error }
  }
} 