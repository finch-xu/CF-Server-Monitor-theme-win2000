// 移植自 CF-Server-Monitor 默认主题（MIT License, https://github.com/huilang-me/CF-Server-Monitor）
import { getApiBases } from './config'

const DEFAULT_ERROR_MESSAGES = {
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  500: 'Internal Server Error'
}

const TURNSTILE_VERIFIED_KEY = 'turnstile_verified'
// 启动路径等关键请求的超时时长，需通过 options.timeoutMs 显式启用；
// 未启用的请求（如 /updateDatabase、长历史查询）保持无超时，避免误伤合法慢接口
export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000

// 主题不实现登录页：未授权时通知界面弹出「需要登录」对话框，由用户选择是否前往 /admin#admin
const notifyAuthRequired = (baseUrl) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('cfsm-auth-required', { detail: { baseUrl } }))
}

const createHeaders = (includeAuth = true, includeTurnstile = true, baseUrl = null, options = {}) => {
  const {
    includeTurnstileToken = includeTurnstile,
    includeTurnstileVerified = true
  } = options
  const headers = {
    'Content-Type': 'application/json'
  }
  
  if (includeAuth) {
    const token = localStorage.getItem('jwt_token')
    if (token) {
      headers['Authorization'] = 'Bearer ' + token
    }
  }
  
  if (includeTurnstile && includeTurnstileToken) {
    const turnstileToken = localStorage.getItem('turnstile_token')
    if (turnstileToken) {
      headers['X-Turnstile-Token'] = turnstileToken
    }
  }

  if (includeTurnstileVerified) {
    const turnstileVerified = localStorage.getItem(TURNSTILE_VERIFIED_KEY)
    if (turnstileVerified) {
      headers['X-Turnstile-Verified'] = turnstileVerified
    }
  }
  
  return headers
}

const handleResponse = async (res, options = {}) => {
  const { autoRedirect = true, baseUrl = null } = options
  
  if (res.status === 401) {
    localStorage.removeItem('jwt_token')
    if (autoRedirect) {
      notifyAuthRequired(baseUrl)
    }
    return { error: DEFAULT_ERROR_MESSAGES[401], status: 401 }
  }
  
  if (res.status === 403) {
    localStorage.removeItem('turnstile_token')
    localStorage.removeItem(TURNSTILE_VERIFIED_KEY)
    if (autoRedirect) {
      window.location.reload()
    }
    return { error: DEFAULT_ERROR_MESSAGES[403], status: 403 }
  }
  
  if (!res.ok) {
    let errorMessage = DEFAULT_ERROR_MESSAGES[res.status] || 'Request failed'
    let errorCode = res.status
    let errorMessageKey = null
    try {
      const data = await res.json()
      if (data.message) {
        errorMessageKey = data.message
      }
      if (data.error) {
        errorMessage = data.error
      }
      if (data.code) {
        errorCode = data.code
        if (!data.error && typeof data.code === 'string') {
          errorMessage = data.code
        }
      }
    } catch (e) {
      // ignore
    }
    return { error: errorMessage, code: errorCode, status: res.status, message: errorMessageKey }
  }
  
  try {
    const data = await res.json()
    if (data && data.turnstile_verified) {
      localStorage.setItem(TURNSTILE_VERIFIED_KEY, data.turnstile_verified)
      localStorage.removeItem('turnstile_token')
    }
    return { data, status: res.status }
  } catch (e) {
    return { data: null, status: res.status }
  }
}

