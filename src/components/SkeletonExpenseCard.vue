<template>
  <div class="space-y-2">
    <div
      v-for="i in count"
      :key="i"
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-3 animate-pulse"
    >
      <!-- Header de la tarjeta -->
      <div class="flex items-start justify-between mb-2">
        <div class="flex items-center gap-2 flex-1">
          <!-- Icono circular -->
          <div class="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
          
          <!-- Información principal -->
          <div class="flex-1">
            <!-- Título (descripción) -->
            <div class="w-40 h-4 bg-gray-200 rounded mb-2"></div>
            <!-- Badge de categoría y tipo -->
            <div class="flex items-center gap-2">
              <div class="w-20 h-5 bg-gray-200 rounded-full"></div>
              <div class="w-12 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        
        <!-- Monto y menú de acciones -->
        <div class="text-right flex-shrink-0 ml-2">
          <div class="w-4 h-4 bg-gray-200 rounded mb-2 ml-auto"></div>
          <div class="w-24 h-5 bg-gray-200 rounded"></div>
        </div>
      </div>
      
      <!-- Información adicional (tarjeta, fecha, estado) -->
      <div class="flex items-center justify-between pt-2 border-t border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-20 h-3 bg-gray-200 rounded"></div>
          <div class="w-16 h-3 bg-gray-200 rounded"></div>
        </div>
        <div class="w-20 h-6 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 5
  }
})
</script>

