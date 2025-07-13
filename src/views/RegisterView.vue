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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { CreditCard, AlertCircle, AlertTriangle } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: '',
  confirmPassword: ''
})

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

  const { success } = await authStore.signUp(form.value.email, form.value.password)
  
  if (success) {
    router.push('/dashboard')
  }
}

onMounted(() => {
  authStore.clearError()
})
</script> 