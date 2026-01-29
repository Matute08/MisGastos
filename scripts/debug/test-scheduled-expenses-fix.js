import { createClient } from '@supabase/supabase-js';

// Usar las variables de entorno directamente (asumiendo que están configuradas)
const supabaseUrl = 'https://your-project.supabase.co'; // Reemplazar con tu URL
const supabaseKey = 'your-anon-key'; // Reemplazar con tu key

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
}

// Función para limpiar gastos de prueba
async function cleanupTestExpenses() {
  console.log('\n🧹 Limpiando gastos de prueba...');
  
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .like('description', 'Test Netflix%');
    
    if (error) {
      console.error('❌ Error limpiando gastos de prueba:', error);
    } else {
      console.log('✅ Gastos de prueba eliminados');
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Función para crear un gasto programado de prueba
async function createTestScheduledExpense() {
  console.log('\n🧪 Creando gasto programado de prueba...');
  
  try {
    // Obtener un usuario de prueba
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.error('❌ No se encontraron usuarios');
      return;
    }
    
    const userId = users[0].id;
    
    // Obtener una tarjeta del usuario
    const { data: userCards, error: cardsError } = await supabase
      .from('user_cards')
      .select('available_card_id')
      .eq('user_id', userId)
      .limit(1);
    
    if (cardsError || !userCards || userCards.length === 0) {
      console.error('❌ No se encontraron tarjetas para el usuario');
      return;
    }
    
    // Obtener una categoría
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (catError || !categories || categories.length === 0) {
      console.error('❌ No se encontraron categorías');
      return;
    }
    
    const expenseData = {
      user_id: userId,
      description: 'Test Netflix - Fecha Corregida',
      amount: 10000,
      card_id: userCards[0].available_card_id,
      category_id: categories[0].id,
      scheduled_start_month: '2025-10-01',
      scheduled_months: 12,
      payment_status_id: 1
    };
    
    // Simular la lógica del backend
    const startDate = new Date(expenseData.scheduled_start_month);
    const maxMonths = expenseData.scheduled_months || 24;
    const expensesToCreate = [];
    
    for (let i = 0; i < maxMonths; i++) {
      const expenseDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      
      const expense = {
        user_id: expenseData.user_id,
        description: expenseData.description,
        amount: expenseData.amount,
        card_id: expenseData.card_id,
        category_id: expenseData.category_id,
        purchase_date: expenseDate.toISOString().split('T')[0],
        payment_status_id: expenseData.payment_status_id,
        installments_count: 1,
        is_scheduled: true,
        scheduled_start_month: expenseData.scheduled_start_month,
        scheduled_months: expenseData.scheduled_months,
        is_active: true
      };
      
      expensesToCreate.push(expense);
    }
    
    console.log(`📊 Se crearán ${expensesToCreate.length} gastos programados`);
    
    // Mostrar las primeras 5 fechas
    console.log('📅 Primeras 5 fechas:');
    expensesToCreate.slice(0, 5).forEach((expense, index) => {
      console.log(`  ${index + 1}. ${expense.purchase_date}`);
    });
    
    // Insertar en la base de datos
    const { data, error } = await supabase
      .from('expenses')
      .insert(expensesToCreate)
      .select('id, purchase_date, description');
    
    if (error) {
      console.error('❌ Error creando gastos programados:', error);
    } else {
      console.log(`✅ Se crearon ${data.length} gastos programados correctamente`);
      
      // Verificar que las fechas son consecutivas
      const dates = data.map(expense => expense.purchase_date).sort();
      console.log('📅 Fechas creadas:', dates.slice(0, 10).join(', '));
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar las pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas de gastos programados...\n');
  
  // Probar la lógica de fechas
  testDateLogic();
  
  // Limpiar gastos de prueba anteriores
  await cleanupTestExpenses();
  
  // Crear gasto programado de prueba
  await createTestScheduledExpense();
  
  console.log('\n✨ Pruebas completadas');
}

runTests().catch(console.error);
