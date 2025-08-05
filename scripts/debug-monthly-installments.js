// Script para debuggear las cuotas del mes
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

async function debugMonthlyInstallments() {
  console.log('🔍 Debug de cuotas del mes...\n');

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
    const [cardsData, installmentsData] = await Promise.all([
      makeRequest(`${API_BASE_URL}/cards`, { headers: { 'Authorization': `Bearer ${token}` } }),
      makeRequest(`${API_BASE_URL}/expenses/upcoming-installments`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    if (!cardsData.success || !installmentsData.success) {
      console.log('❌ Error obteniendo datos');
      return;
    }

    const creditCards = cardsData.data.filter(card => card.type === 'Crédito');
    console.log(`✅ Tarjetas de crédito encontradas: ${creditCards.length}`);

    // 3. Analizar cuotas del mes actual
    console.log('\n3. Analizando cuotas del mes actual...');
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    console.log(`📅 Mes actual: ${currentMonth}, Año actual: ${currentYear}\n`);

    // Todas las cuotas del mes actual
    const monthlyInstallments = installmentsData.data.filter(inst => {
      const due = new Date(inst.due_date);
      return due.getMonth() + 1 === currentMonth && due.getFullYear() === currentYear;
    });

    console.log(`📊 Total de cuotas en agosto: ${monthlyInstallments.length}`);
    monthlyInstallments.forEach(inst => {
      const card = cardsData.data.find(c => c.id === inst.expenses?.card_id);
      const status = inst.payment_status_id === 3 ? 'Pagada' : inst.payment_status_id === 2 ? 'En deuda' : 'Pendiente';
      console.log(`  - ${inst.expenses?.description || 'Cuota'} (${card?.name || 'Sin tarjeta'}): $${inst.amount.toLocaleString()} - ${status} (${inst.due_date})`);
    });

    // 4. Analizar por tarjeta
    console.log('\n4. Analizando por tarjeta...');
    creditCards.forEach(card => {
      console.log(`\n--- ${card.name} ---`);
      
      // Cuotas de esta tarjeta en el mes
      const cardInstallments = monthlyInstallments.filter(inst => 
        inst.expenses?.card_id === card.id
      );
      
      console.log(`Cuotas del mes: ${cardInstallments.length}`);
      cardInstallments.forEach(inst => {
        const status = inst.payment_status_id === 3 ? 'Pagada' : inst.payment_status_id === 2 ? 'En deuda' : 'Pendiente';
        console.log(`  - ${inst.expenses?.description || 'Cuota'}: $${inst.amount.toLocaleString()} - ${status}`);
      });
      
      const total = cardInstallments.reduce((sum, inst) => sum + inst.amount, 0);
      console.log(`🎯 TOTAL CUOTAS: $${total.toLocaleString()}`);
    });

    // 5. Simular la nueva lógica del dashboard
    console.log('\n5. Simulando nueva lógica del dashboard...');
    creditCards.forEach(card => {
      console.log(`\n--- ${card.name} ---`);
      
      // Cuotas que vencen en el mes (incluyendo pagadas)
      const monthlyInstallments = installmentsData.data.filter(inst => {
        const due = new Date(inst.due_date);
        const isCard = inst.expenses?.card_id === card.id;
        return isCard && due.getMonth() + 1 === currentMonth && due.getFullYear() === currentYear;
      });
      
      const monthlyInstallmentsTotal = monthlyInstallments.reduce((sum, inst) => sum + inst.amount, 0);
      console.log(`Cuotas del mes (incluyendo pagadas): $${monthlyInstallmentsTotal.toLocaleString()}`);
      
      // Gastos directos del mes (si los hay)
      // Nota: Aquí necesitaríamos los gastos, pero por ahora solo mostramos las cuotas
      console.log(`🎯 TOTAL MENSUAL (solo cuotas): $${monthlyInstallmentsTotal.toLocaleString()}`);
    });

    console.log('\n✅ Debug completado!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugMonthlyInstallments(); 