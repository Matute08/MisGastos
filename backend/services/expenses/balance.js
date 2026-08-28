import { supabase } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { directExpenseBelongsToPeriod } from './helpers.js';

export async function getMonthlyTotalWithInstallments(userId, month, year, filters = {}) {
  try {

    if (!month || !year || month < 1 || month > 12 || isNaN(month) || isNaN(year)) {
      return {
        success: true,
        data: [{
          total_debit_transfer: 0,
          total_credit: 0,
          total_expenses: 0,
          expenses_count: 0,
          installments_count: 0
        }]
      };
    }

    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextMonthYear = month === 12 ? year + 1 : year;
    const endDate = `${nextMonthYear}-${nextMonth.toString().padStart(2, '0')}-01`;

    let directQuery = supabase
      .from('expenses')
      .select(`
        amount,
        payment_status_id,
        payment_status(code),
        available_cards(name, type),
        first_installment_date,
        purchase_date
      `)
      .eq('user_id', userId)
      .eq('installments_count', 1);

    if (filters.card_id && filters.card_id !== 'null' && filters.card_id !== null) {
      directQuery = directQuery.eq('card_id', filters.card_id);
    }
    if (filters.category_id && filters.category_id !== 'null' && filters.category_id !== null) {
      directQuery = directQuery.eq('category_id', filters.category_id);
    }
    if (filters.payment_status_id && filters.payment_status_id !== 'null' && filters.payment_status_id !== null) {
      directQuery = directQuery.eq('payment_status_id', filters.payment_status_id);
    }

    const { data: allDirectExpenses, error: directError } = await directQuery;

    if (directError) throw directError;

    const directExpenses = (allDirectExpenses || []).filter((expense) =>
      directExpenseBelongsToPeriod(expense, startDate, endDate)
    );

    let installmentsQuery = supabase
      .from('installments')
      .select(`
        amount,
        due_date,
        updated_at,
        payment_status_id,
        expenses!inner(user_id, card_id, category_id),
        payment_status(code)
      `)
      .eq('expenses.user_id', userId)
      .gte('due_date', startDate)
      .lt('due_date', endDate);

    if (filters.card_id && filters.card_id !== 'null' && filters.card_id !== null) {
      installmentsQuery = installmentsQuery.eq('expenses.card_id', filters.card_id);
    }
    if (filters.category_id && filters.category_id !== 'null' && filters.category_id !== null) {
      installmentsQuery = installmentsQuery.eq('expenses.category_id', filters.category_id);
    }
    if (filters.payment_status_id && filters.payment_status_id !== 'null' && filters.payment_status_id !== null) {
      installmentsQuery = installmentsQuery.eq('payment_status_id', filters.payment_status_id);
    }

    const { data: installments, error: installmentsError } = await installmentsQuery;
    if (installmentsError) throw installmentsError;

    const paidDirectExpenses = directExpenses.filter(expense =>
      expense.payment_status?.code === 'pagada' || expense.payment_status_id === 2
    );

    const paidInstallments = (installments || []).filter(installment => {
      const isPaid = installment.payment_status?.code === 'pagada' || installment.payment_status_id === 2;
      if (!isPaid) return false;

      if (!installment.updated_at) return true;
      const paidAt = installment.updated_at.slice(0, 10);
      return paidAt >= startDate && paidAt < endDate;
    });

    const debitTransferExpenses = paidDirectExpenses.filter(expense => {
      const cardType = expense.available_cards?.type;
      return cardType !== 'Crédito';
    });

    const creditExpenses = paidDirectExpenses.filter(expense => {
      const cardType = expense.available_cards?.type;
      return cardType === 'Crédito';
    });

    const totalDebitTransfer = debitTransferExpenses
      ?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

    const totalCreditDirect = creditExpenses
      ?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

    const totalCreditInstallments = paidInstallments?.reduce(
      (sum, installment) => sum + parseFloat(installment.amount),
      0
    ) || 0;

    const totalCredit = totalCreditDirect + totalCreditInstallments;

    const totalExpenses = totalDebitTransfer + totalCredit;
    const totalBalanceExpenses = totalExpenses;

    return {
      success: true,
      data: [{
        total_debit_transfer: totalDebitTransfer,
        total_credit: totalCredit,
        total_expenses: totalExpenses,
        total_balance_expenses: totalBalanceExpenses,
        expenses_count: directExpenses?.length || 0,
        installments_count: installments?.length || 0
      }]
    };

  } catch (error) {
    logger.error('Error en getMonthlyTotalWithInstallments:', { error: error.message, userId, month, year });
    throw error;
  }
}
