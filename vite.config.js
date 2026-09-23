import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 本地开发时把 /api 代理到自己的 Worker，例如 VITE_DEV_PROXY_TARGET=https://status.example.com
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8787'
  // 发布 Release 时工作流传入 THEME_VERSION（版本标签），其余构建标记为 -dev
  const releaseVersion = String(process.env.THEME_VERSION || '').trim()
  const themeVersion = releaseVersion || `v${pkg.version}-dev`

  return {
    plugins: [vue()],
    define: {
      __THEME_VERSION__: JSON.stringify(themeVersion),
      __THEME_IS_RELEASE__: JSON.stringify(!!releaseVersion)
    },
    // 主题产物由 Worker 从主题分支读取，Worker 会把 ./assets/ 改写为 /assets/
    base: './',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      chunkSizeWarningLimit: 800
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true, secure: false, ws: true },
        '/flags': { target: proxyTarget, changeOrigin: true, secure: false },
        '/os-icons': { target: proxyTarget, changeOrigin: true, secure: false }
      }
    }
  }
})
