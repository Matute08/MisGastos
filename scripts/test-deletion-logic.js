// Test para verificar la lógica de eliminación de gastos programados
function testDeletionLogic() {
  console.log('🧪 Probando lógica de eliminación de gastos programados...\n');
  
  // Simular gastos programados de Netflix
  const mockExpenses = [
    { id: '1', description: 'Netflix', amount: 10000, card_id: 'card1', category_id: 'cat1', purchase_date: '2025-10-01', is_scheduled: true },
    { id: '2', description: 'Netflix', amount: 10000, card_id: 'card1', category_id: 'cat1', purchase_date: '2025-11-01', is_scheduled: true },
    { id: '3', description: 'Netflix', amount: 10000, card_id: 'card1', category_id: 'cat1', purchase_date: '2025-12-01', is_scheduled: true },
    { id: '4', description: 'Netflix', amount: 10000, card_id: 'card1', category_id: 'cat1', purchase_date: '2026-01-01', is_scheduled: true },
  ];
  
  console.log('📋 Gastos programados simulados:');
  mockExpenses.forEach(expense => {
    console.log(`  - ${expense.id}: ${expense.description} - ${expense.purchase_date}`);
  });
  
  // Simular eliminación del gasto de noviembre (id: '2')
  const expenseToDelete = mockExpenses[1]; // Noviembre
  const currentDate = expenseToDelete.purchase_date; // '2025-11-01'
  
  console.log(`\n🗑️ Eliminando gasto: ${expenseToDelete.id} (${expenseToDelete.purchase_date})`);
  console.log(`📅 Fecha actual: ${currentDate}`);
  
  // Simular la consulta del backend
  const relatedExpenses = mockExpenses.filter(expense => 
    expense.description === expenseToDelete.description &&
    expense.amount === expenseToDelete.amount &&
    expense.card_id === expenseToDelete.card_id &&
    expense.category_id === expenseToDelete.category_id &&
    expense.purchase_date >= currentDate &&
    expense.is_scheduled === true
  );
  
  console.log(`\n🔍 Gastos relacionados encontrados: ${relatedExpenses.length}`);
  console.log('📋 Gastos que se eliminarían:');
  relatedExpenses.forEach(expense => {
    console.log(`  - ${expense.id}: ${expense.description} - ${expense.purchase_date}`);
  });
  
  console.log('\n✅ Resultado esperado:');
  console.log('  - Se deben eliminar 3 gastos: noviembre, diciembre y enero');
  console.log('  - El gasto de octubre debe mantenerse');
}

testDeletionLogic();
