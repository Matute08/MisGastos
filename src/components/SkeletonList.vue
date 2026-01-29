<template>
  <div class="space-y-3">
    <div
      v-for="i in count"
      :key="i"
      class="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
    >
      <div class="flex items-center justify-between">
        <div class="flex-1 space-y-2">
          <div class="w-32 h-4 bg-gray-200 rounded"></div>
          <div class="w-48 h-3 bg-gray-200 rounded"></div>
          <div class="flex items-center space-x-2">
            <div class="w-16 h-3 bg-gray-200 rounded"></div>
            <div class="w-20 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div class="w-24 h-6 bg-gray-200 rounded ml-4"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 5
  }
})
</script>


