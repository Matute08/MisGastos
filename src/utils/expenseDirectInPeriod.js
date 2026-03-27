/**
 * Misma regla que backend/services/expensesService.js → directExpenseBelongsToPeriod:
 * en crédito con first_installment_date, el gasto directo (1 cuota) se imputa a ese mes;
 * si no, por purchase_date.
 */

export function getMonthRange(month, year) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const nextM = month === 12 ? 1 : month + 1
  const nextY = month === 12 ? year + 1 : year
  const endDate = `${nextY}-${String(nextM).padStart(2, '0')}-01`
  return { startDate, endDate }
}

export function getYearRange(year) {
  return {
    startDate: `${year}-01-01`,
    endDate: `${year + 1}-01-01`
  }
}

export function directExpenseBelongsToPeriod(expense, startDate, endDate) {
  const startDateObj = new Date(startDate)
  const endDateObj = new Date(endDate)
  const cardType = expense.available_cards?.type
  if (cardType === 'Crédito' && expense.first_installment_date) {
    const installmentDate = new Date(expense.first_installment_date)
    return installmentDate >= startDateObj && installmentDate < endDateObj
  }
  const purchaseDate = new Date(expense.purchase_date)
  return purchaseDate >= startDateObj && purchaseDate < endDateObj
}
