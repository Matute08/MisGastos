// Script para debuggear específicamente los gastos de agosto
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

async function debugAugustExpenses() {
  console.log('🔍 Debug de gastos de agosto...\n');

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

    // 3. Analizar gastos directos de agosto
    console.log('\n3. Analizando gastos directos de agosto...');
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    console.log(`📅 Mes actual: ${currentMonth}, Año actual: ${currentYear}\n`);

    // Gastos directos de agosto
    const augustExpenses = expensesData.data.filter(expense => {
      const expenseDate = new Date(expense.purchase_date);
      return expenseDate.getMonth() + 1 === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    console.log(`📊 Gastos directos en agosto: ${augustExpenses.length}`);
    augustExpenses.forEach(exp => {
      const card = cardsData.data.find(c => c.id === exp.card_id);
      console.log(`  - ${exp.description}: $${exp.amount.toLocaleString()} (${card?.name || 'Sin tarjeta'}) - ${exp.purchase_date}`);
    });

    // 4. Analizar por tarjeta de crédito
    console.log('\n4. Analizando por tarjeta de crédito...');
    creditCards.forEach(card => {
      console.log(`\n--- ${card.name} ---`);
      
      // Gastos directos de esta tarjeta en agosto
      const cardExpenses = augustExpenses.filter(exp => exp.card_id === card.id);
      console.log(`Gastos directos de agosto: ${cardExpenses.length}`);
      cardExpenses.forEach(exp => {
        console.log(`  - ${exp.description}: $${exp.amount.toLocaleString()} (${exp.purchase_date})`);
      });
      
      const expensesTotal = cardExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      console.log(`Total gastos directos: $${expensesTotal.toLocaleString()}`);
      
      // Cuotas de esta tarjeta en agosto
      const cardInstallments = installmentsData.data.filter(inst => {
        const due = new Date(inst.due_date);
        const originalExpense = expensesData.data.find(exp => exp.id === inst.expense_id);
        const isCard = originalExpense && originalExpense.card_id === card.id;
        return isCard && due.getMonth() + 1 === currentMonth && due.getFullYear() === currentYear;
      });
      
      console.log(`Cuotas de agosto: ${cardInstallments.length}`);
      cardInstallments.forEach(inst => {
        const status = inst.payment_status_id === 3 ? 'Pagada' : inst.payment_status_id === 2 ? 'En deuda' : 'Pendiente';
        console.log(`  - ${inst.expenses?.description || 'Cuota'}: $${inst.amount.toLocaleString()} (${inst.due_date}) - ${status}`);
      });
      
      const installmentsTotal = cardInstallments.reduce((sum, inst) => sum + inst.amount, 0);
      console.log(`Total cuotas: $${installmentsTotal.toLocaleString()}`);
      
      const total = expensesTotal + installmentsTotal;
      console.log(`🎯 TOTAL AGOSTO: $${total.toLocaleString()}`);
    });

    console.log('\n✅ Debug completado!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugAugustExpenses(); 