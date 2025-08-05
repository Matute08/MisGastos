import { supabase } from '../config/database.js';

export class CategoriesService {
  // Obtener todas las categorías del usuario
  static async getCategories(userId) {
    try {
      const { data, error } = await supabase
        .from('categories')
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

  // Crear nueva categoría
  static async createCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
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

  // Actualizar categoría
  static async updateCategory(categoryId, updates) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', categoryId)
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

  // Eliminar categoría
  static async deleteCategory(categoryId) {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      return {
        success: true,
        message: 'Categoría eliminada correctamente'
      };

    } catch (error) {
      throw error;
    }
  }
} 