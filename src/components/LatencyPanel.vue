<template>
  <div v-if="showThreeNetDetails && hasThreeNetDetails" class="sunken latency-panel">
    <div class="latency-head">
      <span></span>
      <span>{{ trans.w2kLatency }}</span>
      <span></span>
      <span>{{ trans.w2kLoss }}</span>
      <span></span>
    </div>
    <div v-for="row in threeNetDetails" :key="row.key" class="latency-row" :title="row.title || undefined">
      <span class="latency-name">{{ row.label }}</span>
      <b class="latency-value" :style="{ color: getPingColor(row.latestPing) }">{{ formatPingValue(row.latestPing) }}</b>
      <span class="latency-buckets">
        <span
          v-for="(point, index) in row.points"
          :key="'p' + index"
          class="latency-bucket"
          :data-tooltip="point.pingTooltip"
        ><span :style="{ height: point.pingHeight + '%', background: point.pingColor, opacity: point.pingOpacity }"></span></span>
      </span>
      <b class="latency-value" :style="{ color: getLossColor(row.averageLoss) }">{{ formatLossValue(row.averageLoss) }}</b>
      <span class="latency-buckets">
        <span
          v-for="(point, index) in row.points"
          :key="'l' + index"
          class="latency-bucket"
          :data-tooltip="point.lossTooltip"
        ><span :style="{ height: point.lossHeight + '%', background: point.lossColor, opacity: point.lossOpacity }"></span></span>
      </span>
    </div>
  </div>
  <div v-else-if="visiblePings.length" class="sunken latency-chips">
    <span v-for="p in visiblePings" :key="p.label" class="latency-chip">
      <span>{{ p.label }}</span>
      <b :style="{ color: getPingColor(p.value) }">{{ isPingValid(p.value) ? p.value + 'ms' : trans.timeout }}</b>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  trans: { type: Object, required: true },
  showThreeNetDetails: { type: Boolean, default: false },
  hasThreeNetDetails: { type: Boolean, default: false },
  threeNetDetails: { type: Array, default: () => [] },
  pingList: { type: Array, default: () => [] },
  getPingColor: { type: Function, required: true },
  getLossColor: { type: Function, required: true },
  formatPingValue: { type: Function, required: true },
  formatLossValue: { type: Function, required: true },
  isPingValid: { type: Function, required: true }
})

// 与默认主题一致：值为 0 的探测不显示，最多显示 4 条
const visiblePings = computed(() => props.pingList.filter(p => p.value !== 0 && p.value !== undefined).slice(0, 4))
</script>
