import { supabase } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { IncomesService } from '../incomesService.js';
import { directExpenseBelongsToPeriod } from './helpers.js';

export async function getMonthlyExpensesWithInstallments(userId, month, year, filters = {}) {
  try {

    if (!month || !year || month < 1 || month > 12 || isNaN(month) || isNaN(year)) {
      return {
        success: true,
        data: []
      };
    }

    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextMonthYear = month === 12 ? year + 1 : year;
    const endDate = `${nextMonthYear}-${nextMonth.toString().padStart(2, '0')}-01`;

    let directQuery = supabase
      .from('expenses')
      .select(`
        id,
        user_id,
        description,
        amount,
        card_id,
        category_id,
        subcategory_id,
        purchase_date,
        payment_status_id,
        installments_count,
        first_installment_date,
        month,
        year,
        created_at,
        updated_at,
        is_scheduled,
        scheduled_start_month,
        scheduled_months,
        scheduled_end_month,
        is_active,
        available_cards(id, name, type),
        categories(id, name, color),
        subcategories(id, name, color),
        payment_status(code, label)
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

    const { data: allDirectExpenses, error: directError } = await directQuery.order('purchase_date', { ascending: false });

    if (directError) throw directError;

    const directExpenses = (allDirectExpenses || []).filter((expense) =>
      directExpenseBelongsToPeriod(expense, startDate, endDate)
    );

    let installmentsQuery = supabase
      .from('installments')
      .select(`
        *,
        expenses!inner(
          id,
          user_id,
          description,
          amount,
          card_id,
          category_id,
          subcategory_id,
          purchase_date,
          payment_status_id,
          installments_count,
          first_installment_date,
          month,
          year,
          created_at,
          updated_at,
          is_scheduled,
          scheduled_start_month,
          scheduled_months,
          scheduled_end_month,
          is_active,
          available_cards(id, name, type, bank),
          categories(id, name, color),
          subcategories(id, name, color)
        ),
        payment_status(code, label)
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

    const { data: installments, error: installmentsError } = await installmentsQuery.order('due_date', { ascending: true });

    if (installmentsError) throw installmentsError;

    const markedDirectExpenses = (directExpenses || []).map(expense => ({
      ...expense,
      is_installment: false,
      type: 'expense'
    }));

    const markedInstallments = (installments || []).map(installment => ({
      ...installment,
      ...installment.expenses,
      is_installment: true,
      type: 'installment',
      installment_amount: installment.amount,
      installment_id: installment.id,
      due_date: installment.due_date,
      installment_number: installment.installment_number,
      payment_status: installment.payment_status,
      payment_status_id: installment.payment_status_id
    }));

    const combinedResults = [
      ...markedDirectExpenses,
      ...markedInstallments
    ];

    const filteredResults = combinedResults.filter(item => {
      if (item.is_installment) {
        const itemDate = item.due_date;
        const itemDateObj = new Date(itemDate);
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        return itemDateObj >= startDateObj && itemDateObj < endDateObj;
      } else {
        const cardType = item.available_cards?.type;
        let itemDate;

        if (cardType === 'Crédito' && item.first_installment_date) {
          itemDate = item.first_installment_date;
        } else {
          itemDate = item.purchase_date;
        }

        const itemDateObj = new Date(itemDate);
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        return itemDateObj >= startDateObj && itemDateObj < endDateObj;
      }
    });

    return {
      success: true,
      data: filteredResults
    };

  } catch (error) {
    logger.error('Error en getMonthlyExpensesWithInstallments:', { error: error.message, userId, month, year });
    throw error;
  }
}

export async function getExpensesSummaryByType(userId, isAnnual = false) {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    let startDate, endDate;

    if (isAnnual) {
      startDate = `${currentYear}-01-01`;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      endDate = `${nextMonthYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    } else {
      startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      endDate = `${nextMonthYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    }

    const { data: allDirectRaw, error: directError } = await supabase
      .from('expenses')
      .select(`
        amount,
        purchase_date,
        first_installment_date,
        available_cards(type)
      `)
      .eq('user_id', userId)
      .eq('installments_count', 1);

    if (directError) throw directError;

    const directExpenses = (allDirectRaw || []).filter((expense) =>
      directExpenseBelongsToPeriod(expense, startDate, endDate)
    );

    const { data: installments, error: installmentsError } = await supabase
      .from('installments')
      .select(`
        amount,
        expenses!inner(
          available_cards(type)
        )
      `)
      .eq('expenses.user_id', userId)
      .gte('due_date', startDate)
      .lt('due_date', endDate);

    if (installmentsError) throw installmentsError;

    const summaryByType = {};

    (directExpenses || []).forEach(expense => {
      const cardType = expense.available_cards?.type || 'Sin especificar';
      if (!summaryByType[cardType]) {
        summaryByType[cardType] = { direct: 0, installments: 0, total: 0 };
      }
      summaryByType[cardType].direct += expense.amount;
      summaryByType[cardType].total += expense.amount;
    });

    (installments || []).forEach(installment => {
      const cardType = installment.expenses?.available_cards?.type || 'Sin especificar';
      if (!summaryByType[cardType]) {
        summaryByType[cardType] = { direct: 0, installments: 0, total: 0 };
      }
      summaryByType[cardType].installments += installment.amount;
      summaryByType[cardType].total += installment.amount;
    });

    const summaryArray = Object.entries(summaryByType).map(([type, amounts]) => ({
      type,
      direct: amounts.direct,
      installments: amounts.installments,
      total: amounts.total
    })).sort((a, b) => a.type.localeCompare(b.type));

    return {
      success: true,
      data: summaryArray
    };

  } catch (error) {
    throw error;
  }
}

export async function getCreditCardsSummary(userId, isAnnual = false) {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const { data: userCards, error: userCardsError } = await supabase
      .from('user_cards')
      .select(`
        *,
        available_card:available_cards(*)
      `)
      .eq('user_id', userId)
      .eq('available_card.type', 'Crédito');

    if (userCardsError) throw userCardsError;

    if (!userCards || userCards.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    const cardsSummary = [];

    for (const userCard of userCards) {
      const card = userCard.available_card;

      if (!card || !card.id) {
        continue;
      }

      let startDate, endDate;

      if (isAnnual) {
        startDate = `${currentYear}-01-01`;
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
        endDate = `${nextMonthYear}-${nextMonth.toString().padStart(2, '0')}-01`;
      } else {
        startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
        endDate = `${nextMonthYear}-${nextMonth.toString().padStart(2, '0')}-01`;
      }

      const { data: allDirectRaw, error: directError } = await supabase
        .from('expenses')
        .select(`
          amount,
          purchase_date,
          first_installment_date,
          available_cards(type)
        `)
        .eq('user_id', userId)
        .eq('card_id', card.id)
        .eq('installments_count', 1);

      if (directError) throw directError;

      const directExpenses = (allDirectRaw || []).filter((expense) =>
        directExpenseBelongsToPeriod(expense, startDate, endDate)
      );

      const { data: installments, error: installmentsError } = await supabase
        .from('installments')
        .select(`
          amount,
          expenses!inner(card_id, user_id)
        `)
        .eq('expenses.user_id', userId)
        .eq('expenses.card_id', card.id)
        .gte('due_date', startDate)
        .lt('due_date', endDate);

      if (installmentsError) throw installmentsError;

      const directTotal = (directExpenses || []).reduce((sum, expense) => sum + expense.amount, 0);
      const installmentsTotal = (installments || []).reduce((sum, installment) => sum + installment.amount, 0);
      const totalAmount = directTotal + installmentsTotal;

      const cardCredits = await IncomesService.sumCardCreditsInPeriod(
        userId,
        card.id,
        startDate,
        endDate
      );
      const netAmount = totalAmount - cardCredits;

      cardsSummary.push({
        id: card.id,
        name: card.name,
        bank: card.bank,
        type: card.type,
        amount: netAmount,
        grossAmount: totalAmount,
        cardCredits,
        directExpenses: directTotal,
        installments: installmentsTotal,
        period: isAnnual ? 'annual' : 'monthly'
      });
    }

    cardsSummary.sort((a, b) => a.name.localeCompare(b.name));

    return {
      success: true,
      data: cardsSummary
    };

  } catch (error) {
    throw error;
  }
}
