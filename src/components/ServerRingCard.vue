<template>
  <router-link :to="to" class="win server-card ring-card" :class="{ offline: !isOnline }">
    <div class="title-bar" :class="{ inactive: !isOnline }">
      <RegionFlag :region="server.region" />
      <OsIcon :os="server.os" />
      <span class="title-bar-text">{{ server.name }}</span>
      <span class="card-status"><span class="led" :class="{ on: isOnline }"></span>{{ statusText }}</span>
    </div>

    <div class="card-body">
      <div v-if="hasMeta" class="card-meta">
        <span v-if="sysConfig.show_price && priceText" class="card-meta-item">{{ priceText }}</span>
        <span
          v-if="sysConfig.show_expire && server.expire_date"
          class="card-meta-item"
          :class="{ expired: isExpired }"
          :title="expireDateTitle || undefined"
        >{{ expireText }}</span>
        <span class="card-meta-spacer"></span>
        <span v-for="tag in tagList" :key="tag" class="badge">{{ tag }}</span>
        <span v-if="hasPublicIPv4 && hasPublicIPv6" class="badge">IPv4/6</span>
        <template v-else>
          <span v-if="hasPublicIPv4" class="badge">IPv4</span>
          <span v-if="hasPublicIPv6" class="badge">IPv6</span>
        </template>
      </div>

      <div class="pies">
        <div class="pie-item">
          <DiskPie :value="cpuPercent" />
          <b>{{ trans.cpu }} {{ roundedPercent(cpuPercent) }}%</b>
          <span class="pie-sub">{{ cpuCores }} {{ trans.w2kCores }}</span>
        </div>
        <div class="pie-item">
          <DiskPie :value="ramPercent" />
          <b>{{ trans.ram }} {{ roundedPercent(ramPercent) }}%</b>
          <span class="pie-sub">{{ ramUsageText }}</span>
          <span v-if="hasSwapData" class="pie-sub">{{ trans.swap }} {{ roundedPercent(swapPercent) }}%</span>
        </div>
        <div class="pie-item">
          <DiskPie :value="diskPercent" />
          <b>{{ trans.disk }} {{ roundedPercent(diskPercent) }}%</b>
          <span class="pie-sub">{{ diskUsageText }}</span>
        </div>
      </div>

      <div class="pie-legend">
        <span><i class="swatch used"></i>{{ trans.w2kUsed }}</span>
        <span><i class="swatch free"></i>{{ trans.w2kFree }}</span>
      </div>

      <div class="card-kv">
        <span>{{ trans.networkTraffic }}</span>
        <span class="num"><span class="net-down">▼ {{ netInSpeed }}/s</span>&nbsp; <span class="net-up">▲ {{ netOutSpeed }}/s</span></span>

        <span>{{ trans.loadAvg }}</span>
        <span class="num">{{ loadAvg[0].toFixed(2) }}&nbsp; {{ loadAvg[1].toFixed(2) }}&nbsp; {{ loadAvg[2].toFixed(2) }}</span>

        <span>{{ trans.totalTraffic }}</span>
        <span class="num">▼ {{ totalRx }}&nbsp; ▲ {{ totalTx }}</span>
      </div>

      <div v-if="sysConfig.show_tf" class="ring-traffic">
        <div class="ring-traffic-head">
          <span>{{ trans.monthlyTraffic }}</span>
          <span class="num">{{ trafficLimitText }}<template v-if="trafficLimitSummary"> | {{ trafficLimitPercentText }}%</template></span>
        </div>
        <SegProgress :value="trafficUsagePercent" :unlimited="!trafficLimitSummary" />
      </div>

      <LatencyPanel
        :trans="trans"
        :show-three-net-details="!!sysConfig.show_three_net_details"
        :has-three-net-details="hasThreeNetDetails"
        :three-net-details="threeNetDetails"
        :ping-list="pingList"
        :get-ping-color="getPingColor"
        :get-loss-color="getLossColor"
        :format-ping-value="formatPingValue"
        :format-loss-value="formatLossValue"
        :is-ping-valid="isPingValid"
      />
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import OsIcon from './OsIcon.vue'
import RegionFlag from './RegionFlag.vue'
import SegProgress from './SegProgress.vue'
import DiskPie from './DiskPie.vue'
import LatencyPanel from './LatencyPanel.vue'
import { DEFAULT_SERVER_CARD_CONFIG, useServerCardData } from '../composables/useServerCardData'

const props = defineProps({
  server: { type: Object, required: true },
  sysConfig: { type: Object, default: () => ({ ...DEFAULT_SERVER_CARD_CONFIG }) },
  to: { type: String, default: '' }
})

const {
  trans,
  isOnline,
  statusText,
  cpuPercent,
  cpuCores,
  ramPercent,
  swapPercent,
  hasSwapData,
  diskPercent,
  trafficLimitSummary,
  trafficUsagePercent,
  trafficLimitPercentText,
  trafficLimitText,
  netInSpeed,
  netOutSpeed,
  totalRx,
  totalTx,
  priceText,
  expireDateTitle,
  loadAvg,
  ramUsageText,
  diskUsageText,
  roundedPercent,
  isPingValid,
  getPingColor,
  getLossColor,
  formatPingValue,
  formatLossValue,
  pingList,
  threeNetDetails,
  hasThreeNetDetails,
  tagList,
  hasPublicIPv4,
  hasPublicIPv6,
  isExpired,
  expireText
} = useServerCardData(props)

const hasMeta = computed(() => (
  (props.sysConfig.show_price && priceText.value) ||
  (props.sysConfig.show_expire && props.server.expire_date) ||
  tagList.value.length > 0 || hasPublicIPv4.value || hasPublicIPv6.value
))
</script>
