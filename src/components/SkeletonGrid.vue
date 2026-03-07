<script setup>
import SkeletonCard from './SkeletonCard.vue'

defineProps({
  count: { type: Number, default: 6 }
})
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    <SkeletonCard v-for="i in count" :key="i" />
  </div>
</template>
