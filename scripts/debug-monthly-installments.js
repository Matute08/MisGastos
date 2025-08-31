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

    // 2. Obtener datos
    const [cardsData, installmentsData] = await Promise.all([
      makeRequest(`${API_BASE_URL}/cards`, { headers: { 'Authorization': `Bearer ${token}` } }),
      makeRequest(`${API_BASE_URL}/expenses/upcoming-installments`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    if (!cardsData.success || !installmentsData.success) {
      return;
    }

    const creditCards = cardsData.data.filter(card => card.type === 'Crédito');

    // 3. Analizar cuotas del mes actual
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Todas las cuotas del mes actual
    const monthlyInstallments = installmentsData.data.filter(inst => {
      const due = new Date(inst.due_date);
      return due.getMonth() + 1 === currentMonth && due.getFullYear() === currentYear;
    });

    // 4. Analizar por tarjeta
    creditCards.forEach(card => {
      // Cuotas de esta tarjeta en el mes
      const cardInstallments = monthlyInstallments.filter(inst => 
        inst.expenses?.card_id === card.id
      );
      
      const total = cardInstallments.reduce((sum, inst) => sum + inst.amount, 0);
    });

    // 5. Simular la nueva lógica del dashboard
    creditCards.forEach(card => {
      // Cuotas que vencen en el mes (incluyendo pagadas)
      const monthlyInstallments = installmentsData.data.filter(inst => {
        const due = new Date(inst.due_date);
        const isCard = inst.expenses?.card_id === card.id;
        return isCard && due.getMonth() + 1 === currentMonth && due.getFullYear() === currentYear;
      });
      
      const monthlyInstallmentsTotal = monthlyInstallments.reduce((sum, inst) => sum + inst.amount, 0);
      
      // Gastos directos del mes (si los hay)
      // Nota: Aquí necesitaríamos los gastos, pero por ahora solo mostramos las cuotas
    });

    // Debug completado

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugMonthlyInstallments(); 