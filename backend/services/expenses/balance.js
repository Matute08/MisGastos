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

    const debitTransferExpenses = directExpenses.filter(expense => {
      const cardType = expense.available_cards?.type;
      return cardType !== 'Crédito';
    });

    const creditExpenses = directExpenses.filter(expense => {
      const cardType = expense.available_cards?.type;
      return cardType === 'Crédito' && expense.payment_status?.code === 'pagada';
    });

    const totalDebitTransfer = debitTransferExpenses
      ?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

    const totalCreditDirect = creditExpenses
      ?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

    const totalCreditInstallments = installments?.reduce(
      (sum, installment) => sum + parseFloat(installment.amount),
      0
    ) || 0;

    const totalCredit = totalCreditDirect + totalCreditInstallments;

    const totalExpenses = totalDebitTransfer + totalCredit;
    let advancePaidInstallmentsAdjustment = 0;
    const paymentFilterId =
      filters.payment_status_id != null && filters.payment_status_id !== 'null'
        ? parseInt(String(filters.payment_status_id), 10)
        : null;
    const shouldCalculateAdvanceAdjustment =
      paymentFilterId == null || (!Number.isNaN(paymentFilterId) && paymentFilterId === 2);

    if (shouldCalculateAdvanceAdjustment) {
      let advancePaidQuery = supabase
        .from('installments')
        .select(`
          amount,
          due_date,
          updated_at,
          expenses!inner(user_id, card_id, category_id),
          payment_status(code)
        `)
        .eq('expenses.user_id', userId)
        .eq('payment_status_id', 2)
        .gte('updated_at', `${startDate}T00:00:00.000Z`)
        .lt('updated_at', `${endDate}T00:00:00.000Z`);

      if (filters.card_id && filters.card_id !== 'null' && filters.card_id !== null) {
        advancePaidQuery = advancePaidQuery.eq('expenses.card_id', filters.card_id);
      }
      if (filters.category_id && filters.category_id !== 'null' && filters.category_id !== null) {
        advancePaidQuery = advancePaidQuery.eq('expenses.category_id', filters.category_id);
      }

      const { data: advancePaidInstallments, error: advancePaidError } = await advancePaidQuery;
      if (advancePaidError) throw advancePaidError;

      advancePaidInstallmentsAdjustment = (advancePaidInstallments || [])
        .filter((inst) => {
          if (inst.payment_status?.code !== 'pagada') return false;
          const dueDay = (inst.due_date || '').slice(0, 10);
          return !(dueDay >= startDate && dueDay < endDate);
        })
        .reduce((sum, inst) => sum + parseFloat(inst.amount || 0), 0);
    }
    const totalBalanceExpenses = totalExpenses + advancePaidInstallmentsAdjustment;

    return {
      success: true,
      data: [{
        total_debit_transfer: totalDebitTransfer,
        total_credit: totalCredit,
        total_expenses: totalExpenses,
        total_balance_expenses: totalBalanceExpenses,
        advance_paid_installments_adjustment: advancePaidInstallmentsAdjustment,
        expenses_count: directExpenses?.length || 0,
        installments_count: installments?.length || 0
      }]
    };

  } catch (error) {
    logger.error('Error en getMonthlyTotalWithInstallments:', { error: error.message, userId, month, year });
    throw error;
  }
}
