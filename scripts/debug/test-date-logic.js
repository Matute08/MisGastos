// Función para probar la lógica de fechas
function testDateLogic() {
  console.log('🧪 Probando lógica de fechas para gastos programados...\n');
  
  // Simular datos de entrada
  const startDate = new Date('2025-10-01');
  const maxMonths = 12;
  
  console.log(`📅 Fecha de inicio: ${startDate.toISOString().split('T')[0]}`);
  console.log(`📊 Número de meses: ${maxMonths}\n`);
  
  const expensesToCreate = [];
  
  for (let i = 0; i < maxMonths; i++) {
    // Usar la nueva lógica corregida
    const expenseDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    
    const expense = {
      month: i + 1,
      date: expenseDate.toISOString().split('T')[0],
      year: expenseDate.getFullYear(),
      monthNumber: expenseDate.getMonth() + 1
    };
    
    expensesToCreate.push(expense);
  }
  
  console.log('📋 Gastos que se crearían:');
  expensesToCreate.forEach(expense => {
    console.log(`  Mes ${expense.month}: ${expense.date} (${expense.year}-${expense.monthNumber.toString().padStart(2, '0')})`);
  });
  
  // Verificar que las fechas son consecutivas
  let consecutive = true;
  for (let i = 1; i < expensesToCreate.length; i++) {
    const prevDate = new Date(expensesToCreate[i-1].date);
    const currentDate = new Date(expensesToCreate[i].date);
    const diffMonths = (currentDate.getFullYear() - prevDate.getFullYear()) * 12 + (currentDate.getMonth() - prevDate.getMonth());
    
    if (diffMonths !== 1) {
      consecutive = false;
      console.log(`❌ Error: Mes ${i} no es consecutivo al mes ${i-1}`);
    }
  }
  
  if (consecutive) {
    console.log('\n✅ Todas las fechas son consecutivas');
  } else {
    console.log('\n❌ Hay fechas no consecutivas');
  }
  
  // Probar con diferentes fechas de inicio
  console.log('\n🧪 Probando con diferentes fechas de inicio...\n');
  
  const testDates = [
    '2025-01-01',
    '2025-02-01', 
    '2025-03-01',
    '2025-12-01'
  ];
  
  testDates.forEach(testDate => {
    console.log(`📅 Probando con fecha de inicio: ${testDate}`);
    const start = new Date(testDate);
    const testExpenses = [];
    
    for (let i = 0; i < 6; i++) {
      const expenseDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
      testExpenses.push(expenseDate.toISOString().split('T')[0]);
    }
    
    console.log(`  Fechas generadas: ${testExpenses.join(', ')}`);
    
    // Verificar consecutividad
    let isConsecutive = true;
    for (let i = 1; i < testExpenses.length; i++) {
      const prevDate = new Date(testExpenses[i-1]);
      const currentDate = new Date(testExpenses[i]);
      const diffMonths = (currentDate.getFullYear() - prevDate.getFullYear()) * 12 + (currentDate.getMonth() - prevDate.getMonth());
      
      if (diffMonths !== 1) {
        isConsecutive = false;
        break;
      }
    }
    
    console.log(`  ${isConsecutive ? '✅' : '❌'} Consecutivas: ${isConsecutive}`);
    console.log('');
  });
}

// Ejecutar las pruebas
console.log('🚀 Iniciando pruebas de lógica de fechas...\n');
testDateLogic();
console.log('\n✨ Pruebas completadas');
