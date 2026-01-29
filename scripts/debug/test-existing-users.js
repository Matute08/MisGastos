#!/usr/bin/env node

const API_BASE_URL = 'https://fascinating-bridie-misgastos-e524faff.koyeb.app/api';

async function testExistingUsers() {
  console.log('🧪 Probando usuarios existentes en Koyeb...\n');

  try {
    // Usuarios que sabemos que se registraron
    const existingUsers = [
      { email: 'test@hotmail.com', password: 'test123456' },
      { email: 'test@outlook.com', password: 'test123456' }
    ];

    for (const user of existingUsers) {
      console.log(`\n🔐 Probando login con: ${user.email}`);
      
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user)
        });

        const data = await response.json();
        
        if (response.ok) {
          console.log(`   ✅ ÉXITO: Login exitoso`);
          console.log(`   📋 Token: ${data.token ? data.token.substring(0, 20) + '...' : 'No token'}`);
          console.log(`   👤 Usuario: ${data.user ? data.user.email : 'No user data'}`);
          
          console.log('\n📝 Credenciales para usar en el frontend:');
          console.log(`   Email: ${user.email}`);
          console.log(`   Password: ${user.password}`);
          return;
        } else {
          console.log(`   ❌ FALLO: ${data.error || 'Error desconocido'}`);
          
          // Si es "Email not confirmed", intentar registrar de nuevo
          if (data.error === 'Email not confirmed') {
            console.log(`   🔄 Intentando registrar de nuevo: ${user.email}`);
            
            const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: user.email,
                password: user.password,
                nombre_perfil: 'Usuario Test'
              })
            });

            const registerData = await registerResponse.json();
            
            if (registerResponse.ok) {
              console.log(`   ✅ Usuario re-registrado exitosamente`);
              console.log(`   📋 Token: ${registerData.token ? registerData.token.substring(0, 20) + '...' : 'No token'}`);
              
              console.log('\n📝 Credenciales para usar en el frontend:');
              console.log(`   Email: ${user.email}`);
              console.log(`   Password: ${user.password}`);
              return;
            } else {
              console.log(`   ❌ Error en re-registro: ${registerData.error}`);
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    }

    console.log('\n❌ No se pudo hacer login con ningún usuario existente.');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testExistingUsers();
