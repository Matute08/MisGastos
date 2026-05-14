<script setup>
defineProps({
  size: {
    type: [Number, String],
    default: 40
  }
})
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 40 40"
    fill="none"
    class="mg-logo"
    role="img"
    aria-label="MisGastos"
  >
    <rect x="4" y="12" width="32" height="21" rx="4" class="mg-body" />
    <rect x="10" y="8" width="20" height="6" rx="1.5" class="mg-card" />
    <line x1="4" y1="18" x2="36" y2="18" class="mg-flap" stroke-width="2" stroke-linecap="round" />
    <circle cx="20" cy="25" r="5" class="mg-coin" />
    <path d="M20 22.5v5M18 24h4M18 26h4" class="mg-coin-symbol" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

<style scoped>
.mg-body {
  fill: #4F46E5;
}
.mg-card {
  fill: #6366F1;
}
.mg-flap {
  stroke: #E0E7FF;
}
.mg-coin {
  fill: #EEF2FF;
  stroke: #C7D2FE;
  stroke-width: 1.5;
}
.mg-coin-symbol {
  stroke: #4F46E5;
}

@media (prefers-color-scheme: dark) {
  .mg-body {
    fill: #818CF8;
  }
  .mg-card {
    fill: #A5B4FC;
  }
  .mg-flap {
    stroke: #312E81;
  }
  .mg-coin {
    fill: #1E1B4B;
    stroke: #4F46E5;
  }
  .mg-coin-symbol {
    stroke: #C7D2FE;
  }
}
</style>
