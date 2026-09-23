#!/usr/bin/env node
// 在 Release 说明末尾追加主题地址。重新发布时替换旧的地址段，不会重复。
// 用法：GITHUB_REPOSITORY=owner/repo BUILD_SHA=... DIST_TAG=... node scripts/release-notes.js body.md
import fs from 'node:fs'

const START = '<!-- theme-urls:start -->'
const END = '<!-- theme-urls:end -->'

const [bodyFile] = process.argv.slice(2)
const { GITHUB_REPOSITORY, BUILD_SHA, DIST_TAG } = process.env
if (!bodyFile || !GITHUB_REPOSITORY || !BUILD_SHA || !DIST_TAG) {
  console.error('Usage: GITHUB_REPOSITORY=owner/repo BUILD_SHA=<sha> DIST_TAG=<tag> node scripts/release-notes.js <body.md>')
  process.exit(1)
}

const repoUrl = `https://github.com/${GITHUB_REPOSITORY}`
const body = fs.existsSync(bodyFile) ? fs.readFileSync(bodyFile, 'utf8') : ''
const start = body.indexOf(START)
const end = body.indexOf(END)
const cleaned = (start !== -1 && end > start ? body.slice(0, start) + body.slice(end + END.length) : body).trim()

const section = [
  START,
  '### 主题地址 / Theme URL',
  '',
  '在 CF-Server-Monitor 后台的主题设置中填入以下任一地址：',
  '',
  '| 用途 | 地址 |',
  '| --- | --- |',
  `| 始终使用最新发布版 | \`${repoUrl}/tree/build\` |`,
  `| 固定为本版本 | \`${repoUrl}/tree/${DIST_TAG}\` |`,
  `| 固定为本版本（commit） | \`${repoUrl}/tree/${BUILD_SHA}\` |`,
  END
].join('\n')

process.stdout.write(cleaned ? `${cleaned}\n\n${section}\n` : `${section}\n`)
