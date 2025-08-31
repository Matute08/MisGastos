<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppNavigation from '@/components/AppNavigation.vue'
import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue'
import SessionPersistence from '@/components/SessionPersistence.vue'


const authStore = useAuthStore()

onMounted(async () => {
  await authStore.init()
  authStore.setupAuthListener()
})
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <SessionPersistence />
    
    <div v-if="authStore.isInitializing" class="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div class="flex flex-col items-center space-y-4">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <span class="text-gray-700 text-lg font-medium">Verificando sesión...</span>
      </div>
    </div>

    <AppNavigation v-if="authStore.isAuthenticated && !authStore.isInitializing" />
    
    <main v-if="!authStore.isInitializing" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
      <router-view />
    </main>

    <div
      v-if="authStore.loading && !authStore.isInitializing"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        <span class="text-gray-700">Cargando...</span>
      </div>
    </div>



    <PWAInstallPrompt />
  </div>
</template>
