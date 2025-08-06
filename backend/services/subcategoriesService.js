import { supabase } from '../config/database.js';

export class SubcategoriesService {
  // Obtener todas las subcategorías
  static async getSubcategories() {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select(`
          *,
          category:categories(id, name, color)
        `)
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

  // Obtener subcategorías por categoría
  static async getSubcategoriesByCategory(categoryId) {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
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

  // Crear nueva subcategoría
  static async createSubcategory(subcategoryData) {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .insert(subcategoryData)
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

  // Actualizar subcategoría
  static async updateSubcategory(subcategoryId, updates) {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .update(updates)
        .eq('id', subcategoryId)
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

  // Eliminar subcategoría
  static async deleteSubcategory(subcategoryId) {
    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', subcategoryId);

      if (error) throw error;

      return {
        success: true,
        message: 'Subcategoría eliminada correctamente'
      };

    } catch (error) {
      throw error;
    }
  }

  // Obtener categorías con sus subcategorías
  static async getCategoriesWithSubcategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          subcategories(*)
        `)
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

  // Obtener subcategoría por ID
  static async getSubcategoryById(subcategoryId) {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select(`
          *,
          category:categories(id, name, color)
        `)
        .eq('id', subcategoryId)
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