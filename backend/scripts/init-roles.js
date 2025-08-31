import { supabase } from '../config/database.js';

async function initRoles() {
  try {
    const { data: existingRoles, error: checkError } = await supabase
      .from('roles')
      .select('nombre');

    if (checkError) {
      console.error('Error verificando roles existentes:', checkError);
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
          console.error(`Error insertando rol ${role.nombre}:`, insertError);
        }
      }
    }
  } catch (error) {
    console.error('Error en inicialización de roles:', error);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  initRoles();
}

export { initRoles }; 