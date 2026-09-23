<template>
  <div class="page">
    <nav class="toolbar" :aria-label="trans.view">
      <button
        v-for="item in viewButtons"
        :key="item.view"
        type="button"
        class="tool-btn"
        :class="{ active: currentView === item.view }"
        :aria-pressed="currentView === item.view ? 'true' : 'false'"
        @click="switchView(item.view)"
      >
        <WinIcon :name="item.icon" :size="14" />{{ item.label }}
      </button>
    </nav>

    <div class="page-content">
      <div v-if="isLoading" class="loading-panel">
        <span>{{ trans.w2kLoadingSites }}</span>
        <span class="progress progress-indeterminate"><span class="progress-fill"></span></span>
      </div>

      <template v-else>
        <div ref="filterWrap" class="tabs filter-tabs" role="tablist" :aria-label="trans.w2kRegion">
          <button
            type="button"
            class="tab"
            role="tab"
            :class="{ active: currentFilter === 'all' }"
            :aria-selected="currentFilter === 'all' ? 'true' : 'false'"
            @click="setFilter('all')"
          >{{ trans.w2kAll }} <span class="tab-count">{{ servers.length }}</span></button>
          <button
            v-for="item in visibleFilterOptions"
            :key="item.code"
            type="button"
            class="tab"
            role="tab"
            :class="{ active: currentFilter === item.code }"
            :aria-selected="currentFilter === item.code ? 'true' : 'false'"
            @click="setFilter(item.code)"
          >
            <RegionFlag v-if="item.code !== 'unknown'" :region="item.code" />
            <span>{{ item.label }}</span>
            <span class="tab-count">{{ item.count }}</span>
          </button>
          <div v-if="overflowFilterOptions.length > 0" class="filter-more">
            <button
              type="button"
              class="tab"
              :class="{ active: isOverflowFilterActive }"
              :aria-expanded="filterMoreOpen ? 'true' : 'false'"
              @click.stop="toggleFilterMore"
            >{{ isOverflowFilterActive ? currentFilter.toUpperCase() : trans.w2kMore }} ▾</button>
            <div v-if="filterMoreOpen" class="win filter-menu" role="menu">
              <button
                v-for="item in overflowFilterOptions"
                :key="item.code"
                type="button"
                class="filter-menu-item"
                role="menuitem"
                :class="{ active: currentFilter === item.code }"
                @click="setFilter(item.code)"
              >
                <RegionFlag v-if="item.code !== 'unknown'" :region="item.code" />
                <span class="filter-menu-label">{{ item.label }}</span>
                <span>{{ item.count }}</span>
              </button>
            </div>
          </div>
        </div>
        <div ref="filterMeasure" class="tabs filter-measure" aria-hidden="true">
          <span ref="filterAllMeasure" class="tab">{{ trans.w2kAll }} <span class="tab-count">{{ servers.length }}</span></span>
          <span v-for="item in filterOptionEntries" :key="item.code" class="tab filter-measure-tag">
            <span v-if="item.code !== 'unknown'" class="flag-fallback"></span>
            <span>{{ item.label }}</span>
            <span class="tab-count">{{ item.count }}</span>
          </span>
          <span ref="filterMoreMeasure" class="tab">{{ trans.w2kMore }} ▾</span>
        </div>

        <section class="tab-panel dashboard-panel">
          <div class="stats-grid">
            <fieldset class="groupbox stat-box">
              <legend>{{ trans.servers }}</legend>
              <b class="text-online">{{ trans.online }} {{ stats.online }}</b> |
              <b class="text-offline">{{ trans.offline }} {{ stats.offline }}</b>
            </fieldset>
            <fieldset class="groupbox stat-box">
              <legend>{{ trans.totalTraffic }}</legend>
              <span class="num">▼ {{ formatBytes(stats.globalNetRx) }} | ▲ {{ formatBytes(stats.globalNetTx) }}</span>
            </fieldset>
            <fieldset class="groupbox stat-box">
              <legend>{{ trans.realtimeSpeed }}</legend>
              <span class="num"><span class="net-down">▼ {{ formatBytes(stats.globalSpeedIn) }}/s</span> | <span class="net-up">▲ {{ formatBytes(stats.globalSpeedOut) }}/s</span></span>
            </fieldset>
            <fieldset v-if="sysConfig.show_price" class="groupbox stat-box">
              <legend>{{ trans.remainingValue }}</legend>
              <button type="button" class="link-btn" @click="financeModalOpen = true">
                <span class="num">{{ formattedRemainingValue.symbol }}{{ formattedRemainingValue.value }} {{ formattedRemainingValue.currency }}</span>
                <span class="link-text">{{ trans.w2kDetails }}</span>
              </button>
            </fieldset>
          </div>

          <div v-if="isCardView">
            <p v-if="groupedServers.length === 0" class="empty-state">
              {{ trans.noServer }} <a :href="adminUrl">{{ trans.backToAdmin }}</a> {{ trans.w2kAddServerSuffix }}
            </p>
            <fieldset v-for="group in groupedServers" :key="group.name" class="groupbox server-group">
              <legend><b>{{ group.name }}</b> [{{ group.servers.length }}]</legend>
              <div class="servers-grid" :class="{ 'ring-grid': currentView === 'ring' }">
                <component
                  :is="currentCardComponent"
                  v-for="server in group.servers"
                  :key="server.id + '-' + currentView"
                  :server="server"
                  :sys-config="sysConfig"
                  :to="getServerLink(server)"
                />
              </div>
            </fieldset>
          </div>

          <div v-if="currentView === 'table'" class="sunken table-scroll">
            <table class="listview">
              <thead>
                <tr>
                  <th class="col-status"><span class="col-head"></span></th>
                  <th><span class="col-head">{{ trans.hostname }}</span></th>
                  <th><span class="col-head">{{ trans.region }}</span></th>
                  <th><span class="col-head">{{ trans.osArch }}</span></th>
                  <th><span class="col-head">{{ trans.cpu }}</span></th>
                  <th><span class="col-head">{{ trans.ram }}</span></th>
                  <th><span class="col-head">{{ trans.disk }}</span></th>
                  <th><span class="col-head">{{ trans.use }}</span></th>
                  <th><span class="col-head">TCP/UDP</span></th>
                  <th><span class="col-head">{{ trans.dl }}</span></th>
                  <th><span class="col-head">{{ trans.ul }}</span></th>
                  <th><span class="col-head">{{ trans.update }}</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredServers.length === 0">
                  <td colspan="12" class="table-empty">{{ trans.noData }}</td>
                </tr>
                <tr
                  v-for="server in filteredServers"
                  :key="server.id"
                  :class="{ offline: !isServerOnline(server, now) }"
                  tabindex="0"
                  @click="goToServer(server)"
                  @keydown.enter="goToServer(server)"
                >
                  <td class="col-status"><span class="led" :class="{ on: isServerOnline(server, now) }"></span></td>
                  <td><b>{{ server.name }}</b></td>
                  <td><span class="cell-flex"><RegionFlag :region="server.region" />{{ (server.region || 'XX').toUpperCase() }}</span></td>
                  <td><span class="cell-flex"><OsIcon :os="server.os" />{{ formatSystemOs(server.os) }} / {{ server.arch || 'N/A' }}</span></td>
                  <td><span class="cell-meter"><SegProgress :value="usage(server, 'cpu')" />{{ usage(server, 'cpu').toFixed(1) }}%</span></td>
                  <td><span class="cell-meter"><SegProgress :value="usage(server, 'ram')" />{{ usage(server, 'ram').toFixed(1) }}%</span></td>
                  <td><span class="cell-meter"><SegProgress :value="usage(server, 'disk')" />{{ usage(server, 'disk').toFixed(1) }}%</span></td>
                  <td>
                    <span v-if="sysConfig.show_tf && server.traffic_limit" class="cell-meter"><SegProgress :value="calcTrafficUsagePercent(server)" />{{ calcTrafficUsagePercent(server).toFixed(1) }}%</span>
                    <span v-else>-</span>
                  </td>
                  <td class="num">{{ formatConnPair(server) }}</td>
                  <td class="num">{{ formatBytes(server.net_in_speed) }}/s</td>
                  <td class="num">{{ formatBytes(server.net_out_speed) }}/s</td>
                  <td>{{ getUpdateTime(server.last_updated) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-show="currentView === 'map'" class="sunken map-frame">
            <div ref="mapContainer" class="map-container"></div>
          </div>
        </section>

        <div v-if="sitesRemaining > 0" class="loading-more">
          <span>{{ trans.w2kLoadingRemaining }} ({{ sitesRemaining }})</span>
          <span class="progress progress-indeterminate"><span class="progress-fill"></span></span>
        </div>
      </template>
    </div>

    <WinDialog
      :show="!!hasCorsError"
      :title="trans.w2kError"
      icon="error"
      :close-label="trans.close"
      @close="hasCorsError = null"
    >
      <p v-for="site in hasCorsError || []" :key="site" class="dialog-line"><b>{{ site }}</b> {{ trans.corsBlocked }}</p>
      <p class="dialog-line">{{ trans.w2kCorsHint }}</p>
      <template #buttons>
        <button type="button" class="btn default" @click="hasCorsError = null">{{ trans.w2kOk }}</button>
      </template>
    </WinDialog>

    <WinDialog
      :show="!!loadErrorDialog"
      :title="trans.w2kLoadFailed"
      icon="error"
      :close-label="trans.close"
      @close="loadErrorDismissed = true"
    >
      <template v-if="loadErrorDialog">
        <p v-for="item in loadErrorDialog" :key="item.baseUrl" class="dialog-line">
          <b>{{ item.baseUrl }}</b> — HTTP {{ item.status || '-' }} {{ item.error }}
        </p>
        <p class="dialog-line">{{ getLoadErrorHint(trans, loadErrorDialog[0].status) }}</p>
      </template>
      <template #buttons>
        <button type="button" class="btn default" @click="retryLoad">{{ trans.w2kRetry }}</button>
        <button type="button" class="btn" @click="loadErrorDismissed = true">{{ trans.close }}</button>
      </template>
    </WinDialog>

    <WinDialog
      :show="financeModalOpen"
      :title="trans.remainingValue"
      width="520px"
      :close-label="trans.close"
      @close="financeModalOpen = false"
    >
      <div class="finance">
        <div class="finance-summary">
          <fieldset v-for="item in financeSummaryItems" :key="item.label" class="groupbox">
            <legend>{{ item.label }}</legend>
            <b class="finance-amount">{{ item.symbol }}{{ item.value }}</b>
          </fieldset>
        </div>
        <div class="finance-toolbar">
          <div>
            <div>{{ trans.todayExchangeRates }}</div>
            <div class="text-muted">{{ trans.exchangeRateSource }}: {{ financeRateSourceText }}</div>
          </div>
          <label class="finance-picker">
            <span>{{ trans.exchangeRateBase }}:</span>
            <select :value="financeCurrency" class="select" @change="setFinanceCurrency">
              <option v-for="currency in financeRateCurrencies" :key="currency" :value="currency">{{ currency }}</option>
            </select>
          </label>
        </div>
        <div class="sunken finance-rates">
          <div v-for="row in exchangeRateRows" :key="row.currency" class="finance-rate">
            <span>{{ row.currency }}</span>
            <b class="num">{{ row.targetSymbol }}{{ row.rate }}</b>
          </div>
        </div>
        <div class="text-muted finance-meta">
          {{ trans.configuredPrices }}: {{ financeSummary.configuredCount }} ·
          {{ trans.expired }}: {{ financeSummary.expiredCount }} ·
          {{ trans.financeMissingExpire }}: {{ financeSummary.missingExpireCount }}
        </div>
      </div>
      <template #buttons>
        <button type="button" class="btn default" @click="financeModalOpen = false">{{ trans.w2kOk }}</button>
      </template>
    </WinDialog>

    <LiveTimeoutDialog
      :show="showLiveTimeoutModal"
      :trans="trans"
      @close="closeLiveConnection"
      @continue="continueLiveConnection"
    />
  </div>
</template>

<script setup>
// 数据与实时逻辑移植自 CF-Server-Monitor 默认主题 Dashboard.vue（MIT License, https://github.com/huilang-me/CF-Server-Monitor）
import { ref, computed, inject, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import WinIcon from '../components/WinIcon.vue'
import WinDialog from '../components/WinDialog.vue'
import ServerCard from '../components/ServerCard.vue'
import ServerRingCard from '../components/ServerRingCard.vue'
import SegProgress from '../components/SegProgress.vue'
import OsIcon from '../components/OsIcon.vue'
import RegionFlag from '../components/RegionFlag.vue'
import LiveTimeoutDialog from '../components/LiveTimeoutDialog.vue'
import { fetchConfig, fetchServersAll, fetchServersAllWithProgress, formatBytes, createLiveSocket, getFlagRegionCode, getApiBases, isServerOnline, normalizeLiveSocketTimeoutMinutes } from '../utils/api.js'
import { calcTrafficUsagePercent } from '../composables/useServerCardData'
import { getAdminUrl, getTitle, hasMultipleApiBases } from '../utils/config'
import { currentLang, useTranslation } from '../utils/i18n.js'
import { TIME, DEFAULT_SITE_TITLE, STORAGE, LATENCY_WINDOW } from '../utils/constants'
import { normalizeTimestamp as normalizeMetricTimestamp } from '../utils/time.js'
import { normalizeDashboardView, normalizeDisplayMode, resolveDisplayMode } from '../utils/displayMode.js'
import { getPlaybackElapsedMs, resolvePlaybackCursor } from '../utils/playback.js'
import { normalizeThemeOptions } from '../utils/themeOptions.js'
import { getLoadErrorHint } from '../utils/themeTexts.js'
import { setWindowStatus, setWindowTitle } from '../utils/windowState'
import {
  CURRENCY_SYMBOLS,
  DEFAULT_EXCHANGE_RATES,
  DISPLAY_FINANCE_CURRENCIES,
  calculateFinanceSummary,
  convertCnyAmount,
  formatFinanceAmount,
  getDailyExchangeRates,
  getStoredFinanceCurrency,
  normalizeFinanceCurrency,
  setStoredFinanceCurrency
} from '../utils/finance.js'

const servers = ref([])
const stats = ref({ total: '-', online: 0, offline: 0, globalNetRx: 0, globalNetTx: 0, globalSpeedIn: 0, globalSpeedOut: 0 })
const unknownStats = ref(0)
const appConfig = inject('appConfig', null)
const sysConfig = ref({
  show_price: true,
  show_expire: true,
  show_tf: true,
  show_three_net_details: true,
  custom_ct_name: appConfig?.custom_ct_name || '电信',
  custom_cu_name: appConfig?.custom_cu_name || '联通',
  custom_cm_name: appConfig?.custom_cm_name || '移动',
  custom_bd_name: appConfig?.custom_bd_name || 'BGP',
  frontend_ws_timeout_minutes: normalizeLiveSocketTimeoutMinutes(appConfig?.frontend_ws_timeout_minutes),
  display_mode: 'bar',
  site_title: DEFAULT_SITE_TITLE,
  theme_options: normalizeThemeOptions(appConfig?.theme_options),
  latency_window: appConfig?.latency_window || {
    points: LATENCY_WINDOW.POINTS,
    hours: LATENCY_WINDOW.HOURS
  }
})
const regionStats = ref({})
const currentView = ref('bar')
const currentFilter = ref('all')
const filterWrap = ref(null)
const filterMeasure = ref(null)
const filterAllMeasure = ref(null)
const filterMoreMeasure = ref(null)
const filterVisibleCount = ref(Number.POSITIVE_INFINITY)
const filterMoreOpen = ref(false)
const mapContainer = ref(null)
const mapInitialized = ref(false)
const liveConnected = ref(false)
const isLoading = ref(true)
const sitesRemaining = ref(0)
const hasCorsError = ref(null)
const loadErrors = ref([])
const loadErrorDismissed = ref(false)
const financeModalOpen = ref(false)
const showLiveTimeoutModal = ref(false)
const financeCurrency = ref('CNY')
const exchangeRates = ref(DEFAULT_EXCHANGE_RATES)
const exchangeRateSource = ref('default')
const now = ref(Date.now())
const router = useRouter()

const trans = useTranslation()
const financeRateCurrencies = DISPLAY_FINANCE_CURRENCIES
const adminUrl = computed(() => getAdminUrl(0))

const viewButtons = computed(() => [
  { view: 'bar', icon: 'cards', label: trans.value.w2kViewCards },
  { view: 'ring', icon: 'ring', label: trans.value.w2kViewRing },
  { view: 'table', icon: 'table', label: trans.value.w2kViewTable },
  { view: 'map', icon: 'map', label: trans.value.w2kViewMap }
])

// 所有站点都失败时直接展示错误原因；401 由「需要登录」对话框处理
const loadErrorDialog = computed(() => {
  if (isLoading.value || loadErrorDismissed.value) return null
  if (servers.value.length > 0 || loadErrors.value.length === 0) return null
  const errors = loadErrors.value.filter(item => item.status !== 401 && !item.corsError)
  return errors.length > 0 ? errors : null
})

const financeSummary = computed(() => calculateFinanceSummary(servers.value, exchangeRates.value, now.value))
const formattedRemainingValue = computed(() => formatFinanceMetric(financeSummary.value.remainingValueCNY))
const formattedTotalValue = computed(() => formatFinanceMetric(financeSummary.value.totalValueCNY))
const formattedMonthlyAverageCost = computed(() => formatFinanceMetric(financeSummary.value.monthlyAverageCostCNY))

const financeSummaryItems = computed(() => [
  { label: trans.value.totalValue, symbol: formattedTotalValue.value.symbol, value: formattedTotalValue.value.value },
  { label: trans.value.remainingValue, symbol: formattedRemainingValue.value.symbol, value: formattedRemainingValue.value.value },
  { label: trans.value.monthlyAverageCost, symbol: formattedMonthlyAverageCost.value.symbol, value: formattedMonthlyAverageCost.value.value }
])

const exchangeRateRows = computed(() => {
  const baseRate = exchangeRates.value[financeCurrency.value] || DEFAULT_EXCHANGE_RATES[financeCurrency.value] || 1
  return financeRateCurrencies.map(currency => {
    const targetRate = exchangeRates.value[currency] || DEFAULT_EXCHANGE_RATES[currency] || 1
    return {
      currency,
      targetSymbol: CURRENCY_SYMBOLS[currency] || '',
      rate: new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 6, minimumFractionDigits: 6 }).format(targetRate / baseRate)
    }
  })
})

const financeRateSourceText = computed(() => {
  const sourceText = {
    network: trans.value.financeRateNetwork,
    cache: trans.value.financeRateCache,
    'stale-cache': trans.value.financeRateStaleCache,
    default: trans.value.financeRateDefault
  }
  return sourceText[exchangeRateSource.value] || sourceText.default
})

const formatFinanceMetric = (amountCNY) => {
  return formatFinanceAmount(convertCnyAmount(amountCNY, financeCurrency.value, exchangeRates.value), financeCurrency.value)
}

const setFinanceCurrency = (event) => {
  const currency = normalizeFinanceCurrency(event?.target?.value)
  financeCurrency.value = currency
  setStoredFinanceCurrency(currency)
}

const loadFinanceRates = async () => {
  try {
    const { rates, source } = await getDailyExchangeRates()
    exchangeRates.value = rates
    exchangeRateSource.value = source
  } catch (e) {
    console.log('[INFO] Finance rates fallback:', e)
    exchangeRates.value = DEFAULT_EXCHANGE_RATES
    exchangeRateSource.value = 'default'
  }
}

const filterOptions = computed(() => {
  const normalizedStats = {}
  for (const code in regionStats.value) {
    const lower = code.toLowerCase()
    if (lower === 'xx') continue
    normalizedStats[lower] = regionStats.value[code]
  }
  const sorted = Object.entries(normalizedStats).sort(([codeA, countA], [codeB, countB]) => {
    if (countB !== countA) return countB - countA
    return codeA.localeCompare(codeB)
  })
  const opts = Object.fromEntries(sorted)
  if (unknownStats.value > 0) opts.unknown = unknownStats.value
  return opts
})

const filterOptionEntries = computed(() => Object.entries(filterOptions.value).map(([code, count]) => ({
  code,
  count,
  label: code === 'unknown' ? trans.value.w2kUnknownRegion : code.toUpperCase(),
  flagCode: code !== 'unknown' ? getFlagRegionCode(code) : ''
})))

const visibleFilterOptions = computed(() => filterOptionEntries.value.slice(0, filterVisibleCount.value))
const overflowFilterOptions = computed(() => filterOptionEntries.value.slice(filterVisibleCount.value))
const isOverflowFilterActive = computed(() => overflowFilterOptions.value.some(item => item.code === currentFilter.value))

let filterResizeObserver = null
let filterMeasureTimer = null

const getFilterMaxRows = () => window.matchMedia('(max-width: 768px)').matches ? 2 : 1

const getWrappedRowCount = (widths, wrapWidth) => {
  if (widths.length === 0) return 0
  let rows = 1
  let rowWidth = 0
  for (const width of widths) {
    const nextWidth = rowWidth + width
    if (nextWidth <= wrapWidth || rowWidth === 0) {
      rowWidth = nextWidth
    } else {
      rows += 1
      rowWidth = width
    }
  }
  return rows
}

// 选项卡放不下时，把多余的地区收进「更多」下拉
const updateFilterVisibleCount = () => {
  const entries = filterOptionEntries.value
  const wrapEl = filterWrap.value
  const measureEl = filterMeasure.value
  if (!wrapEl || !measureEl || entries.length === 0) {
    filterVisibleCount.value = entries.length
    return
  }

  const wrapWidth = wrapEl.clientWidth - 4
  const itemEls = Array.from(measureEl.querySelectorAll('.filter-measure-tag'))
  if (wrapWidth <= 0 || itemEls.length === 0) return

  const allWidth = filterAllMeasure.value?.offsetWidth || 60
  const itemWidths = itemEls.map(el => el.offsetWidth)
  const maxRows = getFilterMaxRows()

  if (getWrappedRowCount([allWidth, ...itemWidths], wrapWidth) <= maxRows) {
    filterVisibleCount.value = entries.length
    filterMoreOpen.value = false
    return
  }

  const moreWidth = filterMoreMeasure.value?.offsetWidth || 70
  let visibleCount = 0
  for (let index = 0; index < itemWidths.length; index += 1) {
    const testWidths = [allWidth, ...itemWidths.slice(0, index + 1), moreWidth]
    if (getWrappedRowCount(testWidths, wrapWidth) > maxRows) break
    visibleCount = index + 1
  }
  filterVisibleCount.value = Math.max(0, Math.min(visibleCount, entries.length - 1))
}

const scheduleFilterMeasurement = () => {
  if (filterMeasureTimer) clearTimeout(filterMeasureTimer)
  filterMeasureTimer = setTimeout(async () => {
    filterMeasureTimer = null
    await nextTick()
    updateFilterVisibleCount()
  }, 0)
}

const toggleFilterMore = () => {
  filterMoreOpen.value = !filterMoreOpen.value
}

const closeFilterMoreOnOutsideClick = (event) => {
  if (!filterWrap.value?.contains(event.target)) filterMoreOpen.value = false
}

watch(
  () => filterOptionEntries.value.map(item => `${item.code}:${item.count}:${item.label}`).join('|') + servers.value.length,
  scheduleFilterMeasurement,
  { flush: 'post' }
)
watch(currentLang, scheduleFilterMeasurement, { flush: 'post' })

// 加载结束后选项卡才渲染，此时再挂上尺寸监听
watch(filterWrap, (el, oldEl) => {
  if (!filterResizeObserver && window.ResizeObserver) {
    filterResizeObserver = new ResizeObserver(scheduleFilterMeasurement)
  }
  if (filterResizeObserver) {
    if (oldEl) filterResizeObserver.unobserve(oldEl)
    if (el) filterResizeObserver.observe(el)
  }
  scheduleFilterMeasurement()
}, { flush: 'post' })

const filteredServers = computed(() => {
  if (currentFilter.value === 'all') return servers.value
  if (currentFilter.value === 'unknown') return servers.value.filter(s => !s.region)
  return servers.value.filter(s => (s.region || 'xx').toLowerCase() === currentFilter.value)
})

const groupedServers = computed(() => {
  const groups = {}
  const order = []
  filteredServers.value.forEach(server => {
    const groupName = server.server_group || 'Default'
    if (!groups[groupName]) {
      groups[groupName] = []
      order.push(groupName)
    }
    groups[groupName].push(server)
  })
  return order.map(name => ({ name, servers: groups[name] }))
})

const isCardView = computed(() => currentView.value === 'bar' || currentView.value === 'ring')
const currentCardComponent = computed(() => currentView.value === 'ring' ? ServerRingCard : ServerCard)

const switchView = (viewName) => {
  const normalizedView = normalizeDashboardView(viewName, sysConfig.value.display_mode)
  currentView.value = normalizedView
  localStorage.setItem(STORAGE.VIEW_PREFERENCE, normalizedView)
  if (normalizedView === 'map') {
    if (!mapInitialized.value) {
      mapInitialized.value = true
      nextTick(initMap)
    } else if (leafletMap) {
      setTimeout(() => leafletMap && leafletMap.invalidateSize(), 50)
    }
  }
}

const setFilter = (code) => {
  const nextFilter = code.toLowerCase()
  currentFilter.value = nextFilter !== 'all' && currentFilter.value === nextFilter ? 'all' : nextFilter
  filterMoreOpen.value = false
}

const usage = (server, kind) => {
  let value = 0
  if (kind === 'cpu') value = parseFloat(server.cpu) || 0
  if (kind === 'ram' && server.ram_total > 0) value = (server.ram_used / server.ram_total) * 100
  if (kind === 'disk' && server.disk_total > 0) value = (server.disk_used / server.disk_total) * 100
  return Number.isFinite(value) ? value : 0
}

const formatConnCount = (value) => {
  const number = Number.parseInt(value, 10)
  if (!Number.isFinite(number) || number < 0) return '0'
  return number.toLocaleString('en-US')
}

const formatConnPair = (server) => `${formatConnCount(server.tcp_conn)} / ${formatConnCount(server.udp_conn)}`

const formatSystemOs = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return 'N/A'
  return raw
    .replace(/\s+gnu\/linux(?=\s|$)/gi, '')
    .replace(/\s+linux(?=\s|$)/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || raw
}

const getUpdateTime = (lastUpdated) => {
  if (!lastUpdated) return '-'
  const date = new Date(lastUpdated)
  const diff = now.value - date.getTime()
  const zh = currentLang.value === 'zh'
  const fmt = (n, key) => zh ? `${n}${trans.value[key]}` : `${n} ${trans.value[key]}`
  if (diff < 1000) return fmt(0, 'secondsAgo')
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (seconds < 60) return fmt(seconds, 'secondsAgo')
  if (minutes < 60) return fmt(minutes, 'minutesAgo')
  if (hours < 24) return fmt(hours, 'hoursAgo')
  if (days < 30) return fmt(days, 'daysAgo')
  return date.toLocaleString(undefined, { hour12: false })
}

const PLAYBACK_TICK_MS = 1000
const MAX_BUFFER_SAMPLES_PER_SERVER = 600
const playbackBuffers = new Map()

const getServerReportTimestamp = (server, fallback = null) => {
  return normalizeMetricTimestamp(server?.report_timestamp ?? server?.last_updated, fallback)
}

const getServerSampleTimestamp = (server) => {
  return normalizeMetricTimestamp(server?.sample_timestamp ?? server?.timestamp ?? server?.last_updated, null)
}

const getServerDisplayTimestamp = (server) => {
  return normalizeMetricTimestamp(server?.display_timestamp, null)
}

const withDisplayTiming = (server, displayTs = null, currentTs = Date.now()) => {
  const reportTs = getServerReportTimestamp(server, null)
  const sampleTs = getServerSampleTimestamp(server) || displayTs || reportTs
  const ownTs = normalizeMetricTimestamp(displayTs, getServerDisplayTimestamp(server) || sampleTs || reportTs)
  const timed = {
    ...server,
    current_timestamp: currentTs
  }
  if (reportTs) {
    timed.report_timestamp = reportTs
    timed.last_updated = reportTs
  }
  if (!sampleTs || !ownTs) return timed
  return {
    ...timed,
    sample_timestamp: sampleTs,
    display_timestamp: ownTs,
    sample_lag_seconds: Math.max(0, Math.floor((ownTs - sampleTs) / 1000))
  }
}

const toLiveSample = (serverId, data, timestamp, reportTs) => {
  if (!serverId || !data) return
  const ts = normalizeMetricTimestamp(timestamp ?? data.sample_timestamp ?? data.last_updated ?? data.timestamp, null)
  if (!ts) return null
  return {
    serverId,
    ts,
    data,
    reportTs
  }
}

const queueLiveSamples = (serverId, samples, reportTs, { replayCachedReport = false, reportAgeMs = 0 } = {}) => {
  if (!serverId || !Array.isArray(samples) || samples.length === 0) return

  const normalized = samples
    .map(sample => toLiveSample(serverId, sample.data, sample.ts, reportTs))
    .filter(Boolean)
    .sort((a, b) => a.ts - b.ts)

  if (normalized.length === 0) return

  const current = servers.value.find(s => s.id === serverId)
  const currentTs = getServerSampleTimestamp(current)
  const currentDisplayTs = getServerDisplayTimestamp(current)
  const incoming = replayCachedReport
    ? normalized
    : normalized.filter(sample => !currentTs || sample.ts > currentTs)
  if (incoming.length === 0) return

  const playbackStartTs = resolvePlaybackCursor(incoming[0].ts, currentDisplayTs, {
    replayCachedReport,
    reportAgeMs
  })
  if (playbackStartTs === null) return

  if (incoming.length === 1) {
    playbackBuffers.delete(serverId)
    const sample = incoming[0]
    applyServerSample(serverId, sample.data, sample.ts, playbackStartTs, reportTs)
    return
  }

  const unique = []
  const seen = new Set()
  for (const sample of incoming) {
    if (seen.has(sample.ts)) continue
    seen.add(sample.ts)
    unique.push(sample)
  }
  playbackBuffers.set(serverId, unique.slice(-MAX_BUFFER_SAMPLES_PER_SERVER))
  applyPlaybackSamplesForServer(serverId, playbackStartTs)
}

const queueLiveMessage = (msg, { replayCachedReport = false } = {}) => {
  if (!msg || msg.type !== 'batchUpdate') return

  const messageReportTs = normalizeMetricTimestamp(msg.ts, Date.now())

  const updates = Array.isArray(msg.updates) ? msg.updates : []

  for (const update of updates) {
    if (!update || !update.serverId) continue
    const samples = Array.isArray(update.samples) ? update.samples : []
    const reportTs = normalizeMetricTimestamp(update.reportTs ?? update.report_timestamp, messageReportTs)
    const reportAgeMs = replayCachedReport ? update.reportAgeMs : 0

    const liveSamples = []
    for (const sample of samples) {
      if (!sample || typeof sample !== 'object') continue
      const data = sample.data || sample.payload || sample.metrics
      if (!data) continue
      liveSamples.push({
        ts: sample.ts ?? sample.timestamp ?? data.sample_timestamp ?? data.last_updated ?? data.timestamp ?? update.ts ?? msg.ts,
        data
      })
    }
    queueLiveSamples(update.serverId, liveSamples, reportTs, { replayCachedReport, reportAgeMs })
  }
}

const replayLatestReportUpdates = (data) => {
  const updates = Array.isArray(data?.latestReportUpdates) ? data.latestReportUpdates : []
  if (updates.length === 0) return
  queueLiveMessage({ type: 'batchUpdate', ts: Date.now(), updates }, { replayCachedReport: true })
}

const applyServerSample = (serverId, data, sampleTs, displayTs, reportTs = null) => {
  if (!serverId || !data) return
  const idx = servers.value.findIndex(s => s.id === serverId)
  const existing = idx >= 0 ? servers.value[idx] : null
  const currentReportTs = getServerReportTimestamp(existing, null)
  const nextReportTs = normalizeMetricTimestamp(reportTs, currentReportTs || now.value)
  const merged = withDisplayTiming({
    ...data,
    id: serverId,
    report_timestamp: nextReportTs,
    last_updated: nextReportTs,
    sample_timestamp: sampleTs,
    timestamp: sampleTs
  }, displayTs, now.value)

  if (idx >= 0) {
    servers.value[idx] = { ...servers.value[idx], ...merged }
  } else {
    servers.value.push({ ...merged, name: serverId })
  }
}

const applyPlaybackSamplesForServer = (serverId, displayTs = null) => {
  const samples = playbackBuffers.get(serverId)
  if (!samples || samples.length === 0) return
  const server = servers.value.find(s => s.id === serverId)
  const ownTs = normalizeMetricTimestamp(displayTs, getServerDisplayTimestamp(server))
  if (!ownTs) return

  let selected = null
  while (samples.length > 0 && samples[0].ts <= ownTs) {
    selected = samples.shift()
  }
  if (selected) {
    applyServerSample(serverId, selected.data, selected.ts, ownTs, selected.reportTs)
  }
  if (samples.length === 0) playbackBuffers.delete(serverId)
}

const applyPlaybackSamples = () => {
  for (const serverId of Array.from(playbackBuffers.keys())) {
    applyPlaybackSamplesForServer(serverId)
  }
}

const advanceServerClocks = () => {
  const currentTs = now.value
  servers.value = servers.value.map(server => {
    const reportTs = getServerReportTimestamp(server, null)
    const isOnline = reportTs && (currentTs - reportTs) < TIME.ONLINE_THRESHOLD_MS
    const currentDisplayTs = getServerDisplayTimestamp(server) || getServerSampleTimestamp(server) || reportTs
    const elapsedMs = getPlaybackElapsedMs(currentTs, server.current_timestamp, PLAYBACK_TICK_MS)
    const nextDisplayTs = isOnline && currentDisplayTs ? currentDisplayTs + elapsedMs : currentDisplayTs
    return withDisplayTiming(server, nextDisplayTs, currentTs)
  })
  applyPlaybackSamples()
}

const recomputeStats = (currentTs = Date.now()) => {
  const list = servers.value || []
  let online = 0
  let speedIn = 0, speedOut = 0, netRx = 0, netTx = 0
  const regionCounts = {}
  let unknownCount = 0
  for (const s of list) {
    const ts = new Date(s.last_updated || 0).getTime()
    const isOnline = ts && (currentTs - ts) < TIME.ONLINE_THRESHOLD_MS
    if (isOnline) {
      online++
      speedIn += parseFloat(s.net_in_speed) || 0
      speedOut += parseFloat(s.net_out_speed) || 0
    }
    netRx += parseFloat(s.net_rx) || 0
    netTx += parseFloat(s.net_tx) || 0
    if (s.region) {
      const key = String(s.region).toUpperCase()
      regionCounts[key] = (regionCounts[key] || 0) + 1
    } else {
      unknownCount++
    }
  }
  stats.value = {
    total: list.length,
    online,
    offline: list.length - online,
    globalNetRx: netRx,
    globalNetTx: netTx,
    globalSpeedIn: speedIn,
    globalSpeedOut: speedOut
  }
  regionStats.value = regionCounts
  unknownStats.value = unknownCount
}

const runDashboardTick = () => {
  now.value = Date.now()
  advanceServerClocks()
  recomputeStats(now.value)
  if (currentView.value === 'map') drawMarkers()
}

const mergeServersIntoList = (rawServers) => {
  const existingById = new Map(servers.value.map(s => [s.id, s]))
  return rawServers.map(s => {
    const prev = existingById.get(s.id)
    const sampleTs = normalizeMetricTimestamp(s.sample_timestamp ?? s.timestamp ?? s.last_updated, getServerSampleTimestamp(prev))
    const reportTs = normalizeMetricTimestamp(s.report_timestamp ?? s.last_updated, getServerReportTimestamp(prev, null))
    return withDisplayTiming({ ...prev, ...s, sample_timestamp: sampleTs, report_timestamp: reportTs }, sampleTs, now.value)
  })
}

const loadDashboardConfig = async () => {
  try {
    const localTitle = String(getTitle() || '').trim()
    const config = appConfig || await fetchConfig()
    const siteTitle = String(config?.site_title || '').trim()
    sysConfig.value = {
      ...sysConfig.value,
      site_title: hasMultipleApiBases() && localTitle ? localTitle : (siteTitle || sysConfig.value.site_title),
      display_mode: resolveDisplayMode(config),
      frontend_ws_timeout_minutes: normalizeLiveSocketTimeoutMinutes(config?.frontend_ws_timeout_minutes),
      theme_options: normalizeThemeOptions(config?.theme_options),
      latency_window: config?.latency_window || sysConfig.value.latency_window
    }
  } catch (e) {
    console.log('[INFO] Dashboard config pending...', e)
  }
}

const refreshData = async () => {
  const bases = getApiBases()
  const isMultiSite = bases.length > 1
  playbackBuffers.clear()

  if (isMultiSite) {
    sitesRemaining.value = bases.length
    hasCorsError.value = null

    try {
      const data = await fetchServersAllWithProgress((data) => {
        const rawServers = Array.isArray(data.servers)
          ? data.servers
          : Object.entries(data.latestMetricsMap || {}).map(([id, metrics]) => ({ id, ...metrics }))

        servers.value = mergeServersIntoList(rawServers)
        recomputeStats(now.value)

        sysConfig.value = {
          show_price: data.sysConfig?.show_price ?? true,
          show_expire: data.sysConfig?.show_expire ?? true,
          show_tf: data.sysConfig?.show_tf ?? true,
          show_three_net_details: data.sysConfig?.show_three_net_details ?? false,
          custom_ct_name: data.sysConfig?.custom_ct_name || sysConfig.value.custom_ct_name,
          custom_cu_name: data.sysConfig?.custom_cu_name || sysConfig.value.custom_cu_name,
          custom_cm_name: data.sysConfig?.custom_cm_name || sysConfig.value.custom_cm_name,
          custom_bd_name: data.sysConfig?.custom_bd_name || sysConfig.value.custom_bd_name,
          frontend_ws_timeout_minutes: sysConfig.value.frontend_ws_timeout_minutes,
          display_mode: normalizeDisplayMode(data.sysConfig?.display_mode),
          site_title: sysConfig.value.site_title || DEFAULT_SITE_TITLE,
          theme_options: sysConfig.value.theme_options,
          latency_window: data.sysConfig?.latency_window || sysConfig.value.latency_window
        }

        loadErrors.value = data.errors || []
        if (data.corsErrorSites?.length && !hasCorsError.value) hasCorsError.value = [...data.corsErrorSites]
        if (isLoading.value) isLoading.value = false
        drawMarkers()
        sitesRemaining.value = Math.max(0, sitesRemaining.value - 1)
      })
      replayLatestReportUpdates(data)
    } catch (e) {
      console.log('[INFO] Multi-site refresh error:', e)
    }

    isLoading.value = false
    return
  }

  // Single-site fallback
  try {
    const data = await fetchServersAll()
    if (!data) return
    loadErrors.value = data.errors || []

    const rawServers = Array.isArray(data.servers)
      ? data.servers
      : Object.entries(data.latestMetricsMap || {}).map(([id, metrics]) => ({ id, ...metrics }))

    servers.value = mergeServersIntoList(rawServers)
    replayLatestReportUpdates(data)
    recomputeStats(now.value)

    sysConfig.value = {
      show_price: data.sysConfig?.show_price ?? true,
      show_expire: data.sysConfig?.show_expire ?? true,
      show_tf: data.sysConfig?.show_tf ?? true,
      show_three_net_details: data.sysConfig?.show_three_net_details ?? false,
      custom_ct_name: data.sysConfig?.custom_ct_name || sysConfig.value.custom_ct_name,
      custom_cu_name: data.sysConfig?.custom_cu_name || sysConfig.value.custom_cu_name,
      custom_cm_name: data.sysConfig?.custom_cm_name || sysConfig.value.custom_cm_name,
      custom_bd_name: data.sysConfig?.custom_bd_name || sysConfig.value.custom_bd_name,
      frontend_ws_timeout_minutes: sysConfig.value.frontend_ws_timeout_minutes,
      display_mode: normalizeDisplayMode(data.sysConfig?.display_mode),
      site_title: sysConfig.value.site_title || DEFAULT_SITE_TITLE,
      theme_options: sysConfig.value.theme_options,
      latency_window: data.sysConfig?.latency_window || sysConfig.value.latency_window
    }

    drawMarkers()
    isLoading.value = false
  } catch (e) {
    console.log('[INFO] Full refresh pending...', e)
    isLoading.value = false
  }
}

// -------------------------------------------------------------------------
// 实时推送：每个 apiBase 一条连接，只订阅该后端返回的服务器 ID
// -------------------------------------------------------------------------
let liveSockets = []
let liveConnectionClosedByUser = false
let themeObserver = null
let timeUpdateInterval = null

const stopLiveSockets = () => {
  if (liveSockets.length === 0) return
  liveSockets.forEach(socket => {
    if (socket) socket.close()
  })
  liveSockets = []
  liveConnected.value = false
}

const startLiveSocket = () => {
  if (typeof document !== 'undefined' && document.hidden) {
    stopLiveSockets()
    return
  }

  stopLiveSockets()
  const bases = getApiBases()

  const idsByIndex = new Map()
  for (const s of servers.value) {
    if (!s.id || !s.source) continue
    const idx = bases.indexOf(s.source)
    if (idx === -1) continue
    if (!idsByIndex.has(idx)) idsByIndex.set(idx, [])
    idsByIndex.get(idx).push(s.id)
  }

  if (bases.length === 0) {
    const allIds = servers.value.map(s => s.id).filter(Boolean)
    liveSockets = [createLiveSocket('all', {
      replay: false,
      timeoutMinutes: sysConfig.value.frontend_ws_timeout_minutes,
      onMessage: queueLiveMessage,
      onTimeout: () => {
        showLiveTimeoutModal.value = true
      },
      onStatus: ({ connected }) => {
        liveConnected.value = !!connected
      }
    }, 0, allIds)]
    return
  }

  liveSockets = bases.map((_, index) => {
    const ids = idsByIndex.get(index)
    if (!ids || ids.length === 0) return null
    return createLiveSocket('all', {
      replay: false,
      timeoutMinutes: sysConfig.value.frontend_ws_timeout_minutes,
      onMessage: queueLiveMessage,
      onTimeout: () => {
        showLiveTimeoutModal.value = true
      },
      onStatus: () => {
        liveConnected.value = liveSockets.some(s => s && s.isConnected)
      }
    }, index, ids)
  }).filter(Boolean)
}

const closeLiveConnection = () => {
  showLiveTimeoutModal.value = false
  liveConnectionClosedByUser = true
  stopLiveSockets()
}

const continueLiveConnection = () => {
  showLiveTimeoutModal.value = false
  liveConnectionClosedByUser = false
  if (liveSockets.length === 0) {
    startLiveSocket()
    return
  }
  liveSockets.forEach(socket => socket?.reconnect())
}

const handleVisibility = async () => {
  if (document.hidden) {
    stopLiveSockets()
  } else if (showLiveTimeoutModal.value || liveConnectionClosedByUser) {
    return
  } else {
    // 重新可见时先补一次 REST 数据，再恢复实时订阅
    await refreshData()
    startLiveSocket()
  }
}

const retryLoad = async () => {
  loadErrorDismissed.value = false
  loadErrors.value = []
  isLoading.value = true
  await refreshData()
  if (!liveConnectionClosedByUser) startLiveSocket()
}

// -------------------------------------------------------------------------
// 地图视图（Leaflet，按需加载）
// -------------------------------------------------------------------------
const regionCoords = {
  'US': [37.09, -95.71], 'CN': [35.86, 104.19], 'JP': [36.20, 138.25], 'HK': [22.31, 114.16],
  'SG': [1.35, 103.81], 'KR': [35.90, 127.76], 'DE': [51.16, 10.45], 'GB': [55.37, -3.43],
  'NL': [52.13, 5.29], 'FR': [46.22, 2.21], 'CA': [56.13, -106.34], 'AU': [-25.27, 133.77],
  'IN': [20.59, 78.96], 'BR': [-14.23, -51.92], 'RU': [61.52, 105.31], 'ZA': [-30.55, 22.93],
  'TW': [23.69, 120.96], 'IT': [41.87, 12.56], 'SE': [60.12, 18.64], 'CH': [46.81, 8.22],
  'ES': [40.46, -3.74], 'PL': [51.91, 19.14], 'FI': [61.92, 25.74], 'NO': [60.47, 8.46],
  'DK': [56.26, 9.50], 'IE': [53.14, -7.69], 'AT': [47.51, 14.55], 'TR': [38.96, 35.24],
  'AE': [23.42, 53.84], 'MY': [4.21, 101.97], 'TH': [15.87, 100.99], 'VN': [14.05, 108.27],
  'PH': [12.87, 121.77], 'ID': [-0.78, 113.92]
}

let L = null
let leafletMap = null
let worldGeoJson = null
let markersLayer = null
let geoJsonLayer = null
let currentMapDataStr = ''

const isMobile = () => window.innerWidth < 768

const initMap = async () => {
  try {
    const [leafletModule, geoModule] = await Promise.all([
      import('leaflet'),
      import('../assets/world.zh.json'),
      import('leaflet/dist/leaflet.css')
    ])
    L = leafletModule.default || leafletModule
    worldGeoJson = geoModule.default || geoModule
    if (!mapContainer.value) return
    const mobileView = isMobile()
    leafletMap = L.map(mapContainer.value, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 1
    }).setView(mobileView ? [35, 105] : [30, 10], mobileView ? 1 : 2)
    L.control.zoom({ position: 'bottomright' }).addTo(leafletMap)
    currentMapDataStr = ''
    drawMarkers()
  } catch (e) {
    console.error('[ERROR] Map load failed', e)
  }
}

