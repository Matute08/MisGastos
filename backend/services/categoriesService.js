import { supabase } from '../config/database.js';
import { SubcategoriesService } from './subcategoriesService.js';

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
      // Extraer subcategorías del payload si existen
      const { subcategories, ...categoryPayload } = categoryData;

      const { data, error } = await supabase
        .from('categories')
        .insert(categoryPayload)
        .select()
        .single();

      if (error) throw error;

      // Si hay subcategorías, crearlas también
      if (subcategories && subcategories.length > 0) {
        for (const subcategoryData of subcategories) {
          try {
            await SubcategoriesService.createSubcategory({
              category_id: data.id,
              name: subcategoryData.name,
              color: subcategoryData.color
            });
          } catch (subcategoryError) {
            console.error('Error creando subcategoría:', subcategoryError);
            // No fallar la creación de la categoría si falla una subcategoría
          }
        }
      }

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
      // Filtrar solo los campos válidos de la tabla categories
      const validFields = ['name', 'color', 'icon', 'user_id'];
      const filteredUpdates = {};
      
      Object.keys(updates).forEach(key => {
        if (validFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      const { data, error } = await supabase
        .from('categories')
        .update(filteredUpdates)
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