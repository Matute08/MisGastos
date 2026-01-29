<template>
  <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
    <div
      v-for="i in count"
      :key="i"
      class="bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse overflow-hidden"
    >
      <div class="h-2 w-full bg-gray-200"></div>
      <div class="p-3 sm:p-4 md:p-6 space-y-3">
        <div class="w-24 h-5 bg-gray-200 rounded mx-auto"></div>
        <div class="w-32 h-4 bg-gray-200 rounded mx-auto"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 8
  }
})
</script>



