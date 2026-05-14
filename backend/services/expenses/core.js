import { supabase } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { createScheduledExpense } from './scheduled.js';
import { createInstallmentsForExpense } from './installments.js';

export async function getExpenses(userId, filters = {}) {
  try {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        available_cards(name, type),
        categories(name, color),
        subcategories(name, color),
        payment_status(code, label)
      `)
      .eq('user_id', userId);

    if (filters.card_id && filters.card_id !== 'null') {
      query = query.eq('card_id', filters.card_id);
    }

    if (filters.category_id && filters.category_id !== 'null') {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.month && filters.year && filters.month !== 'null' && filters.year !== 'null' &&
        !isNaN(parseInt(filters.month)) && !isNaN(parseInt(filters.year))) {
      const month = parseInt(filters.month);
      const year = parseInt(filters.year);

      if (month >= 1 && month <= 12) {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextMonthYear = month === 12 ? year + 1 : year;
        const nextMonthStart = `${nextMonthYear}-${nextMonth.toString().padStart(2, '0')}-01`;
        query = query.gte('purchase_date', startDate).lt('purchase_date', nextMonthStart);
      }
    }

    const { data, error } = await query.order('purchase_date', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    throw error;
  }
}

export async function createExpense(expenseData) {
  try {
    if (!expenseData.user_id) {
      throw new Error('user_id es requerido');
    }
    if (!expenseData.card_id) {
      throw new Error('card_id es requerido');
    }

    if (expenseData.is_scheduled) {
      return await createScheduledExpense(expenseData);
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

    if (!userCard.available_card) {
      throw new Error('Tarjeta no encontrada o no pertenece al usuario');
    }

    const card = userCard.available_card;

    let paymentStatusId = expenseData.payment_status_id || 1;

    if (!expenseData.payment_status_id) {
      if (card.type === 'Débito' || card.type === 'Transferencia') {
        paymentStatusId = 2;
      } else if (card.type === 'Crédito') {
        paymentStatusId = 1;
      }
    }

    const expenseToInsert = {
      user_id: expenseData.user_id,
      description: expenseData.description,
      amount: expenseData.amount,
      purchase_date: expenseData.purchase_date,
      card_id: expenseData.card_id,
      category_id: expenseData.category_id,
      subcategory_id: expenseData.subcategory_id || null,
      installments_count: expenseData.installments_count || 1,
      payment_status_id: paymentStatusId
    };

    let firstInstallmentDate = null;

    if (card.type === 'Débito' || card.type === 'Transferencia') {
      firstInstallmentDate = expenseData.purchase_date;
    } else if (card.type === 'Crédito') {
      if (expenseData.first_installment_date &&
          expenseData.first_installment_date !== 'null' &&
          expenseData.first_installment_date !== '' &&
          expenseData.first_installment_date !== undefined) {
        firstInstallmentDate = expenseData.first_installment_date;
      }
    }

    if (firstInstallmentDate) {
      expenseToInsert.first_installment_date = firstInstallmentDate;
    }

    const { data: createdExpense, error: insertError } = await supabase
      .from('expenses')
      .insert(expenseToInsert)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    if (createdExpense.installments_count > 1 && card.type === 'Crédito') {

      try {
        await createInstallmentsForExpense(createdExpense);
      } catch (error) {
      }
    } else {
    }

    return {
      success: true,
      data: createdExpense
    };

  } catch (error) {
    throw error;
  }
}

export async function updateExpense(id, updates) {
  try {
    const { data: existingExpense, error: existingExpenseError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (existingExpenseError || !existingExpense) {
      throw new Error('Gasto no encontrado');
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const mergedExpense = { ...existingExpense, ...data };
    const amountChanged = updates.amount !== undefined && Number(updates.amount) !== Number(existingExpense.amount);
    const installmentsChanged =
      updates.installments_count !== undefined &&
      Number(updates.installments_count) !== Number(existingExpense.installments_count);
    const firstInstallmentDateChanged =
      updates.first_installment_date !== undefined &&
      String(updates.first_installment_date || '') !== String(existingExpense.first_installment_date || '');
    const shouldRebuildInstallments = amountChanged || installmentsChanged || firstInstallmentDateChanged;

    if (shouldRebuildInstallments) {
      const nextInstallmentsCount = Number(mergedExpense.installments_count || 1);

      const { data: previousInstallments } = await supabase
        .from('installments')
        .select('installment_number, payment_status_id')
        .eq('expense_id', id);

      const previousStatusByNumber = {};
      (previousInstallments || []).forEach((item) => {
        previousStatusByNumber[item.installment_number] = item.payment_status_id;
      });

      const { error: deleteInstallmentsError } = await supabase
        .from('installments')
        .delete()
        .eq('expense_id', id);

      if (deleteInstallmentsError) throw deleteInstallmentsError;

      if (nextInstallmentsCount > 1) {
        const baseDateString = mergedExpense.first_installment_date || mergedExpense.purchase_date;
        if (!baseDateString) {
          throw new Error('No se pudo recalcular cuotas: falta fecha de primera cuota');
        }

        const baseDate = new Date(baseDateString);
        if (Number.isNaN(baseDate.getTime())) {
          throw new Error('No se pudo recalcular cuotas: fecha inválida');
        }

        const preserveStatuses = nextInstallmentsCount === Number(existingExpense.installments_count || 1);
        const installmentAmount = Number(mergedExpense.amount) / nextInstallmentsCount;
        const rebuiltInstallments = [];

        for (let i = 1; i <= nextInstallmentsCount; i++) {
          const dueDate = new Date(baseDate);
          dueDate.setMonth(dueDate.getMonth() + (i - 1));

          rebuiltInstallments.push({
            expense_id: id,
            installment_number: i,
            amount: installmentAmount,
            due_date: dueDate.toISOString().split('T')[0],
            payment_status_id: preserveStatuses ? (previousStatusByNumber[i] || 1) : 1
          });
        }

        const { error: createInstallmentsError } = await supabase
          .from('installments')
          .insert(rebuiltInstallments);

        if (createInstallmentsError) throw createInstallmentsError;
      }
    }

    return {
      success: true,
      data
    };

  } catch (error) {
    throw error;
  }
}

export async function deleteExpense(id, userId, deleteOption = null) {
  try {
    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new Error('Gasto no encontrado');
    }

    if (expense.is_scheduled && deleteOption === 'future') {

      const currentDate = expense.purchase_date;

      const { data: relatedExpenses, error: fetchRelatedError } = await supabase
        .from('expenses')
        .select('id, purchase_date, description, amount, scheduled_start_month')
        .eq('user_id', userId)
        .eq('is_scheduled', true)
        .eq('description', expense.description)
        .eq('amount', expense.amount)
        .eq('card_id', expense.card_id)
        .eq('category_id', expense.category_id)
        .eq('scheduled_start_month', expense.scheduled_start_month)
        .gte('purchase_date', currentDate)
        .order('purchase_date', { ascending: true });

      if (fetchRelatedError) throw fetchRelatedError;

      if (relatedExpenses && relatedExpenses.length > 0) {
        const { error: deleteError } = await supabase
          .from('expenses')
          .delete()
          .eq('user_id', userId)
          .eq('is_scheduled', true)
          .eq('description', expense.description)
          .eq('amount', expense.amount)
          .eq('card_id', expense.card_id)
          .eq('category_id', expense.category_id)
          .eq('scheduled_start_month', expense.scheduled_start_month)
          .gte('purchase_date', currentDate);

        if (deleteError) throw deleteError;

        return {
          success: true,
          message: `Gasto programado cancelado. Se eliminaron ${relatedExpenses.length} gastos (actual y futuros).`
        };
      } else {
        return {
          success: true,
          message: 'No se encontraron gastos futuros para eliminar.'
        };
      }
    } else {

      const { error: installmentsError } = await supabase
        .from('installments')
        .delete()
        .eq('expense_id', id);

      if (installmentsError) {
        logger.error('Error eliminando cuotas:', { error: installmentsError.message, expenseId: id });
      }

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true,
        message: 'Gasto eliminado correctamente'
      };
    }
  } catch (error) {
    throw error;
  }
}

export async function markAsPaid(expenseId, paymentStatusId) {
  try {
    const { data: existingExpense, error: checkError } = await supabase
      .from('expenses')
      .select('id')
      .eq('id', expenseId)
      .single();

    if (checkError) {
      throw new Error(`Gasto no encontrado: ${expenseId}`);
    }

    const { data, error } = await supabase
      .from('expenses')
      .update({ payment_status_id: paymentStatusId })
      .eq('id', expenseId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data
    };

  } catch (error) {
    throw error;
  }
}
