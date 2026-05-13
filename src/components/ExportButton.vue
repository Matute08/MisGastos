<template>
  <div class="relative inline-flex">
    <button
      @click="handleExport"
      class="p-2 rounded-lg text-slate-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200"
      :title="label"
      :aria-label="label"
    >
      <Download class="h-4 w-4" />
    </button>
  </div>
</template>

<script setup>
import { Download } from 'lucide-vue-next'
import { exportToCsv } from '@/utils/exportCsv'

const props = defineProps({
  data: { type: Array, required: true },
  filename: { type: String, default: 'export.csv' },
  columns: { type: Array, required: true },
  label: { type: String, default: 'Exportar CSV' }
})

function handleExport() {
  exportToCsv(props.filename, props.columns, props.data)
}
</script>
