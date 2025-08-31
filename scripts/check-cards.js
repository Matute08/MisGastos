// Script para verificar las tarjetas existentes
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

async function checkCards() {
  

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

    // 2. Obtener tarjetas
    const cardsData = await makeRequest(`${API_BASE_URL}/cards`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!cardsData.success) {
      return;
    }

    // Tarjetas encontradas
    cardsData.data.forEach((card, index) => {
      // Procesar tarjeta
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCards(); 