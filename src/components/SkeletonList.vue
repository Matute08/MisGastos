<template>
  <div class="space-y-4">
    <div
      v-for="i in count"
      :key="i"
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3 flex-1">
          <div class="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div class="flex-1 space-y-2">
            <div class="w-3/4 h-4 bg-gray-200 rounded"></div>
            <div class="w-1/2 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <div class="w-24 h-5 bg-gray-200 rounded"></div>
          <div class="w-20 h-5 bg-gray-200 rounded"></div>
        </div>
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

