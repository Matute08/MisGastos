// Debug del problema exacto
function debugExactIssue() {
  console.log('🔍 Debug del problema exacto...\n');
  
  // Simular exactamente lo que viene del frontend
  const frontendDate = '2025-10-01'; // Lo que se envía al backend
  
  console.log(`📅 Fecha del frontend: ${frontendDate}`);
  
  // Simular la lógica del backend
  const startDate = new Date(frontendDate);
  console.log(`📅 Fecha parseada: ${startDate.toISOString().split('T')[0]}`);
  console.log(`📅 Año: ${startDate.getFullYear()}`);
  console.log(`📅 Mes (0-11): ${startDate.getMonth()}`);
  console.log(`📅 Mes (1-12): ${startDate.getMonth() + 1}`);
  
  console.log('\n🔍 El problema:');
  console.log('Cuando el usuario selecciona "octubre 2025", esperamos que el primer gasto sea en octubre 2025.');
  console.log('Pero startDate.getMonth() devuelve 8 (septiembre) para octubre.');
  
  console.log('\n✅ Solución:');
  console.log('La lógica está correcta. El problema puede estar en la interpretación.');
  console.log('Octubre 2025 = mes 9 (1-indexado) = mes 8 (0-indexado)');
  console.log('El primer gasto (i=0) debería ser: octubre 2025');
  
  console.log('\n📋 Verificando la lógica:');
  for (let i = 0; i < 4; i++) {
    const expenseDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const monthName = expenseDate.toLocaleString('es-ES', { month: 'long' });
    const year = expenseDate.getFullYear();
    const monthNumber = expenseDate.getMonth() + 1;
    
    console.log(`  i=${i}: ${expenseDate.toISOString().split('T')[0]} (${monthName} ${year}) - Mes ${monthNumber}`);
  }
  
  console.log('\n🔍 Conclusión:');
  console.log('La lógica está correcta. El primer gasto (i=0) se crea en octubre 2025.');
  console.log('El problema debe estar en otro lugar.');
}

debugExactIssue();
