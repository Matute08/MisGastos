// config/database.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

// Si faltan envs, no cortamos el proceso: exportamos null y dejamos log.
if (!supabaseUrl || !supabaseSecretKey) {
  console.error('❌ Error crítico: faltan variables SUPABASE_URL o SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY');
}

// Crear cliente de Supabase solo si hay credenciales
export const supabase =
  (supabaseUrl && supabaseSecretKey)
    ? createClient(supabaseUrl, supabaseSecretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

export default supabase;
