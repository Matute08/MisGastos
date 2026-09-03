import { parseISO } from 'date-fns'

/**
 * Obtiene la información completa de cuota para un gasto programado:
 * { current, total, percentage, label }
 */
export function getScheduledInstallmentInfo(expense) {
  if (!expense?.is_scheduled || !expense.scheduled_start_month || !expense.purchase_date) {
    return null
  }
  let startStr = String(expense.scheduled_start_month)
  if (startStr.length === 7) startStr = `${startStr}-01` // YYYY-MM

  const start = parseISO(startStr)
  const purchase = parseISO(expense.purchase_date)
  if (Number.isNaN(start.getTime()) || Number.isNaN(purchase.getTime())) return null

  let monthsDiff =
    (purchase.getFullYear() - start.getFullYear()) * 12 +
    (purchase.getMonth() - start.getMonth())
  if (monthsDiff < 0) monthsDiff = 0
  const current = monthsDiff + 1
  const total = expense.scheduled_months ? Number(expense.scheduled_months) : null

  const isInfinite = total == null || total === 0 || isNaN(total)
  const label = isInfinite ? `Cuota ${current} (sin fin)` : `Cuota ${current} de ${total}`
  const percentage = isInfinite ? null : Math.min(100, Math.max(0, (current / total) * 100))

  return {
    current,
    total,
    isInfinite,
    percentage,
    label
  }
}

/**
 * Etiqueta tipo "Cuota 3 de 12" para gastos programados, alineada a la serie
 * (mes de inicio + purchase_date del mes mostrado).
 */
export function getScheduledInstallmentLabel(expense) {
  const info = getScheduledInstallmentInfo(expense)
  return info ? info.label : null
}
