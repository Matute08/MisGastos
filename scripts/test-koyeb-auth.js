#!/usr/bin/env node

const API_BASE_URL = 'https://fascinating-bridie-misgastos-e524faff.koyeb.app/api';

async function testKoyebAuth() {
  console.log('🧪 Probando autenticación en Koyeb...\n');

  try {
    // Probar registro con diferentes dominios de email
    console.log('1. Probando registro con diferentes dominios de email...');
    
    const testEmails = [
      'i',
      'test@hotmail.com',
      'test@yahoo.com',
      'test@outlook.com',
      'test@icloud.com'
    ];

    for (const email of testEmails) {
      console.log(`\n   Probando registro con: ${email}`);
      
      const newUser = {
        email: email,
        password: 'test123456',
        nombre_perfil: 'Usuario Test'
      };

      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newUser)
        });

        const data = await response.json();
        
        if (response.ok) {
          console.log(`   ✅ ÉXITO: Usuario registrado con ${email}`);
          console.log(`   📋 Token: ${data.token ? data.token.substring(0, 20) + '...' : 'No token'}`);
          
          // Probar login inmediatamente
          console.log(`   🔐 Probando login con ${email}...`);
          
          const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email,
              password: 'test123456'
            })
          });

          const loginData = await loginResponse.json();
          
          if (loginResponse.ok) {
            console.log(`   ✅ Login exitoso con ${email}`);
            console.log(`   📋 Token: ${loginData.token ? loginData.token.substring(0, 20) + '...' : 'No token'}`);
            console.log(`   👤 Usuario: ${loginData.user ? loginData.user.email : 'No user data'}`);
            
            console.log('\n📝 Credenciales para usar en el frontend:');
            console.log(`   Email: ${email}`);
            console.log(`   Password: test123456`);
            return;
          } else {
            console.log(`   ❌ Error en login: ${loginData.error}`);
          }
        } else {
          console.log(`   ❌ Error en registro: ${data.error}`);
          if (data.details) {
            console.log(`   📋 Detalles:`, data.details);
          }
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    }

    console.log('\n❌ No se pudo registrar ningún usuario. Verificando configuración...');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testKoyebAuth();
