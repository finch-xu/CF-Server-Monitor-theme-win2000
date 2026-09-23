#!/usr/bin/env node
// 在 Release 说明末尾追加安装方式。重新发布时替换旧的一段，不会重复。
// 用法：GITHUB_REPOSITORY=owner/repo RELEASE_TAG=v1.1.0 RELEASE_TITLE=... BUILD_SHA=... DIST_TAG=... \
//       node scripts/release-notes.js body.md
import fs from 'node:fs'

const START = '<!-- theme-urls:start -->'
const END = '<!-- theme-urls:end -->'

const [bodyFile] = process.argv.slice(2)
const { GITHUB_REPOSITORY, RELEASE_TAG, BUILD_SHA, DIST_TAG } = process.env
const RELEASE_TITLE = String(process.env.RELEASE_TITLE || '').trim()
if (!bodyFile || !GITHUB_REPOSITORY || !RELEASE_TAG || !BUILD_SHA || !DIST_TAG) {
  console.error('Usage: GITHUB_REPOSITORY=owner/repo RELEASE_TAG=<tag> BUILD_SHA=<sha> DIST_TAG=<tag> [RELEASE_TITLE=<title>] node scripts/release-notes.js <body.md>')
  process.exit(1)
}

// 与 publish-build.sh 的 commit 标题一致，也就是后台主题商店下拉框里显示的版本名
const versionName = (RELEASE_TITLE && RELEASE_TITLE !== RELEASE_TAG ? `${RELEASE_TAG} ${RELEASE_TITLE}` : RELEASE_TAG)
  .replace(/[\r\n]+/g, ' ')

const repoUrl = `https://github.com/${GITHUB_REPOSITORY}`
const body = fs.existsSync(bodyFile) ? fs.readFileSync(bodyFile, 'utf8') : ''
const start = body.indexOf(START)
const end = body.indexOf(END)
const cleaned = (start !== -1 && end > start ? body.slice(0, start) + body.slice(end + END.length) : body).trim()

const section = [
  START,
  '---',
  '',
  '### 安装 / 更新',
  '',
  `在 CF-Server-Monitor 后台 → **主题商店** → **Win2000** → 点 **「点击加载版本」** → 选择 **${versionName}** → **切换主题**。`,
  '',
  '<details>',
  '<summary>手动填写主题地址</summary>',
  '',
  '在后台主题商店的「自定义主题 URL」中填入：',
  '',
  '```',
  `${repoUrl}/tree/${BUILD_SHA}`,
  '```',
  '',
  'commit 地址会被长期缓存，更新时换成新版本的地址即可。',
  '',
  '</details>',
  '',
  `<sub>build commit \`${BUILD_SHA.slice(0, 7)}\` · tag \`${DIST_TAG}\`</sub>`,
  END
].join('\n')

process.stdout.write(cleaned ? `${cleaned}\n\n${section}\n` : `${section}\n`)
