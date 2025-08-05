// Script para crear gastos de prueba en agosto para todas las tarjetas
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

async function createTestExpenses() {
  console.log('🔧 Creando gastos de prueba para todas las tarjetas...\n');

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

    console.log('✅ Tarjetas obtenidas:', cardsData.data.length);

    // 3. Obtener categorías
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

    // 4. Crear gastos de prueba para cada tarjeta
    console.log('\n4. Creando gastos de prueba...');
    
    const testExpenses = [
      {
        card_id: cardsData.data.find(c => c.name === 'GOcuotas')?.id,
        description: 'Gasto de prueba GOcuotas - Agosto',
        amount: 50000,
        purchase_date: '2025-08-15',
        category_id: firstCategory.id,
        installments_count: 1
      },
      {
        card_id: cardsData.data.find(c => c.name === 'Mercado Pago (Crédito)')?.id,
        description: 'Gasto de prueba Mercado Pago - Agosto',
        amount: 75000,
        purchase_date: '2025-08-10',
        category_id: firstCategory.id,
        installments_count: 3
      },
      {
        card_id: cardsData.data.find(c => c.name === 'Nativa')?.id,
        description: 'Gasto de prueba Nativa - Agosto',
        amount: 120000,
        purchase_date: '2025-08-20',
        category_id: firstCategory.id,
        installments_count: 6
      },
      {
        card_id: cardsData.data.find(c => c.name === 'Transferencia')?.id,
        description: 'Gasto de prueba Transferencia - Agosto',
        amount: 30000,
        purchase_date: '2025-08-05',
        category_id: firstCategory.id,
        installments_count: 1
      }
    ];

    for (const expense of testExpenses) {
      if (!expense.card_id) {
        console.log(`⚠️ Tarjeta no encontrada para: ${expense.description}`);
        continue;
      }

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

    console.log('\n🎉 Gastos de prueba creados exitosamente!');
    console.log('Ahora puedes verificar el dashboard para ver los datos de todas las tarjetas.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestExpenses(); 