import { supabase } from '../../config/database.js';

export async function createScheduledExpense(expenseData) {
  try {
    if (!expenseData.scheduled_start_month) {
      throw new Error('scheduled_start_month es requerido para gastos programados');
    }

    const { data: userCard, error: userCardError } = await supabase
      .from('user_cards')
      .select(`
        *,
        available_card:available_cards(*)
      `)
      .eq('user_id', expenseData.user_id)
      .eq('available_card_id', expenseData.card_id)
      .single();

    if (userCardError) {
      throw new Error(`Error en la consulta: ${userCardError.message}`);
    }

    if (!userCard) {
      throw new Error('Tarjeta no encontrada o no pertenece al usuario');
    }

    const card = userCard.available_card;

    let paymentStatusId = 1;

    const [year, month, day] = expenseData.scheduled_start_month.split('-');
    const startYear = parseInt(year);
    const startMonth = parseInt(month) - 1;
    const startDate = new Date(startYear, startMonth, parseInt(day));

    let endDate = null;
    if (expenseData.scheduled_months && expenseData.scheduled_months > 0) {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + expenseData.scheduled_months);
    }

    const expensesToCreate = [];
    const currentDate = new Date();
    const maxMonths = expenseData.scheduled_months || 24;

    for (let i = 0; i < maxMonths; i++) {
      const expenseDate = new Date(startYear, startMonth + i, 1);

      if (endDate && expenseDate >= endDate) {
        break;
      }

      if (expenseDate >= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)) {
        const expense = {
          user_id: expenseData.user_id,
          description: expenseData.description,
          amount: expenseData.amount,
          card_id: expenseData.card_id,
          category_id: expenseData.category_id,
          subcategory_id: expenseData.subcategory_id || null,
          purchase_date: expenseDate.toISOString().split('T')[0],
          payment_status_id: paymentStatusId,
          installments_count: 1,
          is_scheduled: true,
          scheduled_start_month: expenseData.scheduled_start_month,
          scheduled_months: expenseData.scheduled_months,
          scheduled_end_month: endDate ? endDate.toISOString().split('T')[0] : null,
          is_active: true
        };

        expensesToCreate.push(expense);
      }
    }

    if (expensesToCreate.length === 0) {
      throw new Error('No se pueden crear gastos programados para fechas pasadas');
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert(expensesToCreate)
      .select(`
        *,
        available_cards(name, type),
        categories(name, color),
        subcategories(name, color),
        payment_status(code, label)
      `);

    if (error) throw error;

    return {
      success: true,
      data: data,
      message: `Se crearon ${data.length} gastos programados`
    };

  } catch (error) {
    throw error;
  }
}

export async function updateScheduledExpense(userId, scheduledExpenseId, expenseData) {
  try {
    const { data: originalExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', scheduledExpenseId)
      .eq('user_id', userId)
      .eq('is_scheduled', true)
      .single();

    if (fetchError || !originalExpense) {
      throw new Error('Gasto programado no encontrado');
    }

    if (!expenseData.scheduled_start_month) {
      throw new Error('scheduled_start_month es requerido para gastos programados');
    }

    const updates = {
      description: expenseData.description,
      amount: expenseData.amount,
      card_id: expenseData.card_id,
      category_id: expenseData.category_id,
      subcategory_id: expenseData.subcategory_id || null,
      payment_status_id: expenseData.payment_status_id || 1,
      scheduled_start_month: expenseData.scheduled_start_month,
      scheduled_months: expenseData.scheduled_months ?? null,
      scheduled_end_month: expenseData.scheduled_end_month || originalExpense.scheduled_end_month || null
    };

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('user_id', userId)
      .eq('is_scheduled', true)
      .eq('is_active', true)
      .eq('scheduled_start_month', originalExpense.scheduled_start_month)
      .eq('description', originalExpense.description)
      .eq('amount', originalExpense.amount)
      .eq('card_id', originalExpense.card_id)
      .gte('purchase_date', originalExpense.purchase_date)
      .select();

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      message: `Se actualizaron ${(data || []).length} gasto(s) programado(s) desde este mes en adelante`
    };
  } catch (error) {
    throw error;
  }
}

export async function cancelScheduledExpense(userId, scheduledExpenseId) {
  try {
    const { data: originalExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', scheduledExpenseId)
      .eq('user_id', userId)
      .eq('is_scheduled', true)
      .single();

    if (fetchError) {
      throw new Error('Gasto programado no encontrado');
    }

    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const { error: updateError } = await supabase
      .from('expenses')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_scheduled', true)
      .eq('scheduled_start_month', originalExpense.scheduled_start_month)
      .eq('description', originalExpense.description)
      .eq('amount', originalExpense.amount)
      .eq('card_id', originalExpense.card_id)
      .gte('purchase_date', currentMonth.toISOString().split('T')[0]);

    if (updateError) throw updateError;

    return {
      success: true,
      message: 'Gasto programado cancelado exitosamente'
    };

  } catch (error) {
    throw error;
  }
}

export async function getScheduledExpenses(userId) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        available_cards(name, type),
        categories(name, color),
        subcategories(name, color),
        payment_status(code, label)
      `)
      .eq('user_id', userId)
      .eq('is_scheduled', true)
      .eq('is_active', true)
      .order('scheduled_start_month', { ascending: false });

    if (error) throw error;

    const groupedExpenses = {};
    data.forEach(expense => {
      const key = `${expense.scheduled_start_month}-${expense.description}-${expense.amount}-${expense.card_id}`;
      if (!groupedExpenses[key]) {
        groupedExpenses[key] = {
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          card_id: expense.card_id,
          category_id: expense.category_id,
          subcategory_id: expense.subcategory_id,
          scheduled_start_month: expense.scheduled_start_month,
          scheduled_months: expense.scheduled_months,
          scheduled_end_month: expense.scheduled_end_month,
          available_cards: expense.available_cards,
          categories: expense.categories,
          subcategories: expense.subcategories,
          payment_status: expense.payment_status,
          expenses: []
        };
      }
      groupedExpenses[key].expenses.push(expense);
    });

    return {
      success: true,
      data: Object.values(groupedExpenses)
    };

  } catch (error) {
    throw error;
  }
}
