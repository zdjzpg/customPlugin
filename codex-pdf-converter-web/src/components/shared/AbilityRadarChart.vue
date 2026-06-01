<template>
  <div class="ability-radar-wrap report-radar-card">
    <div class="radar-stage">
      <svg class="radar" viewBox="0 0 320 320" role="img" aria-label="能力雷达图">
        <g transform="translate(160 160)">
          <polygon
            v-for="ring in rings"
            :key="ring"
            :points="ringPoints(ring)"
            fill="none"
            stroke="rgba(143, 189, 222, 0.28)"
            stroke-width="1"
          />
          <line
            v-for="point in axisPoints"
            :key="point.label"
            x1="0"
            y1="0"
            :x2="point.x"
            :y2="point.y"
            stroke="rgba(143, 189, 222, 0.28)"
            stroke-width="1"
          />
          <polygon
            :points="dataPolygon"
            fill="rgba(122, 216, 198, 0.24)"
            stroke="#63bfa6"
            stroke-width="3"
          />
          <circle
            v-for="point in dataPoints"
            :key="point.label"
            :cx="point.x"
            :cy="point.y"
            r="5"
            fill="#4f8fcc"
          />
        </g>
        <g v-for="point in labelPoints" :key="`label_${point.label}`">
          <text
            :x="point.x"
            :y="point.y"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="#5b6f8d"
            font-size="16"
            font-weight="700"
          >
            {{ point.label }}
          </text>
        </g>
      </svg>
    </div>

    <div class="summary-kpis ability-radar-kpis">
      <div v-for="item in items" :key="item.label" class="kpi">
        <div class="kpi-label">{{ item.label }}</div>
        <div class="kpi-value">{{ item.percent }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps */
import { computed } from 'vue';

const props = defineProps({
  items: { type: Array, default: () => [] }
});

const center = 160;
const radius = 102;
const rings = [0.25, 0.5, 0.75, 1];

const axisPoints = computed(() => {
  const count = Math.max(props.items.length, 1);
  return props.items.map((item, index) => {
    const angle = (-Math.PI / 2) + ((Math.PI * 2) / count) * index;
    return {
      label: item.label,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  });
});

const dataPoints = computed(() => axisPoints.value.map((point, index) => {
  const item = props.items[index];
  const factor = Math.max(0, Math.min(1, Number(item.percent || 0) / 100));
  return {
    label: item.label,
    x: point.x * factor,
    y: point.y * factor
  };
}));

const labelPoints = computed(() => axisPoints.value.map((point) => ({
  label: point.label,
  x: center + point.x * 1.24,
  y: center + point.y * 1.24
})));

const dataPolygon = computed(() => dataPoints.value.map((point) => `${point.x},${point.y}`).join(' '));

function ringPoints(scale) {
  return axisPoints.value.map((point) => `${point.x * scale},${point.y * scale}`).join(' ');
}
</script>
