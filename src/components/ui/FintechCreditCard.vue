<template>
  <div
    ref="cardRef"
    class="relative rounded-2xl transition-all duration-200 select-none cursor-pointer group will-change-transform"
    :style="cardTransformStyle"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <!-- Background Card Frame with dynamic bank gradient and glass sheen -->
    <div
      :class="[
        'relative overflow-hidden rounded-2xl p-5 border shadow-xl transition-all duration-300 backdrop-blur-xl',
        'bg-gradient-to-br',
        brandInfo.cardGradient,
        'border-white/15 dark:border-white/10'
      ]"
    >
      <!-- Dynamic Specular / Holographic Glare Overlay -->
      <div
        class="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-200"
        :style="glareStyle"
      ></div>

      <!-- Top Edge Glass Reflection Line -->
      <div class="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

      <!-- Card Top: EMV Chip & Bank Badge -->
      <div class="flex items-center justify-between mb-4 relative z-10">
        <!-- EMV Chip graphic -->
        <div class="flex items-center gap-2">
          <div class="w-8 h-6 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-1 border border-amber-300/40 shadow-xs flex items-center justify-center">
            <div class="w-full h-full border border-amber-800/30 rounded-xs grid grid-cols-2 gap-0.5 opacity-60">
              <div class="border-r border-b border-amber-900/30"></div>
              <div class="border-b border-amber-900/30"></div>
              <div class="border-r border-amber-900/30"></div>
              <div></div>
            </div>
          </div>
          <!-- Contactless icon -->
          <svg class="w-4 h-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8.5 16.5a5 5 0 0 1 0-9M12 19a8.5 8.5 0 0 0 0-14M15.5 21.5a12 12 0 0 0 0-19" />
          </svg>
        </div>

        <!-- Bank or Network Badge -->
        <div class="flex items-center gap-1.5">
          <span
            v-if="brandInfo.networkName"
            :class="['px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ring-1', brandInfo.networkBadge]"
          >
            {{ brandInfo.networkName }}
          </span>
          <span class="text-[10px] text-white/60 font-semibold uppercase tracking-wider">
            {{ isAnnual ? 'Año' : 'Mes' }}
          </span>
        </div>
      </div>

      <!-- Card Title / Bank Name -->
      <div class="relative z-10 mb-2">
        <h3 class="text-sm font-bold text-white tracking-wide truncate">{{ card.name }}</h3>
        <p class="text-[11px] text-white/60 font-medium">{{ brandInfo.bankName }}</p>
      </div>

      <!-- Card Amount / Balance -->
      <div class="relative z-10 pt-2 border-t border-white/10 flex items-baseline justify-between">
        <div>
          <p class="text-[10px] text-white/50 uppercase tracking-wider">Gasto Total</p>
          <p class="text-lg sm:text-xl font-black tabular-nums text-white drop-shadow-xs">
            {{ formatCurrency(card.amount) }}
          </p>
        </div>
        <div v-if="card.cardCredits > 0" class="text-right">
          <span class="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
            -{{ formatCurrency(card.cardCredits) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getCardBrandInfo } from '@/utils/brandHelper';
import { formatCurrency } from '@/utils/formatters';

const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  isAnnual: {
    type: Boolean,
    default: false
  }
});

const cardRef = ref(null);
const tiltX = ref(0);
const tiltY = ref(0);
const glareX = ref(50);
const glareY = ref(50);
const isHovered = ref(false);

const brandInfo = computed(() => {
  return getCardBrandInfo(props.card?.name, props.card?.bank);
});

function handleMouseMove(e) {
  if (!cardRef.value) return;
  const rect = cardRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const px = x / rect.width;
  const py = y / rect.height;

  // Max tilt angle in degrees
  const maxTilt = 12;
  tiltX.value = (py - 0.5) * -maxTilt;
  tiltY.value = (px - 0.5) * maxTilt;

  glareX.value = px * 100;
  glareY.value = py * 100;
  isHovered.value = true;
}

function handleMouseLeave() {
  tiltX.value = 0;
  tiltY.value = 0;
  isHovered.value = false;
}

const cardTransformStyle = computed(() => {
  if (!isHovered.value) {
    return {
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s ease-out'
    };
  }
  return {
    transform: `perspective(1000px) rotateX(${tiltX.value.toFixed(2)}deg) rotateY(${tiltY.value.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`,
    transition: 'transform 0.1s ease-out'
  };
});

const glareStyle = computed(() => {
  if (!isHovered.value) {
    return { opacity: 0 };
  }
  return {
    opacity: 1,
    background: `radial-gradient(circle 180px at ${glareX.value}% ${glareY.value}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 45%, transparent 70%)`
  };
});
</script>
