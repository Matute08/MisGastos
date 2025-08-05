import { supabase } from '../config/database.js';

export class CardsService {
  // Obtener todas las tarjetas del usuario
  static async getCards(userId) {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      throw error;
    }
  }

  // Crear nueva tarjeta
  static async createCard(cardData) {
    try {
      const { data, error } = await supabase
        .from('cards')
        .insert(cardData)
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

  // Actualizar tarjeta
  static async updateCard(cardId, userId, updates) {
    try {
      const { data, error } = await supabase
        .from('cards')
        .update(updates)
        .eq('id', cardId)
        .eq('user_id', userId)
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

  // Eliminar tarjeta
  static async deleteCard(cardId, userId) {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true,
        message: 'Tarjeta eliminada correctamente'
      };

    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas de tarjeta
  static async getCardStats(cardId, userId) {
    try {
      // Verificar que la tarjeta pertenece al usuario
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .eq('user_id', userId)
        .single();

      if (cardError) throw cardError;

      // Aquí puedes agregar lógica para obtener estadísticas
      // Por ahora devolvemos información básica
      return {
        success: true,
        data: {
          card,
          total_expenses: 0,
          monthly_average: 0
        }
      };

    } catch (error) {
      throw error;
    }
  }

  // Obtener gastos de una tarjeta
  static async getCardExpenses(cardId, userId, filters = {}) {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('card_id', cardId)
        .eq('user_id', userId);

      if (filters.month) {
        query = query.eq('month', filters.month);
      }

      if (filters.year) {
        query = query.eq('year', filters.year);
      }

      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      throw error;
    }
  }
} 