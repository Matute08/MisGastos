<template>
  <div :class="gridClass">
    <div
      v-for="i in count"
      :key="i"
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
    >
      <div class="space-y-3">
        <div class="w-12 h-12 bg-gray-200 rounded-lg mx-auto"></div>
        <div class="w-3/4 h-4 bg-gray-200 rounded mx-auto"></div>
        <div class="w-1/2 h-5 bg-gray-200 rounded mx-auto"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  count: {
    type: Number,
    default: 4
  },
  columns: {
    type: String,
    default: 'grid-cols-2 lg:grid-cols-4'
  }
})

const gridClass = computed(() => {
  return `grid ${props.columns} gap-4`
})
</script>

