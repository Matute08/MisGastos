<script setup>
defineProps({
  columns: { type: Number, default: 5 },
  rows: { type: Number, default: 5 }
})
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft overflow-hidden">
    <div class="grid gap-4" :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }">
      <div v-for="col in columns" :key="'h-' + col" class="skeleton h-4 w-full" />
    </div>
    <div class="mt-4 space-y-3">
      <div
        v-for="row in rows"
        :key="'r-' + row"
        class="grid gap-4"
        :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }"
      >
        <div v-for="col in columns" :key="'c-' + col" class="skeleton h-4 w-full" />
      </div>
    </div>
  </div>
</template>
