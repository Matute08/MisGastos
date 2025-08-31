<template>
  <div v-if="showInstallPrompt" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4">
    <div class="max-w-md mx-auto">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <img src="/miwalletlogo.png" alt="MisGastos" class="w-8 h-8" />
          <div>
            <h3 class="text-sm font-medium text-gray-900">Instalar MisGastos</h3>
            <p class="text-xs text-gray-500">Accede rápidamente desde tu pantalla de inicio</p>
          </div>
        </div>
        <div class="flex space-x-2">
          <button
            @click="installPWA"
            class="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors duration-200"
          >
            Instalar
          </button>
          <button
            @click="dismissPrompt"
            class="text-gray-500 hover:text-gray-700 px-2 py-2 rounded-md text-sm transition-colors duration-200"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { X } from 'lucide-vue-next'

const showInstallPrompt = ref(false)
const deferredPrompt = ref(null)

onMounted(() => {
  // Verificar si ya está instalada
  if (window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true) {
    return
  }

  // Escuchar el evento beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    showInstallPrompt.value = true
  })

  // Escuchar si la app se instala
  window.addEventListener('appinstalled', () => {
    showInstallPrompt.value = false
    deferredPrompt.value = null
  })
})

const installPWA = async () => {
  if (!deferredPrompt.value) return

  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice

  if (outcome === 'accepted') {
    // Usuario aceptó instalar la PWA
  } else {
    // Usuario rechazó instalar la PWA
  }

  deferredPrompt.value = null
  showInstallPrompt.value = false
}

const dismissPrompt = () => {
  showInstallPrompt.value = false
  deferredPrompt.value = null
}
</script> 