<template>
  <nav v-if="authStore.isAuthenticated && authStore.isAuthReady" class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo y título -->
        <div class="flex items-center mr-4">
          <div class="flex-shrink-0 flex items-center">
            <img src="/miwalletlogo.png" alt="MiWallet Logo" class="h-14 w-10" />
            <span class="ml-2 text-xl font-semibold text-gray-900">MisGastos</span>
          </div>
        </div>

        <!-- Navegación principal -->
        <div class="hidden md:flex items-center space-x-8">
          <router-link
            v-for="item in navigationItems"
            :key="item.name"
            :to="item.path"
            :class="[
              'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
              $route.name === item.name
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ]"
          >
            <component :is="item.icon" class="h-4 w-4 inline mr-2" />
            {{ item.label }}
          </router-link>
        </div>

        <!-- Menú de usuario -->
        <div class="flex items-center space-x-4">
          <!-- Notificaciones -->
          <!-- <button class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-200">
            <Bell class="h-5 w-5" />
          </button> -->

          <!-- Menú desplegable del usuario -->
          <div class="relative" ref="userMenuRef">
            <button
              @click="toggleUserMenu"
              class="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-200"
            >
              <User class="h-5 w-5" />
              <div class="hidden md:block text-left">
                <div class="text-sm font-medium">{{ userEmail }}</div>
                <div class="text-xs text-gray-500">{{ userRoleDisplay }}</div>
              </div>
              <ChevronDown class="h-4 w-4" />
            </button>

            <!-- Menú desplegable -->
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
            >
              <div class="px-4 py-2 border-b border-gray-100">
                <div class="text-sm font-medium text-gray-900">{{ userEmail }}</div>
                <div class="text-xs text-gray-500">{{ userRoleDisplay }}</div>
              </div>
              <button
                @click="goToSettings"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" /></svg>
                Configuración
              </button>
              <button
                @click="signOut"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <LogOut class="h-4 w-4 inline mr-2" />
                Cerrar sesión
              </button>
            </div>
          </div>

          <!-- Menú móvil -->
          <button
            @click="toggleMobileMenu"
            class="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-200"
            ref="mobileMenuButton"
          >
            <Menu class="h-5 w-5" />
          </button>
        </div>
      </div>

      <!-- Menú móvil -->
      <div
        v-show="showMobileMenu"
        class="md:hidden border-t border-gray-200 py-4 transition-all duration-300 ease-in-out"
        ref="mobileMenuRef"
      >
        <div class="space-y-2">
          <router-link
            v-for="item in navigationItems"
            :key="item.name"
            :to="item.path"
            @click="closeMobileMenu"
            :class="[
              'block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200',
              $route.name === item.name
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ]"
          >
            <component :is="item.icon" class="h-4 w-4 inline mr-2" />
            {{ item.label }}
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  CreditCard,
  BarChart3,
  Receipt,
  CreditCard as CardsIcon,
  Tag,
  Calendar,
  Bell,
  User,
  ChevronDown,
  Menu,
  LogOut
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const showUserMenu = ref(false)
const showMobileMenu = ref(false)
const userMenuRef = ref(null)
const mobileMenuRef = ref(null)
const mobileMenuButton = ref(null)

const userEmail = computed(() => {
  return authStore.user?.email || authStore.userProfile?.email || 'Usuario'
})

const userRoleDisplay = computed(() => {
  const role = authStore.userProfile?.role_nombre;
  if (role === 'admin') return 'Administrador';
  if (role === 'moderator') return 'Moderador';
  if (role === 'user') return 'Usuario';
  return 'Usuario';
})

const navigationItems = computed(() => {
  const items = [
    {
      name: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: BarChart3
    },
    {
      name: 'expenses',
      label: 'Gastos',
      path: '/expenses',
      icon: Receipt
    },
    {
      name: 'cards',
      label: 'Tarjetas',
      path: '/cards',
      icon: CardsIcon
    },
    {
      name: 'categories',
      label: 'Categorías',
      path: '/categories',
      icon: Tag
    },
    // {
    //   name: 'monthly',
    //   label: 'Mensual',
    //   path: '/monthly',
    //   icon: Calendar
    // }
  ]

  // Si el usuario no es admin, mostrar mensaje especial en categorías
  if (!authStore.isAdmin) {
    const categoriesItem = items.find(item => item.name === 'categories')
    if (categoriesItem) {
      categoriesItem.label = 'Categorías'
    }
  }

  return items
})

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
  // Cerrar menú móvil si está abierto
  if (showMobileMenu.value) {
    showMobileMenu.value = false
  }
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  // Cerrar menú de usuario si está abierto
  if (showUserMenu.value) {
    showUserMenu.value = false
  }
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
}

const closeUserMenu = () => {
  showUserMenu.value = false
}

const closeAllMenus = () => {
  showUserMenu.value = false
  showMobileMenu.value = false
}

const signOut = async () => {
  const { success } = await authStore.signOut()
  if (success) {
    router.push('/login')
    window.location.reload() // Forzar recarga para limpiar el estado
  }
  showUserMenu.value = false
}

const goToSettings = () => {
  showUserMenu.value = false
  router.push('/notificaciones')
}

// Cerrar menús al hacer clic fuera
const handleClickOutside = (event) => {
  // Verificar si el clic fue fuera del menú de usuario
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    closeUserMenu()
  }
  
  // Verificar si el clic fue fuera del menú móvil y su botón
  if (mobileMenuRef.value && mobileMenuButton.value) {
    const isClickInsideMobileMenu = mobileMenuRef.value.contains(event.target)
    const isClickOnMobileButton = mobileMenuButton.value.contains(event.target)
    
    if (!isClickInsideMobileMenu && !isClickOnMobileButton) {
      closeMobileMenu()
    }
  }
}

// Cerrar menú móvil al cambiar de ruta
watch(() => router.currentRoute.value, () => {
  if (showMobileMenu.value) {
    closeMobileMenu()
  }
})

// Escuchar clics fuera de los menús
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllMenus()
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script> 