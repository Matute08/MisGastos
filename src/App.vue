<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppNavigation from '@/components/AppNavigation.vue'
import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue'

const authStore = useAuthStore()

onMounted(async () => {
  // Inicializar la aplicación
  await authStore.init()
  authStore.setupAuthListener()
})
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Loader global mientras se verifica la sesión -->
    <div v-if="!authStore.isAuthReady" class="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div class="flex flex-col items-center space-y-4">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <span class="text-gray-700 text-lg font-medium">Verificando sesión...</span>
      </div>
    </div>

    <!-- Navegación -->
    <AppNavigation v-if="authStore.isAuthenticated && authStore.isAuthReady" />
    
    <!-- Contenido principal -->
    <main v-if="authStore.isAuthReady" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>

    <!-- Loading global -->
    <div
      v-if="authStore.loading && authStore.isAuthReady"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        <span class="text-gray-700">Cargando...</span>
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
