import { parseISO } from 'date-fns'

/**
 * Etiqueta tipo "Cuota 3 de 12" para gastos programados, alineada a la serie
 * (mes de inicio + purchase_date del mes mostrado).
 */
export function getScheduledInstallmentLabel(expense) {
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
  const total = expense.scheduled_months
  if (total == null || total === '') {
    return `Cuota ${current} (sin fin)`
  }
  return `Cuota ${current} de ${total}`
}
