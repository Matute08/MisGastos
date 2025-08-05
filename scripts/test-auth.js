// Script para probar la autenticación
const API_BASE_URL = 'http://localhost:3001/api';

async function testAuth() {
  console.log('🧪 Probando sistema de autenticación...\n');

  try {
    // 1. Probar registro
    console.log('1. Probando registro...');
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
    console.log('Respuesta de registro:', registerData);

    if (!registerData.success) {
      console.log('❌ Error en registro:', registerData.error);
      return;
    }

    // 2. Probar login
    console.log('\n2. Probando login...');
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
    console.log('Respuesta de login:', loginData);

    if (!loginData.success) {
      console.log('❌ Error en login:', loginData.error);
      return;
    }

    const token = loginData.token;
    console.log('✅ Token obtenido:', token.substring(0, 20) + '...');

    // 3. Probar validación de token
    console.log('\n3. Probando validación de token...');
    const validateResponse = await fetch(`${API_BASE_URL}/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const validateData = await validateResponse.json();
    console.log('Respuesta de validación:', validateData);

    // 4. Probar obtención de perfil
    console.log('\n4. Probando obtención de perfil...');
    const profileResponse = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const profileData = await profileResponse.json();
    console.log('Respuesta de perfil:', profileData);

    // 5. Probar renovación de token
    console.log('\n5. Probando renovación de token...');
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
    console.log('Respuesta de renovación:', refreshData);

    console.log('\n✅ Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar pruebas
testAuth(); 