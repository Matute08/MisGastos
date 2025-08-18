import { supabase } from '../config/database.js';

export class AvailableCardsService {
  // Obtener todas las tarjetas disponibles
  static async getAllAvailableCards() {
    try {
      const { data, error } = await supabase
        .from('available_cards')
        .select('*')
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

  // Crear nueva tarjeta disponible (solo admin)
  static async createAvailableCard(cardData) {
    try {
      const { data, error } = await supabase
        .from('available_cards')
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

  // Actualizar tarjeta disponible (solo admin)
  static async updateAvailableCard(cardId, updates) {
    try {
      const { data, error } = await supabase
        .from('available_cards')
        .update(updates)
        .eq('id', cardId)
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

  // Eliminar tarjeta disponible (solo admin)
  static async deleteAvailableCard(cardId) {
    try {
      const { error } = await supabase
        .from('available_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      return {
        success: true,
        message: 'Tarjeta disponible eliminada correctamente'
      };

    } catch (error) {
      throw error;
    }
  }

  // Obtener tarjeta disponible por ID
  static async getAvailableCardById(cardId) {
    try {
      const { data, error } = await supabase
        .from('available_cards')
        .select('*')
        .eq('id', cardId)
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
}
