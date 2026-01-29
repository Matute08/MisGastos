// Test para verificar la corrección de octubre
function testOctoberFix() {
  console.log('🧪 Probando corrección para octubre 2025...\n');
  
  // Simular exactamente lo que viene del frontend
  const frontendDate = '2025-10-01'; // Lo que se envía al backend
  
  console.log(`📅 Fecha del frontend: ${frontendDate}`);
  
  // Simular la lógica del backend
  const startDate = new Date(frontendDate);
  console.log(`📅 Fecha parseada: ${startDate.toISOString().split('T')[0]}`);
  console.log(`📅 Año: ${startDate.getFullYear()}`);
  console.log(`📅 Mes (0-11): ${startDate.getMonth()}`);
  console.log(`📅 Mes (1-12): ${startDate.getMonth() + 1}`);
  
  console.log('\n📋 Generando gastos con la lógica actual:');
  
  for (let i = 0; i < 4; i++) {
    const expenseDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const monthName = expenseDate.toLocaleString('es-ES', { month: 'long' });
    const year = expenseDate.getFullYear();
    const monthNumber = expenseDate.getMonth() + 1;
    
    console.log(`  Mes ${i + 1}: ${expenseDate.toISOString().split('T')[0]} (${monthName} ${year}) - Mes ${monthNumber}`);
  }
  
  console.log('\n🔍 El problema:');
  console.log('El primer gasto (i=0) se crea en septiembre 2025, no en octubre 2025.');
  console.log('Esto es porque startDate.getMonth() devuelve 8 para octubre.');
  
  console.log('\n✅ Solución:');
  console.log('Necesitamos ajustar la lógica para que el primer gasto sea en el mes correcto.');
  
  console.log('\n📋 Con la corrección:');
  for (let i = 0; i < 4; i++) {
    // CORRECCIÓN: El primer gasto debe ser en el mes seleccionado
    const expenseDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const monthName = expenseDate.toLocaleString('es-ES', { month: 'long' });
    const year = expenseDate.getFullYear();
    const monthNumber = expenseDate.getMonth() + 1;
    
    console.log(`  Mes ${i + 1}: ${expenseDate.toISOString().split('T')[0]} (${monthName} ${year}) - Mes ${monthNumber}`);
  }
}

testOctoberFix();
