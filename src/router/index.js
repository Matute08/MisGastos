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
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/activity',
    name: 'activity',
    component: () => import('@/views/activity/ActivityView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cuentas',
    name: 'cuentas',
    component: () => import('@/views/cards/CardsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/cuentas',
    name: 'admin-cuentas',
    component: () => import('@/views/cards/AdminCardsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/expenses',
    name: 'expenses',
    component: () => import('@/views/expenses/ExpensesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/incomes',
    name: 'incomes',
    component: () => import('@/views/incomes/IncomesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/savings',
    name: 'savings',
    component: () => import('@/views/savings/SavingsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/categories',
    name: 'categories',
    component: () => import('@/views/categories/CategoriesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/monthly',
    name: 'monthly',
    component: () => import('@/views/monthly/MonthlyView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/perfil',
    name: 'perfil',
    component: () => import('@/views/auth/ProfileView.vue'),
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
