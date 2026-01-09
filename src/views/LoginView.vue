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

      <!-- Botón de autenticación biométrica -->
      <div v-if="biometricSupported" class="text-center">
        <button
          @click="showBiometricAuth"
          class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
        >
          <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {{ biometricType === 'face' ? 'Usar Face ID' : 'Usar Touch ID' }}
        </button>
        
        <div class="mt-4">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">o</span>
            </div>
          </div>
        </div>
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
          <div class="relative mt-1">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              class="input-field pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              tabindex="-1"
            >
              <Eye v-if="!showPassword" class="h-5 w-5" />
              <EyeOff v-else class="h-5 w-5" />
            </button>
          </div>
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
    
    <!-- Componente de autenticación biométrica -->
    <BiometricAuth
      ref="biometricAuthRef"
      @authenticated="handleBiometricSuccess"
      @cancelled="handleBiometricCancelled"
      @usePassword="handleUsePassword"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { CreditCard, AlertCircle, Eye, EyeOff } from 'lucide-vue-next'
import BiometricAuth from '@/components/BiometricAuth.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: ''
})

const rememberMe = ref(false)
const showPassword = ref(false)

// Referencias para autenticación biométrica
const biometricAuthRef = ref(null)
const biometricSupported = ref(false)
const biometricType = ref('face')

// Verificar soporte de autenticación biométrica
const checkBiometricSupport = async () => {
  try {
    if (!window.PublicKeyCredential) {
      return
    }

    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    
    if (available) {
      biometricSupported.value = true
      
      // Detectar tipo de autenticación
      if (window.navigator.userAgent.includes('iPhone') || window.navigator.userAgent.includes('iPad')) {
        biometricType.value = 'face'
      } else {
        biometricType.value = 'fingerprint'
      }
    }
  } catch (error) {
    console.error('Error verificando soporte biométrico:', error)
  }
}

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

// Funciones para autenticación biométrica
const showBiometricAuth = () => {
  if (biometricAuthRef.value) {
    biometricAuthRef.value.showBiometric()
  }
}

const handleBiometricSuccess = async (assertion) => {
  try {
    // Obtener credenciales guardadas para el userId
    const savedCredentials = localStorage.getItem('rememberedCredentials')
    if (!savedCredentials) {
      console.log('No hay credenciales guardadas para autenticación biométrica')
      handleUsePassword()
      return
    }

    const credentials = JSON.parse(savedCredentials)
    
    // Enviar la assertion al backend para verificación
    const response = await fetch('/api/webauthn/verify-authentication', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: credentials.userId || '1', // Necesitarás obtener el userId real
        credential: {
          id: assertion.id,
          rawId: Array.from(new Uint8Array(assertion.rawId)),
          response: {
            authenticatorData: Array.from(new Uint8Array(assertion.response.authenticatorData)),
            clientDataJSON: Array.from(new Uint8Array(assertion.response.clientDataJSON)),
            signature: Array.from(new Uint8Array(assertion.response.signature))
          },
          type: assertion.type
        }
      })
    })

    const result = await response.json()
    
    if (result.success) {
      // Autenticación exitosa, usar el token JWT
      authStore.setToken(result.token)
      const redirectTo = route.query.redirect || '/dashboard'
      router.push(redirectTo)
    } else {
      console.error('Error en verificación biométrica:', result.error)
      handleUsePassword()
    }
  } catch (error) {
    console.error('Error en autenticación biométrica:', error)
    handleUsePassword()
  }
}

const handleBiometricCancelled = () => {
  // Usuario canceló la autenticación biométrica
  console.log('Autenticación biométrica cancelada')
}

const handleUsePassword = () => {
  // Mostrar formulario de contraseña
  console.log('Usando autenticación por contraseña')
}

// Watcher para limpiar credenciales si se desmarca "Recordar mis datos"
watch(rememberMe, (newValue) => {
  if (!newValue) {
    clearCredentials()
  }
})

onMounted(async () => {
  authStore.clearError()
  
  // Verificar soporte de autenticación biométrica
  await checkBiometricSupport()
  
  // Cargar credenciales guardadas
  loadSavedCredentials()
  
  // Si ya está autenticado, redirigir
  if (authStore.isAuthenticated) {
    const redirectTo = route.query.redirect || '/dashboard'
    router.push(redirectTo)
  }
})
</script> 