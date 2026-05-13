import { supabase } from '../../config/database.js';
import logger from '../../utils/logger.js';

export async function createInstallmentsForExpense(expense) {
  try {
    const expenseId = expense.id;

    if (!expense.first_installment_date ||
        expense.first_installment_date === 'null' ||
        expense.first_installment_date === '' ||
        expense.first_installment_date === undefined) {
      logger.error('El gasto no tiene fecha de primera cuota', { expenseId });
      throw new Error('El gasto debe tener fecha de primera cuota para crear cuotas');
    }

    const firstInstallmentDate = new Date(expense.first_installment_date);

    const installmentAmount = expense.amount / expense.installments_count;

    const installmentsData = [];
    for (let i = 1; i <= expense.installments_count; i++) {
      const dueDate = new Date(firstInstallmentDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      const installment = {
        expense_id: expenseId,
        installment_number: i,
        amount: installmentAmount,
        due_date: dueDate.toISOString().split('T')[0],
        payment_status_id: 1
      };

      installmentsData.push(installment);
    }

    const { error: installmentsError } = await supabase
      .from('installments')
      .insert(installmentsData);

    if (installmentsError) {
      logger.error('Error insertando cuotas:', { error: installmentsError.message, expenseId });
      throw installmentsError;
    }

  } catch (error) {
    logger.error('Error en createInstallmentsForExpense:', { error: error.message, expenseId });
    throw error;
  }
}

export async function getInstallments(expenseId) {
  try {
    const { data, error } = await supabase
      .from('installments')
      .select(`
        *,
        expenses!inner(description, installments_count, available_cards(name, type), categories(name, color), subcategories(name, color)),
        payment_status(code, label)
      `)
      .eq('expense_id', expenseId)
      .order('installment_number', { ascending: true });

    if (error) throw error;

    const installmentsWithExpenseInfo = (data || []).map(installment => ({
      ...installment,
      expense: installment.expenses
    }));

    return {
      success: true,
      data: installmentsWithExpenseInfo
    };
  } catch (error) {
    throw error;
  }
}

export async function getExpenseInstallmentsSummary(expenseId) {
  try {
    const { data: installments, error } = await supabase
      .from('installments')
      .select(`
        *,
        payment_status(code, label)
      `)
      .eq('expense_id', expenseId)
      .order('installment_number', { ascending: true });

    if (error) throw error;

    const totalInstallments = installments?.length || 0;
    const paidInstallments = installments?.filter(i => i.payment_status?.code === 'pagada').length || 0;
    const pendingInstallments = installments?.filter(i => i.payment_status?.code === 'pendiente').length || 0;
    const totalAmount = installments?.reduce((sum, i) => sum + i.amount, 0) || 0;
    const paidAmount = installments?.filter(i => i.payment_status?.code === 'pagada').reduce((sum, i) => sum + i.amount, 0) || 0;
    const pendingAmount = installments?.filter(i => i.payment_status?.code === 'pendiente').reduce((sum, i) => sum + i.amount, 0) || 0;
    const nextDueDate = installments?.filter(i => i.payment_status?.code === 'pendiente').sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0]?.due_date;
    const isCompleted = totalInstallments > 0 && paidInstallments === totalInstallments;

    return {
      success: true,
      data: [{
        total_installments: totalInstallments,
        paid_installments: paidInstallments,
        pending_installments: pendingInstallments,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        pending_amount: pendingAmount,
        next_due_date: nextDueDate,
        is_completed: isCompleted
      }]
    };

  } catch (error) {
    throw error;
  }
}

