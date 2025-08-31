// Configuración de variables de entorno para MisGastos
export const config = {
  // URL de la API - Backend desplegado en Koyeb
  API_BASE_URL: 'https://fascinating-bridie-misgastos-e524faff.koyeb.app/api',
  
  // URL del frontend - Desplegado en Vercel
  FRONTEND_URL: 'https://mis-gastos-phi.vercel.app',
  
  // Configuración de la aplicación
  APP_NAME: import.meta.env.VITE_APP_NAME || 'MisGastos',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Configuración de Supabase (para autenticación)
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // Configuración de notificaciones push
  VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  FCM_SERVER_KEY: import.meta.env.VITE_FCM_SERVER_KEY,
  
  // Configuración de desarrollo
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD
}

// Función para obtener la URL completa de la API
export const getApiUrl = (endpoint) => {
  return `${config.API_BASE_URL}${endpoint}`
}

// Función para verificar si estamos en producción
export const isProduction = () => {
  return config.IS_PRODUCTION
}

// Función para verificar si estamos en desarrollo
export const isDevelopment = () => {
  return config.IS_DEVELOPMENT
}
