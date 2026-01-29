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
    const [cardsData, expensesData, installmentsData] = await Promise.all([
      makeRequest(`${API_BASE_URL}/cards`, { headers: { 'Authorization': `Bearer ${token}` } }),
      makeRequest(`${API_BASE_URL}/expenses`, { headers: { 'Authorization': `Bearer ${token}` } }),
      makeRequest(`${API_BASE_URL}/expenses/upcoming-installments`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    if (!cardsData.success || !expensesData.success || !installmentsData.success) {
      return;
    }

    const creditCards = cardsData.data.filter(card => card.type === 'Crédito');

    // 3. Analizar totales anuales
    const now = new Date();
    const currentYear = now.getFullYear();

    // Gastos del año
    const annualExpenses = expensesData.data.filter(expense => {
      const expenseDate = new Date(expense.purchase_date);
      return expenseDate.getFullYear() === currentYear;
    });

    // 4. Analizar por tarjeta de crédito
    creditCards.forEach(card => {
      // Gastos de esta tarjeta en el año
      const cardExpenses = annualExpenses.filter(exp => exp.card_id === card.id);
      const expensesTotal = cardExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    });

    // 5. Verificar suma de tarjetas
    const cardTotals = creditCards.map(card => {
      const cardExpenses = annualExpenses.filter(exp => exp.card_id === card.id);
      const total = cardExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      return { name: card.name, total };
    });

    const sumOfCards = cardTotals.reduce((sum, card) => sum + card.total, 0);

    // 6. Verificar gastos sin tarjeta
    const expensesWithoutCard = annualExpenses.filter(exp => !exp.card_id);
    const totalWithoutCard = expensesWithoutCard.reduce((sum, exp) => sum + exp.amount, 0);

    const grandTotal = sumOfCards + totalWithoutCard;

    // Debug completado

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugAnnualTotals(); 