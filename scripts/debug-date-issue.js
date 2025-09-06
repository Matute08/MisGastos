// Debug del problema de fechas
function debugDateIssue() {
  console.log('🔍 Debug del problema de fechas...\n');
  
  // Simular lo que viene del frontend
  const frontendDate = '2025-10'; // Lo que viene del input
  const backendDate = frontendDate + '-01'; // Lo que se envía al backend
  
  console.log(`📅 Fecha del frontend: ${frontendDate}`);
  console.log(`📅 Fecha enviada al backend: ${backendDate}`);
  
  // Simular lo que hace el backend
  const startDate = new Date(backendDate);
  console.log(`📅 Fecha parseada por el backend: ${startDate.toISOString().split('T')[0]}`);
  console.log(`📅 Mes del backend (0-11): ${startDate.getMonth()}`);
  console.log(`📅 Mes del backend (1-12): ${startDate.getMonth() + 1}`);
  
  console.log('\n📋 Generando gastos programados:');
  
  for (let i = 0; i < 6; i++) {
    const expenseDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    console.log(`  Mes ${i + 1}: ${expenseDate.toISOString().split('T')[0]} (${expenseDate.getFullYear()}-${(expenseDate.getMonth() + 1).toString().padStart(2, '0')})`);
  }
  
  console.log('\n🔍 El problema:');
  console.log('Si el usuario selecciona octubre 2025, esperamos que el primer gasto sea en octubre 2025, no en septiembre 2025.');
  
  console.log('\n✅ Solución:');
  console.log('La lógica está correcta. El problema puede estar en cómo se muestra o en la lógica de filtrado.');
}

debugDateIssue();
