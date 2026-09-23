import { computed, ref } from 'vue'
import { STYLE_CLASSES, normalizeStyle, normalizeStyleChoice, resolveStyle } from '../utils/styleChoice'

// 访客选择（没有这一项表示跟随站点默认）与站点默认的缓存；index.html 的内联脚本也读这两个键
export const STYLE_STORAGE_KEY = 'win2000_style'
export const SITE_STYLE_STORAGE_KEY = 'win2000_style_site'

const readStorage = (key) => {
  try {
    return localStorage.getItem(key)
  } catch (_) {
    return null
  }
}

const writeStorage = (key, value) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch (_) {
    // 隐私模式等场景下写不进去，只影响下次访问
  }
}

const styleChoice = ref(normalizeStyleChoice(readStorage(STYLE_STORAGE_KEY)))
const siteStyle = ref(normalizeStyle(readStorage(SITE_STYLE_STORAGE_KEY)))
const effectiveStyle = computed(() => resolveStyle(styleChoice.value, siteStyle.value))

const applyStyleClass = (style) => {
  if (typeof document === 'undefined' || !document.body) return
  for (const className of Object.values(STYLE_CLASSES)) {
    if (className) document.body.classList.remove(className)
  }
  const className = STYLE_CLASSES[style]
  if (className) document.body.classList.add(className)
}

// 读到 /api/config 后调用：记录并缓存站点默认值
export const applyDefaultStyle = (siteValue) => {
  siteStyle.value = normalizeStyle(siteValue)
  writeStorage(SITE_STYLE_STORAGE_KEY, siteStyle.value)
  applyStyleClass(effectiveStyle.value)
}

// 读不到站点配置时（加载失败等）沿用缓存，不覆盖站点默认
export const applyStoredStyle = () => {
  applyStyleClass(effectiveStyle.value)
}

export const useStyle = () => {
  const setStyle = (choice) => {
    const normalized = normalizeStyleChoice(choice)
    styleChoice.value = normalized
    writeStorage(STYLE_STORAGE_KEY, normalized === 'default' ? null : normalized)
    applyStyleClass(effectiveStyle.value)
  }

  return { styleChoice, siteStyle, effectiveStyle, setStyle }
}

export default useStyle
