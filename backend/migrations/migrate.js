import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../config/database.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    logger.info('No se encontraron archivos de migración');
    return;
  }

  if (!supabase) {
    logger.error('Supabase no está configurado. Verifica SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    logger.info(`Ejecutando migración: ${file}`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_text: sql });

      if (error) {
        if (error.message && error.message.includes('function exec_sql')) {
          logger.warn(`La función exec_sql no existe. Ejecutando migración vía SQL directo...`);
          const chunks = sql.split(';').filter(s => s.trim().length > 0);
          for (const chunk of chunks) {
            const { error: chunkError } = await supabase.rpc('exec_sql', { sql_text: chunk + ';' });
            if (chunkError && !chunkError.message?.includes('already exists') && !chunkError.message?.includes('duplicada')) {
              logger.error(`Error en chunk de migración ${file}:`, { error: chunkError.message });
            }
          }
        } else {
          if (error.message?.includes('already exists') || error.message?.includes('duplicada')) {
            logger.info(`Migración ${file}: algunas tablas ya existían (ok)`);
          } else {
            logger.error(`Error ejecutando migración ${file}:`, { error: error.message });
            throw error;
          }
        }
      }

      logger.info(`Migración completada: ${file}`);
    } catch (error) {
      logger.error(`Error crítico en migración ${file}:`, { error: error.message });
      throw error;
    }
  }

  logger.info('Todas las migraciones completadas');
}

migrate().catch(error => {
  logger.error('Migración fallida:', { error: error.message });
  process.exit(1);
});
