// Script para insertar subcategorías de ejemplo
// Ejecutar después de crear las categorías en Supabase

import { supabase } from '../backend/config/database.js';

async function insertSampleSubcategories() {
  try {
    console.log('🔍 Iniciando inserción de subcategorías de ejemplo...');

    // Primero, obtener las categorías existentes
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');

    if (categoriesError) {
      console.error('❌ Error obteniendo categorías:', categoriesError);
      return;
    }

    console.log('📋 Categorías encontradas:', categories);

    // Definir subcategorías de ejemplo
    const sampleSubcategories = [
      // Compras
      { category_name: 'Compras', subcategories: [
        { name: 'Ropa', color: '#EF4444' },
        { name: 'Joyas', color: '#F59E0B' },
        { name: 'Salud', color: '#10B981' },
        { name: 'Casa y Jardín', color: '#3B82F6' },
        { name: 'Mascotas', color: '#8B5CF6' },
        { name: 'Regalos', color: '#EC4899' },
        { name: 'Tecnología', color: '#06B6D4' },
        { name: 'Libros', color: '#84CC16' }
      ]},
      
      // Transporte
      { category_name: 'Transporte', subcategories: [
        { name: 'Combustible', color: '#EF4444' },
        { name: 'Transporte Público', color: '#10B981' },
        { name: 'Taxi/Uber', color: '#F59E0B' },
        { name: 'Mantenimiento', color: '#3B82F6' },
        { name: 'Estacionamiento', color: '#8B5CF6' },
        { name: 'Peajes', color: '#EC4899' }
      ]},
      
      // Entretenimiento
      { category_name: 'Entretenimiento', subcategories: [
        { name: 'Cine', color: '#EF4444' },
        { name: 'Restaurantes', color: '#10B981' },
        { name: 'Eventos', color: '#F59E0B' },
        { name: 'Streaming', color: '#3B82F6' },
        { name: 'Juegos', color: '#8B5CF6' },
        { name: 'Deportes', color: '#06B6D4' },
        { name: 'Música', color: '#84CC16' }
      ]},
      
      // Servicios
      { category_name: 'Servicios', subcategories: [
        { name: 'Luz', color: '#EF4444' },
        { name: 'Gas', color: '#10B981' },
        { name: 'Agua', color: '#F59E0B' },
        { name: 'Internet', color: '#3B82F6' },
        { name: 'Teléfono', color: '#8B5CF6' },
        { name: 'Seguro', color: '#EC4899' },
        { name: 'Impuestos', color: '#06B6D4' }
      ]},
      
      // Salud
      { category_name: 'Salud', subcategories: [
        { name: 'Médico', color: '#EF4444' },
        { name: 'Dentista', color: '#10B981' },
        { name: 'Farmacia', color: '#F59E0B' },
        { name: 'Oftalmólogo', color: '#3B82F6' },
        { name: 'Psicólogo', color: '#8B5CF6' },
        { name: 'Gimnasio', color: '#EC4899' }
      ]},
      
      // Educación
      { category_name: 'Educación', subcategories: [
        { name: 'Universidad', color: '#EF4444' },
        { name: 'Cursos', color: '#10B981' },
        { name: 'Libros', color: '#F59E0B' },
        { name: 'Materiales', color: '#3B82F6' },
        { name: 'Certificaciones', color: '#8B5CF6' }
      ]},
      
      // Supermercado
      { category_name: 'Supermercado', subcategories: [
        { name: 'Frutas y Verduras', color: '#10B981' },
        { name: 'Carnes', color: '#EF4444' },
        { name: 'Lácteos', color: '#F59E0B' },
        { name: 'Panadería', color: '#8B5CF6' },
        { name: 'Bebidas', color: '#3B82F6' },
        { name: 'Limpieza', color: '#06B6D4' },
        { name: 'Higiene', color: '#EC4899' }
      ]}
    ];

    // Insertar subcategorías
    for (const categoryGroup of sampleSubcategories) {
      const category = categories.find(c => c.name.toLowerCase() === categoryGroup.category_name.toLowerCase());
      
      if (!category) {
        console.log(`⚠️ Categoría "${categoryGroup.category_name}" no encontrada, saltando...`);
        continue;
      }

      console.log(`📝 Insertando subcategorías para "${category.name}"...`);

      for (const subcategory of categoryGroup.subcategories) {
        const { data, error } = await supabase
          .from('subcategories')
          .insert({
            category_id: category.id,
            name: subcategory.name,
            color: subcategory.color
          })
          .select();

        if (error) {
          console.error(`❌ Error insertando subcategoría "${subcategory.name}":`, error);
        } else {
          console.log(`✅ Subcategoría "${subcategory.name}" insertada correctamente`);
        }
      }
    }

    console.log('🎉 Inserción de subcategorías completada');

  } catch (error) {
    console.error('❌ Error en insertSampleSubcategories:', error);
  }
}

// Ejecutar el script
insertSampleSubcategories(); 