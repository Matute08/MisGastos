#!/usr/bin/env node

const API_BASE_URL = 'https://fascinating-bridie-misgastos-e524faff.koyeb.app/api';

async function testAdminPassword() {
  console.log('🔐 Probando contraseñas para matutegon97@gmail.com...\n');

  const passwords = [
    'admin123456',
    'admin123',
    '123456',
    'password',
    'password123',
    'admin',
    'user123',
    'test123',
    'Catalina2611',
    'matutegon97',
    'misgastos',
    'misgastos123'
  ];

  for (const password of passwords) {
    console.log(`   Probando: ${password}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'matutegon97@gmail.com',
          password: password
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`\n✅ ÉXITO: Contraseña encontrada!`);
        console.log(`   📧 Email: matutegon97@gmail.com`);
        console.log(`   🔑 Password: ${password}`);
        console.log(`   📋 Token: ${data.token ? data.token.substring(0, 20) + '...' : 'No token'}`);
        return;
      } else {
        console.log(`   ❌ ${data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }

  console.log('\n❌ No se encontró la contraseña correcta.');
  console.log('💡 Sugerencia: Usa las credenciales que funcionan:');
  console.log('   📧 Email: test@hotmail.com');
  console.log('   🔑 Password: test123456');
}

testAdminPassword();
