<template>
  <router-link :to="to" class="win server-card" :class="{ offline: !isOnline }">
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

      <div class="card-meters">
        <span>{{ trans.cpu }}</span>
        <SegProgress :value="cpuPercent" />
        <span class="num">{{ cpuPercent.toFixed(2) }}%</span>

        <span>{{ trans.ram }}</span>
        <SegProgress :value="ramPercent" />
        <span class="num">{{ ramPercent.toFixed(2) }}%</span>

        <span>{{ trans.disk }}</span>
        <SegProgress :value="diskPercent" />
        <span class="num">{{ diskPercent.toFixed(2) }}%</span>

        <template v-if="sysConfig.show_tf">
          <span>{{ trans.use }}</span>
          <SegProgress :value="trafficUsagePercent" :unlimited="!server.traffic_limit" />
          <span class="num">{{ server.traffic_limit ? trafficUsagePercentText + '%' : '∞' }}</span>
        </template>
      </div>

      <div class="card-kv">
        <span>{{ trans.w2kLoad }}</span>
        <span class="num">{{ loadAvg[0].toFixed(2) }}&nbsp; {{ loadAvg[1].toFixed(2) }}&nbsp; {{ loadAvg[2].toFixed(2) }}</span>

        <span>{{ trans.w2kSpeed }}</span>
        <span class="num"><span class="net-down">▼ {{ netInSpeed }}/s</span>&nbsp; <span class="net-up">▲ {{ netOutSpeed }}/s</span></span>

        <span>{{ trans.monthlyTraffic }}</span>
        <span class="num">
          ▼ {{ totalRxMonthly }}&nbsp; ▲ {{ totalTxMonthly }}
          <template v-if="sysConfig.show_tf && server.traffic_limit"> / {{ formatBytes(server.traffic_limit * 1024 * 1024 * 1024) }}</template>
        </span>
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
  ramPercent,
  diskPercent,
  trafficUsagePercent,
  trafficUsagePercentText,
  tagList,
  hasPublicIPv4,
  hasPublicIPv6,
  netInSpeed,
  netOutSpeed,
  totalRxMonthly,
  totalTxMonthly,
  priceText,
  expireDateTitle,
  loadAvg,
  isExpired,
  expireText,
  isPingValid,
  getPingColor,
  getLossColor,
  formatPingValue,
  formatLossValue,
  pingList,
  threeNetDetails,
  hasThreeNetDetails,
  formatBytes
} = useServerCardData(props)

const hasMeta = computed(() => (
  (props.sysConfig.show_price && priceText.value) ||
  (props.sysConfig.show_expire && props.server.expire_date) ||
  tagList.value.length > 0 || hasPublicIPv4.value || hasPublicIPv6.value
))
</script>
