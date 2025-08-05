// Script para verificar tarjetas y crear gastos de prueba
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

async function checkAndCreateTestData() {
  console.log('🔧 Verificando tarjetas y creando datos de prueba...\n');

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

    // 2. Obtener tarjetas
    console.log('2. Obteniendo tarjetas...');
    const cardsData = await makeRequest(`${API_BASE_URL}/cards`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!cardsData.success) {
      console.log('❌ Error obteniendo tarjetas:', cardsData.error);
      return;
    }

    console.log('✅ Tarjetas encontradas:');
    cardsData.data.forEach((card, index) => {
      console.log(`${index + 1}. ID: ${card.id} | Nombre: "${card.name}" | Tipo: ${card.type}`);
    });

    // 3. Filtrar tarjetas de crédito
    const creditCards = cardsData.data.filter(card => card.type === 'Crédito');
    console.log(`\n📊 Tarjetas de crédito encontradas: ${creditCards.length}`);
    creditCards.forEach((card, index) => {
      console.log(`${index + 1}. ${card.name} (ID: ${card.id})`);
    });

    // 4. Obtener categorías
    console.log('\n3. Obteniendo categorías...');
    const categoriesData = await makeRequest(`${API_BASE_URL}/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!categoriesData.success) {
      console.log('❌ Error obteniendo categorías:', categoriesData.error);
      return;
    }

    const firstCategory = categoriesData.data[0];
    console.log('✅ Categorías obtenidas');

    // 5. Crear gastos de prueba para cada tarjeta de crédito
    console.log('\n4. Creando gastos de prueba para tarjetas de crédito...');
    
    const testExpenses = creditCards.map((card, index) => ({
      card_id: card.id,
      description: `Gasto de prueba ${card.name} - Agosto`,
      amount: 50000 + (index * 25000), // Montos diferentes para cada tarjeta
      purchase_date: '2025-08-15',
      category_id: firstCategory.id,
      installments_count: index + 1 // Diferentes cantidades de cuotas
    }));

    for (const expense of testExpenses) {
      console.log(`Creando gasto: ${expense.description} - $${expense.amount}`);
      
      const createResponse = await makeRequest(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: expense
      });

      if (createResponse.success) {
        console.log(`✅ Gasto creado: ${createResponse.data.id}`);
      } else {
        console.log(`❌ Error creando gasto: ${createResponse.error}`);
      }
    }

    // 6. Verificar gastos creados
    console.log('\n5. Verificando gastos creados...');
    const expensesData = await makeRequest(`${API_BASE_URL}/expenses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (expensesData.success) {
      console.log(`✅ Total de gastos en la base de datos: ${expensesData.data.length}`);
      
      // Mostrar gastos de agosto
      const augustExpenses = expensesData.data.filter(exp => {
        const date = new Date(exp.purchase_date);
        return date.getMonth() + 1 === 8 && date.getFullYear() === 2025;
      });
      
      console.log(`📅 Gastos de agosto: ${augustExpenses.length}`);
      augustExpenses.forEach(exp => {
        const card = cardsData.data.find(c => c.id === exp.card_id);
        console.log(`  - ${exp.description}: $${exp.amount} (${card?.name || 'Sin tarjeta'})`);
      });
    }

    console.log('\n🎉 Proceso completado!');
    console.log('Ahora puedes verificar el dashboard para ver los datos de todas las tarjetas de crédito.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAndCreateTestData(); 