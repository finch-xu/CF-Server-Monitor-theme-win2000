// 在浏览器控制台（或浏览器自动化工具）中执行：对一种风格采集 6 个计算样式快照，用于样式回归对比。
// 使用前把下面两行改成需要的值；一次只跑一种风格（约 20 秒）。需要 npm run mock 与 npm run dev 都在运行。
// 快照保存在 scripts/mock-worker/snapshots/<PREFIX>-<style>-<mode>-<page>.json，用 diff-styles.mjs 对比
const STYLE = 'win2000'   // 'win2000' | 'xp' | 'win31' | 'osx'
const PREFIX = 'post'

const cap = await (await fetch('http://localhost:8787/__capture.js')).text()
const results = []
for (const mode of ['dark', 'light']) {
  for (const page of ['cards', 'table', 'detail']) {
    localStorage.setItem('win2000_style', STYLE)
    localStorage.setItem('theme_preference', mode)
    localStorage.setItem('monitor_preferred_view', page === 'table' ? 'table' : 'bar')
    const f = document.createElement('iframe')
    f.style.cssText = 'position:fixed;left:0;top:0;width:800px;height:1200px;opacity:0;pointer-events:none'
    f.src = location.origin + '/' + (page === 'detail' ? '#/server/hk-01' : '#/')
    document.body.appendChild(f)
    await new Promise(r => { f.onload = r })
    await new Promise(r => setTimeout(r, 2500))
    f.contentWindow.__SNAP_NAME = `${PREFIX}-${STYLE}-${mode}-${page}`
    const res = await f.contentWindow.eval(cap)
    results.push(`${res.saved}:${res.count}`)
    f.remove()
  }
}
localStorage.removeItem('win2000_style')
localStorage.setItem('theme_preference', 'dark')
localStorage.setItem('monitor_preferred_view', 'bar')
results.join(' ')
