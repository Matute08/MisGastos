<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useExpensesStore } from '@/stores/expenses'
import { useOnboardingStore } from '@/stores/onboarding'
import { useTheme } from '@/composables/useTheme'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import AppNavigation from '@/components/layout/AppNavigation.vue'
import PWAInstallPrompt from '@/components/layout/PWAInstallPrompt.vue'
import OnboardingTour from '@/components/layout/OnboardingTour.vue'
import ShortcutsHelp from '@/components/layout/ShortcutsHelp.vue'
import FloatingActionButton from '@/components/ui/FloatingActionButton.vue'
import CommandPalette from '@/components/ui/CommandPalette.vue'

const authStore = useAuthStore()
const expensesStore = useExpensesStore()
const onboardingStore = useOnboardingStore()
const { initTheme } = useTheme()
const { registerShortcuts, unregisterShortcuts, showShortcutsHelp } = useKeyboardShortcuts()
const router = useRouter()

const showCommandPalette = ref(false)

const handleGlobalKeyDown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    showCommandPalette.value = !showCommandPalette.value
  }
}

const handleOpenCommandPalette = () => {
  showCommandPalette.value = true
}

onMounted(async () => {
  initTheme()
  await authStore.init()
  authStore.setupAuthListener()
  window.addEventListener('keydown', handleGlobalKeyDown)
  window.addEventListener('open:command-palette', handleOpenCommandPalette)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown)
  window.removeEventListener('open:command-palette', handleOpenCommandPalette)
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
  <div id="app" class="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-gray-100 transition-colors duration-300 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
    <!-- Ambient background glow orbs for authentic glassmorphism refraction -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/15 dark:bg-indigo-600/15 rounded-full blur-[100px]"></div>
      <div class="absolute top-1/3 -left-32 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-[100px]"></div>
      <div class="absolute -bottom-32 right-1/4 w-[450px] h-[450px] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[120px]"></div>
    </div>

    <!-- Initializing Spinner -->
    <div
      v-if="authStore.isInitializing"
      class="fixed inset-0 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-xl flex items-center justify-center z-50"
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
        'transition-all duration-200 relative z-10',
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
      class="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50"
    >
      <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-white/20 dark:border-white/10 flex items-center gap-3">
        <div class="h-5 w-5 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin"></div>
        <span class="text-gray-700 dark:text-gray-300 text-sm font-medium">Cargando...</span>
      </div>
    </div>

    <PWAInstallPrompt />
    <OnboardingTour />
    <ShortcutsHelp v-model="showShortcutsHelp" />
    <CommandPalette v-model="showCommandPalette" />
  </div>
</template>


