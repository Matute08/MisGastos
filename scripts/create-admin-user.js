#!/usr/bin/env node

const API_BASE_URL = 'https://fascinating-bridie-misgastos-e524faff.koyeb.app/api';

async function createAdminUser() {
  console.log('👤 Creando cuenta de admin en Koyeb...\n');

  try {
    // Datos del usuario admin
    const adminUser = {
      email: 'matutegon97@gmail.com',
      password: 'Catalina2611', // Cambia esta contraseña por la que quieras
      nombre_perfil: 'Admin User'
    };

    console.log(`📧 Registrando: ${adminUser.email}`);

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminUser)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Usuario admin registrado exitosamente');
      console.log(`📋 Token: ${data.token ? data.token.substring(0, 20) + '...' : 'No token'}`);
      
      // Probar login inmediatamente
      console.log('\n🔐 Probando login con la cuenta admin...');
      
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: adminUser.email,
          password: adminUser.password
        })
      });

      const loginData = await loginResponse.json();
      
      if (loginResponse.ok) {
        console.log('✅ Login exitoso con cuenta admin');
        console.log(`📋 Token: ${loginData.token ? loginData.token.substring(0, 20) + '...' : 'No token'}`);
        console.log(`👤 Usuario: ${loginData.user ? loginData.user.email : 'No user data'}`);
        
        console.log('\n📝 Credenciales para usar en el frontend:');
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Password: ${adminUser.password}`);
      } else {
        console.log(`❌ Error en login: ${loginData.error}`);
      }
    } else {
      console.log(`❌ Error en registro: ${data.error}`);
      if (data.details) {
        console.log(`📋 Detalles:`, data.details);
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

createAdminUser();
