<template>
  <!-- Desktop Sidebar (lg+) -->
  <aside
    v-if="authStore.isAuthenticated && authStore.isAuthReady"
    class="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-60 bg-white dark:bg-gray-800 border-r border-gray-200/80 dark:border-gray-700/80 z-40"
  >
    <!-- Logo -->
    <div class="flex items-center justify-between px-6 h-16 border-b border-gray-100 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <img src="/miwalletlogo.png" alt="MisGastos" class="h-9 w-7" />
        <span class="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">MisGastos</span>
      </div>
      <DarkModeToggle />
    </div>

    <!-- Nav Items -->
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <router-link
        v-for="item in sidebarItems"
        :key="item.name"
        :to="item.path"
        :class="[
          'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          isActive(item.name)
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-l-[3px] border-primary-600 pl-[9px]'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
        ]"
      >
        <component
          :is="item.icon"
          :class="[
            'h-5 w-5 shrink-0 transition-colors duration-200',
            isActive(item.name) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
          ]"
        />
        {{ item.label }}
      </router-link>
    </nav>

    <!-- User Section -->
    <div class="border-t border-gray-100 dark:border-gray-700 p-3">
      <div class="relative" ref="userMenuRef">
        <button
          @click="toggleUserMenu"
          class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <div class="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-semibold shrink-0">
            {{ userInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ userName }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ userRoleDisplay }}</div>
          </div>
          <ChevronDown
            :class="[
              'h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200',
              showUserMenu ? 'rotate-180' : ''
            ]"
          />
        </button>

        <!-- User Dropdown -->
        <Transition
          enter-active-class="transition ease-out duration-150"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div
            v-if="showUserMenu"
            class="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-soft-lg dark:shadow-none dark:border dark:border-gray-700 border border-gray-200 py-1 z-50"
          >
            <button
              @click="goToProfile"
              class="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
            >
              <UserCircle class="h-4 w-4 text-gray-400 dark:text-gray-500" />
              Mi Perfil
            </button>

            <button
              @click="goToCategories"
              class="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
            >
              <Tag class="h-4 w-4 text-gray-400 dark:text-gray-500" />
              Categorías
            </button>

            <button
              v-if="authStore.isAdmin"
              @click="goToAdminCards"
              class="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
            >
              <CreditCard class="h-4 w-4 text-gray-400 dark:text-gray-500" />
              Admin Cuentas
            </button>

            <div class="border-t border-gray-100 dark:border-gray-700 my-1"></div>

            <button
              @click="signOut"
              class="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors duration-150"
            >
              <LogOut class="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </aside>

  <!-- Mobile Bottom Navigation (< lg) -->
  <nav
    v-if="authStore.isAuthenticated && authStore.isAuthReady"
    class="lg:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-800 border-t border-gray-200/80 dark:border-gray-700/80 shadow-[0_-2px_10px_-3px_rgba(0,0,0,0.06)] dark:shadow-none z-50"
  >
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="showUserMenu"
        ref="mobileUserMenuRef"
        class="absolute bottom-full right-3 mb-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-soft-lg dark:shadow-none dark:border dark:border-gray-700 border border-gray-200 py-1"
      >
        <button
          @click="goToProfile"
          class="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
        >
          <UserCircle class="h-4 w-4 text-gray-400 dark:text-gray-500" />
          Mi Perfil
        </button>

        <button
          @click="goToCategories"
          class="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
        >
          <Tag class="h-4 w-4 text-gray-400 dark:text-gray-500" />
          Categorías
        </button>

        <button
          v-if="authStore.isAdmin"
          @click="goToAdminCards"
          class="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
        >
          <CreditCard class="h-4 w-4 text-gray-400 dark:text-gray-500" />
          Admin Cuentas
        </button>

        <div class="border-t border-gray-100 dark:border-gray-700 my-1"></div>

        <button
          @click="signOut"
          class="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors duration-150"
        >
          <LogOut class="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </Transition>

    <div class="flex items-center justify-around h-16 px-1">
      <template
        v-for="item in mobileItems"
        :key="item.name"
      >
        <button
          v-if="item.name === 'perfil'"
          ref="mobileProfileButtonRef"
          type="button"
          @click="toggleUserMenu"
          class="flex flex-col items-center justify-center flex-1 min-w-0 py-1"
        >
          <div
            :class="[
              'flex items-center justify-center rounded-full transition-all duration-200 mb-0.5',
              showUserMenu ? 'bg-primary-100 dark:bg-primary-900/40 h-8 w-12' : 'h-8 w-8'
            ]"
        >
            <component
              :is="item.icon"
              :class="[
                'transition-all duration-200',
                showUserMenu ? 'h-[22px] w-[22px] text-primary-600 dark:text-primary-400' : 'h-5 w-5 text-gray-400 dark:text-gray-500'
              ]"
            />
          </div>
          <span
            :class="[
              'text-[10px] font-medium transition-colors duration-200 leading-tight',
              showUserMenu ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
            ]"
          >
            {{ item.label }}
          </span>
        </button>
        <router-link
          v-else
          :to="item.path"
          class="flex flex-col items-center justify-center flex-1 min-w-0 py-1"
        >
          <div
            :class="[
              'flex items-center justify-center rounded-full transition-all duration-200 mb-0.5',
              isActive(item.name)
                ? 'bg-primary-100 dark:bg-primary-900/40 h-8 w-12'
                : 'h-8 w-8'
            ]"
          >
            <component
              :is="item.icon"
              :class="[
                'transition-all duration-200',
                isActive(item.name)
                  ? 'h-[22px] w-[22px] text-primary-600 dark:text-primary-400'
                  : 'h-5 w-5 text-gray-400 dark:text-gray-500'
              ]"
            />
          </div>
          <span
            :class="[
              'text-[10px] font-medium transition-colors duration-200 leading-tight',
              isActive(item.name) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
            ]"
          >
            {{ item.label }}
          </span>
        </router-link>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DarkModeToggle from '@/components/DarkModeToggle.vue'
