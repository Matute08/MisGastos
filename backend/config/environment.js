// Configuración del backend basada en variables de entorno
export const backendConfig = {
  // Configuración del servidor
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Configuración de CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://mis-gastos-phi.vercel.app',
  
  // Configuración de Supabase
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  
  // Configuración de JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Configuración de rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100000,
  
  // Configuración de seguridad
  HELMET_ENABLED: process.env.HELMET_ENABLED !== 'false',
  COMPRESSION_ENABLED: process.env.COMPRESSION_ENABLED !== 'false',
  
  // Configuración de logs
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
}

// Función para obtener la configuración según el entorno
export const getBackendConfig = () => {
  return backendConfig
}

// Función para verificar que las variables críticas estén configuradas
export const validateConfig = () => {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY', 
    'SUPABASE_SECRET_KEY',
    'JWT_SECRET'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`)
  }
  
  return true
}
