<template>
  <!-- Componente invisible que maneja la persistencia de sesión -->
  <div style="display: none;"></div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { auth } from '@/lib/api'

const authStore = useAuthStore()

let refreshInterval = null

// Configurar renovación automática de token
const setupAutoRefresh = () => {
  // Limpiar intervalo anterior si existe
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }

  // Verificar cada 10 minutos si el token necesita renovación
  refreshInterval = setInterval(async () => {
    if (authStore.isAuthenticated && auth.isTokenExpiringSoon()) {
      try {
        const refreshed = await auth.refreshToken()
        if (refreshed) {
          const currentUser = await auth.getUser()
          if (currentUser) {
            authStore.user = currentUser
            await authStore.loadUserProfile()
          }
        }
      } catch (error) {
        console.error('Error al renovar token automáticamente:', error)
      }
    }
  }, 10 * 60 * 1000)
}

// Escuchar cambios en el estado de autenticación
const handleAuthStateChange = () => {
  if (authStore.isAuthenticated) {
    setupAutoRefresh()
  } else {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }
}

// Verificar token al cargar la página
const checkTokenOnLoad = async () => {
  const token = localStorage.getItem('token')
  if (token && !authStore.isAuthenticated) {
    try {
      const isValid = await auth.validateToken()
      if (isValid) {
        const currentUser = await auth.getUser()
        if (currentUser) {
          authStore.user = currentUser
          await authStore.loadUserProfile()
          setupAutoRefresh()
        }
      } else {
        // Token inválido, limpiar
        localStorage.removeItem('token')
        localStorage.removeItem('tokenExpiresAt')
      }
    } catch (error) {
      console.error('Error verificando token:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('tokenExpiresAt')
    }
  }
}

onMounted(() => {
  // Verificar token al cargar
  checkTokenOnLoad()
  
  // Configurar renovación automática si ya está autenticado
  if (authStore.isAuthenticated) {
    setupAutoRefresh()
  }
  
  // Escuchar cambios en el estado de autenticación
  authStore.$subscribe((mutation, state) => {
    if (mutation.type === 'direct') {
      handleAuthStateChange()
    }
  })
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script> 