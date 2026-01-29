// src/utils/errorMessages.js

/**
 * Convierte errores técnicos en mensajes amigables para el usuario
 * @param {Error|Object} error - Error a convertir
 * @returns {string} Mensaje amigable para el usuario
 */
export const getUserFriendlyError = (error) => {
  // Si el error ya es un string amigable, retornarlo
  if (typeof error === 'string') {
    return error;
  }

  // Obtener el mensaje del error
  const errorMessage = error?.message || error?.error || 'Error desconocido';
  const errorCode = error?.code || error?.statusCode || error?.status;

  // Mapeo de códigos de error comunes
  const errorMessages = {
    // Errores de red
    'NetworkError': 'Problema de conexión. Verifica tu internet e intenta nuevamente.',
    'Failed to fetch': 'Problema de conexión. Verifica tu internet e intenta nuevamente.',
    'Network request failed': 'Problema de conexión. Verifica tu internet e intenta nuevamente.',
    
    // Errores HTTP
    400: 'Datos inválidos. Por favor, verifica la información ingresada.',
    401: 'Tu sesión expiró. Por favor, inicia sesión nuevamente.',
    403: 'No tienes permisos para realizar esta acción.',
    404: 'No se encontró el recurso solicitado.',
    409: 'Ya existe un registro con estos datos.',
    422: 'Por favor, completa todos los campos correctamente.',
    429: 'Demasiadas solicitudes. Por favor, espera un momento e intenta nuevamente.',
    500: 'Error del servidor. Por favor, intenta más tarde.',
    502: 'El servidor no está disponible. Por favor, intenta más tarde.',
    503: 'Servicio temporalmente no disponible. Por favor, intenta más tarde.',
    
    // Errores de validación
    'ValidationError': 'Por favor, completa todos los campos correctamente.',
    'UnauthorizedError': 'Tu sesión expiró. Por favor, inicia sesión nuevamente.',
    'ForbiddenError': 'No tienes permisos para realizar esta acción.',
    'NotFoundError': 'No se encontró el recurso solicitado.',
    
    // Errores específicos de la aplicación
    'INVALID_CREDENTIALS': 'Email o contraseña incorrectos.',
    'USER_NOT_FOUND': 'Usuario no encontrado.',
    'EMAIL_ALREADY_EXISTS': 'Este email ya está registrado.',
    'TOKEN_EXPIRED': 'Tu sesión expiró. Por favor, inicia sesión nuevamente.',
    'TOKEN_INVALID': 'Sesión inválida. Por favor, inicia sesión nuevamente.',
  };

  // Buscar por código de error
  if (errorCode && errorMessages[errorCode]) {
    return errorMessages[errorCode];
  }

  // Buscar por mensaje de error
  const errorMessageLower = errorMessage.toLowerCase();
  for (const [key, value] of Object.entries(errorMessages)) {
    if (errorMessageLower.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Si el mensaje contiene palabras clave, usar mensajes genéricos
  if (errorMessageLower.includes('network') || errorMessageLower.includes('fetch')) {
    return errorMessages['NetworkError'];
  }

  if (errorMessageLower.includes('unauthorized') || errorMessageLower.includes('token')) {
    return errorMessages['UnauthorizedError'];
  }

  if (errorMessageLower.includes('validation') || errorMessageLower.includes('invalid')) {
    return errorMessages['ValidationError'];
  }

  // Mensaje por defecto
  return 'Ocurrió un error. Por favor, intenta nuevamente.';
};

/**
 * Obtiene el tipo de error para mostrar iconos o estilos diferentes
 * @param {Error|Object} error - Error a analizar
 * @returns {string} Tipo de error: 'network', 'auth', 'validation', 'server', 'unknown'
 */
export const getErrorType = (error) => {
  const errorMessage = (error?.message || error?.error || '').toLowerCase();
  const errorCode = error?.code || error?.statusCode || error?.status;

  if (errorCode === 401 || errorCode === 403 || errorMessage.includes('unauthorized') || errorMessage.includes('token')) {
    return 'auth';
  }

  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
    return 'network';
  }

  if (errorCode === 400 || errorCode === 422 || errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return 'validation';
  }

  if (errorCode >= 500 || errorMessage.includes('server')) {
    return 'server';
  }

  return 'unknown';
};

