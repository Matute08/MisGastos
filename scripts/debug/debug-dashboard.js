// Script para debug del dashboard
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

async function debugDashboard() {
  console.log('🔍 Debug del Dashboard...\n');

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

    console.log('Respuesta de login:', loginData);

    if (!loginData.success) {
      console.log('❌ Error en login:', loginData.error);
      return;
    }

    const token = loginData.token;
    const userId = loginData.user.id;
    console.log('✅ Token obtenido para usuario:', userId);

    // 2. Obtener tarjetas
    console.log('\n2. Obteniendo tarjetas...');
    const cardsData = await makeRequest(`${API_BASE_URL}/cards`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Tarjetas:', cardsData);

    // 3. Obtener gastos
    console.log('\n3. Obteniendo gastos...');
    const expensesData = await makeRequest(`${API_BASE_URL}/expenses`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Gastos:', expensesData);

    // 4. Obtener próximas cuotas
    console.log('\n4. Obteniendo próximas cuotas...');
    const installmentsData = await makeRequest(`${API_BASE_URL}/expenses/upcoming-installments?limit=1000`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Próximas cuotas:', installmentsData);

    // 5. Obtener gastos mensuales con cuotas
    console.log('\n5. Obteniendo gastos mensuales con cuotas...');
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const monthlyData = await makeRequest(`${API_BASE_URL}/expenses/monthly?month=${currentMonth}&year=${currentYear}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Gastos mensuales:', monthlyData);

    // 6. Analizar datos por tarjeta
    console.log('\n6. Analizando datos por tarjeta...');
    if (cardsData.success && cardsData.data) {
      cardsData.data.forEach(card => {
        console.log(`\n--- Tarjeta: ${card.name} (${card.type}) ---`);
        
        // Gastos directos de esta tarjeta
        const cardExpenses = expensesData.data?.filter(exp => exp.card_id === card.id) || [];
        console.log(`Gastos directos: ${cardExpenses.length}`);
        cardExpenses.forEach(exp => {
          console.log(`  - ${exp.description}: $${exp.amount} (${exp.purchase_date})`);
        });
        
        // Cuotas de esta tarjeta
        const cardInstallments = installmentsData.data?.filter(inst => 
          inst.expenses?.cards?.id === card.id
        ) || [];
        console.log(`Cuotas pendientes: ${cardInstallments.length}`);
        cardInstallments.forEach(inst => {
          console.log(`  - ${inst.expenses?.description}: $${inst.amount} (${inst.due_date})`);
        });
        
        // Cuotas del mes actual
        const currentMonthInstallments = cardInstallments.filter(inst => {
          const dueDate = new Date(inst.due_date);
          return dueDate.getMonth() + 1 === currentMonth && dueDate.getFullYear() === currentYear;
        });
        console.log(`Cuotas del mes actual: ${currentMonthInstallments.length}`);
        currentMonthInstallments.forEach(inst => {
          console.log(`  - ${inst.expenses?.description}: $${inst.amount} (${inst.due_date})`);
        });
        
        // Simular la función cardTotal
        console.log('\n--- Simulando cardTotal ---');
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        console.log(`Mes actual: ${currentMonth}, Año actual: ${currentYear}`);
        
        // Cuotas pendientes y en deuda
        const installments = installmentsData.data?.filter(inst => {
          const due = new Date(inst.due_date);
          const isCard = inst.expenses?.cards?.id === card.id;
          return isCard && due.getMonth() + 1 === currentMonth && due.getFullYear() === currentYear && inst.payment_status_id !== 3;
        }) || [];
        const installmentsTotal = installments.reduce((sum, inst) => sum + inst.amount, 0);
        console.log(`Cuotas del mes (status != 3): ${installments.length}, Total: $${installmentsTotal}`);
        
        // Gastos directos del mes (con nueva lógica)
        const directExpenses = expensesData.data?.filter(expense => {
          const expenseDate = new Date(expense.purchase_date);
          const isCard = expense.card_id === card.id;
          
          // Nueva lógica: solo gastos del mes actual para vista mensual
          const isCurrentMonth = expenseDate.getMonth() + 1 === currentMonth && expenseDate.getFullYear() === currentYear;
          
          console.log(`  Gastos ${expense.description}: mes=${expenseDate.getMonth() + 1}, isCurrent=${isCurrentMonth}`);
          
          return isCard && isCurrentMonth;
        }) || [];
        const directTotal = directExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        console.log(`Gastos directos del mes: ${directExpenses.length}, Total: $${directTotal}`);
        
        const total = installmentsTotal + directTotal;
        console.log(`TOTAL CALCULADO: $${total}`);
      });
    }

    console.log('\n✅ Debug completado!');

  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
}

// Ejecutar debug
debugDashboard(); 