export async function getUpcomingInstallments(userId, limit = 100) {
  try {
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id')
      .eq('user_id', userId);

    if (expensesError) throw expensesError;

    if (!expenses || expenses.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    const expenseIds = expenses.map(expense => expense.id);

    const { data, error } = await supabase
      .from('installments')
      .select(`
        *,
        expenses!inner(
          description,
          user_id,
          card_id,
          available_cards(id, name, type, bank),
          categories(id, name, color),
          subcategories(id, name, color)
        ),
        payment_status(code, label)
      `)
      .in('expense_id', expenseIds)
      .in('payment_status_id', [1, 2])
      .order('due_date', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    throw error;
  }
}

export async function getPaymentStatus() {
  try {
    const { data, error } = await supabase
      .from('payment_status')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    throw error;
  }
}

export async function getPaymentStatusByCode(code) {
  try {
    const { data, error } = await supabase
      .from('payment_status')
      .select('*')
      .eq('code', code);

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    throw error;
  }
}

export async function createInstallments(installmentsData) {
  try {
    const { data, error } = await supabase
      .from('installments')
      .insert(installmentsData)
      .select();

    if (error) throw error;

    return {
      success: true,
      data
    };

  } catch (error) {
    throw error;
  }
}

export async function updateInstallmentStatus(installmentId, paymentStatusId) {
  try {

    const { data: updatedInstallment, error: updateError } = await supabase
      .from('installments')
      .update({ payment_status_id: paymentStatusId })
      .eq('id', installmentId)
      .select(`
        *,
        expenses(id, user_id),
        payment_status(code, label)
      `)
      .single();

    if (updateError) {
      logger.error('Error actualizando cuota:', { error: updateError.message, installmentId });
      throw updateError;
    }

    const expenseId = updatedInstallment.expense_id;

    await updateExpenseStatusBasedOnInstallments(expenseId);

    return {
      success: true,
      data: updatedInstallment
    };

  } catch (error) {
    logger.error('Error en updateInstallmentStatus:', { error: error.message, installmentId, paymentStatusId });
    throw error;
  }
}

export async function updateExpenseStatusBasedOnInstallments(expenseId) {
  try {

    const { data: statuses, error: statusError } = await supabase
      .from('payment_status')
      .select('id, code')
      .in('code', ['pagada', 'pendiente', 'en_deuda']);

    if (statusError) throw statusError;

    const statusMap = {};
    statuses.forEach(status => {
      statusMap[status.code] = status.id;
    });

    const idPagada = statusMap['pagada'];
    const idPendiente = statusMap['pendiente'];
    const idEnDeuda = statusMap['en_deuda'];

    const { data: installments, error: installmentsError } = await supabase
      .from('installments')
      .select('payment_status_id')
      .eq('expense_id', expenseId);

    if (installmentsError) throw installmentsError;

    let nuevoEstado = idPendiente;

    if (installments && installments.length > 0) {
      const totalInstallments = installments.length;
      const enDeudaCount = installments.filter(i => i.payment_status_id === idEnDeuda).length;
      const pendienteCount = installments.filter(i => i.payment_status_id === idPendiente).length;
      const pagadaCount = installments.filter(i => i.payment_status_id === idPagada).length;

      if (enDeudaCount > 0) {
        nuevoEstado = idEnDeuda;
      } else if (pendienteCount > 0) {
        nuevoEstado = idPendiente;
      } else if (pagadaCount === totalInstallments) {
        nuevoEstado = idPagada;
      }
    }

    const { data: currentExpense, error: currentError } = await supabase
      .from('expenses')
      .select('payment_status_id')
      .eq('id', expenseId)
      .single();

    if (currentError) throw currentError;

    if (currentExpense.payment_status_id !== nuevoEstado) {

      const { error: updateError } = await supabase
        .from('expenses')
        .update({ payment_status_id: nuevoEstado })
        .eq('id', expenseId);

      if (updateError) throw updateError;

    }

  } catch (error) {
    logger.error('Error actualizando estado del gasto:', { error: error.message, expenseId, paymentStatusId });
    throw error;
  }
}

export async function markInstallmentAsPaid(installmentId, paymentStatusId) {
  try {
    const { data, error } = await supabase
      .from('installments')
      .update({
        payment_status_id: paymentStatusId,
        updated_at: new Date().toISOString()
      })
      .eq('id', installmentId)
      .select(`
        *,
        payment_status(code, label)
      `)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data
    };

  } catch (error) {
    throw error;
  }
}

export async function getAllPaymentStatuses() {
  try {
    const { data, error } = await supabase
      .from('payment_status')
      .select('id, code, label')
      .order('id', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    throw error;
  }
}
