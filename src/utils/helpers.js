export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
}

export const formatUsd = (amount) => {
  if (amount === null || amount === undefined) return 'US$0'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount || 0)
}

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
  } catch {
    return ''
  }
}

export const formatPercentage = (value) => {
  if (value === null || value === undefined) return '0%'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}
