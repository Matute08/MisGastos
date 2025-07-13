<template>
  <button
    type="button"
    @click="$emit('update:modelValue', !modelValue)"
    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
    :class="modelValue ? 'bg-primary-600' : 'bg-gray-200'"
  >
    <span
      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
      :class="modelValue ? 'translate-x-6' : 'translate-x-1'"
    />
  </button>
</template>

<script setup>
defineProps({
  modelValue: Boolean
})
defineEmits(['update:modelValue'])
</script> 