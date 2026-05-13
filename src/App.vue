<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useExpensesStore } from '@/stores/expenses'
import { useOnboardingStore } from '@/stores/onboarding'
import { useTheme } from '@/composables/useTheme'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import AppNavigation from '@/components/AppNavigation.vue'
import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue'
import OnboardingTour from '@/components/OnboardingTour.vue'
import ShortcutsHelp from '@/components/ShortcutsHelp.vue'
import FloatingActionButton from '@/components/FloatingActionButton.vue'

const authStore = useAuthStore()
const expensesStore = useExpensesStore()
const onboardingStore = useOnboardingStore()
const { initTheme } = useTheme()
const { registerShortcuts, unregisterShortcuts, showShortcutsHelp } = useKeyboardShortcuts()
const router = useRouter()

onMounted(async () => {
  initTheme()
  await authStore.init()
  authStore.setupAuthListener()
})

onUnmounted(() => {
  window.removeEventListener('shortcut:new-expense', handleNewExpense)
  window.removeEventListener('shortcut:new-income', handleNewIncome)
  window.removeEventListener('shortcut:go-expenses', handleGoExpenses)
  window.removeEventListener('shortcut:go-dashboard', handleGoDashboard)
  unregisterShortcuts()
})

const handleNewExpense = () => router.push({ name: 'expenses' })
const handleNewIncome = () => router.push({ name: 'incomes' })
const handleGoExpenses = () => router.push({ name: 'expenses' })
const handleGoDashboard = () => router.push({ name: 'dashboard' })

watch(() => authStore.isAuthenticated, (val) => {
  if (val) {
    registerShortcuts()
    window.addEventListener('shortcut:new-expense', handleNewExpense)
    window.addEventListener('shortcut:new-income', handleNewIncome)
    window.addEventListener('shortcut:go-expenses', handleGoExpenses)
    window.addEventListener('shortcut:go-dashboard', handleGoDashboard)
  } else {
    unregisterShortcuts()
    window.removeEventListener('shortcut:new-expense', handleNewExpense)
    window.removeEventListener('shortcut:new-income', handleNewIncome)
    window.removeEventListener('shortcut:go-expenses', handleGoExpenses)
    window.removeEventListener('shortcut:go-dashboard', handleGoDashboard)
  }
})

watch(
  [() => authStore.isAuthenticated, () => authStore.isInitializing],
  ([isAuth, isInit]) => {
    if (isAuth && !isInit && !onboardingStore.completed) {
      setTimeout(() => {
        if (expensesStore.expenses.length === 0) {
          onboardingStore.startTour()
        } else {
          onboardingStore.skipTour()
        }
      }, 2000)
    }
  },
)
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Initializing Spinner -->
    <div
      v-if="authStore.isInitializing"
      class="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50"
    >
      <div class="flex flex-col items-center gap-4">
        <div class="h-10 w-10 rounded-full border-[3px] border-primary-200 border-t-primary-600 animate-spin"></div>
        <span class="text-gray-600 dark:text-gray-400 text-sm font-medium tracking-wide">Verificando sesión...</span>
      </div>
    </div>

    <!-- Navigation -->
    <AppNavigation v-if="authStore.isAuthenticated && !authStore.isInitializing" />

    <!-- Main Content -->
    <main
      v-if="!authStore.isInitializing"
      :class="[
        'transition-all duration-200',
        authStore.isAuthenticated
          ? 'lg:ml-60 lg:pb-8 pb-24 px-4 sm:px-6 lg:px-8 py-6'
          : ''
      ]"
    >
      <Transition name="page" mode="out-in">
        <router-view />
      </Transition>
    </main>

    <!-- Floating Action Button -->
    <FloatingActionButton />

    <!-- Loading Overlay -->
    <div
      v-if="authStore.loading && !authStore.isInitializing"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-soft-lg dark:shadow-none dark:border dark:border-gray-700 flex items-center gap-3">
        <div class="h-5 w-5 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin"></div>
        <span class="text-gray-700 dark:text-gray-300 text-sm font-medium">Cargando...</span>
      </div>
    </div>

    <PWAInstallPrompt />
    <OnboardingTour />
    <ShortcutsHelp v-model="showShortcutsHelp" />
  </div>
</template>