const getCss = (name, fallback) => {
  const value = window.getComputedStyle(document.body).getPropertyValue(name).trim()
  return value || fallback
}

const drawMarkers = () => {
  if (!leafletMap || !worldGeoJson || !L) return

  const newDataStr = JSON.stringify(regionStats.value) + document.body.className
  if (currentMapDataStr === newDataStr) return
  currentMapDataStr = newDataStr

  if (geoJsonLayer) leafletMap.removeLayer(geoJsonLayer)
  if (markersLayer) markersLayer.clearLayers()
  else markersLayer = L.layerGroup().addTo(leafletMap)

  const colors = {
    active: getCss('--bar', '#0a246a'),
    land: getCss('--face', '#d4d0c8'),
    border: getCss('--shadow', '#808080')
  }

  const activeIso2 = {}
  for (const code in regionStats.value) {
    const upperCode = code.toUpperCase()
    activeIso2[upperCode] = true
    if (upperCode === 'HK' || upperCode === 'TW' || upperCode === 'MO') activeIso2.CN = true
  }

  geoJsonLayer = L.geoJSON(worldGeoJson, {
    style: (feature) => {
      const isActive = activeIso2[feature.properties.iso_a2]
      return {
        fillColor: isActive ? colors.active : colors.land,
        weight: 1,
        opacity: 1,
        color: colors.border,
        fillOpacity: isActive ? 0.75 : 1
      }
    }
  }).addTo(leafletMap)

  for (const [code, count] of Object.entries(regionStats.value)) {
    const upperCode = code.toUpperCase()
    if (!regionCoords[upperCode]) continue
    const icon = L.divIcon({
      className: 'map-marker',
      html: `<span class="map-marker-box" title="${upperCode}: ${count}">${count}</span>`,
      iconSize: [22, 18]
    })
    L.marker(regionCoords[upperCode], { icon, title: `${upperCode}: ${count}` }).addTo(markersLayer)
  }
}

