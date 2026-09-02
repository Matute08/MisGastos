// Configuración de variables de entorno para MisGastos
export const config = {
  // URL de la API: usa VITE_API_URL si está definido (ej. Vercel) o localhost en desarrollo
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',

  // Configuración de la aplicación
  APP_NAME: import.meta.env.VITE_APP_NAME || 'MisGastos',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '2.0.0',

  // Configuración de Supabase (para autenticación)
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,

  // Configuración de desarrollo
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD
}

// Función para obtener la URL completa de la API
export const getApiUrl = (endpoint) => {
  return `${config.API_BASE_URL}${endpoint}`
}

// Funciones para verificar el entorno
export const isProduction = () => config.IS_PRODUCTION
export const isDevelopment = () => config.IS_DEVELOPMENT
