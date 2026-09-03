<template>
  <div class="min-h-screen flex">
    <!-- Left Panel - Branding (desktop only) -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden items-center justify-center p-12">
      <div class="absolute top-20 -left-16 w-72 h-72 bg-white opacity-10 rounded-full"></div>
      <div class="absolute bottom-32 right-10 w-48 h-48 bg-white opacity-10 rounded-full"></div>
      <div class="absolute top-1/2 left-1/3 w-24 h-24 bg-white opacity-5 rounded-full"></div>

      <div class="relative z-10 text-center max-w-md">
        <div class="mx-auto mb-8 h-20 w-20 flex items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <Wallet class="h-10 w-10 text-white" />
        </div>
        <h1 class="text-4xl font-bold text-white tracking-tight">MisGastos</h1>
        <p class="mt-4 text-lg text-primary-100 leading-relaxed">
          Controla tus finanzas de forma inteligente
        </p>
        <div class="mt-10 flex items-center justify-center gap-3">
          <div class="h-1 w-8 rounded-full bg-white/40"></div>
          <div class="h-1 w-8 rounded-full bg-white/20"></div>
          <div class="h-1 w-8 rounded-full bg-white/20"></div>
        </div>
      </div>
    </div>

    <!-- Right Panel - Form -->
    <div class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 bg-white dark:bg-gray-900">
      <div class="w-full max-w-md">
        <!-- Mobile logo -->
        <div class="lg:hidden text-center mb-8">
          <div class="mx-auto h-14 w-14 flex items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
            <Wallet class="h-7 w-7 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 class="mt-3 text-xl font-bold text-primary-700 dark:text-primary-400">MisGastos</h1>
        </div>

        <!-- Heading -->
        <div class="text-center lg:text-left">
          <div class="hidden lg:flex mb-6 h-12 w-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
            <Wallet class="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Bienvenido de vuelta</h2>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Ingresa a tu cuenta</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="mt-8 space-y-5">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo electrónico</label>
            <div class="relative mt-1.5">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail class="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                autocomplete="email"
                class="input-field pl-10"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
            <div class="relative mt-1.5">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock class="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                class="input-field pl-10 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                tabindex="-1"
              >
                <Eye v-if="!showPassword" class="h-5 w-5" />
                <EyeOff v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <!-- Remember me -->
          <div class="flex items-center">
            <input
              id="rememberMe"
              v-model="rememberMe"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
            />
            <label for="rememberMe" class="ml-2 block text-sm text-gray-600 dark:text-gray-400">
              Recordar mis datos
            </label>
          </div>

          <!-- Error -->
          <div
            v-if="authStore.error"
            class="flex items-start gap-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 p-4"
          >
            <AlertCircle class="h-5 w-5 text-danger-500 shrink-0 mt-0.5" />
            <p class="text-sm text-danger-700 dark:text-danger-300">{{ authStore.error }}</p>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="authStore.loading"
            class="btn-primary w-full flex items-center justify-center gap-2"
          >
            <div
              v-if="authStore.loading"
              class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
            ></div>
            {{ authStore.loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
          </button>

          <!-- Register link -->
          <p class="text-center text-sm text-gray-500 dark:text-gray-400">
            ¿No tienes cuenta?
            <router-link to="/register" class="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors">
              Regístrate aquí
            </router-link>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Wallet, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({ email: '', password: '' })
const rememberMe = ref(false)
const showPassword = ref(false)

const CREDENTIALS_KEY = 'mg_saved_credentials'

const saveCredentials = () => {
  if (rememberMe.value) {
    const payload = JSON.stringify({
      email: form.value.email,
      p: btoa(form.value.password)
    })
    localStorage.setItem(CREDENTIALS_KEY, payload)
  } else {
    localStorage.removeItem(CREDENTIALS_KEY)
  }
}

const loadSavedCredentials = () => {
  const saved = localStorage.getItem(CREDENTIALS_KEY)
  if (saved) {
    try {
      const credentials = JSON.parse(saved)
      form.value.email = credentials.email || ''
      form.value.password = credentials.p ? atob(credentials.p) : ''
      rememberMe.value = true
    } catch {
      localStorage.removeItem(CREDENTIALS_KEY)
    }
  }
}

const handleLogin = async () => {
  const { success } = await authStore.signIn(form.value.email, form.value.password)

  if (success) {
    saveCredentials()
    const redirectTo = route.query.redirect || '/dashboard'
    router.push(redirectTo)
  }
}

watch(rememberMe, (val) => {
  if (!val) localStorage.removeItem(CREDENTIALS_KEY)
})

onMounted(() => {
  authStore.clearError()
  loadSavedCredentials()

  if (authStore.isAuthenticated) {
    router.push(route.query.redirect || '/dashboard')
  }
})
</script>