const getServerLink = (server) => {
  const bases = getApiBases()
  if (bases.length === 0) return `/server/${server.id}`
  const apiIndex = bases.indexOf(server.source)
  if (apiIndex === -1 || apiIndex === 0) return `/server/${server.id}`
  return `/server/${server.id}?apiIndex=${apiIndex}`
}

const goToServer = (server) => {
  router.push(getServerLink(server))
}

// 标题栏与状态栏
watch(() => sysConfig.value.site_title, (title) => {
  setWindowTitle(title || DEFAULT_SITE_TITLE)
}, { immediate: true })

watch([() => stats.value.total, () => stats.value.online, liveConnected, isLoading, currentLang], () => {
  if (isLoading.value) {
    setWindowStatus(trans.value.w2kLoadingSites)
    return
  }
  const count = `${servers.value.length} ${trans.value.w2kServerCount}`
  const live = liveConnected.value ? trans.value.w2kLiveOn : trans.value.w2kLiveOff
  setWindowStatus(`${count} · ${trans.value.online} ${stats.value.online} · ${live}`)
}, { immediate: true })

onMounted(async () => {
  financeCurrency.value = getStoredFinanceCurrency()
  loadFinanceRates()

  await loadDashboardConfig()
  const rawSavedView = localStorage.getItem(STORAGE.VIEW_PREFERENCE)
  const savedView = normalizeDashboardView(rawSavedView, sysConfig.value.display_mode)
  currentView.value = savedView
  if (rawSavedView && rawSavedView !== savedView) {
    localStorage.setItem(STORAGE.VIEW_PREFERENCE, savedView)
  }
  await refreshData()
  await nextTick()
  if (!window.ResizeObserver) window.addEventListener('resize', scheduleFilterMeasurement)
  document.addEventListener('click', closeFilterMoreOnOutsideClick)
  startLiveSocket()
  document.addEventListener('visibilitychange', handleVisibility)

  runDashboardTick()
  timeUpdateInterval = setInterval(runDashboardTick, 1000)

  if (currentView.value === 'map') {
    mapInitialized.value = true
    nextTick(initMap)
  }

  // 明暗、风格切换都会改变 body 类名：地图重新取色，选项卡宽度也可能变化
  themeObserver = new MutationObserver(() => {
    scheduleFilterMeasurement()
    if (currentView.value === 'map') drawMarkers()
  })
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibility)
  document.removeEventListener('click', closeFilterMoreOnOutsideClick)
  window.removeEventListener('resize', scheduleFilterMeasurement)
  if (filterMeasureTimer) clearTimeout(filterMeasureTimer)
  if (filterResizeObserver) filterResizeObserver.disconnect()
  if (timeUpdateInterval) clearInterval(timeUpdateInterval)
  stopLiveSockets()
  if (themeObserver) themeObserver.disconnect()
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }
})
</script>
