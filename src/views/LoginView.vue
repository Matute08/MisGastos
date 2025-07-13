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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { CreditCard, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: ''
})

const handleLogin = async () => {
  const { success } = await authStore.signIn(form.value.email, form.value.password)
  
  if (success) {
    router.push('/dashboard')
  }
}

onMounted(() => {
  authStore.clearError()
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})
</script> 