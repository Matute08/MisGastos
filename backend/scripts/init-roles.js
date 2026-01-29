import { supabase } from '../config/database.js';
import logger from '../utils/logger.js';

async function initRoles() {
  try {
    const { data: existingRoles, error: checkError } = await supabase
      .from('roles')
      .select('nombre');

    if (checkError) {
      logger.error('Error verificando roles existentes:', { error: checkError.message });
      return;
    }

    const existingRoleNames = existingRoles.map(role => role.nombre);

    const basicRoles = [
      {
        nombre: 'user',
        descripcion: 'Usuario regular'
      },
      {
        nombre: 'moderator',
        descripcion: 'Moderador'
      },
      {
        nombre: 'admin',
        descripcion: 'Administrador'
      }
    ];

    for (const role of basicRoles) {
      if (!existingRoleNames.includes(role.nombre)) {
        const { error: insertError } = await supabase
          .from('roles')
          .insert(role);

        if (insertError) {
          logger.error(`Error insertando rol ${role.nombre}:`, { error: insertError.message, role: role.nombre });
        }
      }
    }
  } catch (error) {
    logger.error('Error en inicialización de roles:', { error: error.message });
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  initRoles();
}

export { initRoles }; 