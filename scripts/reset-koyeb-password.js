#!/usr/bin/env node

const API_BASE_URL = 'https://fascinating-bridie-misgastos-e524faff.koyeb.app/api';

async function resetKoyebPassword() {
  console.log('🔐 Reseteando contraseña en Koyeb...\n');

  try {
    // Primero, intentar hacer login con la contraseña actual
    console.log('1. Verificando contraseña actual...');
    
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'matutegon97@gmail.com',
        password: 'Catalina2611'
      })
    });

    if (loginResponse.ok) {
      console.log('✅ La contraseña Catalina2611 SÍ funciona en Koyeb!');
      const data = await loginResponse.json();
      console.log(`📋 Token: ${data.token ? data.token.substring(0, 20) + '...' : 'No token'}`);
      return;
    }

    console.log('❌ La contraseña Catalina2611 no funciona en Koyeb');
    console.log('🔄 Intentando resetear la contraseña...');

    // Intentar resetear la contraseña usando Supabase Auth
    const resetResponse = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'matutegon97@gmail.com'
      })
    });

    const resetData = await resetResponse.json();
    
    if (resetResponse.ok) {
      console.log('✅ Email de reset enviado a matutegon97@gmail.com');
      console.log('📧 Revisa tu email para resetear la contraseña');
    } else {
      console.log(`❌ Error enviando reset: ${resetData.error}`);
      
      // Si no hay endpoint de reset, intentar crear un nuevo usuario
      console.log('\n🔄 Intentando crear nuevo usuario con contraseña conocida...');
      
      const newUserResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'matutegon97@gmail.com',
          password: 'Catalina2611',
          nombre_perfil: 'Admin User'
        })
      });

      const newUserData = await newUserResponse.json();
      
      if (newUserResponse.ok) {
        console.log('✅ Usuario recreado exitosamente');
        console.log(`📋 Token: ${newUserData.token ? newUserData.token.substring(0, 20) + '...' : 'No token'}`);
        
        console.log('\n📝 Credenciales para usar:');
        console.log(`   Email: matutegon97@gmail.com`);
        console.log(`   Password: Catalina2611`);
      } else {
        console.log(`❌ Error recreando usuario: ${newUserData.error}`);
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

resetKoyebPassword();
