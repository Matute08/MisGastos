<template>
  <span
    class="inline-flex items-center gap-0.5 text-sm font-semibold transition-all duration-300 dark:text-gray-400"
    :class="badgeClass"
  >
    <ArrowUp v-if="!isNeutral && isPositive" class="w-3.5 h-3.5" />
    <ArrowDown v-if="!isNeutral && !isPositive" class="w-3.5 h-3.5" />
    <span v-if="isNeutral">&mdash;</span>
    <span v-else>{{ formattedPercentage }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowUp, ArrowDown } from 'lucide-vue-next'

const props = defineProps({
  currentValue: { type: Number, default: 0 },
  previousValue: { type: Number, default: 0 },
  inverse: { type: Boolean, default: false }
})

const percentage = computed(() => {
  if (props.previousValue === 0) return 0
  return ((props.currentValue - props.previousValue) / Math.abs(props.previousValue)) * 100
})

const isNeutral = computed(() => props.previousValue === 0)

const isPositive = computed(() => {
  if (isNeutral.value) return true
  return props.inverse ? percentage.value < 0 : percentage.value >= 0
})

const formattedPercentage = computed(() => {
  const sign = percentage.value >= 0 ? '+' : ''
  return `${sign}${percentage.value.toFixed(1)}%`
})

const badgeClass = computed(() => {
  if (isNeutral.value) return 'text-slate-400'
  return isPositive.value ? 'text-success-600' : 'text-danger-600'
})
</script>
