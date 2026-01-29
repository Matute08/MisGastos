// Test específico para octubre 2025
function testOctoberDates() {
  console.log('🧪 Probando fechas para octubre 2025...\n');
  
  // Simular exactamente lo que viene del frontend
  const frontendDate = '2025-10-01'; // Lo que se envía al backend
  
  console.log(`📅 Fecha del frontend: ${frontendDate}`);
  
  // Simular la lógica del backend
  const startDate = new Date(frontendDate);
  console.log(`📅 Fecha parseada: ${startDate.toISOString().split('T')[0]}`);
  console.log(`📅 Año: ${startDate.getFullYear()}`);
  console.log(`📅 Mes (0-11): ${startDate.getMonth()}`);
  console.log(`📅 Mes (1-12): ${startDate.getMonth() + 1}`);
  
  const maxMonths = 4;
  console.log(`📊 Número de meses a crear: ${maxMonths}\n`);
  
  console.log('📋 Generando gastos:');
  
  for (let i = 0; i < maxMonths; i++) {
    const expenseDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const monthName = expenseDate.toLocaleString('es-ES', { month: 'long' });
    const year = expenseDate.getFullYear();
    const monthNumber = expenseDate.getMonth() + 1;
    
    console.log(`  Mes ${i + 1}: ${expenseDate.toISOString().split('T')[0]} (${monthName} ${year}) - Mes ${monthNumber}`);
  }
  
  console.log('\n🔍 Verificación:');
  console.log('Si el usuario selecciona octubre 2025, esperamos:');
  console.log('  - Mes 1: Octubre 2025');
  console.log('  - Mes 2: Noviembre 2025');
  console.log('  - Mes 3: Diciembre 2025');
  console.log('  - Mes 4: Enero 2026');
}

testOctoberDates();
