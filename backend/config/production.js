// Configuración de producción para Koyeb
export const productionConfig = {
  // Configuración del servidor
  PORT: process.env.PORT || 3001,
  NODE_ENV: 'production',
  
  // Configuración de CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://mis-gastos-phi.vercel.app',
  
  // Configuración de rate limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutos
  RATE_LIMIT_MAX_REQUESTS: 100000,
  
  // Configuración de seguridad
  HELMET_ENABLED: true,
  COMPRESSION_ENABLED: true,
  
  // Configuración de logs
  LOG_LEVEL: 'error', // Solo errores en producción
  
  // Configuración de base de datos
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  
  // Configuración de JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: '30d',
  
  // Configuración de cookies
  COOKIE_SECURE: true,
  COOKIE_SAME_SITE: 'none'
}

// Función para obtener la configuración según el entorno
export const getConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    return productionConfig
  }
  
  // Configuración de desarrollo
  return {
    PORT: 3001,
    NODE_ENV: 'development',
    CORS_ORIGIN: ['http://localhost:3000', 'http://localhost:5173'],
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
    RATE_LIMIT_MAX_REQUESTS: 100000,
    HELMET_ENABLED: true,
    COMPRESSION_ENABLED: true,
    LOG_LEVEL: 'debug',
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: '30d',
    COOKIE_SECURE: false,
    COOKIE_SAME_SITE: 'lax'
  }
}
