<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Plus } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isVisible = ref(true)
let lastScrollY = 0

const handleScroll = () => {
  const currentScrollY = window.scrollY
  isVisible.value = currentScrollY < lastScrollY || currentScrollY < 50
  lastScrollY = currentScrollY
}

const navigateToExpenses = () => {
  router.push('/expenses')
}

const shouldShow = () => {
  return authStore.isAuthenticated && !authStore.isInitializing && route.name !== 'expenses'
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div
    v-if="shouldShow()"
    class="lg:hidden fixed z-40 transition-all duration-300 ease-out"
    :class="isVisible ? 'bottom-24 right-5 opacity-100 translate-y-0' : 'bottom-20 right-5 opacity-0 translate-y-4 pointer-events-none'"
  >
    <button
      @click="navigateToExpenses"
      class="flex items-center justify-center w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white shadow-lg hover:shadow-xl dark:shadow-gray-900/50 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      aria-label="Agregar gasto"
    >
      <Plus class="h-7 w-7" />
    </button>
  </div>
</template>
