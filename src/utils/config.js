// 移植自 CF-Server-Monitor 默认主题（MIT License, https://github.com/huilang-me/CF-Server-Monitor）
let apiBases = []
let wsBase = null
let title = ''
let configuredApiBase = false

const stripTrailingSlash = (s) => String(s || '').replace(/\/+$/, '')

const computeWsBase = (origin) => {
  try {
    const u = new URL(origin)
    const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProto}//${u.host}`
  } catch (_) {
    return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  }
}

const setApiBases = (values) => {
  apiBases = values.map(v => stripTrailingSlash(v)).filter(v => v)
  if (apiBases.length === 0) {
    apiBases = [stripTrailingSlash(window.location.origin)]
  }
  wsBase = computeWsBase(apiBases[0])
  window.__APP_API_BASES__ = apiBases
  window.__APP_WS_BASE__ = wsBase
}

export const initConfig = async () => {
  configuredApiBase = false
  setApiBases([window.location.origin])

  // GitHub Pages/static builds inject runtime config through meta tags.
  const metaApiBase = document.querySelector('meta[name="apiBase"]')?.content
  if (metaApiBase) {
    const bases = metaApiBase.split(',').map(s => s.trim()).filter(Boolean)
    if (bases.length > 0) {
      configuredApiBase = true
      setApiBases(bases)
    }
  }

  title = document.title || ''

  return apiBases
}

export const getApiBases = () => {
  if (apiBases.length > 0) return apiBases
  if (window.__APP_API_BASES__?.length > 0) return window.__APP_API_BASES__
  return [stripTrailingSlash(window.location.origin)]
}

export const getWsBase = () => {
  if (wsBase) return wsBase
  if (window.__APP_WS_BASE__) return window.__APP_WS_BASE__
  return computeWsBase(getApiBases()[0])
}

export const hasMultipleApiBases = () => {
  return getApiBases().length > 1
}

export const hasConfiguredApiBase = () => configuredApiBase

export const getTitle = () => title

// 旗帜 /flags/ 与系统图标 /os-icons/ 由 Worker 的默认皮肤提供。
// 纯静态部署（配置了 apiBase meta）时，从第一个后端读取这些静态文件。
export const getPublicAssetUrl = (assetPath) => {
  const cleanPath = String(assetPath || '').replace(/^\/+/, '')
  const base = configuredApiBase ? getApiBases()[0] : ''
  return `${base}/${cleanPath}`
}

// 管理后台登录入口：同源时为 /admin#admin，其他后端时跳到对应 Worker 的 /admin#admin
export const getAdminUrl = (apiIndex = 0) => {
  const bases = getApiBases()
  const base = bases[apiIndex] || bases[0] || ''
  try {
    if (!base || new URL(base).origin === window.location.origin) return '/admin#admin'
  } catch (_) {
    return '/admin#admin'
  }
  return `${base}/admin#admin`
}

export default { initConfig, getApiBases, getWsBase, hasMultipleApiBases, hasConfiguredApiBase, getTitle, getPublicAssetUrl, getAdminUrl }
