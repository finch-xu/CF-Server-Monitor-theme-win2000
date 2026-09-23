<template>
  <span class="disk-pie" :style="pieStyle" role="img" :aria-label="Math.round(clamped) + '%'">
    <span class="disk-pie-side"></span>
    <span class="disk-pie-top"></span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

// Win2000 磁盘属性风格的 3D 饼图：已用蓝色 / 可用洋红色
const props = defineProps({
  value: { type: Number, default: 0 }
})

const clamped = computed(() => {
  const n = Number(props.value)
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0
})

const pieStyle = computed(() => ({ '--pie-used': `${clamped.value}%` }))
</script>
