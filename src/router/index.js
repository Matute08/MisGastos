import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cuentas',
    name: 'cuentas',
    component: () => import('@/views/CardsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/cuentas',
    name: 'admin-cuentas',
    component: () => import('@/views/AdminCardsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/expenses',
    name: 'expenses',
    component: () => import('@/views/ExpensesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/incomes',
    name: 'incomes',
    component: () => import('@/views/IncomesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/savings',
    name: 'savings',
    component: () => import('@/views/SavingsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/categories',
    name: 'categories',
    component: () => import('@/views/CategoriesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/monthly',
    name: 'monthly',
    component: () => import('@/views/MonthlyView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/perfil',
    name: 'perfil',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from) => {
  if (!window.__appMounted) {
    await new Promise(resolve => {
      const check = () => {
        if (window.__appMounted) resolve()
        else setTimeout(check, 10)
      }
      check()
    })
  }

  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()

  if (!authStore.isAuthReady) {
    await new Promise(resolve => {
      const stop = watch(
        () => authStore.isAuthReady,
        (ready) => {
          if (ready) { stop(); resolve() }
        }
      )
    })
  }

  if (authStore.isInitializing) return true
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return { path: '/dashboard' }
  }
  if (to.meta.requiresAdmin) {
    if (!authStore.isAuthReady || authStore.isInitializing) return false
    if (!authStore.isAdmin) return { path: '/dashboard' }
  }

  return true
})

export default router
