import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'

// Vistas
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import DashboardView from '@/views/DashboardView.vue'
import CardsView from '@/views/CardsView.vue'
import ExpensesView from '@/views/ExpensesView.vue'
import CategoriesView from '@/views/CategoriesView.vue'
import MonthlyView from '@/views/MonthlyView.vue'
import NotificationSettingsView from '@/views/NotificationSettingsView.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/cards',
    name: 'cards',
    component: CardsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/expenses',
    name: 'expenses',
    component: ExpensesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/categories',
    name: 'categories',
    component: CategoriesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/monthly',
    name: 'monthly',
    component: MonthlyView,
    meta: { requiresAuth: true }
  },
  {
    path: '/notificaciones',
    name: 'notificaciones',
    component: NotificationSettingsView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guardia de navegación mejorado
router.beforeEach(async (to, from) => {
  // Espera a que la app esté montada y Pinia inicializado
  if (!window.__appMounted) {
    await new Promise(resolve => {
      const check = () => {
        if (window.__appMounted) {
          resolve();
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  }

  // Importa dinámicamente el store para asegurar la instancia correcta
  const { useAuthStore } = await import('@/stores/auth');
  const authStore = useAuthStore();

  // Esperar a que la autenticación esté lista
  if (!authStore.isAuthReady) {
    await new Promise(resolve => {
      const stop = watch(
        () => authStore.isAuthReady,
        (ready) => {
          if (ready) {
            stop();
            resolve();
          }
        }
      );
    });
  }

  // Si está inicializando, permitir la navegación
  if (authStore.isInitializing) {
    return true;
  }

  // Rutas que requieren autenticación
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('Redirigiendo a login: usuario no autenticado');
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  // Rutas que requieren ser invitado (no autenticado)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    console.log('Redirigiendo a dashboard: usuario ya autenticado');
    return { path: '/dashboard' };
  }

  return true;
});

export default router 