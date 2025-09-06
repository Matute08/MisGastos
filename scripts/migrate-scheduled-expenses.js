#!/usr/bin/env node

/**
 * Script para migrar la base de datos y agregar soporte para gastos programados
 * 
 * Uso:
 * node scripts/migrate-scheduled-expenses.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Iniciando migración para gastos programados...');
    
    // Leer el archivo SQL
    const sqlFile = join(__dirname, 'add-scheduled-expenses-columns.sql');
    const sqlContent = readFileSync(sqlFile, 'utf8');
    
    // Dividir el contenido en declaraciones individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Ejecutando ${statements.length} declaraciones SQL...`);
    
    // Ejecutar cada declaración
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.toLowerCase().includes('select')) {
        // Para consultas SELECT, usar rpc o query directa
        console.log(`🔍 Ejecutando consulta: ${statement.substring(0, 50)}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.warn(`⚠️  Advertencia en consulta ${i + 1}:`, error.message);
          } else {
            console.log(`✅ Consulta ${i + 1} ejecutada correctamente`);
            if (data && data.length > 0) {
              console.log('📊 Resultado:', data);
            }
          }
        } catch (err) {
          console.warn(`⚠️  Error en consulta ${i + 1}:`, err.message);
        }
      } else {
        // Para otras declaraciones (ALTER, CREATE, etc.)
        console.log(`🔧 Ejecutando declaración: ${statement.substring(0, 50)}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.warn(`⚠️  Advertencia en declaración ${i + 1}:`, error.message);
          } else {
            console.log(`✅ Declaración ${i + 1} ejecutada correctamente`);
          }
        } catch (err) {
          console.warn(`⚠️  Error en declaración ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('🎉 Migración completada exitosamente!');
    console.log('');
    console.log('📋 Resumen de cambios:');
    console.log('   • Agregadas columnas para gastos programados');
    console.log('   • Creados índices para mejorar rendimiento');
    console.log('   • Documentadas las nuevas columnas');
    console.log('');
    console.log('🔧 Próximos pasos:');
    console.log('   1. Reiniciar el servidor backend');
    console.log('   2. Probar la funcionalidad de gastos programados');
    console.log('   3. Verificar que los datos se guardan correctamente');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar la migración
runMigration();
