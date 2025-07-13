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

// Guardia de navegación para Vue Router 4 (sin next)
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

  if (to.meta.requiresAuth && !authStore.user) {
    return { path: '/login' };
  }
  if ((to.path === '/login' || to.path === '/register') && authStore.user) {
    return { path: '/' };
  }
  return true;
});

export default router 