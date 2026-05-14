import { supabase } from '../config/database.js';
import logger from '../utils/logger.js';

function toStartOfMonth(year, month) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}
function toStartOfNextMonth(year, month) {
  const nextM = month === 12 ? 1 : month + 1;
  const nextY = month === 12 ? year + 1 : year;
  return `${nextY}-${String(nextM).padStart(2, '0')}-01`;
}

export class HistoryService {
  static async getHistory(userId, filters = {}) {
    try {
      const {
        type,         // 'expense' | 'income' | 'installment' | null (all)
        card_id,
        category_id,
        date_from,
        date_to,
        page = 1,
        limit = 50,
        search,
        month,
        year,
      } = filters;

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));

      let dateFrom = date_from;
      let dateTo = date_to;

      if (month && year) {
        dateFrom = toStartOfMonth(parseInt(year), parseInt(month));
        dateTo = toStartOfNextMonth(parseInt(year), parseInt(month));
      }

      const promises = [];

      // Only fetch the requested type(s)
      const fetchExpenses = !type || type === 'expense';
      const fetchInstallments = !type || type === 'installment';
      const fetchIncomes = !type || type === 'income';

      if (fetchExpenses) {
        promises.push(this._getExpenses(userId, { card_id, category_id, dateFrom, dateTo, search }));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (fetchInstallments) {
        promises.push(this._getInstallments(userId, { card_id, category_id, dateFrom, dateTo, search }));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (fetchIncomes) {
        promises.push(this._getIncomes(userId, { card_id, dateFrom, dateTo, search }));
      } else {
        promises.push(Promise.resolve([]));
      }

      const [expenses, installments, incomes] = await Promise.all(promises);

      // Combine and normalize
      const allItems = [
        ...expenses.map(e => this._normalizeExpense(e)),
        ...installments.map(i => this._normalizeInstallment(i)),
        ...incomes.map(inc => this._normalizeIncome(inc)),
      ];

      // Sort by date descending (most recent first)
      allItems.sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));

      const total = allItems.length;
      const offset = (pageNum - 1) * limitNum;
      const paged = allItems.slice(offset, offset + limitNum);

      return {
        success: true,
        data: paged,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      };
    } catch (error) {
      logger.error('Error in HistoryService.getHistory:', { error: error.message, userId });
      throw error;
    }
  }

  static async _getExpenses(userId, { card_id, category_id, dateFrom, dateTo, search }) {
    let query = supabase
      .from('expenses')
      .select(`
        id, description, amount, purchase_date, first_installment_date,
        installments_count, payment_status_id, created_at,
        card_id, category_id, subcategory_id,
        available_cards(id, name, type, bank),
        categories(id, name, color),
        subcategories(id, name, color),
        payment_status(id, code, label)
      `)
      .eq('user_id', userId)
      .eq('installments_count', 1)
      .order('purchase_date', { ascending: false });

    if (card_id) query = query.eq('card_id', card_id);
    if (category_id) query = query.eq('category_id', category_id);
    if (dateFrom) query = query.gte('purchase_date', dateFrom);
    if (dateTo) query = query.lt('purchase_date', dateTo);
    if (search) query = query.ilike('description', `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async _getInstallments(userId, { card_id, category_id, dateFrom, dateTo, search }) {
    let query = supabase
      .from('installments')
      .select(`
        id, installment_number, amount, due_date, payment_status_id, created_at,
        expenses!inner(
          id, description, user_id, card_id, category_id, subcategory_id,
          installments_count, purchase_date, first_installment_date,
          available_cards(id, name, type, bank),
          categories(id, name, color),
          subcategories(id, name, color)
        ),
        payment_status(id, code, label)
      `)
      .eq('expenses.user_id', userId);

    if (card_id) query = query.eq('expenses.card_id', card_id);
    if (category_id) query = query.eq('expenses.category_id', category_id);
    if (dateFrom) query = query.gte('due_date', dateFrom);
    if (dateTo) query = query.lt('due_date', dateTo);
    if (search) query = query.ilike('expenses.description', `%${search}%`);

    const { data, error } = await query.order('due_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async _getIncomes(userId, { card_id, dateFrom, dateTo, search }) {
    let query = supabase
      .from('incomes')
      .select(`
        id, description, amount, income_date, is_recurring,
        affects_cash_balance, card_id, created_at,
        month, year
      `)
      .eq('user_id', userId);

    if (card_id) query = query.eq('card_id', card_id);
    if (dateFrom) query = query.gte('income_date', dateFrom);
    if (dateTo) query = query.lt('income_date', dateTo);
    if (search) query = query.ilike('description', `%${search}%`);

    const { data, error } = await query.order('income_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static _normalizeExpense(e) {
    return {
      id: e.id,
      type: 'expense',
      description: e.description,
      amount: e.amount,
      date: e.purchase_date,
      sortDate: e.first_installment_date || e.purchase_date,
      card: e.available_cards || null,
      category: e.categories || null,
      subcategory: e.subcategories || null,
      paymentStatus: e.payment_status || null,
      detail: {
        installmentsCount: e.installments_count,
        firstInstallmentDate: e.first_installment_date,
      },
    };
  }

  static _normalizeInstallment(inst) {
    const exp = inst.expenses;
    return {
      id: `installment-${inst.id}`,
      type: 'installment',
      description: exp?.description || '',
      amount: inst.amount,
      date: inst.due_date,
      sortDate: inst.due_date,
      card: exp?.available_cards || null,
      category: exp?.categories || null,
      subcategory: exp?.subcategories || null,
      paymentStatus: inst.payment_status || null,
      detail: {
        installmentNumber: inst.installment_number,
        totalInstallments: exp?.installments_count || 1,
        expenseId: exp?.id,
        purchaseDate: exp?.purchase_date,
      },
    };
  }

  static _normalizeIncome(inc) {
    return {
      id: inc.id,
      type: 'income',
      description: inc.description,
      amount: inc.amount,
      date: inc.income_date,
      sortDate: inc.income_date,
      card: null,
      category: null,
      subcategory: null,
      paymentStatus: null,
      detail: {
        isRecurring: inc.is_recurring,
        affectsCashBalance: inc.affects_cash_balance,
        cardId: inc.card_id,
      },
    };
  }
}
