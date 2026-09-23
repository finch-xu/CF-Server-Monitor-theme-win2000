<template>
  <span class="progress" role="progressbar" :aria-valuenow="Math.round(clamped)" aria-valuemin="0" aria-valuemax="100">
    <span class="progress-fill" :class="{ hot: clamped >= hotAt, unlimited }" :style="{ width: (unlimited ? 100 : clamped) + '%' }"></span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  hotAt: { type: Number, default: 80 },
  unlimited: { type: Boolean, default: false }
})

const clamped = computed(() => {
  const n = Number(props.value)
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0
})
</script>
