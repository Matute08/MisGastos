<template>
  <!-- Skeleton para Desktop -->
  <div class="hidden lg:flex card items-center justify-between animate-pulse">
    <!-- Flecha izquierda -->
    <div class="w-8 h-8 bg-gray-200 rounded"></div>
    
    <!-- Tres columnas de resumen -->
    <div class="flex-1">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div>
          <div class="w-20 h-4 bg-gray-200 rounded mx-auto mb-2"></div>
          <div class="w-32 h-8 bg-gray-200 rounded mx-auto"></div>
        </div>
        <div>
          <div class="w-20 h-4 bg-gray-200 rounded mx-auto mb-2"></div>
          <div class="w-32 h-8 bg-gray-200 rounded mx-auto"></div>
        </div>
        <div>
          <div class="w-24 h-4 bg-gray-200 rounded mx-auto mb-2"></div>
          <div class="w-32 h-8 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    </div>
    
    <!-- Flecha derecha -->
    <div class="w-8 h-8 bg-gray-200 rounded"></div>
  </div>

  <!-- Skeleton para Mobile -->
  <div class="block lg:hidden card animate-pulse">
    <!-- Flechas arriba -->
    <div class="flex items-center justify-between mb-3">
      <div class="w-8 h-8 bg-gray-200 rounded"></div>
      <div class="w-8 h-8 bg-gray-200 rounded"></div>
    </div>
    
    <!-- Tres columnas -->
    <div class="grid grid-cols-3 gap-3">
      <div class="text-center">
        <div class="w-12 h-3 bg-gray-200 rounded mx-auto mb-2"></div>
        <div class="w-20 h-4 bg-gray-200 rounded mx-auto"></div>
      </div>
      <div class="text-center">
        <div class="w-12 h-3 bg-gray-200 rounded mx-auto mb-2"></div>
        <div class="w-20 h-4 bg-gray-200 rounded mx-auto"></div>
      </div>
      <div class="text-center">
        <div class="w-12 h-3 bg-gray-200 rounded mx-auto mb-2"></div>
        <div class="w-20 h-4 bg-gray-200 rounded mx-auto"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>



