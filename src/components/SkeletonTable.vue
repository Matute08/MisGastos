<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
    <!-- Table header -->
    <div class="bg-gray-50 px-6 py-3 border-b border-gray-200">
      <div class="grid gap-4" :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }">
        <div
          v-for="i in columns"
          :key="i"
          class="h-4 bg-gray-200 rounded"
        ></div>
      </div>
    </div>
    <!-- Table rows -->
    <div class="divide-y divide-gray-200">
      <div
        v-for="i in rows"
        :key="i"
        class="px-6 py-4"
      >
        <div class="grid gap-4" :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }">
          <div
            v-for="j in columns"
            :key="j"
            class="h-4 bg-gray-200 rounded"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rows: {
    type: Number,
    default: 5
  },
  columns: {
    type: Number,
    default: 5
  }
})
</script>

