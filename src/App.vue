<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppNavigation from '@/components/AppNavigation.vue'
import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue'
import SessionPersistence from '@/components/SessionPersistence.vue'
import { Receipt, CreditCard } from 'lucide-vue-next'

const authStore = useAuthStore()

onMounted(async () => {
  // Inicializar la aplicación
  await authStore.init()
  authStore.setupAuthListener()
})
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Componente de persistencia de sesión -->
    <SessionPersistence />
    
    <!-- Loader global mientras se verifica la sesión -->
    <div v-if="authStore.isInitializing" class="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div class="flex flex-col items-center space-y-4">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <span class="text-gray-700 text-lg font-medium">Verificando sesión...</span>
      </div>
    </div>

    <!-- Navegación -->
    <AppNavigation v-if="authStore.isAuthenticated && !authStore.isInitializing" />
    
    <!-- Contenido principal -->
    <main v-if="!authStore.isInitializing" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
      <router-view />
    </main>

    <!-- Loading global -->
    <div
      v-if="authStore.loading && !authStore.isInitializing"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        <span class="text-gray-700">Cargando...</span>
      </div>
    </div>

    <!-- Barra de navegación fija para móviles - Estilo Instagram -->
    <div v-if="authStore.isAuthenticated && !authStore.isInitializing" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div class="flex items-center justify-around py-3 px-4">
        <!-- Botón Dashboard -->
        <router-link 
          to="/dashboard" 
          class="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
          :class="{ 'text-blue-600': $route.path === '/dashboard' }"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span class="text-xs font-medium">Dashboard</span>
        </router-link>

        <!-- Botón Gastos -->
        <router-link 
          to="/expenses" 
          class="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
          :class="{ 'text-blue-600': $route.path === '/expenses' }"
        >
          <Receipt class="h-6 w-6" />
          <span class="text-xs font-medium">Gastos</span>
        </router-link>

        <!-- Botón Cuentas -->
        <router-link 
          to="/cuentas" 
          class="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
          :class="{ 'text-blue-600': $route.path === '/cuentas' }"
        >
          <CreditCard class="h-6 w-6" />
          <span class="text-xs font-medium">Cuentas</span>
        </router-link>

        <!-- Botón Categorías -->
        <router-link 
          to="/categories" 
          class="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
          :class="{ 'text-blue-600': $route.path === '/categories' }"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span class="text-xs font-medium">Categorías</span>
        </router-link>
      </div>
    </div>

    <!-- PWA Install Prompt -->
    <PWAInstallPrompt />
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
