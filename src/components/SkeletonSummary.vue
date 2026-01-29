<template>
  <div class="bg-white rounded-lg shadow p-4 animate-pulse">
    <div class="w-32 h-5 bg-gray-200 rounded mb-3"></div>
    <div class="space-y-3">
      <div
        v-for="i in items"
        :key="i"
        class="flex items-center justify-between py-2"
      >
        <div class="flex items-center space-x-3">
          <div class="w-6 h-6 bg-gray-200 rounded-md"></div>
          <div class="w-24 h-4 bg-gray-200 rounded"></div>
        </div>
        <div class="w-32 h-5 bg-gray-200 rounded"></div>
      </div>
      <div class="flex items-center justify-between py-2 border-t-2 border-gray-200 pt-3">
        <div class="flex items-center space-x-3">
          <div class="w-6 h-6 bg-gray-200 rounded-md"></div>
          <div class="w-24 h-4 bg-gray-200 rounded"></div>
        </div>
        <div class="w-40 h-6 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Number,
    default: 3
  }
})
</script>



