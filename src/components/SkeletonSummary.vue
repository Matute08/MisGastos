<template>
  <!-- Versión Desktop -->
  <div v-if="!isMobile" class="card animate-pulse hidden lg:flex items-center justify-between">
    <div class="w-10 h-10 bg-gray-200 rounded"></div>
    <div class="flex-1">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div v-for="i in 3" :key="i" class="space-y-2">
          <div class="w-20 h-4 bg-gray-200 rounded mx-auto"></div>
          <div class="w-32 h-8 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    </div>
    <div class="w-10 h-10 bg-gray-200 rounded"></div>
  </div>
  
  <!-- Versión Mobile -->
  <div v-else class="card animate-pulse block lg:hidden">
    <div class="flex items-center justify-between mb-3">
      <div class="w-10 h-10 bg-gray-200 rounded"></div>
      <div class="w-10 h-10 bg-gray-200 rounded"></div>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div v-for="i in 3" :key="i" class="text-center space-y-2">
        <div class="w-12 h-3 bg-gray-200 rounded mx-auto"></div>
        <div class="w-20 h-4 bg-gray-200 rounded mx-auto"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isMobile: {
    type: Boolean,
    default: false
  }
})
</script>

<script setup>
</script>

