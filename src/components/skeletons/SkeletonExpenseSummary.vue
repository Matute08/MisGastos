<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-6 shadow-soft dark:shadow-none animate-fade-in">
    <div class="grid grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="space-y-2">
        <div class="skeleton h-3 w-16" />
        <div class="skeleton h-6 w-full" />
      </div>
    </div>
  </div>
</template>
