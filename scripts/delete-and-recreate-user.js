#!/usr/bin/env node

const API_BASE_URL = 'https://fascinating-bridie-misgastos-e524faff.koyeb.app/api';

async function deleteAndRecreateUser() {
  console.log('🔄 Eliminando y recreando usuario en Koyeb...\n');

  try {
    // 1. Intentar eliminar el usuario existente (si hay endpoint)
    console.log('1. Intentando eliminar usuario existente...');
    
    const deleteResponse = await fetch(`${API_BASE_URL}/auth/delete-user`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'matutegon97@gmail.com'
      })
    });

    if (deleteResponse.ok) {
      console.log('✅ Usuario eliminado exitosamente');
    } else {
      console.log('⚠️ No se pudo eliminar el usuario (endpoint no disponible)');
    }

    // 2. Crear nuevo usuario con contraseña conocida
    console.log('\n2. Creando nuevo usuario con contraseña Catalina2611...');
    
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
      
      // 3. Probar login inmediatamente
      console.log('\n3. Probando login con nueva cuenta...');
      
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

      const loginData = await loginResponse.json();
      
      if (loginResponse.ok) {
        console.log('✅ Login exitoso con nueva cuenta');
        console.log(`📋 Token: ${loginData.token ? loginData.token.substring(0, 20) + '...' : 'No token'}`);
        
        console.log('\n📝 Credenciales para usar en el frontend:');
        console.log(`   Email: matutegon97@gmail.com`);
        console.log(`   Password: Catalina2611`);
      } else {
        console.log(`❌ Error en login: ${loginData.error}`);
      }
    } else {
      console.log(`❌ Error recreando usuario: ${newUserData.error}`);
      
      // Si no se puede recrear, sugerir usar credenciales temporales
      console.log('\n💡 Sugerencia: Usa las credenciales temporales:');
      console.log(`   Email: test@hotmail.com`);
      console.log(`   Password: test123456`);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

deleteAndRecreateUser();
