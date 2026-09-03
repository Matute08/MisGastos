<template>
  <div class="relative w-full overflow-hidden pointer-events-none" :style="{ height: `${height}px` }">
    <svg
      :viewBox="`0 0 ${width} ${height}`"
      class="w-full h-full overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient :id="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" :stop-color="color" stop-opacity="0.35" />
          <stop offset="100%" :stop-color="color" stop-opacity="0.0" />
        </linearGradient>
      </defs>

      <!-- Fill under curve -->
      <path
        v-if="areaPath"
        :d="areaPath"
        :fill="`url(#${gradientId})`"
      />

      <!-- Glowing stroke line -->
      <path
        :d="linePath"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
      />

      <!-- End dot pulse -->
      <circle
        v-if="points.length > 0"
        :cx="points[points.length - 1].x"
        :cy="points[points.length - 1].y"
        r="3.5"
        :fill="color"
        class="animate-pulse"
      />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Array,
    default: () => [10, 25, 18, 30, 45, 38, 55, 60]
  },
  color: {
    type: String,
    default: '#10B981'
  },
  height: {
    type: Number,
    default: 40
  },
  width: {
    type: Number,
    default: 120
  },
  strokeWidth: {
    type: Number,
    default: 2
  }
});

const gradientId = computed(() => `sparkline-grad-${Math.random().toString(36).substring(2, 9)}`);

const points = computed(() => {
  const vals = props.data.length > 1 ? props.data : [props.data[0] || 0, props.data[0] || 0];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min === 0 ? 1 : max - min;
  const paddingY = 4;
  const usableHeight = props.height - paddingY * 2;

  return vals.map((val, idx) => {
    const x = (idx / (vals.length - 1)) * props.width;
    const y = props.height - paddingY - ((val - min) / range) * usableHeight;
    return { x, y };
  });
});

const linePath = computed(() => {
  const pts = points.value;
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M 0 ${pts[0].y} L ${props.width} ${pts[0].y}`;

  // Build a smooth cubic bezier spline through the points
  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
});

const areaPath = computed(() => {
  const pts = points.value;
  if (pts.length === 0) return '';
  const line = linePath.value;
  return `${line} L ${pts[pts.length - 1].x} ${props.height} L ${pts[0].x} ${props.height} Z`;
});
</script>
