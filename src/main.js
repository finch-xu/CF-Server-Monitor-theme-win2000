// 启动流程参考 CF-Server-Monitor 默认主题（MIT License, https://github.com/huilang-me/CF-Server-Monitor）
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/win2000.css'
import './styles/xp.css'
import './styles/win31.css'
import './styles/app.css'
import { applyDefaultLanguage, currentLang, translations } from './utils/i18n'
import './utils/themeTexts'
import { http } from './utils/http'
import { initConfig, hasMultipleApiBases } from './utils/config'
import { LAST_AGENT_VERSION, LAST_WORKERS_VERSION, VERSION, normalizeLiveSocketTimeoutMinutes } from './utils/api'
import { resolveDisplayMode } from './utils/displayMode'
import { normalizeThemeOptions } from './utils/themeOptions'
import { applyDefaultTheme } from './composables/useTheme'
import { applyDefaultStyle, applyStoredStyle } from './composables/useStyle'
import { windowState } from './utils/windowState'
import {
  clearTurnstileToken,
  fetchAllTurnstileConfigs,
  getTurnstileEnabledSites,
  hasTurnstileSiteKeyMismatch,
  isTurnstileValueEnabled,
  loadTurnstileScript,
  setTurnstileToken
} from './utils/turnstile'

const trans = () => translations[currentLang.value] || translations.en

const normalizeChoice = (value, choices, fallback) => {
  const normalized = String(value || '').toLowerCase()
  return choices.includes(normalized) ? normalized : fallback
}

const EMPTY_CONFIG = {
  turnstile_enabled: false,
  turnstile_login_enabled: false,
  turnstile_site_key: '',
  turnstile_api_index: 0,
  custom_ct_name: '电信',
  custom_cu_name: '联通',
  custom_cm_name: '移动',
  custom_bd_name: 'BGP',
  node_1_name: 'Node 1',
  node_2_name: 'Node 2',
  node_3_name: 'Node 3',
  node_4_name: 'Node 4',
  display_mode: 'bar',
  preferred_theme: 'auto',
  default_language: 'auto',
  version: '',
  last_workers_version: '',
  last_agent_version: '',
  frontend_ws_timeout_minutes: 0,
  theme_options: {},
  verified: false,
  is_public: true,
  authorization: false,
  site_title: ''
}

const normalizeConfig = (data) => ({
  ...EMPTY_CONFIG,
  turnstile_enabled: isTurnstileValueEnabled(data.turnstile_enabled),
  turnstile_login_enabled: isTurnstileValueEnabled(data.turnstile_login_enabled),
  turnstile_site_key: data.turnstile_site_key || '',
  custom_ct_name: data.custom_ct_name || EMPTY_CONFIG.custom_ct_name,
  custom_cu_name: data.custom_cu_name || EMPTY_CONFIG.custom_cu_name,
  custom_cm_name: data.custom_cm_name || EMPTY_CONFIG.custom_cm_name,
  custom_bd_name: data.custom_bd_name || EMPTY_CONFIG.custom_bd_name,
  node_1_name: data.node_1_name || EMPTY_CONFIG.node_1_name,
  node_2_name: data.node_2_name || EMPTY_CONFIG.node_2_name,
  node_3_name: data.node_3_name || EMPTY_CONFIG.node_3_name,
  node_4_name: data.node_4_name || EMPTY_CONFIG.node_4_name,
  version: data.version || '',
  last_workers_version: data.last_workers_version || '',
  last_agent_version: data.last_agent_version || '',
  verified: data.verified === true,
  is_public: data.is_public !== false,
  authorization: data.authorization === true,
  site_title: data.site_title || '',
  display_mode: resolveDisplayMode(data),
  preferred_theme: normalizeChoice(data.preferred_theme, ['dark', 'light', 'auto'], 'auto'),
  default_language: normalizeChoice(data.default_language, ['zh', 'en', 'auto'], 'auto'),
  frontend_ws_timeout_minutes: normalizeLiveSocketTimeoutMinutes(data.frontend_ws_timeout_minutes),
  long_history_points: data.long_history_points,
  latency_window: data.latency_window,
  theme_options: normalizeThemeOptions(data.theme_options)
})

const applyVersions = (config) => {
  if (config.version) VERSION.value = config.version
  LAST_WORKERS_VERSION.value = config.last_workers_version || ''
  LAST_AGENT_VERSION.value = config.last_agent_version || ''
}

async function fetchSingleConfig() {
  try {
    const result = await http.get('/api/config', { includeAuth: true, includeTurnstile: true, autoRedirect: false })
    if (result.error || !result.data) {
      return { ...EMPTY_CONFIG, load_error: { status: result.status || 0, error: result.error || 'Request failed' } }
    }
    return normalizeConfig(result.data)
  } catch (e) {
    console.error('Failed to fetch config:', e)
    return { ...EMPTY_CONFIG, load_error: { status: 0, error: e?.message || 'Request failed' } }
  }
}

