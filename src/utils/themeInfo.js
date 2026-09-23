// 主题自身的名称与版本。版本号在构建时由 vite.config.js 写入：
// 发布 Release 时为版本标签（如 v1.0.0），其他构建为 package.json 版本加 -dev。
/* global __THEME_VERSION__, __THEME_IS_RELEASE__ */

export const THEME_SHORT_NAME = 'Win2000'
export const THEME_FULL_NAME = 'CF-Server-Monitor-theme-win2000'
export const THEME_REPO_URL = 'https://github.com/finch-xu/CF-Server-Monitor-theme-win2000'
export const THEME_VERSION = __THEME_VERSION__
export const themeReleaseUrl = __THEME_IS_RELEASE__
  ? `${THEME_REPO_URL}/releases/tag/${encodeURIComponent(THEME_VERSION)}`
  : ''
