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
  

  try {
    // 1. Login
    const loginData = await makeRequest(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: {
        email: 'matutegon97@gmail.com',
        password: 'Catalina26'
      }
    });

    if (!loginData.success) {
      return;
    }

    const token = loginData.token;

    // 2. Obtener gastos
    const expensesData = await makeRequest(`${API_BASE_URL}/expenses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!expensesData.success) {
      return;
    }

    // 3. Identificar gastos de prueba de agosto
    const augustTestExpenses = expensesData.data.filter(expense => {
      const expenseDate = new Date(expense.purchase_date);
      const isAugust = expenseDate.getMonth() + 1 === 8 && expenseDate.getFullYear() === 2025;
      const isTest = expense.description.includes('Gasto de prueba');
      return isAugust && isTest;
    });

    // 4. Eliminar gastos de prueba
    for (const expense of augustTestExpenses) {
      const deleteResponse = await makeRequest(`${API_BASE_URL}/expenses/${expense.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (deleteResponse.success) {
        // Eliminado exitosamente
      } else {
        // Error eliminando
      }
    }

    // Limpieza completada

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanTestExpenses(); 