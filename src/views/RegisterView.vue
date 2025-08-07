<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
          <CreditCard class="h-8 w-8 text-primary-600" />
        </div>
        <h2 class="mt-6 text-3xl font-bold text-gray-900">
          Crear cuenta
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Únete a Control Gastos para gestionar tus finanzas
        </p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleRegister" class="mt-8 space-y-6">
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

        <!-- Nombre (opcional) -->
        <div>
          <label for="nombre" class="block text-sm font-medium text-gray-700">
            Nombre (opcional)
          </label>
          <input
            id="nombre"
            v-model="form.nombre"
            type="text"
            class="input-field mt-1"
            placeholder="Tu nombre"
          />
          <p class="mt-1 text-xs text-gray-500">
            Si no lo proporcionas, usaremos tu email
          </p>
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
            minlength="6"
            class="input-field mt-1"
            placeholder="••••••••"
          />
          <p class="mt-1 text-xs text-gray-500">
            Mínimo 6 caracteres
          </p>
        </div>

        <!-- Confirmar contraseña -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
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

        <!-- Error de validación -->
        <div v-if="validationError" class="bg-warning-50 border border-warning-200 rounded-md p-4">
          <div class="flex">
            <AlertTriangle class="h-5 w-5 text-warning-400" />
            <div class="ml-3">
              <p class="text-sm text-warning-700">
                {{ validationError }}
              </p>
            </div>
          </div>
        </div>

        <!-- Error de autenticación -->
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
          {{ authStore.loading ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>

        <!-- Enlaces adicionales -->
        <div class="text-center">
          <p class="text-sm text-gray-600">
            ¿Ya tienes una cuenta?
            <router-link to="/login" class="font-medium text-primary-600 hover:text-primary-500">
              Inicia sesión aquí
            </router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { CreditCard, AlertCircle, AlertTriangle } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  nombre: '',
  password: '',
  confirmPassword: ''
})

const rememberMe = ref(false)

// Función para guardar credenciales
const saveCredentials = () => {
  if (rememberMe.value) {
    localStorage.setItem('rememberedCredentials', JSON.stringify({
      email: form.value.email,
      nombre: form.value.nombre,
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
    form.value.nombre = credentials.nombre || ''
    rememberMe.value = credentials.rememberMe
  }
}

// Función para limpiar credenciales
const clearCredentials = () => {
  localStorage.removeItem('rememberedCredentials')
}

const validationError = computed(() => {
  if (form.value.password && form.value.confirmPassword && form.value.password !== form.value.confirmPassword) {
    return 'Las contraseñas no coinciden'
  }
  if (form.value.password && form.value.password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres'
  }
  return null
})

const handleRegister = async () => {
  if (validationError.value) {
    return
  }

  const { success } = await authStore.signUp(form.value.email, form.value.password, form.value.nombre)
  
  if (success) {
    // Guardar credenciales si está marcado "Recordar mis datos"
    saveCredentials()
    
    router.push('/dashboard')
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
})
</script> 