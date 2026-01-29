#!/usr/bin/env node

// Script para probar la API de producción en Koyeb
// Usar la URL desde las variables de entorno o la URL por defecto
const API_BASE_URL = process.env.VITE_API_URL || 'https://fascinating-bridie-misgastos-e524faff.koyeb.app/api';

async function testProductionAPI() {
  console.log('🧪 Probando API de producción en Koyeb...\n');

  try {
    // 1. Probar endpoint de salud
    console.log('1. Probando endpoint de salud...');
    const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ Endpoint de salud funcionando:', healthData.message);
    } else {
      console.log('❌ Error en endpoint de salud:', healthData);
    }

    // 2. Probar endpoint raíz
    console.log('\n2. Probando endpoint raíz...');
    const rootResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/`);
    const rootData = await rootResponse.json();
    
    if (rootResponse.ok) {
      console.log('✅ Endpoint raíz funcionando:', rootData.message);
      console.log('📋 Endpoints disponibles:', rootData.endpoints);
    } else {
      console.log('❌ Error en endpoint raíz:', rootData);
    }

    // 3. Probar CORS con preflight
    console.log('\n3. Probando CORS...');
    const corsResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://mis-gastos-phi.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    if (corsResponse.ok) {
      console.log('✅ CORS configurado correctamente');
      console.log('📋 Headers CORS:', {
        'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
      });
    } else {
      console.log('❌ Error en CORS:', corsResponse.status, corsResponse.statusText);
    }

    // 4. Probar endpoint de autenticación (sin credenciales)
    console.log('\n4. Probando endpoint de autenticación...');
    const authResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://mis-gastos-phi.vercel.app'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      })
    });
    
    const authData = await authResponse.json();
    
    if (authResponse.status === 401) {
      console.log('✅ Endpoint de autenticación funcionando (esperado: 401 Unauthorized)');
      console.log('📋 Respuesta:', authData.message || authData.error);
    } else {
      console.log('⚠️ Respuesta inesperada:', authResponse.status, authData);
    }

    console.log('\n🎉 Pruebas de API completadas!');
    
    // Resumen de configuración
    console.log('\n📋 Resumen de configuración:');
    console.log(`🌐 Backend URL: ${API_BASE_URL.replace('/api', '')}`);
    console.log(`🔗 Frontend URL: https://mis-gastos-phi.vercel.app`);
    console.log(`🔒 CORS Origin: https://mis-gastos-phi.vercel.app`);

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.log('\n🔍 Posibles problemas:');
    console.log('1. Backend no está ejecutándose en Koyeb');
    console.log('2. Variables de entorno no configuradas');
    console.log('3. Problemas de CORS');
    console.log('4. Base de datos no accesible');
  }
}

// Ejecutar pruebas
testProductionAPI();
