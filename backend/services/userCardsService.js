import { supabase } from '../config/database.js';

export class UserCardsService {
  // Obtener tarjetas vinculadas por usuario
  static async getUserCards(userId) {
    try {
      const { data, error } = await supabase
        .from('user_cards')
        .select(`
          *,
          available_card:available_cards(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      throw error;
    }
  }

  // Vincular una tarjeta disponible al usuario
  static async linkCardToUser(userId, availableCardId) {
    try {
      // Verificar que la tarjeta no esté ya vinculada
      const { data: existingCard, error: checkError } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', userId)
        .eq('available_card_id', availableCardId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingCard) {
        throw new Error('Esta tarjeta ya está vinculada a tu cuenta');
      }

      // Vincular la tarjeta
      const { data, error } = await supabase
        .from('user_cards')
        .insert({
          user_id: userId,
          available_card_id: availableCardId
        })
        .select(`
          *,
          available_card:available_cards(*)
        `)
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

  // Desvincular una tarjeta del usuario
  static async unlinkCardFromUser(userId, userCardId) {
    try {
      const { error } = await supabase
        .from('user_cards')
        .delete()
        .eq('id', userCardId)
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true,
        message: 'Tarjeta desvinculada correctamente'
      };

    } catch (error) {
      throw error;
    }
  }

  // Verificar si una tarjeta está vinculada al usuario
  static async isCardLinkedToUser(userId, availableCardId) {
    try {
      const { data, error } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', userId)
        .eq('available_card_id', availableCardId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        success: true,
        isLinked: !!data
      };

    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas de tarjetas del usuario
  static async getUserCardStats(userId) {
    try {
      const { data, error } = await supabase
        .from('user_cards')
        .select(`
          *,
          available_card:available_cards(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        total: data.length,
        credit: data.filter(uc => uc.available_card?.type === 'Crédito').length,
        debit: data.filter(uc => uc.available_card?.type === 'Débito').length
      };

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      throw error;
    }
  }
}
