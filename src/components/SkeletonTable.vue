<template>
  <div class="card animate-pulse">
    <div class="card-header">
      <div class="w-48 h-5 bg-gray-200 rounded mb-2"></div>
      <div class="w-64 h-4 bg-gray-200 rounded"></div>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              v-for="i in columns"
              :key="i"
              class="px-6 py-3 text-left"
            >
              <div class="w-24 h-4 bg-gray-200 rounded"></div>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="i in rows" :key="i">
            <td
              v-for="j in columns"
              :key="j"
              class="px-6 py-4"
            >
              <div class="w-20 h-4 bg-gray-200 rounded"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  columns: {
    type: Number,
    default: 6
  },
  rows: {
    type: Number,
    default: 5
  }
})
</script>



