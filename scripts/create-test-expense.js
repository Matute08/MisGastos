// Script para crear un gasto de prueba en agosto
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
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          resolve({ data: data, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function createTestExpense() {
  console.log('🔧 Creando gasto de prueba en agosto...\n');

  try {
    // 1. Login para obtener token
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
    const userId = loginData.user.id;
    console.log('✅ Token obtenido para usuario:', userId);

    // 2. Obtener tarjetas para usar una de ellas
    console.log('\n2. Obteniendo tarjetas...');
    const cardsData = await makeRequest(`${API_BASE_URL}/cards`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!cardsData.success || !cardsData.data.length) {
      console.log('❌ No se pudieron obtener tarjetas');
      return;
    }

    const testCard = cardsData.data[0]; // Usar la primera tarjeta
    console.log('✅ Usando tarjeta:', testCard.name);

    // 3. Obtener categorías
    console.log('\n3. Obteniendo categorías...');
    const categoriesData = await makeRequest(`${API_BASE_URL}/categories`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!categoriesData.success || !categoriesData.data.length) {
      console.log('❌ No se pudieron obtener categorías');
      return;
    }

    const testCategory = categoriesData.data[0]; // Usar la primera categoría
    console.log('✅ Usando categoría:', testCategory.name);

    // 4. Crear gasto de prueba en agosto
    console.log('\n4. Creando gasto de prueba...');
    const testExpense = {
      description: 'Gasto de prueba agosto',
      amount: 50000,
      purchase_date: '2025-08-05',
      card_id: testCard.id,
      category_id: testCategory.id,
      installments_count: 1,
      user_id: userId
    };

    const createResponse = await makeRequest(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: testExpense
    });

    if (createResponse.success) {
      console.log('✅ Gasto creado exitosamente:', createResponse.data);
      console.log('\n🎉 Ahora puedes verificar el dashboard - debería mostrar $50,000 para la tarjeta', testCard.name);
    } else {
      console.log('❌ Error creando gasto:', createResponse.error);
    }

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

// Ejecutar script
createTestExpense(); 