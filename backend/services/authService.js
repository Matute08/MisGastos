import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabase } from '../config/database.js';
import logger from '../utils/logger.js';

export class AuthService {
  /**
   * Generar hash SHA256 de un token (para almacenar de forma segura)
   * @param {string} token - Token JWT
   * @returns {string} Hash SHA256 del token
   */
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Obtener fecha de expiración de un token
   * @param {string} token - Token JWT
   * @returns {Date} Fecha de expiración
   */
  static getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || !decoded.payload.exp) {
        return null;
      }
      return new Date(decoded.payload.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  /**
   * Revocar un token agregándolo a la blacklist
   * @param {string} token - Token JWT a revocar
   * @returns {Promise<boolean>} true si se revocó correctamente
   */
  static async revokeToken(token) {
    try {
      const tokenHash = this.hashToken(token);
      const expiresAt = this.getTokenExpiration(token);

      if (!expiresAt) {
        logger.error('No se pudo obtener la fecha de expiración del token');
        return false;
      }

      // Insertar en la blacklist (ignorar si ya existe)
      const { error } = await supabase
        .from('revoked_tokens')
        .insert({
          token_hash: tokenHash,
          expires_at: expiresAt.toISOString()
        })
        .select();

      if (error) {
        // Si el token ya está en la blacklist, no es un error crítico
        if (error.code !== '23505') { // 23505 = unique violation
          logger.error('Error revocando token:', { error: error.message });
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Error en revokeToken:', { error: error.message });
      return false;
    }
  }

  /**
   * Verificar si un token está revocado
   * @param {string} token - Token JWT a verificar
   * @returns {Promise<boolean>} true si el token está revocado
   */
  static async isTokenRevoked(token) {
    try {
      const tokenHash = this.hashToken(token);

      const { data, error } = await supabase
        .from('revoked_tokens')
        .select('id')
        .eq('token_hash', tokenHash)
        .single();

      if (error) {
        // Si no se encuentra, el token NO está revocado
        if (error.code === 'PGRST116') {
          return false;
        }
        logger.error('Error verificando token revocado:', { error: error.message });
        return false;
      }

      // Si se encuentra, el token ESTÁ revocado
      return !!data;
    } catch (error) {
      logger.error('Error en isTokenRevoked:', { error: error.message });
      return false;
    }
  }

  /**
   * Limpiar tokens expirados de la blacklist
   * @returns {Promise<number>} Número de tokens eliminados
   */
  static async cleanupExpiredTokens() {
    try {
      const { data, error } = await supabase
        .from('revoked_tokens')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) {
        logger.error('Error limpiando tokens expirados:', { error: error.message });
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      logger.error('Error en cleanupExpiredTokens:', { error: error.message });
      return 0;
    }
  }

  static generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );
  }

  // Validar token
  static async validateToken(token) {
    try {
      // Primero verificar si el token está revocado
      const isRevoked = await this.isTokenRevoked(token);
      if (isRevoked) {
        return false;
      }

      // Verificar firma y expiración del token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar que el usuario aún existe en la base de datos
      const { data: profile, error } = await supabase
        .from('usuarios_perfil')
        .select('id')
        .eq('id', decoded.id)
        .single();

      if (error || !profile) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Renovar token con Refresh Token Rotation
  static async refreshToken(token) {
    try {
      // Primero verificar si el token está revocado (no permitir renovar tokens ya revocados)
      const isRevoked = await this.isTokenRevoked(token);
      if (isRevoked) {
        return {
          success: false,
          error: 'Token ya fue utilizado y revocado'
        };
      }

      // Validar el token actual (firma y expiración)
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        return {
          success: false,
          error: 'Token inválido o expirado'
        };
      }
      
      // Obtener información actualizada del usuario desde la base de datos
      const { data: profile, error } = await supabase
        .from('usuarios_perfil')
        .select(`
          id,
          nombre,
          roles(nombre, descripcion)
        `)
        .eq('id', decoded.id)
        .single();

      if (error || !profile) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      // REVOCAR el token antiguo (Refresh Token Rotation)
      await this.revokeToken(token);

      // Generar nuevo token
      const userData = {
        id: profile.id,
        email: decoded.email, // Mantener el email del token original
        role: profile.roles?.nombre || 'user'
      };

      const newToken = this.generateToken(userData);

      return {
        success: true,
        token: newToken,
        user: userData
      };
    } catch (error) {
      logger.error('Error renovando token:', { error: error.message });
      return {
        success: false,
        error: 'Error renovando token'
      };
    }
  }

  // Registrar nuevo usuario
  static async register(userData) {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // 2. Obtener el UUID del rol "user"
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('nombre', 'user')
        .single();

      if (roleError || !role) {
        throw new Error('No se pudo obtener el rol por defecto');
      }

      // 3. Crear perfil en nuestra tabla personalizada
      const { data: profile, error: profileError } = await supabase
        .from('usuarios_perfil')
        .insert({
          id: authData.user.id,
          nombre: userData.nombre_perfil || userData.email,
          role_id: role.id
        })
        .select()
        .single();

      if (profileError) {
        throw new Error(profileError.message);
      }

      const user = {
        id: authData.user.id,
        email: userData.email,
        nombre_perfil: userData.nombre_perfil || userData.email,
        role: 'user'
      };

      const token = this.generateToken(user);

      return {
        success: true,
        user: user,
        token
      };

    } catch (error) {
      throw error;
    }
  }

  // Iniciar sesión
  static async login(email, password) {
    try {
      // 1. Autenticar con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // 2. Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('usuarios_perfil')
        .select(`
          id,
          nombre,
          roles(nombre, descripcion)
        `)
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        // Si no existe el perfil, crear uno por defecto
        // Obtener el UUID del rol "user"
        const { data: role, error: roleError } = await supabase
          .from('roles')
          .select('id')
          .eq('nombre', 'user')
          .single();

        if (roleError || !role) {
          throw new Error('No se pudo obtener el rol por defecto');
        }

        const { data: newProfile, error: createError } = await supabase
          .from('usuarios_perfil')
          .insert({
            id: authData.user.id,
            nombre: email,
            role_id: role.id
          })
          .select()
          .single();

        if (createError) {
          throw new Error('Error creando perfil de usuario');
        }
      }

      const user = {
        id: authData.user.id,
        email: email,
        nombre_perfil: profile?.nombre || email,
        role: profile?.roles?.nombre || 'user'
      };

      const token = this.generateToken(user);

      return {
        success: true,
        user: user,
        token
      };

    } catch (error) {
      throw error;
    }
  }

  // Obtener perfil del usuario actual
  static async getCurrentUserProfile(userId) {
    try {
      // Obtener perfil personalizado directamente por ID
      const { data: profile, error: profileError } = await supabase
        .from('usuarios_perfil')
        .select(`
          id,
          nombre,
          roles(nombre, descripcion)
        `)
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        throw new Error('Usuario no encontrado');
      }

      return {
        id: profile.id,
        email: profile.nombre, // Usar el nombre como email temporal
        nombre_perfil: profile.nombre,
        role_nombre: profile.roles?.nombre || 'user',
        role_descripcion: profile.roles?.descripcion || 'Usuario regular'
      };
    } catch (error) {
      throw error;
    }
  }

  // Verificar si el usuario es admin
  static async isAdmin(userId) {
    try {
      const { data: profile, error } = await supabase
        .from('usuarios_perfil')
        .select('roles(nombre)')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return false;
      }

      return profile.roles?.nombre === 'admin';
    } catch (error) {
      return false;
    }
  }

  // Verificar si el usuario es moderador
  static async isModerator(userId) {
    try {
      const { data: profile, error } = await supabase
        .from('usuarios_perfil')
        .select('roles(nombre)')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return false;
      }

      return profile.roles?.nombre === 'moderator';
    } catch (error) {
      return false;
    }
  }

  // Cambiar rol de usuario (solo admins)
  static async changeUserRole(userId, newRoleName) {
    try {
      // Verificar que el rol existe
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('nombre', newRoleName)
        .single();

      if (roleError || !role) {
        throw new Error('Rol no válido');
      }

      // Actualizar rol del usuario
      const { error: updateError } = await supabase
        .from('usuarios_perfil')
        .update({ role_id: role.id })
        .eq('id', userId);

      if (updateError) {
        throw new Error('Error actualizando rol');
      }

      return {
        success: true,
        message: 'Rol actualizado correctamente'
      };
    } catch (error) {
      throw error;
    }
  }
} 