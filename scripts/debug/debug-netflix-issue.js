// Debug específico del problema de Netflix
function debugNetflixIssue() {
  console.log('🔍 Debug del problema de Netflix - 4 meses...\n');
  
  // Simular exactamente lo que viene del frontend
  const frontendData = {
    description: 'Netflix',
    amount: 10000,
    card_id: 'some-card-id',
    category_id: 'some-category-id',
    scheduled_start_month: '2025-10-01', // Lo que se envía al backend
    scheduled_months: 4, // 4 meses como pidió el usuario
    payment_status_id: 1
  };
  
  console.log('📥 Datos del frontend:');
  console.log(JSON.stringify(frontendData, null, 2));
  
  // Simular la lógica del backend
  const startDate = new Date(frontendData.scheduled_start_month);
  console.log(`\n📅 Fecha de inicio parseada: ${startDate.toISOString().split('T')[0]}`);
  console.log(`📅 Mes (0-11): ${startDate.getMonth()}, Mes (1-12): ${startDate.getMonth() + 1}`);
  
  const maxMonths = frontendData.scheduled_months || 24;
  console.log(`📊 Número de meses a crear: ${maxMonths}`);
  
  const expensesToCreate = [];
  const currentDate = new Date();
  console.log(`📅 Fecha actual: ${currentDate.toISOString().split('T')[0]}`);
  console.log(`📅 Mes actual (0-11): ${currentDate.getMonth()}, Mes actual (1-12): ${currentDate.getMonth() + 1}`);
  
  console.log('\n📋 Generando gastos:');
  
  for (let i = 0; i < maxMonths; i++) {
    const expenseDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const isCurrentOrFuture = expenseDate >= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    console.log(`  Mes ${i + 1}: ${expenseDate.toISOString().split('T')[0]} (${expenseDate.getFullYear()}-${(expenseDate.getMonth() + 1).toString().padStart(2, '0')}) - ${isCurrentOrFuture ? '✅ Se creará' : '❌ No se creará'}`);
    
    if (isCurrentOrFuture) {
      expensesToCreate.push({
        month: i + 1,
        date: expenseDate.toISOString().split('T')[0],
        description: frontendData.description,
        amount: frontendData.amount
      });
    }
  }
  
  console.log(`\n📊 Total de gastos que se crearán: ${expensesToCreate.length}`);
  console.log('📋 Gastos que se crearán:');
  expensesToCreate.forEach(expense => {
    console.log(`  - ${expense.description}: $${expense.amount} el ${expense.date}`);
  });
  
  // Verificar si hay duplicados
  const dates = expensesToCreate.map(e => e.date);
  const uniqueDates = [...new Set(dates)];
  
  if (dates.length !== uniqueDates.length) {
    console.log('\n❌ PROBLEMA: Se detectaron fechas duplicadas');
    const duplicates = dates.filter((date, index) => dates.indexOf(date) !== index);
    console.log('Fechas duplicadas:', duplicates);
  } else {
    console.log('\n✅ No hay fechas duplicadas en la lógica');
  }
  
  // Verificar consecutividad
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
    console.log('✅ Todas las fechas son consecutivas');
  } else {
    console.log('❌ Hay fechas no consecutivas');
  }
}

debugNetflixIssue();
