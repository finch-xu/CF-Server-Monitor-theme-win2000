#!/usr/bin/env node
// 纯静态部署构建（例如 GitHub Pages）：读取 .env 并把运行时配置写入 dist/index.html
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(rootDir, 'dist')

const loadEnvFile = () => {
  const envPath = path.join(rootDir, '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const escapeCssUrl = (value) => String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"')

// 与 Worker 的 CORS 配置一致：只保留 origin，多个用英文逗号分隔
const parseOrigins = (raw) => String(raw || '')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean)
  .map(item => {
    try {
      return new URL(item).origin
    } catch (_) {
      return ''
    }
  })
  .filter(Boolean)

loadEnvFile()

const apiBases = parseOrigins(process.env.API_BASE)
const title = String(process.env.TITLE || '').trim()
const backgroundImage = String(process.env.BACKGROUND_IMAGE || '').trim()
const mobileBackgroundImage = String(process.env.BACKGROUND_IMAGE_MOBILE || '').trim()

if (apiBases.length === 0) {
  console.error('API_BASE is required, e.g. API_BASE=https://status.example.com')
  process.exit(1)
}

console.log('Config from env:', { apiBases, title, backgroundImage, mobileBackgroundImage })
execSync('npx vite build', { cwd: rootDir, stdio: 'inherit' })

const htmlPath = path.join(distDir, 'index.html')
let html = fs.readFileSync(htmlPath, 'utf8')

html = html.replace(/<meta name="apiBase" content="[^"]*">/, `<meta name="apiBase" content="${escapeHtml(apiBases.join(','))}">`)

if (title) {
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`)
}

const rules = []
if (backgroundImage) {
  rules.push(`body{background:url('${escapeCssUrl(backgroundImage)}') center/cover fixed no-repeat}`)
}
if (mobileBackgroundImage || backgroundImage) {
  rules.push(`@media (max-width: 767px){body{background:url('${escapeCssUrl(mobileBackgroundImage || backgroundImage)}') center/cover no-repeat}}`)
}
if (rules.length > 0) {
  html = html.replace('</head>', `<style>${rules.join('')}</style>\n</head>`)
}

fs.writeFileSync(htmlPath, html, 'utf8')
console.log('Static theme build complete: dist/')
