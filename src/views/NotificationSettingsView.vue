<template>
  <div class="max-w-2xl mx-auto py-10">
    <h1 class="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
      <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </span>
      Configuración de Notificaciones
    </h1>
    <p class="text-gray-600 mb-6">Gestiona tus recordatorios y alertas</p>
    <NotificationSettings />
  </div>
</template>

<script setup>
import NotificationSettings from '@/components/NotificationSettings.vue'
</script> 