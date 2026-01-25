/**
 * Utilidades para manejo seguro de errores
 */

/**
 * Determina si estamos en producción
 */
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Sanitiza un error para logging seguro
 * @param {Error} error - Error a sanitizar
 * @param {Object} options - Opciones de sanitización
 * @returns {Object} Error sanitizado
 */
export const sanitizeError = (error, options = {}) => {
  const { includeStack = false, includeCause = false } = options;
  const isProd = isProduction();

  const sanitized = {
    message: error.message || 'Error desconocido',
    name: error.name || 'Error',
    code: error.code,
    statusCode: error.statusCode || error.status,
    timestamp: new Date().toISOString()
  };

  // Solo incluir stack en desarrollo o si se solicita explícitamente
  if ((!isProd && includeStack !== false) || includeStack === true) {
    sanitized.stack = error.stack;
  }

  // Solo incluir cause en desarrollo
  if (!isProd && includeCause && error.cause) {
    sanitized.cause = error.cause instanceof Error 
      ? sanitizeError(error.cause, { includeStack: false })
      : error.cause;
  }

  // NO incluir información sensible en producción
  if (isProd) {
    // Eliminar propiedades que pueden contener información sensible
    delete sanitized.stack;
    delete sanitized.cause;
    
    // Si el mensaje contiene información sensible, reemplazarlo
    if (sanitized.message.includes('password') || 
        sanitized.message.includes('token') ||
        sanitized.message.includes('secret') ||
        sanitized.message.includes('key')) {
      sanitized.message = 'Error interno del servidor';
    }
  }

  return sanitized;
};

/**
 * Log seguro de errores
 * @param {Error} error - Error a loguear
 * @param {Object} context - Contexto adicional (req, etc.)
 */
export const logError = (error, context = {}) => {
  const isProd = isProduction();
  const sanitized = sanitizeError(error, { 
    includeStack: !isProd,
    includeCause: !isProd 
  });

  if (isProd) {
    // En producción: log mínimo y seguro
    console.error('Error:', JSON.stringify({
      message: sanitized.message,
      code: sanitized.code,
      statusCode: sanitized.statusCode,
      timestamp: sanitized.timestamp,
      path: context.path,
      method: context.method
    }));
  } else {
    // En desarrollo: log detallado
    console.error('Error detallado:', {
      ...sanitized,
      context: {
        path: context.path,
        method: context.method,
        userId: context.userId
      }
    });
  }
};

/**
 * Respuesta de error segura para el cliente
 * @param {Error} error - Error a enviar
 * @returns {Object} Respuesta de error
 */
export const getErrorResponse = (error) => {
  const isProd = isProduction();
  const statusCode = error.statusCode || error.status || 500;

  const response = {
    success: false,
    error: isProd ? 'Error interno del servidor' : error.message
  };

  // Solo incluir detalles adicionales en desarrollo
  if (!isProd) {
    if (error.code) {
      response.code = error.code;
    }
    if (error.details) {
      response.details = error.details;
    }
  }

  return { response, statusCode };
};



