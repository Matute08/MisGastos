// Script para probar la autenticación
const API_BASE_URL = 'http://localhost:3001/api';

async function testAuth() {
  

  try {
    // 1. Probar registro
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        nombre_perfil: 'Usuario Test'
      })
    });

    const registerData = await registerResponse.json();

    if (!registerData.success) {
      return;
    }

    // 2. Probar login
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();

    if (!loginData.success) {
      return;
    }

    const token = loginData.token;

    // 3. Probar validación de token
    const validateResponse = await fetch(`${API_BASE_URL}/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const validateData = await validateResponse.json();

    // 4. Probar obtención de perfil
    const profileResponse = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const profileData = await profileResponse.json();

    // 5. Probar renovación de token
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token
      })
    });

    const refreshData = await refreshResponse.json();

    // Todas las pruebas completadas exitosamente

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar pruebas
testAuth(); 