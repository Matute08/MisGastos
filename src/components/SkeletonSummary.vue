<script setup>
defineProps({
  items: { type: Number, default: 3 }
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-6 shadow-soft dark:shadow-none animate-fade-in">
    <div class="skeleton h-5 w-40 mb-5" />
    <div class="space-y-4">
      <div v-for="i in items" :key="i" class="flex items-center justify-between">
        <div class="skeleton h-4 w-28" />
        <div class="skeleton h-4 w-20" />
      </div>
    </div>
  </div>
</template>
