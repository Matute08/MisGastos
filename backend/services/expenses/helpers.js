export function directExpenseBelongsToPeriod(expense, startDate, endDate) {
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const cardType = expense.available_cards?.type;
  if (cardType === 'Crédito' && expense.first_installment_date) {
    const installmentDate = new Date(expense.first_installment_date);
    return installmentDate >= startDateObj && installmentDate < endDateObj;
  }
  const purchaseDate = new Date(expense.purchase_date);
  return purchaseDate >= startDateObj && purchaseDate < endDateObj;
}
