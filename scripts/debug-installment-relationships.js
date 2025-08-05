// Script para investigar la relación entre cuotas y tarjetas
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

async function debugInstallmentRelationships() {
  console.log('🔍 Investigando relaciones entre cuotas y tarjetas...\n');

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
    const [cardsData, installmentsData, expensesData] = await Promise.all([
      makeRequest(`${API_BASE_URL}/cards`, { headers: { 'Authorization': `Bearer ${token}` } }),
      makeRequest(`${API_BASE_URL}/expenses/upcoming-installments`, { headers: { 'Authorization': `Bearer ${token}` } }),
      makeRequest(`${API_BASE_URL}/expenses`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    if (!cardsData.success || !installmentsData.success || !expensesData.success) {
      console.log('❌ Error obteniendo datos');
      return;
    }

    console.log(`✅ Tarjetas encontradas: ${cardsData.data.length}`);
    console.log(`✅ Cuotas encontradas: ${installmentsData.data.length}`);
    console.log(`✅ Gastos encontrados: ${expensesData.data.length}`);

    // 3. Analizar cuotas de agosto
    console.log('\n3. Analizando cuotas de agosto...');
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const augustInstallments = installmentsData.data.filter(inst => {
      const due = new Date(inst.due_date);
      return due.getMonth() + 1 === currentMonth && due.getFullYear() === currentYear;
    });

    console.log(`📊 Cuotas de agosto: ${augustInstallments.length}`);
    augustInstallments.forEach((inst, index) => {
      console.log(`\n--- Cuota ${index + 1} ---`);
      console.log(`ID: ${inst.id}`);
      console.log(`Expense ID: ${inst.expense_id}`);
      console.log(`Descripción: ${inst.expenses?.description || 'Sin descripción'}`);
      console.log(`Monto: $${inst.amount.toLocaleString()}`);
      console.log(`Fecha de vencimiento: ${inst.due_date}`);
      console.log(`Estado: ${inst.payment_status_id === 3 ? 'Pagada' : inst.payment_status_id === 2 ? 'En deuda' : 'Pendiente'}`);
      
      // Buscar el gasto original
      const originalExpense = expensesData.data.find(exp => exp.id === inst.expense_id);
      if (originalExpense) {
        console.log(`Gasto original:`);
        console.log(`  - ID: ${originalExpense.id}`);
        console.log(`  - Card ID: ${originalExpense.card_id}`);
        console.log(`  - Descripción: ${originalExpense.description}`);
        console.log(`  - Monto: $${originalExpense.amount.toLocaleString()}`);
        console.log(`  - Fecha: ${originalExpense.purchase_date}`);
        
        // Buscar la tarjeta
        const card = cardsData.data.find(c => c.id === originalExpense.card_id);
        console.log(`  - Tarjeta: ${card?.name || 'Sin tarjeta'} (${card?.type || 'Sin tipo'})`);
      } else {
        console.log(`❌ No se encontró el gasto original`);
      }
    });

    // 4. Verificar relaciones
    console.log('\n4. Verificando relaciones...');
    augustInstallments.forEach(inst => {
      const originalExpense = expensesData.data.find(exp => exp.id === inst.expense_id);
      if (originalExpense) {
        const card = cardsData.data.find(c => c.id === originalExpense.card_id);
        console.log(`Cuota "${inst.expenses?.description || 'Sin descripción'}": ${card?.name || 'Sin tarjeta'} (${card?.type || 'Sin tipo'})`);
      }
    });

    console.log('\n✅ Debug completado!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugInstallmentRelationships(); 