const doFetch = async (url, init, timeoutMs = null) => {
  if (!timeoutMs) {
    return fetch(url, init)
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

const request = async (method, url, body, options = {}) => {
  const { includeAuth = true, includeTurnstile = true, autoRedirect = true, baseUrl = null, timeoutMs = null } = options
  const headers = createHeaders(includeAuth, includeTurnstile, baseUrl, options)
  const base = baseUrl || getApiBases()[0]

  try {
    const res = await doFetch(`${base}${url}`, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
      credentials: 'include'
    }, timeoutMs)
    return { ...(await handleResponse(res, { autoRedirect, baseUrl: base })), baseUrl: base }
  } catch (e) {
    if (e.name === 'AbortError') {
      return { error: 'timeout', status: 0, baseUrl: base, timeout: true }
    }
    return { error: e.message || 'Network error', status: 0, baseUrl: base }
  }
}

const fetchWithBase = async (baseUrl, url, options, method = 'GET', body = null) => {
  const { includeAuth = true, includeTurnstile = true, autoRedirect = true, timeoutMs = null } = options
  const headers = createHeaders(includeAuth, includeTurnstile, baseUrl, options)

  try {
    const res = await doFetch(`${baseUrl}${url}`, {
      method,
      headers,
      body,
      credentials: 'include'
    }, timeoutMs)
    const result = await handleResponse(res, { autoRedirect, baseUrl })
    return { ...result, baseUrl }
  } catch (e) {
    if (e.name === 'AbortError') {
      return { error: 'timeout', status: 0, baseUrl, timeout: true }
    }
    throw e
  }
}

export const http = {
  get(url, options = {}) {
    return request('GET', url, null, options)
  },

  post(url, body = {}, options = {}) {
    return request('POST', url, body, options)
  },

  put(url, body = {}, options = {}) {
    return request('PUT', url, body, options)
  },

  delete(url, options = {}) {
    return request('DELETE', url, null, options)
  },

  async getAll(url, options = {}) {
    const bases = getApiBases()
    if (bases.length === 0) {
      const result = await this.get(url, options)
      return [{ ...result, baseUrl: getApiBases()[0] }]
    }

    const promises = bases.map(baseUrl =>
      fetchWithBase(baseUrl, url, options, 'GET', null)
    )

    const settled = await Promise.allSettled(promises)
    return settled.map((r, i) => r.status === 'fulfilled' ? r.value : { error: r.reason?.message || 'Request failed', status: 0, baseUrl: bases[i] })
  },

  async getAllWithProgress(url, onResult, options = {}) {
    const bases = getApiBases()
    if (bases.length === 0) {
      const result = await this.get(url, options)
      onResult({ ...result, baseUrl: getApiBases()[0] })
      return
    }

    const promises = bases.map(baseUrl =>
      fetchWithBase(baseUrl, url, options, 'GET', null)
        .then(result => {
          onResult({ ...result, baseUrl })
        })
        .catch(e => {
          const isCors = /failed to fetch|networkerror|cors/i.test(e.message)
          onResult({ error: e.message, status: 0, baseUrl, corsError: isCors })
        })
    )

    await Promise.allSettled(promises)
  },

  async postAll(url, body = {}, options = {}) {
    const bases = getApiBases()
    if (bases.length === 0) {
      const result = await this.post(url, body, options)
      return [{ ...result, baseUrl: getApiBases()[0] }]
    }

    const promises = bases.map(baseUrl =>
      fetchWithBase(baseUrl, url, options, 'POST', JSON.stringify(body))
    )

    const settled = await Promise.allSettled(promises)
    return settled.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason?.message || 'Request failed', status: 0, baseUrl: '' })
  },

  getByIndex(url, index = 0, options = {}) {
    const bases = getApiBases()
    const base = (bases.length > 0 && bases[index] !== undefined) ? bases[index] : getApiBases()[0]
    return this.get(url, { ...options, baseUrl: base })
  },

  postByIndex(url, body = {}, index = 0, options = {}) {
    const bases = getApiBases()
    const base = (bases.length > 0 && bases[index] !== undefined) ? bases[index] : getApiBases()[0]
    return this.post(url, body, { ...options, baseUrl: base })
  }
}

export const isAdminLoggedIn = () => {
  return !!localStorage.getItem('jwt_token')
}

export default http
