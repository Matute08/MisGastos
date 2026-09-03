<script setup>
import { Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    @click="toggleTheme"
    class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
    :aria-label="isDark ? 'Activar modo claro' : 'Activar modo oscuro'"
    :title="isDark ? 'Modo claro' : 'Modo oscuro'"
  >
    <Sun
      v-if="isDark"
      class="h-5 w-5 transition-transform duration-500"
      :class="isDark ? 'rotate-0' : 'rotate-90'"
    />
    <Moon
      v-else
      class="h-5 w-5 transition-transform duration-500"
      :class="isDark ? 'rotate-90' : 'rotate-0'"
    />
  </button>
</template>
