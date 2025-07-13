// Utilidades para formatear datos

/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (por defecto 'ARS')
 * @returns {string} - Cantidad formateada
 */
export const formatCurrency = (amount, currency = 'ARS') => {
  if (amount === null || amount === undefined) return '$0'
  
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  return formatter.format(amount)
}

/**
 * Formatea una fecha
 * @param {string|Date} date - Fecha a formatear
 * @param {string} format - Formato de salida ('short', 'long', 'month')
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  
  if (isNaN(dateObj.getTime())) return ''
  
  const options = {
    short: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    },
    long: {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    },
    month: {
      month: 'long',
      year: 'numeric'
    }
  }
  
  return new Intl.DateTimeFormat('es-AR', options[format] || options.short).format(dateObj)
}

/**
 * Formatea una fecha relativa (ej: "hace 2 días")
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha relativa
 */
export const formatRelativeDate = (date) => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  const now = new Date()
  const diffTime = Math.abs(now - dateObj)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`
  
  return formatDate(date, 'short')
}

/**
 * Formatea un número como porcentaje
 * @param {number} value - Valor a formatear
 * @param {number} total - Valor total
 * @returns {string} - Porcentaje formateado
 */
export const formatPercentage = (value, total) => {
  if (!total || total === 0) return '0%'
  
  const percentage = (value / total) * 100
  return `${percentage.toFixed(1)}%`
}

/**
 * Formatea un número con separadores de miles
 * @param {number} number - Número a formatear
 * @returns {string} - Número formateado
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined) return '0'
  
  return new Intl.NumberFormat('es-AR').format(number)
} 