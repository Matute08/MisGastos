<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
          <CreditCard class="h-8 w-8 text-primary-600" />
        </div>
        <h2 class="mt-6 text-3xl font-bold text-gray-900">
          Iniciar sesión
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Accede a tu cuenta de Control Gastos
        </p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">
            Correo electrónico
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="input-field mt-1"
            placeholder="tu@email.com"
          />
        </div>

        <!-- Contraseña -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            class="input-field mt-1"
            placeholder="••••••••"
          />
        </div>

        <!-- Checkbox Recordar mis datos -->
        <div class="flex items-center">
          <input
            id="rememberMe"
            v-model="rememberMe"
            type="checkbox"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label for="rememberMe" class="ml-2 block text-sm text-gray-700">
            Recordar mis datos
          </label>
        </div>

        <!-- Error -->
        <div v-if="authStore.error" class="bg-danger-50 border border-danger-200 rounded-md p-4">
          <div class="flex">
            <AlertCircle class="h-5 w-5 text-danger-400" />
            <div class="ml-3">
              <p class="text-sm text-danger-700">
                {{ authStore.error }}
              </p>
            </div>
          </div>
        </div>

        <!-- Botón de envío -->
        <button
          type="submit"
          :disabled="authStore.loading"
          class="btn-primary w-full flex justify-center"
        >
          <div v-if="authStore.loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {{ authStore.loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
        </button>

        <!-- Enlaces adicionales -->
        <div class="text-center">
          <p class="text-sm text-gray-600">
            ¿No tienes una cuenta?
            <router-link to="/register" class="font-medium text-primary-600 hover:text-primary-500">
              Regístrate aquí
            </router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { CreditCard, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: ''
})

const rememberMe = ref(false)

// Función para guardar credenciales
const saveCredentials = () => {
  if (rememberMe.value) {
    localStorage.setItem('rememberedCredentials', JSON.stringify({
      email: form.value.email,
      rememberMe: true
    }))
  } else {
    localStorage.removeItem('rememberedCredentials')
  }
}

// Función para cargar credenciales guardadas
const loadSavedCredentials = () => {
  const saved = localStorage.getItem('rememberedCredentials')
  if (saved) {
    const credentials = JSON.parse(saved)
    form.value.email = credentials.email
    rememberMe.value = credentials.rememberMe
  }
}

// Función para limpiar credenciales
const clearCredentials = () => {
  localStorage.removeItem('rememberedCredentials')
}

const handleLogin = async () => {
  const { success } = await authStore.signIn(form.value.email, form.value.password)
  
  if (success) {
    // Guardar credenciales si está marcado "Recordar mis datos"
    saveCredentials()
    
    // Redirigir a la página original o al dashboard
    const redirectTo = route.query.redirect || '/dashboard'
    router.push(redirectTo)
  }
}

// Watcher para limpiar credenciales si se desmarca "Recordar mis datos"
watch(rememberMe, (newValue) => {
  if (!newValue) {
    clearCredentials()
  }
})

onMounted(() => {
  authStore.clearError()
  
  // Cargar credenciales guardadas
  loadSavedCredentials()
  
  // Si ya está autenticado, redirigir
  if (authStore.isAuthenticated) {
    const redirectTo = route.query.redirect || '/dashboard'
    router.push(redirectTo)
  }
})
</script> 