<template>
  <div class="desktop">
    <div class="win app-window">
      <header class="title-bar">
        <WinIcon class="title-bar-icon" name="app" />
        <h1 class="title-bar-text">{{ windowState.title || siteTitle }}</h1>
        <button
          type="button"
          class="title-btn"
          :title="trans.w2kLanguage"
          :aria-label="trans.w2kLanguage"
          @click="toggleLanguage"
        >{{ currentLang === 'zh' ? 'EN' : '中' }}</button>
        <button
          type="button"
          class="title-btn"
          :title="themeLabel"
          :aria-label="themeLabel"
          @click="cycleTheme"
        >
          <WinIcon :name="themeIcon" :size="9" />
        </button>
        <a
          class="title-btn title-btn-last"
          :href="adminUrl"
          :title="trans.w2kAdmin"
          :aria-label="trans.w2kAdmin"
        >
          <WinIcon name="gear" :size="9" />
        </a>
      </header>

      <main class="app-body">
        <router-view />
      </main>

      <footer class="status-bar">
        <div class="status-field grow">{{ windowState.status }}</div>
        <div class="status-field tooltip-anchor" :tabindex="hasWorkersUpdate ? 0 : undefined">
          <span>V{{ version || '-' }}</span>
          <span v-if="hasWorkersUpdate" class="update-dot" aria-hidden="true"></span>
          <span v-if="hasWorkersUpdate" class="tooltip-box" role="tooltip">{{ trans.w2kUpdateAvailable }} V{{ latestWorkersVersion }}</span>
        </div>
        <div class="status-field">
          Powered by&nbsp;<a href="https://github.com/huilang-me/CF-Server-Monitor/" target="_blank" rel="noopener">CF-Server-Monitor</a>
        </div>
      </footer>
    </div>

    <WinDialog
      :show="windowState.authRequired"
      :title="trans.w2kLoginTitle"
      icon="info"
      :close-label="trans.close"
      @close="windowState.authRequired = false"
    >
      {{ trans.w2kLoginPrivate }}
      <template #buttons>
        <a class="btn default btn-link" :href="authAdminUrl">{{ trans.login }}</a>
        <button type="button" class="btn" @click="windowState.authRequired = false">{{ trans.cancel }}</button>
      </template>
    </WinDialog>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, onUnmounted } from 'vue'
import WinIcon from './components/WinIcon.vue'
import WinDialog from './components/WinDialog.vue'
import { useTheme } from './composables/useTheme'
import { currentLang, toggleLanguage, useTranslation } from './utils/i18n'
import { LAST_WORKERS_VERSION, VERSION } from './utils/api'
import { getAdminUrl, getApiBases, getTitle, hasMultipleApiBases } from './utils/config'
import { DEFAULT_SITE_TITLE } from './utils/constants'
import { windowState } from './utils/windowState'

const appConfig = inject('appConfig', {})
const trans = useTranslation()
const { currentTheme, setTheme, initTheme } = useTheme()
initTheme()

const siteTitle = computed(() => {
  const localTitle = String(getTitle() || '').trim()
  if (hasMultipleApiBases() && localTitle) return localTitle
  return String(appConfig?.site_title || '').trim() || localTitle || DEFAULT_SITE_TITLE
})

const version = computed(() => String(VERSION.value || '').trim())
const latestWorkersVersion = computed(() => String(LAST_WORKERS_VERSION.value || '').trim())
const hasWorkersUpdate = computed(() => !!(latestWorkersVersion.value && version.value && latestWorkersVersion.value !== version.value))

const THEME_ORDER = ['auto', 'dark', 'light']
const themeIcon = computed(() => ({ auto: 'contrast', dark: 'moon', light: 'sun' })[currentTheme.value] || 'contrast')
const themeLabel = computed(() => ({
  auto: trans.value.w2kAppearanceAuto,
  dark: trans.value.w2kAppearanceDark,
  light: trans.value.w2kAppearanceLight
})[currentTheme.value] || trans.value.w2kAppearance)
const cycleTheme = () => {
  const index = THEME_ORDER.indexOf(currentTheme.value)
  setTheme(THEME_ORDER[(index + 1) % THEME_ORDER.length])
}

const adminUrl = computed(() => getAdminUrl(0))
const authAdminUrl = computed(() => getAdminUrl(windowState.authApiIndex || 0))

const handleAuthRequired = (event) => {
  const baseUrl = event?.detail?.baseUrl
  const index = baseUrl ? getApiBases().indexOf(baseUrl) : 0
  windowState.authApiIndex = index > 0 ? index : 0
  windowState.authRequired = true
}

onMounted(() => {
  window.addEventListener('cfsm-auth-required', handleAuthRequired)
})

onUnmounted(() => {
  window.removeEventListener('cfsm-auth-required', handleAuthRequired)
})
</script>