async function fetchMultiConfig() {
  const results = await fetchAllTurnstileConfigs()
  const enabledTurnstileSites = getTurnstileEnabledSites(results, 'global')
  const first = results.find(r => !r.error && r.data)
  const sharedTurnstileSite = enabledTurnstileSites[0] || null
  const privateSites = results.filter(r => !r.error && r.data && r.data.is_public === false)
  const hasPrivateSite = privateSites.length > 0
  const hasUnauthorizedPrivateSite = privateSites.some(r => r.data.authorization !== true)

  if (!hasPrivateSite && hasTurnstileSiteKeyMismatch(enabledTurnstileSites)) {
    return { ...EMPTY_CONFIG, turnstile_mismatch: true }
  }
  if (!first) {
    const failed = results.find(r => r.error) || {}
    return { ...EMPTY_CONFIG, load_error: { status: failed.status || 0, error: failed.error || 'Request failed' } }
  }

  const config = normalizeConfig(first.data)
  config.site_configs = results.map(r => (!r.error && r.data) ? r.data : null)
  config.is_public = !hasPrivateSite
  config.authorization = !hasUnauthorizedPrivateSite
  config.verified = sharedTurnstileSite ? enabledTurnstileSites.every(site => site.verified) : first.data.verified === true
  if (sharedTurnstileSite) {
    config.turnstile_enabled = true
    config.turnstile_site_key = sharedTurnstileSite.siteKey
    config.turnstile_api_index = sharedTurnstileSite.index
  }
  return config
}

const setBootText = (text, className = '') => {
  const el = document.getElementById('boot-text')
  if (!el) return
  el.textContent = text
  el.className = className
}

const showBootError = (title, desc) => {
  setBootText(title, 'boot-err')
  const bar = document.querySelector('#boot .boot-bar')
  if (bar) bar.remove()
  const container = document.getElementById('turnstile-container')
  if (container) {
    container.textContent = desc || ''
    container.className = 'boot-hint'
  }
}

function verifyTurnstileByIndex(siteKey, apiIndex = 0) {
  return new Promise((resolve) => {
    window.turnstile.render('#turnstile-container', {
      sitekey: siteKey,
      callback: async (token) => {
        setTurnstileToken(token)
        try {
          const result = await http.getByIndex('/api/config', apiIndex, { includeAuth: false, includeTurnstile: true, autoRedirect: false })
          resolve(!result.error && result.data && result.data.verified === true)
        } catch (e) {
          console.error('Failed to verify token:', e)
          resolve(false)
        }
      },
      errorCallback: (error) => {
        console.error('Turnstile error:', error)
        resolve(false)
      },
      expiredCallback: () => {
        clearTurnstileToken()
        resolve(false)
      }
    })
  })
}

async function runStartupTurnstile(siteKey, apiIndex) {
  setBootText(trans().w2kVerifying)
  try {
    await loadTurnstileScript()
    const verified = await verifyTurnstileByIndex(siteKey, apiIndex)
    if (!verified) {
      showBootError(trans().verificationFailed, trans().refreshToRetry)
      return false
    }
    return true
  } catch (e) {
    console.error('Turnstile error:', e)
    showBootError(trans().verificationError, trans().refreshToRetry)
    return false
  }
}

async function initApp() {
  await initConfig()
  const bootTitle = document.querySelector('#boot .boot-title')
  if (bootTitle && document.title) bootTitle.textContent = document.title
  setBootText(trans().w2kStarting)

  const config = hasMultipleApiBases() ? await fetchMultiConfig() : await fetchSingleConfig()
  applyVersions(config)
  applyDefaultTheme(config.preferred_theme)
  applyDefaultLanguage(config.default_language)
  // 读不到站点配置时沿用上次缓存的站点风格，避免把缓存重置成 win2000
  if (config.load_error || config.turnstile_mismatch) applyStoredStyle()
  else applyDefaultStyle(config.theme_options?.win2000_style)

  if (config.turnstile_mismatch) {
    showBootError(trans().turnstileSiteKeyMismatch, trans().turnstileSiteKeyMismatchDesc)
    return
  }

  if (config.turnstile_enabled && config.turnstile_site_key && !config.verified) {
    const verified = await runStartupTurnstile(config.turnstile_site_key, config.turnstile_api_index || 0)
    if (!verified) return
  }

  // 私有站点未登录：不自动跳转，由窗口内的对话框提示用户前往 /admin#admin 登录
  if (!config.load_error && !config.is_public && !config.authorization) {
    windowState.authRequired = true
  }

  const app = createApp(App)
  app.provide('appConfig', config)
  app.use(router)
  app.mount('#app')
  document.getElementById('boot')?.remove()
}

initApp()
