function escapeCsvValue(value) {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export function exportToCsv(filename, columns, rows) {
  const BOM = '\uFEFF'
  const header = columns.map(col => escapeCsvValue(col.label)).join(',')
  const dataRows = rows.map(row =>
    columns.map(col => escapeCsvValue(row[col.key])).join(',')
  )
  const csv = BOM + header + '\n' + dataRows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

export function exportExpensesToCsv(expenses, filename = 'gastos.csv') {
  const columns = [
    { key: 'description', label: 'Descripción' },
    { key: 'amount', label: 'Monto' },
    { key: 'date', label: 'Fecha' },
    { key: 'category', label: 'Categoría' },
    { key: 'card', label: 'Tarjeta' },
    { key: 'type', label: 'Tipo' },
    { key: 'status', label: 'Estado' }
  ]
  const rows = expenses.map(e => ({
    description: e.description || '',
    amount: e.amount ?? 0,
    date: e.purchase_date || e.due_date || '',
    category: (e.categories?.name || e.expenses?.categories?.name) || '',
    card: (e.available_cards?.name || e.expenses?.available_cards?.name) || '',
    type: e.is_installment ? 'Cuota' : e.is_scheduled ? 'Programado' : 'Directo',
    status: e.payment_status_label || (e.payment_status?.label) || ''
  }))
  exportToCsv(filename, columns, rows)
}

export function exportIncomesToCsv(incomes, filename = 'ingresos.csv') {
  const columns = [
    { key: 'description', label: 'Descripción' },
    { key: 'amount', label: 'Monto' },
    { key: 'date', label: 'Fecha' },
    { key: 'type', label: 'Tipo' }
  ]
  const rows = incomes.map(i => ({
    description: i.description || '',
    amount: i.amount ?? 0,
    date: i.income_date || '',
    type: i.affects_cash_balance !== false ? 'Balance' : 'Tarjeta'
  }))
  exportToCsv(filename, columns, rows)
}
