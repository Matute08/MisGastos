<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppNavigation from '@/components/AppNavigation.vue'
import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue'

const authStore = useAuthStore()

onMounted(async () => {
  await authStore.init()
  authStore.setupAuthListener()
})
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Initializing Spinner -->
    <div
      v-if="authStore.isInitializing"
      class="fixed inset-0 bg-white flex items-center justify-center z-50"
    >
      <div class="flex flex-col items-center gap-4">
        <div class="h-10 w-10 rounded-full border-[3px] border-primary-200 border-t-primary-600 animate-spin"></div>
        <span class="text-gray-600 text-sm font-medium tracking-wide">Verificando sesión...</span>
      </div>
    </div>

    <!-- Navigation -->
    <AppNavigation v-if="authStore.isAuthenticated && !authStore.isInitializing" />

    <!-- Main Content -->
    <main
      v-if="!authStore.isInitializing"
      :class="[
        'transition-all duration-200',
        authStore.isAuthenticated
          ? 'lg:ml-60 lg:pb-8 pb-24 px-4 sm:px-6 lg:px-8 py-6'
          : ''
      ]"
    >
      <router-view />
    </main>

    <!-- Loading Overlay -->
    <div
      v-if="authStore.loading && !authStore.isInitializing"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-2xl p-5 shadow-soft-lg flex items-center gap-3">
        <div class="h-5 w-5 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin"></div>
        <span class="text-gray-700 text-sm font-medium">Cargando...</span>
      </div>
    </div>

    <PWAInstallPrompt />
  </div>
</template>
