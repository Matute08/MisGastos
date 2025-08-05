// Script para debuggear los totales anuales
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

async function debugAnnualTotals() {
  console.log('🔍 Debug de totales anuales...\n');

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

    // 3. Analizar totales anuales
    console.log('\n3. Analizando totales anuales...');
    const now = new Date();
    const currentYear = now.getFullYear();
    
    console.log(`📅 Año actual: ${currentYear}\n`);

    // Gastos del año
    const annualExpenses = expensesData.data.filter(expense => {
      const expenseDate = new Date(expense.purchase_date);
      return expenseDate.getFullYear() === currentYear;
    });

    console.log(`📊 Total de gastos en ${currentYear}: ${annualExpenses.length}`);
    console.log(`💰 Monto total de gastos: $${annualExpenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}`);

    // 4. Analizar por tarjeta de crédito
    console.log('\n4. Analizando por tarjeta de crédito...');
    creditCards.forEach(card => {
      console.log(`\n--- ${card.name} ---`);
      
      // Gastos de esta tarjeta en el año
      const cardExpenses = annualExpenses.filter(exp => exp.card_id === card.id);
      console.log(`Gastos del año: ${cardExpenses.length}`);
      cardExpenses.forEach(exp => {
        console.log(`  - ${exp.description}: $${exp.amount.toLocaleString()} (${exp.purchase_date})`);
      });
      
      const expensesTotal = cardExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      console.log(`🎯 TOTAL ANUAL (solo gastos): $${expensesTotal.toLocaleString()}`);
    });

    // 5. Verificar suma de tarjetas
    console.log('\n5. Verificando suma de tarjetas...');
    const cardTotals = creditCards.map(card => {
      const cardExpenses = annualExpenses.filter(exp => exp.card_id === card.id);
      const total = cardExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      return { name: card.name, total };
    });

    const sumOfCards = cardTotals.reduce((sum, card) => sum + card.total, 0);
    console.log(`📊 Suma de todas las tarjetas: $${sumOfCards.toLocaleString()}`);
    cardTotals.forEach(card => {
      console.log(`  - ${card.name}: $${card.total.toLocaleString()}`);
    });

    // 6. Verificar gastos sin tarjeta
    const expensesWithoutCard = annualExpenses.filter(exp => !exp.card_id);
    const totalWithoutCard = expensesWithoutCard.reduce((sum, exp) => sum + exp.amount, 0);
    console.log(`\n📊 Gastos sin tarjeta: $${totalWithoutCard.toLocaleString()}`);
    expensesWithoutCard.forEach(exp => {
      console.log(`  - ${exp.description}: $${exp.amount.toLocaleString()}`);
    });

    const grandTotal = sumOfCards + totalWithoutCard;
    console.log(`\n🎯 TOTAL GENERAL: $${grandTotal.toLocaleString()}`);

    console.log('\n✅ Debug completado!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugAnnualTotals(); 