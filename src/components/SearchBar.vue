<script setup>
import { ref, watch } from 'vue'
import { Search, X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Buscar...' }
})

const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue)
let debounceTimer = null

watch(localValue, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update:modelValue', val)
  }, 300)
})

watch(() => props.modelValue, (val) => {
  if (val !== localValue.value) {
    localValue.value = val
  }
})

const clearSearch = () => {
  localValue.value = ''
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="relative">
    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
      <Search class="h-4 w-4 text-slate-400 dark:text-gray-500" />
    </div>
    <input
      v-model="localValue"
      type="text"
      :placeholder="placeholder"
      class="input-field pl-10 pr-10"
    />
    <button
      v-if="localValue"
      @click="clearSearch"
      class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
      aria-label="Limpiar búsqueda"
    >
      <X class="h-4 w-4" />
    </button>
  </div>
</template>
