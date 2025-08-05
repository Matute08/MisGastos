// Script para debuggear la nueva lógica del dashboard
import https from 'https';
import http from 'http';

const API_BASE_URL = 'http://localhost:3001/api';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function debugNewLogic() {
  console.log('🔍 Debug de la nueva lógica del dashboard...\n');

  try {
    // 1. Login
    console.log('1. Obteniendo token...');
    const loginData = await makeRequest(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: {
        email: 'matutegon97@gmail.com',
        password: 'Catalina26'
      }
    });

    if (!loginData.success) {
      console.log('❌ Error en login:', loginData.error);
      return;
    }

    const token = loginData.token;
    console.log('✅ Login exitoso\n');

    // 2. Obtener datos
    console.log('2. Obteniendo datos...');
    const [cardsData, expensesData, installmentsData] = await Promise.all([
      makeRequest(`${API_BASE_URL}/cards`, { headers: { 'Authorization': `Bearer ${token}` } }),
      makeRequest(`${API_BASE_URL}/expenses`, { headers: { 'Authorization': `Bearer ${token}` } }),
      makeRequest(`${API_BASE_URL}/expenses/upcoming-installments`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    if (!cardsData.success || !expensesData.success || !installmentsData.success) {
      console.log('❌ Error obteniendo datos');
      return;
    }

    const creditCards = cardsData.data.filter(card => card.type === 'Crédito');
    console.log(`✅ Tarjetas de crédito encontradas: ${creditCards.length}`);

    // 3. Simular la nueva lógica
    console.log('\n3. Simulando nueva lógica del dashboard...');
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    console.log(`📅 Mes actual: ${currentMonth}, Año actual: ${currentYear}\n`);

    // Vista mensual
    console.log('📊 VISTA MENSUAL:');
    creditCards.forEach(card => {
      console.log(`\n--- ${card.name} ---`);
      
      // Gastos del mes
      const monthlyExpenses = expensesData.data.filter(expense => {
        const expenseDate = new Date(expense.purchase_date);
        const isCard = expense.card_id === card.id;
        return isCard && expenseDate.getMonth() + 1 === currentMonth && expenseDate.getFullYear() === currentYear;
      });
      
      const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      console.log(`Gastos del mes: ${monthlyExpenses.length} gastos = $${monthlyTotal.toLocaleString()}`);
      monthlyExpenses.forEach(exp => {
        console.log(`  - ${exp.description}: $${exp.amount.toLocaleString()}`);
      });
      
      // Cuotas que vencen en el mes
      const monthlyInstallments = installmentsData.data.filter(inst => {
        const due = new Date(inst.due_date);
        // Buscar el gasto original para obtener la tarjeta
        const originalExpense = expensesData.data.find(exp => exp.id === inst.expense_id);
        const isCard = originalExpense && originalExpense.card_id === card.id;
        return isCard && due.getMonth() + 1 === currentMonth && due.getFullYear() === currentYear;
      });
      
      const monthlyInstallmentsTotal = monthlyInstallments.reduce((sum, inst) => sum + inst.amount, 0);
      console.log(`Cuotas del mes: ${monthlyInstallments.length} cuotas = $${monthlyInstallmentsTotal.toLocaleString()}`);
      monthlyInstallments.forEach(inst => {
        console.log(`  - ${inst.expenses?.description || 'Cuota'}: $${inst.amount.toLocaleString()} (vence: ${inst.due_date})`);
      });
      
      const total = monthlyTotal + monthlyInstallmentsTotal;
      console.log(`🎯 TOTAL MENSUAL: $${total.toLocaleString()}`);
    });

    // Vista anual
    console.log('\n📊 VISTA ANUAL:');
    creditCards.forEach(card => {
      console.log(`\n--- ${card.name} ---`);
      
      // Todos los gastos del año
      const annualExpenses = expensesData.data.filter(expense => {
        const expenseDate = new Date(expense.purchase_date);
        const isCard = expense.card_id === card.id;
        return isCard && expenseDate.getFullYear() === currentYear;
      });
      
      const annualTotal = annualExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      console.log(`Gastos del año: ${annualExpenses.length} gastos = $${annualTotal.toLocaleString()}`);
      
      // Cuotas pendientes del año
      const annualInstallments = installmentsData.data.filter(inst => {
        const due = new Date(inst.due_date);
        // Buscar el gasto original para obtener la tarjeta
        const originalExpense = expensesData.data.find(exp => exp.id === inst.expense_id);
        const isCard = originalExpense && originalExpense.card_id === card.id;
        return isCard && due.getFullYear() === currentYear && inst.payment_status_id !== 3;
      });
      
      const annualInstallmentsTotal = annualInstallments.reduce((sum, inst) => sum + inst.amount, 0);
      console.log(`Cuotas pendientes del año: ${annualInstallments.length} cuotas = $${annualInstallmentsTotal.toLocaleString()}`);
      
      const total = annualTotal + annualInstallmentsTotal;
      console.log(`🎯 TOTAL ANUAL: $${total.toLocaleString()}`);
    });

    console.log('\n✅ Debug completado!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugNewLogic(); 