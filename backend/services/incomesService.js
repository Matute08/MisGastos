import { supabase } from '../config/database.js';
import logger from '../utils/logger.js';

export class IncomesService {
  static async getIncomes(userId, filters = {}) {
    try {
      let query = supabase.from('incomes').select('*').eq('user_id', userId);

      if (filters.month && filters.year) {
        const month = parseInt(filters.month);
        const year = parseInt(filters.year);
        if (month >= 1 && month <= 12) {
          query = query.eq('month', month).eq('year', year);
        }
      } else if (filters.year) {
        query = query.eq('year', parseInt(filters.year));
      }

      const { data, error } = await query.order('income_date', { ascending: false });
      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      logger.error('Error getting incomes:', error);
      throw error;
    }
  }

  static async createIncome(incomeData) {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .insert(incomeData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Error creating income:', error);
      throw error;
    }
  }

  static async getIncomeById(userId, id) {
    const { data, error } = await supabase
      .from('incomes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async updateIncome(id, userId, updates) {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Ingreso no encontrado');
      return { success: true, data };
    } catch (error) {
      logger.error('Error updating income:', error);
      throw error;
    }
  }

  static async deleteIncome(id, userId) {
    try {
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error('Error deleting income:', error);
      throw error;
    }
  }

  static async getSummary(userId, month, year) {
    try {
      let query = supabase
        .from('incomes')
        .select('amount, description, income_date, is_recurring, month, year, affects_cash_balance')
        .eq('user_id', userId);

      if (month && year) {
        query = query.eq('month', parseInt(month)).eq('year', parseInt(year));
      } else if (year) {
        query = query.eq('year', parseInt(year));
      }

      const { data, error } = await query.order('income_date', { ascending: false });
      if (error) throw error;

      const rows = data || [];
      const total = rows
        .filter((inc) => inc.affects_cash_balance !== false)
        .reduce((sum, inc) => sum + parseFloat(inc.amount), 0);
      return { success: true, data: { incomes: rows, total } };
    } catch (error) {
      logger.error('Error getting income summary:', error);
      throw error;
    }
  }

  /** Suma ingresos marcados como crédito en tarjeta (no efectivo) en [startDate, endDate). */
  static async sumCardCreditsInPeriod(userId, cardId, startDate, endDate) {
    const { data, error } = await supabase
      .from('incomes')
      .select('amount')
      .eq('user_id', userId)
      .eq('card_id', cardId)
      .eq('affects_cash_balance', false)
      .gte('income_date', startDate)
      .lt('income_date', endDate);

    if (error) throw error;
    return (data || []).reduce((sum, inc) => sum + parseFloat(inc.amount), 0);
  }

  static async assertUserOwnsCreditCard(userId, cardId) {
    const { data, error } = await supabase
      .from('user_cards')
      .select(`
        id,
        available_cards ( type )
      `)
      .eq('user_id', userId)
      .eq('available_card_id', cardId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const err = new Error('Tarjeta no encontrada o no vinculada a tu cuenta');
      err.statusCode = 400;
      throw err;
    }
    const cardType = data.available_cards?.type;
    if (cardType !== 'Crédito') {
      const err = new Error('Solo se pueden acreditar devoluciones en tarjetas de crédito');
      err.statusCode = 400;
      throw err;
    }
  }
}
