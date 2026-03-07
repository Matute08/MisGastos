<script setup>
defineProps({
  count: { type: Number, default: 5 }
})
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="i in count"
      :key="i"
      class="bg-white rounded-2xl border border-slate-100 p-4 shadow-soft flex items-center gap-4"
    >
      <div class="skeleton h-10 w-10 !rounded-full shrink-0" />
      <div class="flex-1 space-y-2">
        <div class="skeleton h-4 w-36" />
        <div class="skeleton h-3 w-24" />
      </div>
      <div class="skeleton h-5 w-20 shrink-0" />
    </div>
  </div>
</template>