import {
  BarChart3,
  Receipt,
  Wallet,
  PiggyBank,
  CreditCard,
  Tag,
  UserCircle,
  ChevronDown,
  LogOut
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const showUserMenu = ref(false)
const userMenuRef = ref(null)
const mobileUserMenuRef = ref(null)
const mobileProfileButtonRef = ref(null)

const userName = computed(() => {
  return authStore.userProfile?.nombre_perfil || authStore.user?.email?.split('@')[0] || 'Usuario'
})

const userInitials = computed(() => {
  const name = userName.value
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
})

const userRoleDisplay = computed(() => {
  const role = authStore.userProfile?.role_nombre
  if (role === 'admin') return 'Administrador'
  if (role === 'moderator') return 'Moderador'
  return 'Usuario'
})

const sidebarItems = computed(() => [
  { name: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
  { name: 'expenses', label: 'Gastos', path: '/expenses', icon: Receipt },
  { name: 'incomes', label: 'Ingresos', path: '/incomes', icon: Wallet },
  { name: 'savings', label: 'Ahorros', path: '/savings', icon: PiggyBank },
  { name: 'cuentas', label: 'Cuentas', path: '/cuentas', icon: CreditCard }
])

const mobileItems = computed(() => [
  { name: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
  { name: 'expenses', label: 'Gastos', path: '/expenses', icon: Receipt },
  { name: 'incomes', label: 'Ingresos', path: '/incomes', icon: Wallet },
  { name: 'savings', label: 'Ahorros', path: '/savings', icon: PiggyBank },
  { name: 'cuentas', label: 'Cuentas', path: '/cuentas', icon: CreditCard },
  { name: 'perfil', label: 'Perfil', path: '/perfil', icon: UserCircle }
])

const isActive = (name) => route.name === name

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const signOut = async () => {
  showUserMenu.value = false
  const { success } = await authStore.signOut()
  if (success) {
    router.push('/login')
    window.location.reload()
  }
}

const goToProfile = () => {
  showUserMenu.value = false
  router.push('/perfil')
}

const goToAdminCards = () => {
  showUserMenu.value = false
  router.push('/admin/cuentas')
}

const goToCategories = () => {
  showUserMenu.value = false
  router.push('/categories')
}

const unwrapRefEl = (r) => {
  if (!r) return null
  return Array.isArray(r) ? r[0] : r
}

const handleClickOutside = (event) => {
  const desktopEl = unwrapRefEl(userMenuRef.value)
  const mobileMenuEl = unwrapRefEl(mobileUserMenuRef.value)
  const mobileProfileEl = unwrapRefEl(mobileProfileButtonRef.value)

  const clickedDesktopMenu = desktopEl && desktopEl.contains(event.target)
  const clickedMobileMenu = mobileMenuEl && mobileMenuEl.contains(event.target)
  const clickedMobileProfileButton = mobileProfileEl && mobileProfileEl.contains(event.target)

  if (!clickedDesktopMenu && !clickedMobileMenu && !clickedMobileProfileButton) {
    showUserMenu.value = false
  }
}

const handleEscape = (e) => {
  if (e.key === 'Escape') showUserMenu.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>
