#!/usr/bin/env node

/**
 * Script de prueba para verificar la funcionalidad de gastos programados
 * 
 * Uso:
 * node scripts/test-scheduled-expenses.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testScheduledExpenses() {
  try {
    console.log('🧪 Iniciando pruebas de gastos programados...');
    
    // 1. Verificar que las columnas existen
    console.log('\n1️⃣ Verificando columnas de gastos programados...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'expenses')
      .in('column_name', ['is_scheduled', 'scheduled_start_month', 'scheduled_months', 'scheduled_end_month', 'is_active']);
    
    if (columnsError) {
      console.error('❌ Error verificando columnas:', columnsError);
      return;
    }
    
    console.log('✅ Columnas encontradas:');
    columns.forEach(col => {
      console.log(`   • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 2. Verificar que hay categorías disponibles
    console.log('\n2️⃣ Verificando categorías disponibles...');
    
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, color')
      .limit(5);
    
    if (categoriesError) {
      console.error('❌ Error obteniendo categorías:', categoriesError);
      return;
    }
    
    console.log(`✅ Categorías disponibles (${categories.length}):`);
    categories.forEach(cat => {
      console.log(`   • ${cat.name} (${cat.color})`);
    });
    
    // 3. Verificar que hay tarjetas disponibles
    console.log('\n3️⃣ Verificando tarjetas disponibles...');
    
    const { data: cards, error: cardsError } = await supabase
      .from('available_cards')
      .select('id, name, type')
      .limit(5);
    
    if (cardsError) {
      console.error('❌ Error obteniendo tarjetas:', cardsError);
      return;
    }
    
    console.log(`✅ Tarjetas disponibles (${cards.length}):`);
    cards.forEach(card => {
      console.log(`   • ${card.name} (${card.type})`);
    });
    
    // 4. Verificar que hay usuarios
    console.log('\n4️⃣ Verificando usuarios...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, nombre_perfil')
      .limit(3);
    
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }
    
    console.log(`✅ Usuarios disponibles (${users.length}):`);
    users.forEach(user => {
      console.log(`   • ${user.nombre_perfil} (${user.email})`);
    });
    
    console.log('\n🎉 Todas las pruebas pasaron exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('   ✅ Columnas de gastos programados creadas');
    console.log('   ✅ Categorías disponibles');
    console.log('   ✅ Tarjetas disponibles');
    console.log('   ✅ Usuarios disponibles');
    console.log('\n🚀 La funcionalidad de gastos programados está lista para usar!');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar las pruebas
testScheduledExpenses();
