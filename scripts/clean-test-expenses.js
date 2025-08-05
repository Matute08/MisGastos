// Script para limpiar gastos de prueba de agosto
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

async function cleanTestExpenses() {
  console.log('🧹 Limpiando gastos de prueba de agosto...\n');

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

    // 2. Obtener gastos
    console.log('2. Obteniendo gastos...');
    const expensesData = await makeRequest(`${API_BASE_URL}/expenses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!expensesData.success) {
      console.log('❌ Error obteniendo gastos');
      return;
    }

    // 3. Identificar gastos de prueba de agosto
    console.log('3. Identificando gastos de prueba...');
    const augustTestExpenses = expensesData.data.filter(expense => {
      const expenseDate = new Date(expense.purchase_date);
      const isAugust = expenseDate.getMonth() + 1 === 8 && expenseDate.getFullYear() === 2025;
      const isTest = expense.description.includes('Gasto de prueba');
      return isAugust && isTest;
    });

    console.log(`📊 Gastos de prueba encontrados: ${augustTestExpenses.length}`);
    augustTestExpenses.forEach(exp => {
      console.log(`  - ${exp.description}: $${exp.amount.toLocaleString()} (${exp.purchase_date})`);
    });

    // 4. Eliminar gastos de prueba
    console.log('\n4. Eliminando gastos de prueba...');
    for (const expense of augustTestExpenses) {
      console.log(`Eliminando: ${expense.description}...`);
      
      const deleteResponse = await makeRequest(`${API_BASE_URL}/expenses/${expense.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (deleteResponse.success) {
        console.log(`✅ Eliminado: ${expense.description}`);
      } else {
        console.log(`❌ Error eliminando: ${expense.description} - ${deleteResponse.error}`);
      }
    }

    console.log('\n🎉 Limpieza completada!');
    console.log('Ahora el dashboard debería mostrar solo los datos reales de agosto.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanTestExpenses(); 